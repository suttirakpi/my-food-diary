import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./DailyLog.module.css";

// 1. สร้าง Type โครงสร้างให้เหมือนกับ Database Schema เป๊ะๆ
interface MealOption {
  id: number;
  option_name: string;
}

interface MealEntry {
  id: number;
  meal_date: string;
  meal_time: string;
  main_dish: string;
  options: MealOption[];
}

const DailyLog: React.FC = () => {
  const navigate = useNavigate();

  // 2. สร้างข้อมูลจำลอง (Mock Data) เสมือนว่าดึงมาจาก Backend แล้ว
  const [meals, setMeals] = useState<MealEntry[]>([
    {
      id: 1,
      meal_date: "2026-05-14",
      meal_time: "08:30",
      main_dish: "ข้าวอกไก่",
      options: [
        { id: 101, option_name: "ไข่ข้น" },
        { id: 102, option_name: "ซอสเทอริยากิ" },
      ],
    },
    {
      id: 2,
      meal_date: "2026-05-14",
      meal_time: "12:15",
      main_dish: "บะหมี่เกี๊ยว",
      options: [
        { id: 103, option_name: "หมูแดง" },
        { id: 104, option_name: "ไข่ต้ม" },
      ],
    },
  ]);

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>Vitality Food Diary</div>
        <button className={styles.addBtn} onClick={() => navigate("/add-meal")}>
          <span className="material-symbols-outlined">add</span> Add Meal
        </button>
      </header>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.sectionHeader}>
          <h2>Meal Entries</h2>
          <button className={styles.viewHistoryBtn}>
            View Full History{" "}
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>

        {/* 3. ใช้ .map() วนลูปข้อมูลจาก State มาแสดงผลเป็น Card */}
        {meals.map((meal) => (
          <div key={meal.id} className={styles.mealCard}>
            <div className={styles.cardHeader}>
              <div>
                {/* แสดงเวลา */}
                <span className={styles.timeTag}>Time • {meal.meal_time}</span>
                {/* แสดงชื่อเมนูหลัก */}
                <h3 className={styles.dishTitle}>{meal.main_dish}</h3>
              </div>
              {/* เอาส่วนของ Badge (High Protein) ออกไปแล้วเพื่อให้ตรงกับ DB */}
            </div>

            <div className={styles.cardBody}>
              <div className={styles.detailColumn}>
                <p className={styles.detailLabel}>Main Dish</p>
                <p>{meal.main_dish}</p>
              </div>
              <div className={styles.detailColumn}>
                <p className={styles.detailLabel}>Side Options</p>
                {/* เช็คว่ามี options ไหม ถ้ามีก็วนลูปแสดงเป็นรายการ (li) */}
                {meal.options.length > 0 ? (
                  <ul>
                    {meal.options.map((opt) => (
                      <li key={opt.id}>{opt.option_name}</li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: "var(--on-surface-variant)" }}>
                    - ไม่มีตัวเลือกเสริม -
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};

export default DailyLog;
