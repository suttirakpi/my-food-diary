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
  category: string;
  item_type: string;
  options: MealOption[];
}

const DailyLog: React.FC = () => {
  const navigate = useNavigate();
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );

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

  useEffect(() => {
    fetchMeals();
  }, [selectedDate]);

  const handleDelete = async (id: number) => {
    const isConfirm = window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?");
    if (!isConfirm) return;

    try {
      await axios.delete(`http://localhost:3000/api/meals/${id}`);
      setMeals((prevMeals) => prevMeals.filter((meal) => meal.id !== id));
    } catch (error) {
      console.error("ลบข้อมูลไม่สำเร็จ:", error);
      alert("เกิดข้อผิดพลาดในการลบข้อมูล");
    }
  };

  const formattedDate = new Date(selectedDate).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const groupedMeals = meals.reduce(
    (acc, meal) => {
      const cat = meal.category || "อื่นๆ";
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat].push(meal);
      return acc;
    },
    {} as Record<string, MealEntry[]>,
  );

  const categoryOrder = ["มื้อเช้า", "มื้อกลางวัน", "มื้อเย็น", "ระหว่างวัน"];

  const getCategoryTheme = (cat: string) => {
    if (cat === "มื้อเช้า") return styles.themeOrange;
    if (cat === "มื้อกลางวัน") return styles.themeRed;
    if (cat === "มื้อเย็น") return styles.themeYellow;
    return styles.themeBlue;
  };

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
          <h2>รายการอาหาร ({formattedDate})</h2>

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
          categoryOrder.map((cat) => {
            const mealsInCat = groupedMeals[cat];
            if (!mealsInCat || mealsInCat.length === 0) return null;

            return (
              <section
                key={cat}
                className={`${styles.categorySection} ${getCategoryTheme(cat)}`}
              >
                <h3 className={styles.categoryTitle}>{cat}</h3>

                <div className={styles.mealGrid}>
                  {mealsInCat.map((meal) => (
                    <div key={meal.id} className={styles.mealCard}>
                      <div
                        className={styles.cardHeader}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <div>
                          <span className={styles.timeTag}>
                            เวลา • {meal.meal_time}
                          </span>
                          <h3 className={styles.dishTitle}>
                            {meal.main_dish}
                            <span
                              style={{
                                fontSize: "14px",
                                fontWeight: "normal",
                                color: "var(--on-surface-variant)",
                                marginLeft: "8px",
                              }}
                            >
                              ({meal.item_type})
                            </span>
                          </h3>
                        </div>
                        <button
                          onClick={() => handleDelete(meal.id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#ff4d4f",
                            cursor: "pointer",
                            padding: "8px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          onMouseOver={(e) =>
                            (e.currentTarget.style.backgroundColor = "#ffebee")
                          }
                          onMouseOut={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              "transparent")
                          }
                          title="ลบรายการนี้"
                        >
                          <span className="material-symbols-outlined">
                            delete
                          </span>
                        </button>
                      </div>

                      <div className={styles.cardBody}>
                        <div className={styles.detailColumn}>
                          <p className={styles.detailLabel}>Main Item</p>
                          <p>{meal.main_dish}</p>
                        </div>
                        <div className={styles.detailColumn}>
                          <p className={styles.detailLabel}>Toppings</p>
                          {meal.options && meal.options.length > 0 ? (
                            <ul>
                              {meal.options.map((opt) => (
                                <li key={opt.id}>{opt.option_name}</li>
                              ))}
                            </ul>
                          ) : (
                            <p style={{ color: "var(--on-surface-variant)" }}>
                              -
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })
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
