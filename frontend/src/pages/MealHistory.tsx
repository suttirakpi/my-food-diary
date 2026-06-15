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

// ฟังก์ชันแปลงวันที่ให้ตรงกับ Timezone ท้องถิ่น (YYYY-MM-DD)
const getLocalDateStr = (dateString: string) => {
  const d = new Date(dateString);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const MealHistory: React.FC = () => {
  const navigate = useNavigate();
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [waterData, setWaterData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);

  // 🌟 States สำหรับระบบค้นหาและตัวกรอง (Filters)
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ทั้งหมด");
  const [selectedType, setSelectedType] = useState<string>("ทั้งหมด");
  const [minCal, setMinCal] = useState<number | "">("");
  const [maxCal, setMaxCal] = useState<number | "">("");

  // 🌟 State สำหรับระบบแบ่งหน้า (Pagination)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const DATES_PER_PAGE = 7; // จำกัดให้แสดงหน้าละ 7 วัน

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ดึงทั้งข้อมูล Meals และ ข้อมูล Calendar (เพื่อเอาน้ำดื่ม)
        const [mealsRes, calendarRes] = await Promise.all([
          axios.get("https://my-food-diary-n1tf.onrender.com/api/meals"),
          axios.get("https://my-food-diary-n1tf.onrender.com/api/calendar"),
        ]);
        setMeals(mealsRes.data);

        // ดึงข้อมูลน้ำดื่มมาจัดรูปให้ค้นหาง่ายๆ (key เป็นวันที่ value เป็นแก้ว)
        const wData: Record<string, number> = {};
        if (calendarRes.data && calendarRes.data.water) {
          calendarRes.data.water.forEach((w: any) => {
            wData[w.date] = w.glasses;
          });
        }
        setWaterData(wData);
      } catch (error) {
        console.error("ดึงข้อมูลประวัติล้มเหลว:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 🌟 1. กรองข้อมูลตามเงื่อนไขที่ผู้ใช้กรอก
  const filteredMeals = useMemo(() => {
    return meals.filter((meal) => {
      const matchesSearch = meal.main_dish
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "ทั้งหมด" || meal.category === selectedCategory;
      const matchesType =
        selectedType === "ทั้งหมด" || meal.item_type === selectedType;

      const cal = Number(meal.calories) || 0;
      const matchesMinCal = minCal === "" || cal >= minCal;
      const matchesMaxCal = maxCal === "" || cal <= maxCal;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesType &&
        matchesMinCal &&
        matchesMaxCal
      );
    });
  }, [meals, searchTerm, selectedCategory, selectedType, minCal, maxCal]);

  // รีเซ็ตหน้ากลับไปหน้าที่ 1 เสมอเวลาเปลี่ยนตัวกรอง
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedType, minCal, maxCal]);

  // 🌟 2. จัดกลุ่มข้อมูลที่กรองแล้ว "ตามวันที่"
  const groupedByDate = useMemo(() => {
    const groups: Record<string, MealEntry[]> = {};
    filteredMeals.forEach((meal) => {
      const dateStr = getLocalDateStr(meal.meal_date);
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(meal);
    });
    return groups;
  }, [filteredMeals]);

  // 🌟 3. ดึงวันที่ทั้งหมดมาเรียงลำดับจากใหม่ -> เก่า
  const uniqueDates = useMemo(() => {
    return Object.keys(groupedByDate).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime(),
    );
  }, [groupedByDate]);

  // 🌟 4. คำนวณระบบหน้า (Pagination)
  const totalPages = Math.ceil(uniqueDates.length / DATES_PER_PAGE) || 1;
  const currentDates = useMemo(() => {
    const startIndex = (currentPage - 1) * DATES_PER_PAGE;
    return uniqueDates.slice(startIndex, startIndex + DATES_PER_PAGE);
  }, [uniqueDates, currentPage]);

  const totalFilteredCalories = useMemo(() => {
    return filteredMeals.reduce(
      (sum, meal) => sum + (Number(meal.calories) || 0),
      0,
    );
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
          <label>กรองตามแคลอรี่ (kcal)</label>
          <div className={styles.calFilterGroup}>
            <input
              type="number"
              placeholder="Min"
              value={minCal}
              onChange={(e) =>
                setMinCal(e.target.value ? Number(e.target.value) : "")
              }
            />
            <span>-</span>
            <input
              type="number"
              placeholder="Max"
              value={maxCal}
              onChange={(e) =>
                setMaxCal(e.target.value ? Number(e.target.value) : "")
              }
            />
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label>มื้ออาหาร</label>
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
          <label>ประเภท</label>
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

      <div className={styles.tableSummary}>
        พบข้อมูลทั้งหมด <strong>{filteredMeals.length}</strong> รายการ |
        แคลอรี่รวมในการค้นหานี้: <strong>{totalFilteredCalories} kcal</strong>
      </div>

      {/* 📊 ตารางข้อมูล (ตัดคอลัมน์วันที่ออก เพราะใช้วิธีจัดกลุ่มรายวันแทน) */}
      <div className={styles.tableWrapper}>
        <table className={styles.excelTable}>
          <thead>
            <tr>
              <th>เวลา</th>
              <th>มื้ออาหาร</th>
              <th>ประเภท</th>
              <th>ชื่อเมนูอาหาร / เครื่องดื่ม</th>
              <th>ท็อปปิ้ง / เพิ่มเติม</th>
              <th style={{ textAlign: "right" }}>แคลอรี่ (kcal)</th>
            </tr>
          </thead>
          <tbody>
            {currentDates.length > 0 ? (
              currentDates.map((date) => {
                const dayMeals = groupedByDate[date];
                const glasses = waterData[date] || 0;

                // จัดฟอร์แมตวันที่ให้สวยงาม
                const dateObj = new Date(date);
                const formattedDate = dateObj.toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  weekday: "long",
                });

                return (
                  <React.Fragment key={date}>
                    {/* 🌟 แถบหัวตารางของแต่ละวัน (รวมข้อมูลน้ำดื่ม) */}
                    <tr className={styles.dateHeaderRow}>
                      <td colSpan={6}>
                        📅 {formattedDate} &nbsp;&nbsp;|&nbsp;&nbsp; 💧 ดื่มน้ำ:{" "}
                        {glasses} แก้ว ({glasses * 22} oz /{" "}
                        {((glasses * 650) / 1000).toFixed(1)} L)
                      </td>
                    </tr>

                    {/* ข้อมูลมื้ออาหารของวันนั้นๆ */}
                    {dayMeals.map((meal) => (
                      <tr key={meal.id}>
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
                                <span
                                  key={opt.id}
                                  className={styles.toppingTag}
                                >
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
                    ))}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={6}
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
          <tfoot>
            <tr>
              <td
                colSpan={5}
                style={{ fontWeight: "bold", textAlign: "right" }}
              >
                รวมแคลอรี่สุทธิที่กรองมาได้ (SUM):
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

      {/* 🌟 ระบบแบ่งหน้า (Pagination) โชว์ด้านล่าง */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <span className="material-symbols-outlined">chevron_left</span>{" "}
            ก่อนหน้า
          </button>

          <span className={styles.pageInfo}>
            หน้าที่ {currentPage} จาก {totalPages}
          </span>

          <button
            className={styles.pageBtn}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            ถัดไป{" "}
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default MealHistory;
