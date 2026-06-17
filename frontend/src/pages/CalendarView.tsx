// frontend/src/pages/CalendarView.tsx
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import styles from "./CalendarView.module.css";
import AppLayout from "../components/AppLayout";

interface CalendarData {
  meals: { date: string; total_cal: number }[];
  water: { date: string; glasses: number }[];
  exercises: { date: string; total_burned: number }[];
  protein?: { date: string; total_grams: number }[]; // เก็บไว้รองรับข้อมูลเดิม
  macros?: { date: string; protein: number; carbs: number; fats: number }[]; // 🌟 เพิ่มข้อมูล Macros ใหม่
}

const CalendarView: React.FC = () => {
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const DAILY_GOAL = 1400; // เป้าหมายแคลอรี่

  useEffect(() => {
    const fetchCalendarData = async () => {
      try {
        const res = await axios.get(
          "https://my-food-diary-n1tf.onrender.com/api/calendar",
        );
        setData(res.data);
      } catch (error) {
        console.error("ดึงข้อมูลปฏิทินล้มเหลว", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCalendarData();
  }, []);

  const prevMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  const nextMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );

  const calendarGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const blanks = Array(firstDay).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    return { blanks, days, year, month };
  }, [currentDate]);

  const getDayStats = (day: number) => {
    if (!data) return null;

    const year = calendarGrid.year;
    const month = String(calendarGrid.month + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    const fullDateStr = `${year}-${month}-${dayStr}`;

    const meal = data.meals.find((m) => m.date === fullDateStr);
    const water = data.water.find((w) => w.date === fullDateStr);
    const ex = data.exercises.find((e) => e.date === fullDateStr);

    // 🌟 ดึงข้อมูลจากตารางใหม่ (macros) หรือตารางเก่า (protein)
    const macroData = data.macros?.find((m) => m.date === fullDateStr);
    const legacyProtein = data.protein?.find((p) => p.date === fullDateStr);

    const totalCal = Number(meal?.total_cal || 0);
    const totalBurned = Number(ex?.total_burned || 0);
    const netCal = totalCal - totalBurned;

    return {
      cal: totalCal,
      burn: totalBurned,
      water: water?.glasses || 0,
      protein: macroData?.protein || legacyProtein?.total_grams || 0,
      carbs: macroData?.carbs || 0,
      fats: macroData?.fats || 0,
      netCal: netCal,
      hasData: totalCal > 0 || totalBurned > 0 || (water?.glasses || 0) > 0,
    };
  };

  const monthNames = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];
  const dayNames = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

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
              กำลังโหลดปฏิทิน...
            </h2>
            <p
              style={{
                color: "#64748b",
                margin: 0,
                fontSize: "14px",
                lineHeight: "1.6",
              }}
            >
              รอแป๊บนะฮะ ไวท์มอลกำลังกางปฏิทินให้อยู่!
              <br />
              (อาจใช้เวลาสักครู่หากเซิร์ฟเวอร์หลับ)
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
            <h1>Your Calendar</h1>
            <p>Review your daily nourishment history 📅</p>
          </div>

          <div className={styles.calendarCard}>
            <div className={styles.calendarHeader}>
              <button onClick={prevMonth} className={styles.navBtn}>
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <h2>
                {monthNames[calendarGrid.month]} {calendarGrid.year + 543}
              </h2>
              <button onClick={nextMonth} className={styles.navBtn}>
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>

            <div className={styles.calendarGrid}>
              {dayNames.map((day) => (
                <div key={day} className={styles.dayName}>
                  {day}
                </div>
              ))}

              {calendarGrid.blanks.map((_, i) => (
                <div key={`blank-${i}`} className={styles.blankCell}></div>
              ))}

              {calendarGrid.days.map((day) => {
                const stats = getDayStats(day);
                const isToday =
                  new Date().getDate() === day &&
                  new Date().getMonth() === calendarGrid.month &&
                  new Date().getFullYear() === calendarGrid.year;

                let borderClass = styles.borderDefault;
                if (stats?.hasData) {
                  borderClass =
                    stats.netCal > DAILY_GOAL
                      ? styles.borderRed
                      : styles.borderGreen;
                }

                return (
                  <div
                    key={day}
                    className={`${styles.dayCell} ${borderClass} ${isToday ? styles.today : ""}`}
                  >
                    <span className={styles.dayNumber}>{day}</span>

                    {stats && stats.hasData && (
                      <div className={styles.statsGrid}>
                        <div
                          className={`${styles.statItem} ${styles.labelCal}`}
                        >
                          <span>กิน:</span> <span>{stats.cal}</span>
                        </div>
                        <div
                          className={`${styles.statItem} ${styles.labelBurn}`}
                        >
                          <span>เบิร์น:</span> <span>{stats.burn}</span>
                        </div>
                        <div
                          className={`${styles.statItem} ${styles.labelWater}`}
                        >
                          <span>น้ำ:</span> <span>{stats.water}ก.</span>
                        </div>
                        <div
                          className={`${styles.statItem} ${styles.labelProtein}`}
                        >
                          <span>โปร:</span> <span>{stats.protein}g</span>
                        </div>
                        {/* 🌟 เพิ่มคาร์บและไขมันตรงนี้ */}
                        <div
                          className={`${styles.statItem} ${styles.labelCarbs}`}
                        >
                          <span>คาร์บ:</span> <span>{stats.carbs}g</span>
                        </div>
                        <div
                          className={`${styles.statItem} ${styles.labelFats}`}
                        >
                          <span>ไขมัน:</span> <span>{stats.fats}g</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default CalendarView;
