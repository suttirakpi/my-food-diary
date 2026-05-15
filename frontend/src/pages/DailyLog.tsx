import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./DailyLog.module.css";

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
  const [meals, setMeals] = useState<MealEntry[]>([]);

  // 1. สร้าง State เก็บวันที่ ค่าเริ่มต้นคือ "วันนี้" (รูปแบบ YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );

  // 2. ฟังก์ชันดึงข้อมูล แนบวันที่เข้าไปใน URL ด้วย
  const fetchMeals = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3000/api/meals?date=${selectedDate}`,
      );
      setMeals(response.data);
    } catch (error) {
      console.error("ดึงข้อมูลไม่สำเร็จ:", error);
    }
  };

  // 3. ใช้ useEffect สั่งให้ดึงข้อมูล "ทุกครั้งที่ selectedDate เปลี่ยนแปลง"
  useEffect(() => {
    fetchMeals();
  }, [selectedDate]);

  // ฟังก์ชันแปลงวันที่สำหรับแสดงผลให้ดูสวยขึ้น (เช่น 14 พฤษภาคม 2026)
  const formattedDate = new Date(selectedDate).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.logo}>Vitality Food Diary</div>
        <button className={styles.addBtn} onClick={() => navigate("/add-meal")}>
          <span className="material-symbols-outlined">add</span> Add Meal
        </button>
      </header>

      <main className={styles.mainContent}>
        <div className={styles.sectionHeader}>
          {/* แสดงหัวข้อพร้อมวันที่ปัจจุบันที่เลือกอยู่ */}
          <h2>รายการอาหาร ({formattedDate})</h2>

          {/* 4. กล่องเลือกวันที่ (Date Picker) */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label
              htmlFor="datePicker"
              style={{ fontWeight: 600, color: "var(--on-surface-variant)" }}
            >
              เลือกวันที่:
            </label>
            <input
              type="date"
              id="datePicker"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid var(--tertiary-fixed)",
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>
        </div>

        {meals.length > 0 ? (
          meals.map((meal) => (
            <div key={meal.id} className={styles.mealCard}>
              <div className={styles.cardHeader}>
                <div>
                  <span className={styles.timeTag}>
                    Time • {meal.meal_time}
                  </span>
                  <h3 className={styles.dishTitle}>{meal.main_dish}</h3>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.detailColumn}>
                  <p className={styles.detailLabel}>Main Dish</p>
                  <p>{meal.main_dish}</p>
                </div>
                <div className={styles.detailColumn}>
                  <p className={styles.detailLabel}>Side Options</p>
                  {meal.options && meal.options.length > 0 ? (
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
          ))
        ) : (
          <div
            style={{
              textAlign: "center",
              marginTop: "40px",
              padding: "40px",
              backgroundColor: "white",
              borderRadius: "12px",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "48px", color: "var(--outline-variant)" }}
            >
              restaurant
            </span>
            <p
              style={{ marginTop: "16px", color: "var(--on-surface-variant)" }}
            >
              ยังไม่มีการบันทึกอาหารในวันที่เลือก
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default DailyLog;
