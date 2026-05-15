import express from "express";
import type { Request, Response } from "express"; // แยกการนำเข้า Type ออกมา
import cors from "cors";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ----------------------------------------------------
// ตั้งค่าการเชื่อมต่อ Database (แก้ Type Error ตรงนี้)
// ----------------------------------------------------
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "food_diary",
  waitForConnections: true,
  connectionLimit: 10,
});

// ----------------------------------------------------
// API 1: GET /api/meals
// ----------------------------------------------------
app.get("/api/meals", async (req: Request, res: Response) => {
  try {
    // 1. รับค่า date จาก Query Parameter (เช่น ?date=2026-05-14)
    const { date } = req.query;

    // 2. เตรียมคำสั่ง SQL พื้นฐาน
    let query = "SELECT * FROM meals";
    let queryParams: any[] = [];

    // 3. ถ้ามีการส่ง date มา ให้เพิ่มเงื่อนไข WHERE เข้าไป
    if (date) {
      query += " WHERE meal_date = ?";
      queryParams.push(date);
    }

    // 4. จัดเรียงข้อมูลจากใหม่ไปเก่า
    query += " ORDER BY meal_date DESC, meal_time DESC";

    // 5. ดึงข้อมูลจากฐานข้อมูล
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
  // รับค่า calories เพิ่มมา
  const { mainDish, options, category, itemType, calories } = req.body;

  const today = new Date();
  const mealDate = today.toISOString().split("T")[0];
  const mealTime = today.toTimeString().split(" ")[0];

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // เพิ่ม calories ลงไปในคำสั่ง INSERT
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
app.delete("/api/meals/:id", async (req: Request, res: Response) => {
  const { id } = req.params; // รับค่า ID ที่ส่งมาจาก Frontend
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. ลบ "ตัวเลือกเสริม (options)" ที่ผูกกับมื้อนี้ทิ้งก่อน (ถ้าไม่ลบตัวลูกก่อน ตัวแม่จะลบไม่ได้ครับ)
    await connection.query("DELETE FROM meal_options WHERE meal_id = ?", [id]);

    // 2. ลบ "มื้ออาหารหลัก (meals)"
    const [result] = await connection.query("DELETE FROM meals WHERE id = ?", [
      id,
    ]);

    await connection.commit();

    // เช็คว่าลบสำเร็จไหม
    if ((result as any).affectedRows === 0) {
      res.status(404).json({ error: "ไม่พบข้อมูลที่ต้องการลบ" });
      return;
    }

    res.json({ message: "ลบข้อมูลสำเร็จ!" });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ error: "ลบข้อมูลล้มเหลว" });
  } finally {
    connection.release();
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
    // ถ้ามีวันที่นี้อยู่แล้วให้อัปเดตจำนวนแก้ว ถ้ายังไม่มีให้สร้างใหม่ (ON DUPLICATE KEY)
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
    // 1. สัดส่วนประเภทอาหาร (วงกลม)
    const [itemStats] = await pool.query(
      "SELECT item_type as name, COUNT(*) as value FROM meals GROUP BY item_type",
    );

    // 2. น้ำดื่ม 7 วันย้อนหลัง (กราฟแท่ง)
    const [waterStats] = await pool.query(
      "SELECT log_date as date, glasses FROM water_logs ORDER BY log_date DESC LIMIT 7",
    );

    // 3. แคลอรี่ย้อนหลัง 7 วัน (กราฟเส้น)
    const [calorieTrend] = await pool.query(`
      SELECT meal_date as date, SUM(calories) as total_cal 
      FROM meals 
      GROUP BY meal_date 
      ORDER BY meal_date DESC 
      LIMIT 7
    `);

    // 4. สรุปแคลอรี่รวม (วันนี้, เดือนนี้, ปีนี้)
    const [summaryStats] = await pool.query(`
      SELECT 
        SUM(CASE WHEN DATE(meal_date) = CURDATE() THEN calories ELSE 0 END) as cal_today,
        SUM(CASE WHEN MONTH(meal_date) = MONTH(CURDATE()) AND YEAR(meal_date) = YEAR(CURDATE()) THEN calories ELSE 0 END) as cal_month,
        SUM(CASE WHEN YEAR(meal_date) = YEAR(CURDATE()) THEN calories ELSE 0 END) as cal_year
      FROM meals
    `);

    // ปรับ Format วันที่ให้กราฟดูสวยๆ (เช่น "ศ. 15")
    const formatData = (data: any[], valueKey: string) => {
      return data
        .map((item) => {
          const d = new Date(item.date);
          return {
            date: `${d.toLocaleDateString("th-TH", { weekday: "short" })} ${d.getDate()}`,
            [valueKey]: item[valueKey],
          };
        })
        .reverse(); // กลับด้านให้จากเก่าไปใหม่
    };

    res.json({
      itemStats,
      waterStats: formatData(waterStats as any[], "glasses"),
      calorieTrend: formatData(calorieTrend as any[], "total_cal"),
      summary: (summaryStats as any[])[0], // ส่งก้อนสรุปไปให้ด้วย
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "ดึงข้อมูลสถิติล้มเหลว" });
  }
});

app.put("/api/meals/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  // รับค่า calories เข้ามาแก้ไขด้วย
  const { mainDish, category, itemType, options, calories } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // เพิ่ม calories ลงไปในคำสั่ง UPDATE
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

app.get("/api/search", async (req: Request, res: Response) => {
  const { q } = req.query;
  if (!q) return res.json([]);

  try {
    // 1. ค้นหาเมนูที่มีคำที่พิมพ์มา (เรียงจากวันที่ใหม่ไปเก่า)
    const [meals] = await pool.query(
      "SELECT * FROM meals WHERE main_dish LIKE ? OR item_type LIKE ? ORDER BY meal_date DESC LIMIT 50",
      [`%${q}%`, `%${q}%`],
    );

    // 2. ดึง Topping ของเมนูที่หาเจอมาประกอบร่าง
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

app.listen(port, () => {
  console.log(`Backend Server is running on http://localhost:${port}`);
});
