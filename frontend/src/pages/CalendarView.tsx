import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./CalendarView.module.css";

interface CalendarData {
  meals: { date: string; total_cal: number }[];
  water: { date: string; glasses: number }[];
  exercises: { date: string; total_burned: number }[];
  protein: { date: string; total_grams: number }[]; // 🌟 เพิ่มโปรตีน
}

const CalendarView: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const DAILY_GOAL = 1400; // เป้าหมายแคลอรี่

  useEffect(() => {
    const fetchCalendarData = async () => {
      try {
        // ดึงข้อมูลรวม (Backend ต้องส่ง protein มาใน /api/calendar ด้วยนะครับ)
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

  // 🌟 ฟังก์ชันดึงตัวเลขสถิติรายวัน
  const getDayStats = (day: number) => {
    if (!data) return null;

    const year = calendarGrid.year;
    const month = String(calendarGrid.month + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    const fullDateStr = `${year}-${month}-${dayStr}`;

    const meal = data.meals.find((m) => m.date === fullDateStr);
    const water = data.water.find((w) => w.date === fullDateStr);
    const ex = data.exercises.find((e) => e.date === fullDateStr);
    const protein = data.protein?.find((p) => p.date === fullDateStr);

    const totalCal = Number(meal?.total_cal || 0);
    const totalBurned = Number(ex?.total_burned || 0);
    const netCal = totalCal - totalBurned;

    return {
      cal: totalCal,
      burn: totalBurned,
      water: water?.glasses || 0,
      protein: protein?.total_grams || 0,
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

  if (loading)
    return <div className={styles.pageContainer}>กำลังโหลดปฏิทิน...</div>;

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate("/")}>
          <span className="material-symbols-outlined">arrow_back</span>{" "}
          กลับหน้าหลัก
        </button>
        <h1 className={styles.title}>สถิติรายวัน</h1>
        <div style={{ width: "40px" }}></div>
      </header>

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

            // 🌟 ตัดสินใจเรื่องสีขอบ
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

                {stats && (
                  <div className={styles.statsGrid}>
                    <div className={`${styles.statItem} ${styles.labelCal}`}>
                      <span>กิน:</span> <span>{stats.cal}</span>
                    </div>
                    <div className={`${styles.statItem} ${styles.labelBurn}`}>
                      <span>เบิร์น:</span> <span>{stats.burn}</span>
                    </div>
                    <div className={`${styles.statItem} ${styles.labelWater}`}>
                      <span>น้ำ:</span> <span>{stats.water}ก.</span>
                    </div>
                    <div
                      className={`${styles.statItem} ${styles.labelProtein}`}
                    >
                      <span>โปร:</span> <span>{stats.protein}g</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
