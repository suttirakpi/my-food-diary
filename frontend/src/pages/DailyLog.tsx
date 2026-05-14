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

  // ฟังก์ชันดึงข้อมูลจาก Backend
  const fetchMeals = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/meals");
      setMeals(response.data);
    } catch (error) {
      console.error("ดึงข้อมูลไม่สำเร็จ:", error);
    }
  };

  // เรียกใช้ fetchMeals เมื่อหน้าเว็บโหลด
  useEffect(() => {
    fetchMeals();
  }, []);

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
          <h2>Meal Entries</h2>
          <button className={styles.viewHistoryBtn}>
            View Full History{" "}
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
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
          <p style={{ textAlign: "center", marginTop: "40px" }}>
            ยังไม่มีข้อมูลมื้ออาหาร ลองเพิ่มดูสิ!
          </p>
        )}
      </main>
    </div>
  );
};

export default DailyLog;
