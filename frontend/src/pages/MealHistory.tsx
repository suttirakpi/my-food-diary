import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./MealHistory.module.css";

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
  calories: number;
  options: MealOption[];
}

const MealHistory: React.FC = () => {
  const navigate = useNavigate();
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // States สำหรับระบบค้นหาและตัวกรอง (Filters)
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ทั้งหมด");
  const [selectedType, setSelectedType] = useState<string>("ทั้งหมด");

  useEffect(() => {
    const fetchAllMeals = async () => {
      try {
        // ดึงข้อมูลมื้ออาหารทั้งหมด (ไม่ระบุวันที่ เพื่อเอามาทุกวัน)
        const res = await axios.get(
          "https://my-food-diary-n1tf.onrender.com/api/meals",
        );
        setMeals(res.data);
      } catch (error) {
        console.error("ดึงข้อมูลประวัติล้มเหลว:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllMeals();
  }, []);

  // 🌟 ระบบกรองข้อมูลอัจฉริยะ (Search & Filters Logic)
  const filteredMeals = useMemo(() => {
    return meals.filter((meal) => {
      const matchesSearch = meal.main_dish
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "ทั้งหมด" || meal.category === selectedCategory;
      const matchesType =
        selectedType === "ทั้งหมด" || meal.item_type === selectedType;
      return matchesSearch && matchesCategory && matchesType;
    });
  }, [meals, searchTerm, selectedCategory, selectedType]);

  // คำนวณแคลอรี่รวมของข้อมูลที่ถูกกรองอยู่ (เหมือนฟังก์ชัน SUM ใน Excel)
  const totalFilteredCalories = useMemo(() => {
    return filteredMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
  }, [filteredMeals]);

  if (loading)
    return (
      <div className={styles.pageContainer}>กำลังโหลดประวัติข้อมูล...</div>
    );

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate("/")}>
          <span className="material-symbols-outlined">arrow_back</span>{" "}
          กลับหน้าแรก
        </button>
        <h1 style={{ fontFamily: "var(--font-heading)", margin: 0 }}>
          Meal History Ledger
        </h1>
        <div style={{ width: "40px" }}></div>
      </header>

      {/* 🔍 ส่วนแถบตัวกรองและค้นหา (Excel Filter Bar) */}
      <div className={styles.filterSection}>
        <div className={styles.inputGroup}>
          <label>ค้นหาชื่อเมนู</label>
          <input
            type="text"
            placeholder="พิมพ์ชื่ออาหารเพื่อค้นหา..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.inputGroup}>
          <label>กรองตามมื้ออาหาร</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="ทั้งหมด">ทั้งหมดทุกมื้อ</option>
            <option value="มื้อเช้า">มื้อเช้า</option>
            <option value="มื้อกลางวัน">มื้อกลางวัน</option>
            <option value="มื้อเย็น">มื้อเย็น</option>
            <option value="ระหว่างวัน">ระหว่างวัน</option>
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label>กรองตามประเภท</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="ทั้งหมด">ทั้งหมดทุกประเภท</option>
            <option value="อาหาร">อาหาร</option>
            <option value="เครื่องดื่ม">เครื่องดื่ม</option>
            <option value="ขนม">ขนม</option>
          </select>
        </div>
      </div>

      {/* สรุปแถวข้อมูลเบื้องต้น */}
      <div className={styles.tableSummary}>
        พบข้อมูลทั้งหมด <strong>{filteredMeals.length}</strong> รายการ |
        แคลอรี่รวมในตารางนี้: <strong>{totalFilteredCalories} kcal</strong>
      </div>

      {/* 📊 ตารางข้อมูลสไตล์ Excel */}
      <div className={styles.tableWrapper}>
        <table className={styles.excelTable}>
          <thead>
            <tr>
              <th>วันที่</th>
              <th>เวลา</th>
              <th>มื้ออาหาร</th>
              <th>ประเภท</th>
              <th>ชื่อเมนูอาหาร / เครื่องดื่ม</th>
              <th>ท็อปปิ้ง / รายละเอียดเพิ่มเติม</th>
              <th style={{ textAlign: "right" }}>แคลอรี่ (kcal)</th>
            </tr>
          </thead>
          <tbody>
            {filteredMeals.length > 0 ? (
              filteredMeals.map((meal) => {
                const dateObj = new Date(meal.meal_date);
                const formattedDate = dateObj.toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });

                return (
                  <tr key={meal.id}>
                    <td data-label="วันที่" className={styles.dateCell}>
                      {formattedDate}
                    </td>
                    <td data-label="เวลา">
                      {meal.meal_time.substring(0, 5)} น.
                    </td>
                    <td data-label="มื้ออาหาร">
                      <span
                        className={`${styles.badge} ${styles[meal.category]}`}
                      >
                        {meal.category}
                      </span>
                    </td>
                    <td data-label="ประเภท">{meal.item_type}</td>
                    <td data-label="ชื่อเมนู" style={{ fontWeight: 600 }}>
                      {meal.main_dish}
                    </td>
                    <td data-label="ท็อปปิ้ง">
                      {meal.options && meal.options.length > 0 ? (
                        <div className={styles.toppingContainer}>
                          {meal.options.map((opt) => (
                            <span key={opt.id} className={styles.toppingTag}>
                              {opt.option_name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: "#bfbfbf" }}>-</span>
                      )}
                    </td>
                    <td
                      data-label="แคลอรี่"
                      style={{
                        textAlign: "right",
                        fontWeight: "bold",
                        color: "#e65100",
                      }}
                    >
                      {meal.calories > 0 ? `${meal.calories} 🔥` : "0"}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "var(--on-surface-variant)",
                  }}
                >
                  ❌ ไม่พบข้อมูลที่ตรงกับตัวกรองซักรายการเลยครับตูน
                </td>
              </tr>
            )}
          </tbody>
          {/* แถวสรุปท้ายตารางสไตล์ Excel */}
          <tfoot>
            <tr>
              <td
                colSpan={6}
                style={{ fontWeight: "bold", textAlign: "right" }}
              >
                รวมแคลอรี่สุทธิ (SUM):
              </td>
              <td
                style={{
                  fontWeight: "bold",
                  textAlign: "right",
                  color: "#d32f2f",
                  fontSize: "18px",
                }}
              >
                {totalFilteredCalories} kcal
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default MealHistory;
