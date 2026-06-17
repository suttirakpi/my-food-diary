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

// 🌟 เพิ่ม API สำหรับการแก้ไขการออกกำลังกาย (PUT) ตรงนี้
app.put("/api/exercises/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { activityName, caloriesBurned } = req.body;
  try {
    await pool.query(
      "UPDATE exercises SET activity_name = ?, calories_burned = ? WHERE id = ?",
      [activityName, caloriesBurned, id],
    );
    res.json({ message: "อัปเดตข้อมูลสำเร็จ" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "อัปเดตล้มเหลว" });
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

// 🌟 ย้าย API Calendar ขึ้นมาไว้ตรงนี้ (ก่อน app.listen)
app.get("/api/calendar", async (req, res) => {
  try {
    const [mealRows]: any = await pool.query(
      "SELECT DATE_FORMAT(meal_date, '%Y-%m-%d') as date, SUM(calories) as total_cal FROM meals GROUP BY date",
    );
    const [waterRows]: any = await pool.query(
      "SELECT DATE_FORMAT(log_date, '%Y-%m-%d') as date, glasses FROM water_logs",
    );

    // 🌟 แก้ไข: เปลี่ยนจาก log_date เป็น exercise_date ให้ตรงกับฐานข้อมูล
    const [exRows]: any = await pool.query(
      "SELECT DATE_FORMAT(exercise_date, '%Y-%m-%d') as date, SUM(calories_burned) as total_burned FROM exercises GROUP BY date",
    );

    // 🌟 แก้ไข: ดึงข้อมูลโปรตีนแบบปกติ (เอา CONVERT_TZ ออก ป้องกันบั๊กค่าว่าง)
    const [proteinRows]: any = await pool.query(
      "SELECT DATE_FORMAT(log_date, '%Y-%m-%d') as date, total_grams FROM daily_protein",
    );

    res.json({
      meals: mealRows,
      water: waterRows,
      exercises: exRows,
      protein: proteinRows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// 🌟 API สำหรับดึงข้อมูลโปรตีน
app.get("/api/protein", async (req, res) => {
  const { date } = req.query;
  try {
    const [rows]: any = await pool.query(
      "SELECT total_grams FROM daily_protein WHERE log_date = ?",
      [date],
    );
    res.json({ grams: rows.length > 0 ? rows[0].total_grams : 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// 🌟 API สำหรับบันทึก/อัปเดตโปรตีน
app.post("/api/protein", async (req, res) => {
  const { date, grams } = req.body;
  try {
    await pool.query(
      "INSERT INTO daily_protein (log_date, total_grams) VALUES (?, ?) ON DUPLICATE KEY UPDATE total_grams = ?",
      [date, grams, grams],
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// 🌟 API สำหรับดึงข้อมูลตารางออกกำลังกายทั้งหมด
app.get("/api/workout-plans", async (req, res) => {
  try {
    const [rows]: any = await pool.query(
      "SELECT day_index, plan_data FROM workout_plans",
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// 2. บันทึก/อัปเดตตารางออกกำลังกาย (รายวัน)
app.post("/api/workout-plans", async (req, res) => {
  const { dayIndex, planData } = req.body;
  try {
    await pool.query(
      "INSERT INTO workout_plans (day_index, plan_data) VALUES (?, ?) ON DUPLICATE KEY UPDATE plan_data = ?",
      [dayIndex, JSON.stringify(planData), JSON.stringify(planData)],
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/weight", async (req, res) => {
  try {
    const [rows]: any = await pool.query(
      "SELECT DATE_FORMAT(log_date, '%Y-%m-%d') as date, weight FROM weight_logs ORDER BY log_date ASC",
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// 2. บันทึกหรืออัปเดตน้ำหนักรายวัน
app.post("/api/weight", async (req, res) => {
  const { date, weight } = req.body;
  try {
    await pool.query(
      "INSERT INTO weight_logs (log_date, weight) VALUES (?, ?) ON DUPLICATE KEY UPDATE weight = ?",
      [date, weight, weight],
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// ----------------------------------------
// ⚙️ API สำหรับจัดการการตั้งค่าเป้าหมาย (Settings)
// ----------------------------------------

// ดึงข้อมูลการตั้งค่า
app.get("/api/settings", async (req: Request, res: Response) => {
  try {
    // ดึงข้อมูล user id 1 (เพราะเราใช้คนเดียว)
    const [rows]: any = await pool.query(
      "SELECT * FROM user_settings WHERE id = 1",
    );
    if (rows.length === 0) {
      // ถ้ายังไม่มีข้อมูลใน DB ให้ส่งค่า Default กลับไป
      res.json({
        cal_goal: 1400,
        protein_goal: 140,
        water_goal: 8,
        current_weight: 0,
        target_weight: 0,
      });
    } else {
      res.json(rows[0]);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "ดึงข้อมูลการตั้งค่าไม่สำเร็จ" });
  }
});

// บันทึก/อัปเดตการตั้งค่า
app.post("/api/settings", async (req: Request, res: Response) => {
  const { cal_goal, protein_goal, water_goal, current_weight, target_weight } =
    req.body;
  try {
    // ถ้ามี id = 1 อยู่แล้วให้อัปเดต ถ้าไม่มีให้สร้างใหม่ (รองรับ MySQL)
    await pool.query(
      `
      INSERT INTO user_settings (id, cal_goal, protein_goal, water_goal, current_weight, target_weight)
      VALUES (1, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        cal_goal = VALUES(cal_goal),
        protein_goal = VALUES(protein_goal),
        water_goal = VALUES(water_goal),
        current_weight = VALUES(current_weight),
        target_weight = VALUES(target_weight)
    `,
      [cal_goal, protein_goal, water_goal, current_weight, target_weight],
    );

    res.json({ message: "บันทึกการตั้งค่าสำเร็จ" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "บันทึกการตั้งค่าไม่สำเร็จ" });
  }
});

// ดึงข้อมูล Macros รายวัน
app.get("/api/macros", async (req: Request, res: Response) => {
  const date = req.query.date;
  try {
    const [rows]: any = await pool.query(
      "SELECT * FROM daily_macros WHERE log_date = ?",
      [date],
    );
    if (rows.length === 0) {
      res.json({ protein: 0, carbs: 0, fats: 0 });
    } else {
      res.json(rows[0]);
    }
  } catch (error) {
    res.status(500).json({ error: "ดึงข้อมูล Macros ไม่สำเร็จ" });
  }
});

// บันทึก/อัปเดตข้อมูล Macros รายวัน
app.post("/api/macros", async (req: Request, res: Response) => {
  const { date, protein, carbs, fats } = req.body;
  try {
    await pool.query(
      `
      INSERT INTO daily_macros (log_date, protein, carbs, fats)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        protein = VALUES(protein),
        carbs = VALUES(carbs),
        fats = VALUES(fats)
    `,
      [date, protein, carbs, fats],
    );
    res.json({ message: "อัปเดต Macros สำเร็จ" });
  } catch (error) {
    res.status(500).json({ error: "บันทึก Macros ไม่สำเร็จ" });
  }
});

// 🌟 บรรทัด app.listen ต้องอยู่ล่างสุดเสมอ!
app.listen(port, () => {
  console.log(`Backend Server is running on http://localhost:${port}`);
});
