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
    const [meals] = await pool.query(
      "SELECT * FROM meals ORDER BY meal_date DESC, meal_time DESC",
    );
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
  const { mainDish, options } = req.body;

  const today = new Date();
  const mealDate = today.toISOString().split("T")[0];
  const mealTime = today.toTimeString().split(" ")[0];

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [mealResult] = await connection.query(
      "INSERT INTO meals (meal_date, meal_time, main_dish) VALUES (?, ?, ?)",
      [mealDate, mealTime, mainDish],
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

app.listen(port, () => {
  console.log(`Backend Server is running on http://localhost:${port}`);
});
