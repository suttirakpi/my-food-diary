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
  // 1. รับค่า itemType เพิ่มเข้ามา
  const { mainDish, options, category, itemType } = req.body;

  const today = new Date();
  const mealDate = today.toISOString().split("T")[0];
  const mealTime = today.toTimeString().split(" ")[0];

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 2. เพิ่ม item_type ลงในคำสั่ง INSERT
    const [mealResult] = await connection.query(
      "INSERT INTO meals (meal_date, meal_time, main_dish, category, item_type) VALUES (?, ?, ?, ?, ?)",
      [mealDate, mealTime, mainDish, category, itemType],
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
    // 1. สรุปสัดส่วนประเภทของกินทั้งหมด (Pie Chart)
    const [itemStats] = await pool.query(
      "SELECT item_type as name, COUNT(*) as value FROM meals GROUP BY item_type",
    );

    // 2. ดึงข้อมูลน้ำดื่มย้อนหลัง 7 วัน (Bar Chart)
    const [waterStats] = await pool.query(
      "SELECT log_date as date, glasses FROM water_logs ORDER BY log_date DESC LIMIT 7",
    );

    // ปรับฟอร์แมตวันที่ให้สวยงาม (เช่น "ศ. 15") และเรียงจากเก่าไปใหม่
    const formattedWaterStats = (waterStats as any[])
      .map((w) => {
        const d = new Date(w.date);
        const shortDay = d.toLocaleDateString("th-TH", { weekday: "short" });
        const dayNum = d.getDate();
        return {
          date: `${shortDay} ${dayNum}`,
          glasses: w.glasses,
          oz: w.glasses * 22, // แปลงเป็นออนซ์ให้ด้วยเลย
        };
      })
      .reverse();

    res.json({
      itemStats,
      waterStats: formattedWaterStats,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "ดึงข้อมูลสถิติล้มเหลว" });
  }
});

app.put("/api/meals/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { mainDish, category, itemType, options } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. อัปเดตข้อมูลหลัก (ชื่อเมนู, หมวดหมู่, ประเภท)
    await connection.query(
      "UPDATE meals SET main_dish = ?, category = ?, item_type = ? WHERE id = ?",
      [mainDish, category, itemType, id],
    );

    // 2. ลบ Topping เดิมทิ้งให้หมดก่อน
    await connection.query("DELETE FROM meal_options WHERE meal_id = ?", [id]);

    // 3. Insert Topping ใหม่ (ถ้ามี)
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

app.listen(port, () => {
  console.log(`Backend Server is running on http://localhost:${port}`);
});
