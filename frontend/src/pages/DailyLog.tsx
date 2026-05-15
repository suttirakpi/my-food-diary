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

  const formattedDate = new Date(selectedDate).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const getItemIcon = (type: string) => {
    if (type === "เครื่องดื่ม") return "🥤";
    if (type === "ขนม") return "🍰";
    return "🍛";
  };

  // ==========================================
  // 1. นำข้อมูลมาจัดกลุ่ม (Group) ตามหมวดหมู่ (Category)
  // ==========================================
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

  // 2. กำหนดลำดับการแสดงผล (เช้า -> กลางวัน -> เย็น -> ว่าง)
  const categoryOrder = ["มื้อเช้า", "มื้อกลางวัน", "มื้อเย็น", "ระหว่างวัน"];

  // 3. ฟังก์ชันช่วยเลือกสีของกล่องแต่ละมื้อ
  const getCategoryTheme = (cat: string) => {
    if (cat === "มื้อเช้า") return styles.themeOrange; // สีส้ม
    if (cat === "มื้อกลางวัน") return styles.themeRed; // สีแดง
    if (cat === "มื้อเย็น") return styles.themeYellow; // สีเหลือง
    return styles.themeBlue; // สีฟ้า (ระหว่างวัน/ของว่าง)
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.logo}>Suttirak : Food Diary</div>
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

        {/* ==========================================
            4. แสดงผลแยกตามกลุ่ม (Grid Category)
        ========================================== */}
        {meals.length > 0 ? (
          categoryOrder.map((cat) => {
            const mealsInCat = groupedMeals[cat];

            // ถ้ามื้อไหนไม่มีข้อมูลในวันนั้น ให้ข้ามไปไม่ต้องแสดงกล่อง
            if (!mealsInCat || mealsInCat.length === 0) return null;

            return (
              <section
                key={cat}
                className={`${styles.categorySection} ${getCategoryTheme(cat)}`}
              >
                {/* หัวข้อของกลุ่ม */}
                <h3 className={styles.categoryTitle}>{cat}</h3>

                {/* เริ่ม Grid แบ่ง 2 คอลัมน์ (หรือ 1 ในมือถือ) */}
                <div className={styles.mealGrid}>
                  {mealsInCat.map((meal) => (
                    <div key={meal.id} className={styles.mealCard}>
                      <div className={styles.cardHeader}>
                        <div>
                          <span className={styles.timeTag}>
                            เวลา • {meal.meal_time}
                          </span>
                          <h3 className={styles.dishTitle}>
                            {getItemIcon(meal.item_type)} {meal.main_dish}
                            <span
                              style={{
                                fontSize: "14px",
                                fontWeight: "normal",
                              }}
                            >
                              ({meal.item_type})
                            </span>
                          </h3>
                        </div>
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
