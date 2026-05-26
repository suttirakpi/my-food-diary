import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ----------------------------------------------------
// ตั้งค่าการเชื่อมต่อ Database
// ----------------------------------------------------
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 4000,
  ssl: {
    minVersion: "TLSv1.2",
    rejectUnauthorized: false,
  },
});

// ----------------------------------------------------
// API 1: GET /api/meals
// ----------------------------------------------------
app.get("/api/meals", async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    let query = "SELECT * FROM meals";
    let queryParams: any[] = [];

    if (date) {
      query += " WHERE meal_date = ?";
      queryParams.push(date);
    }

    query += " ORDER BY meal_date DESC, meal_time DESC";

    const [meals] = await pool.query(query, queryParams);
    const [options] = await pool.query("SELECT * FROM meal_options");

    const result = (meals as any[]).map((meal) => ({
      ...meal,
      options: (options as any[]).filter((opt) => opt.meal_id === meal.id),
    }));

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
  }
});

// ----------------------------------------------------
// API 2: POST /api/meals
// ----------------------------------------------------
app.post("/api/meals", async (req: Request, res: Response) => {
  const { mainDish, options, category, itemType, calories, date, time } =
    req.body;
  const today = new Date();

  const mealDate = date || today.toISOString().split("T")[0];
  const mealTime = time || today.toTimeString().split(" ")[0];

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [mealResult] = await connection.query(
      "INSERT INTO meals (meal_date, meal_time, main_dish, category, item_type, calories) VALUES (?, ?, ?, ?, ?, ?)",
      [mealDate, mealTime, mainDish, category, itemType, calories || 0],
    );
    const mealId = (mealResult as any).insertId;

    if (options && options.length > 0) {
      const optionValues = options.map((opt: string) => [mealId, opt]);
      await connection.query(
        "INSERT INTO meal_options (meal_id, option_name) VALUES ?",
        [optionValues],
      );
    }

    await connection.commit();
    res.status(201).json({ message: "บันทึกมื้ออาหารสำเร็จ!", id: mealId });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ error: "บันทึกล้มเหลว" });
  } finally {
    connection.release();
  }
});

app.put("/api/meals/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { mainDish, category, itemType, options, calories } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await connection.query(
      "UPDATE meals SET main_dish = ?, category = ?, item_type = ?, calories = ? WHERE id = ?",
      [mainDish, category, itemType, calories || 0, id],
    );

    await connection.query("DELETE FROM meal_options WHERE meal_id = ?", [id]);

    if (options && options.length > 0) {
      const optionValues = options.map((opt: string) => [id, opt]);
      await connection.query(
        "INSERT INTO meal_options (meal_id, option_name) VALUES ?",
        [optionValues],
      );
    }

    await connection.commit();
    res.json({ message: "แก้ไขข้อมูลสำเร็จ!" });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ error: "แก้ไขข้อมูลล้มเหลว" });
  } finally {
    connection.release();
  }
});

app.delete("/api/meals/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    // ลบ options ก่อนเพื่อไม่ให้ติด foreign key (ถ้าตั้งค่า cascade ไว้ใน DB ก็ไม่ต้องทำขั้นตอนนี้)
    await pool.query("DELETE FROM meal_options WHERE meal_id = ?", [id]);
    const [result] = await pool.query("DELETE FROM meals WHERE id = ?", [id]);

    if ((result as any).affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "ไม่พบข้อมูลที่ต้องการลบ (อาจถูกลบไปแล้ว)" });
    }
    res.json({ message: "ลบข้อมูลมื้ออาหารสำเร็จ" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "ลบข้อมูลไม่สำเร็จ" });
  }
});

app.get("/api/water", async (req: Request, res: Response) => {
  const { date } = req.query;
  try {
    const [rows] = await pool.query(
      "SELECT glasses FROM water_logs WHERE log_date = ?",
      [date],
    );
    const glasses = (rows as any[])[0]?.glasses || 0;
    res.json({ glasses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "ดึงข้อมูลน้ำดื่มล้มเหลว" });
  }
});

