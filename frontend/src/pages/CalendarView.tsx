import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./CalendarView.module.css";

interface CalendarData {
  meals: { date: string; total_cal: number }[];
  water: { date: string; glasses: number }[];
  exercises: { date: string; total_burned: number }[];
}

const CalendarView: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);

  // State จัดการเดือนและปีที่แสดงผล (เริ่มต้นที่เดือนปัจจุบัน)
  const [currentDate, setCurrentDate] = useState(new Date());

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

  // 🌟 ฟังก์ชันเลื่อนเดือน
  const prevMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  const nextMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );

  // 🌟 Logic การคำนวณวันในปฏิทิน
  const calendarGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // หาวันแรกของเดือน (ตกวันอะไร) และจำนวนวันทั้งหมดในเดือนนี้
    const firstDay = new Date(year, month, 1).getDay(); // 0 (อาทิตย์) ถึง 6 (เสาร์)
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // สร้างช่องว่าง (Blank) สำหรับวันก่อนเริ่มเดือน
    const blanks = Array(firstDay).fill(null);
    // สร้าง Array ของวันที่ 1 ถึงสิ้นเดือน
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return { blanks, days, year, month };
  }, [currentDate]);

  // 🌟 ฟังก์ชันเช็กข้อมูลรายวันเพื่อสร้าง "จุดสี"
  const getDayStatus = (day: number) => {
    if (!data)
      return { hasMealData: false, isOverCal: false, isWaterGoal: false };

    const year = calendarGrid.year;
    const month = String(calendarGrid.month + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    const fullDateStr = `${year}-${month}-${dayStr}`;

    const mealData = data.meals.find((m) => m.date === fullDateStr);
    const waterData = data.water.find((w) => w.date === fullDateStr);
    const exerciseData = data.exercises.find((e) => e.date === fullDateStr);

    const totalCal = mealData ? mealData.total_cal : 0;
    const totalBurned = exerciseData ? exerciseData.total_burned : 0;
    const netCalories = totalCal - totalBurned;

    return {
      hasMealData: totalCal > 0,
      isOverCal: netCalories > 1600, // เป้าหมาย 1600 kcal
      isWaterGoal: waterData ? waterData.glasses >= 8 : false, // น้ำเป้าหมาย 8 แก้ว
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
          กลับหน้าแรก
        </button>
        <h1 className={styles.title}>Month-at-a-glance</h1>
        <div style={{ width: "40px" }}></div>
      </header>

      <div className={styles.calendarCard}>
        {/* แถบเปลี่ยนเดือน */}
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

        {/* อธิบายจุดสี */}
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span
              className={styles.dot}
              style={{ backgroundColor: "#4caf50" }}
            ></span>{" "}
            คุมแคลอรี่ได้ดี
          </div>
          <div className={styles.legendItem}>
            <span
              className={styles.dot}
              style={{ backgroundColor: "#f44336" }}
            ></span>{" "}
            แคลอรี่เกิน (รีบเบิร์นด่วน!)
          </div>
          <div className={styles.legendItem}>
            <span
              className={styles.dot}
              style={{ backgroundColor: "#2196f3" }}
            ></span>{" "}
            ดื่มน้ำครบ 8 แก้ว
          </div>
        </div>

        {/* ตารางปฏิทิน */}
        <div className={styles.calendarGrid}>
          {dayNames.map((day) => (
            <div key={day} className={styles.dayName}>
              {day}
            </div>
          ))}

          {/* วันว่างๆ ก่อนเริ่มเดือน */}
          {calendarGrid.blanks.map(
            (
              _: any,
              i: number, // 🌟 ระบุ (_: any, i: number)
            ) => (
              <div key={`blank-${i}`} className={styles.blankCell}></div>
            ),
          )}

          {/* วันจริงในเดือน */}
          {calendarGrid.days.map((day: number) => {
            const status = getDayStatus(day);
            const isToday =
              new Date().getDate() === day &&
              new Date().getMonth() === calendarGrid.month &&
              new Date().getFullYear() === calendarGrid.year;

            return (
              <div
                key={day}
                className={`${styles.dayCell} ${isToday ? styles.today : ""}`}
              >
                <span className={styles.dayNumber}>{day}</span>
                <div className={styles.dotContainer}>
                  {status.hasMealData && !status.isOverCal && (
                    <span
                      className={styles.dot}
                      style={{ backgroundColor: "#4caf50" }}
                      title="คุมแคลอรี่เยี่ยม!"
                    ></span>
                  )}
                  {status.hasMealData && status.isOverCal && (
                    <span
                      className={styles.dot}
                      style={{ backgroundColor: "#f44336" }}
                      title="กินเกินเป้าหมาย!"
                    ></span>
                  )}
                  {status.isWaterGoal && (
                    <span
                      className={styles.dot}
                      style={{ backgroundColor: "#2196f3" }}
                      title="ดื่มน้ำครบ 8 แก้ว"
                    ></span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
