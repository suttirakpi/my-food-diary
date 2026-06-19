// frontend/src/pages/MealHistory.tsx
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import styles from "./MealHistory.module.css";
import AppLayout from "../components/AppLayout";

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
  protein?: number; // 🌟 เพิ่มมารองรับข้อมูลใหม่
  carbs?: number; // 🌟 เพิ่มมารองรับข้อมูลใหม่
  fats?: number; // 🌟 เพิ่มมารองรับข้อมูลใหม่
  options: MealOption[];
}

const getLocalDateStr = (dateString: string) => {
  const d = new Date(dateString);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const MealHistory: React.FC = () => {
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [waterData, setWaterData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ทั้งหมด");
  const [selectedType, setSelectedType] = useState<string>("ทั้งหมด");
  const [minCal, setMinCal] = useState<number | "">("");
  const [maxCal, setMaxCal] = useState<number | "">("");
  const [sortOrder, setSortOrder] = useState<string>("default");

  const [currentPage, setCurrentPage] = useState<number>(1);
  const DATES_PER_PAGE = 7;
  const MEALS_PER_PAGE = 15;

  const isGroupedView = sortOrder === "default";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mealsRes, calendarRes] = await Promise.all([
          axios.get("https://my-food-diary-n1tf.onrender.com/api/meals"),
          axios.get("https://my-food-diary-n1tf.onrender.com/api/calendar"),
        ]);
        setMeals(mealsRes.data);

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

  const filteredMeals = useMemo(() => {
    let result = meals.filter((meal) => {
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

    if (sortOrder === "highToLow") {
      result.sort(
        (a, b) => (Number(b.calories) || 0) - (Number(a.calories) || 0),
      );
    } else if (sortOrder === "lowToHigh") {
      result.sort(
        (a, b) => (Number(a.calories) || 0) - (Number(b.calories) || 0),
      );
    }

    return result;
  }, [
    meals,
    searchTerm,
    selectedCategory,
    selectedType,
    minCal,
    maxCal,
    sortOrder,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedType, minCal, maxCal, sortOrder]);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, MealEntry[]> = {};
    filteredMeals.forEach((meal) => {
      const dateStr = getLocalDateStr(meal.meal_date);
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(meal);
    });
    return groups;
  }, [filteredMeals]);

  const uniqueDates = useMemo(() => {
    return Object.keys(groupedByDate).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime(),
    );
  }, [groupedByDate]);

  const totalPages = isGroupedView
    ? Math.ceil(uniqueDates.length / DATES_PER_PAGE) || 1
    : Math.ceil(filteredMeals.length / MEALS_PER_PAGE) || 1;

  const currentDates = useMemo(() => {
    const startIndex = (currentPage - 1) * DATES_PER_PAGE;
    return uniqueDates.slice(startIndex, startIndex + DATES_PER_PAGE);
  }, [uniqueDates, currentPage]);

  const currentFlatMeals = useMemo(() => {
    const startIndex = (currentPage - 1) * MEALS_PER_PAGE;
    return filteredMeals.slice(startIndex, startIndex + MEALS_PER_PAGE);
  }, [filteredMeals, currentPage]);

  const totalFilteredCalories = useMemo(() => {
    return filteredMeals.reduce(
      (sum, meal) => sum + (Number(meal.calories) || 0),
      0,
    );
  }, [filteredMeals]);

  return (
    <AppLayout>
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingCard}>
            <div className={styles.loadingMascot}>🐹💨</div>
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                margin: "0 0 8px 0",
                color: "#0f172a",
              }}
            >
              กำลังโหลดประวัติ...
            </h2>
            <p
              style={{
                color: "#64748b",
                margin: 0,
                fontSize: "14px",
                lineHeight: "1.6",
              }}
            >
              รอแป๊บนะฮะ ไวท์มอลกำลังรื้อแฟ้มประวัติให้อยู่!
            </p>
            <div className={styles.loadingBarContainer}>
              <div className={styles.loadingBar}></div>
            </div>
          </div>
        </div>
      )}

      {!loading && (
        <div className={styles.contentWrapper}>
          <div className={styles.pageHeader}>
            <h1>Meal History Ledger</h1>
            <p>Review and filter your past dietary records 📋</p>
          </div>

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
                <span style={{ color: "#94a3b8", fontWeight: "bold" }}>-</span>
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
              <label>เรียงลำดับแคลอรี่</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="default">ค่าเริ่มต้น (จัดกลุ่มตามวัน)</option>
                <option value="highToLow">แคลอรี่: มากไปน้อย 🔥</option>
                <option value="lowToHigh">แคลอรี่: น้อยไปมาก 🥗</option>
              </select>
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
            พบข้อมูลทั้งหมด <strong>{filteredMeals.length}</strong> รายการ
            &nbsp;|&nbsp; แคลอรี่รวมในการค้นหานี้:{" "}
            <strong>{totalFilteredCalories} kcal</strong>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.excelTable}>
              <thead>
                <tr>
                  {!isGroupedView && <th>วันที่</th>}
                  <th>เวลา</th>
                  <th>มื้ออาหาร</th>
                  <th>ชื่อเมนูอาหาร / เครื่องดื่ม</th>
                  <th>ท็อปปิ้ง / เพิ่มเติม</th>
                  {/* 🌟 เพิ่มหัวตาราง Macros */}
                  <th style={{ textAlign: "right" }}>สารอาหาร (Macros)</th>
                  <th style={{ textAlign: "right" }}>แคลอรี่ (kcal)</th>
                </tr>
              </thead>
              <tbody>
                {isGroupedView ? (
                  currentDates.length > 0 ? (
                    currentDates.map((date) => {
                      const dayMeals = groupedByDate[date];
                      const glasses = waterData[date] || 0;
                      const dateObj = new Date(date);
                      const formattedDate = dateObj.toLocaleDateString(
                        "th-TH",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          weekday: "long",
                        },
                      );

                      return (
                        <React.Fragment key={date}>
                          <tr className={styles.dateHeaderRow}>
                            <td colSpan={7}>
                              📅 {formattedDate} &nbsp;&nbsp;|&nbsp;&nbsp; 💧
                              ดื่มน้ำ: {glasses} แก้ว ({glasses * 22} oz /{" "}
                              {((glasses * 650) / 1000).toFixed(1)} L)
                            </td>
                          </tr>

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
                              <td
                                data-label="ชื่อเมนู"
                                style={{ fontWeight: 700 }}
                              >
                                {meal.main_dish}
                                <div
                                  style={{
                                    fontSize: "12px",
                                    color: "#94a3b8",
                                    fontWeight: "normal",
                                    marginTop: "2px",
                                  }}
                                >
                                  {meal.item_type}
                                </div>
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
                                  <span style={{ color: "#cbd5e1" }}>-</span>
                                )}
                              </td>
                              {/* 🌟 เซลล์แสดง Macros แบบแยกบรรทัด */}
                              <td
                                data-label="สารอาหาร"
                                className={styles.macroCell}
                              >
                                {meal.protein || meal.carbs || meal.fats ? (
                                  <>
                                    <span
                                      className={`${styles.macroText} ${styles.textProtein}`}
                                    >
                                      Pro: {meal.protein || 0}g
                                    </span>
                                    <span
                                      className={`${styles.macroText} ${styles.textCarbs}`}
                                    >
                                      Carb: {meal.carbs || 0}g
                                    </span>
                                    <span
                                      className={`${styles.macroText} ${styles.textFats}`}
                                    >
                                      Fat: {meal.fats || 0}g
                                    </span>
                                  </>
                                ) : (
                                  <span
                                    style={{
                                      color: "#cbd5e1",
                                      fontSize: "13px",
                                    }}
                                  >
                                    ไม่มีข้อมูล
                                  </span>
                                )}
                              </td>
                              <td
                                data-label="แคลอรี่"
                                style={{
                                  textAlign: "right",
                                  fontWeight: "bold",
                                  color: "#10b981",
                                  verticalAlign: "top",
                                }}
                              >
                                {meal.calories > 0 ? `${meal.calories}` : "0"}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          textAlign: "center",
                          padding: "40px",
                          color: "#64748b",
                          fontWeight: 500,
                        }}
                      >
                        ❌ ไม่พบข้อมูลที่ตรงกับตัวกรอง
                      </td>
                    </tr>
                  )
                ) : currentFlatMeals.length > 0 ? (
                  currentFlatMeals.map((meal) => {
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
                        <td data-label="ชื่อเมนู" style={{ fontWeight: 700 }}>
                          {meal.main_dish}
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#94a3b8",
                              fontWeight: "normal",
                              marginTop: "2px",
                            }}
                          >
                            {meal.item_type}
                          </div>
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
                            <span style={{ color: "#cbd5e1" }}>-</span>
                          )}
                        </td>
                        <td data-label="สารอาหาร" className={styles.macroCell}>
                          {meal.protein || meal.carbs || meal.fats ? (
                            <>
                              <span
                                className={`${styles.macroText} ${styles.textProtein}`}
                              >
                                Pro: {meal.protein || 0}g
                              </span>
                              <span
                                className={`${styles.macroText} ${styles.textCarbs}`}
                              >
                                Carb: {meal.carbs || 0}g
                              </span>
                              <span
                                className={`${styles.macroText} ${styles.textFats}`}
                              >
                                Fat: {meal.fats || 0}g
                              </span>
                            </>
                          ) : (
                            <span
                              style={{ color: "#cbd5e1", fontSize: "13px" }}
                            >
                              ไม่มีข้อมูล
                            </span>
                          )}
                        </td>
                        <td
                          data-label="แคลอรี่"
                          style={{
                            textAlign: "right",
                            fontWeight: "bold",
                            color: "#10b981",
                            verticalAlign: "top",
                          }}
                        >
                          {meal.calories > 0 ? `${meal.calories}` : "0"}
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
                        color: "#64748b",
                        fontWeight: 500,
                      }}
                    >
                      ❌ ไม่พบข้อมูล
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td
                    colSpan={isGroupedView ? 5 : 6}
                    style={{
                      fontWeight: "bold",
                      textAlign: "right",
                      color: "#475569",
                    }}
                  >
                    รวมแคลอรี่สุทธิที่กรองมาได้ (SUM):
                  </td>
                  <td
                    style={{
                      fontWeight: "800",
                      textAlign: "right",
                      color: "#0f172a",
                      fontSize: "18px",
                    }}
                  >
                    {totalFilteredCalories} kcal
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

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
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                ถัดไป{" "}
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
};

export default MealHistory;