app.post("/api/water", async (req: Request, res: Response) => {
  const { date, glasses } = req.body;
  try {
    await pool.query(
      "INSERT INTO water_logs (log_date, glasses) VALUES (?, ?) ON DUPLICATE KEY UPDATE glasses = ?",
      [date, glasses, glasses],
    );
    res.json({ message: "อัปเดตน้ำดื่มสำเร็จ!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "บันทึกน้ำดื่มล้มเหลว" });
  }
});

app.get("/api/trends", async (req: Request, res: Response) => {
  try {
    const [itemStats] = await pool.query(
      "SELECT item_type as name, COUNT(*) as value FROM meals GROUP BY item_type",
    );

    const [waterStats] = await pool.query(
      "SELECT log_date as date, glasses FROM water_logs ORDER BY log_date DESC LIMIT 7",
    );

    const [calorieTrend] = await pool.query(`
      SELECT meal_date as date, SUM(calories) as total_cal 
      FROM meals 
      GROUP BY meal_date 
      ORDER BY meal_date DESC 
      LIMIT 7
    `);

    const [summaryStats] = await pool.query(`
      SELECT 
        SUM(CASE WHEN DATE(meal_date) = CURDATE() THEN calories ELSE 0 END) as cal_today,
        SUM(CASE WHEN MONTH(meal_date) = MONTH(CURDATE()) AND YEAR(meal_date) = YEAR(CURDATE()) THEN calories ELSE 0 END) as cal_month,
        SUM(CASE WHEN YEAR(meal_date) = YEAR(CURDATE()) THEN calories ELSE 0 END) as cal_year
      FROM meals
    `);

    const [exerciseTrend] = await pool.query(`
      SELECT 
        exercise_date as date, 
        SUM(calories_burned) as total_burned
      FROM exercises 
      GROUP BY exercise_date
      ORDER BY exercise_date DESC
      LIMIT 7
    `);

    const formatData = (data: any[], valueKey: string) => {
      return data
        .map((item) => {
          const d = new Date(item.date);
          return {
            date: `${d.toLocaleDateString("th-TH", { weekday: "short" })} ${d.getDate()}`,
            [valueKey]: item[valueKey],
          };
        })
        .reverse();
    };

    res.json({
      itemStats,
      waterStats: formatData(waterStats as any[], "glasses"),
      calorieTrend: formatData(calorieTrend as any[], "total_cal"),
      exerciseTrend: formatData(exerciseTrend as any[], "total_burned"),
      summary: (summaryStats as any[])[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "ดึงข้อมูลสถิติล้มเหลว" });
  }
});

app.get("/api/search", async (req: Request, res: Response) => {
  const { q } = req.query;
  if (!q) return res.json([]);

  try {
    const [meals] = await pool.query(
      "SELECT * FROM meals WHERE main_dish LIKE ? OR item_type LIKE ? ORDER BY meal_date DESC LIMIT 50",
      [`%${q}%`, `%${q}%`],
    );

    for (let meal of meals as any[]) {
      const [options] = await pool.query(
        "SELECT * FROM meal_options WHERE meal_id = ?",
        [meal.id],
      );
      meal.options = options;
    }

    res.json(meals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "ค้นหาล้มเหลว" });
  }
});

// ==========================================
// 🏋️‍♂️ API สำหรับจัดการการออกกำลังกาย (Exercises)
// ==========================================

app.get("/api/exercises", async (req, res) => {
  const { date } = req.query;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM exercises WHERE exercise_date = ? ORDER BY created_at DESC",
      [date],
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "ดึงข้อมูลออกกำลังกายไม่สำเร็จ" });
  }
});

app.post("/api/exercises", async (req, res) => {
  const { date, activityName, caloriesBurned } = req.body;
  try {
    const [result] = await pool.query(
      "INSERT INTO exercises (exercise_date, activity_name, calories_burned) VALUES (?, ?, ?)",
      [date, activityName, caloriesBurned],
    );
    res
      .status(201)
      .json({ message: "บันทึกสำเร็จ", id: (result as any).insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "บันทึกข้อมูลไม่สำเร็จ" });
  }
});

app.delete("/api/exercises/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM exercises WHERE id = ?", [
      id,
    ]);
    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ error: "ไม่พบข้อมูลที่ต้องการลบ" });
    }
    res.json({ message: "ลบข้อมูลสำเร็จ" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "ลบข้อมูลไม่สำเร็จ" });
  }
});

app.listen(port, () => {
  console.log(`Backend Server is running on http://localhost:${port}`);
});
