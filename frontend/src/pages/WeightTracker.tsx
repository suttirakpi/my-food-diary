import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import styles from "./WeightTracker.module.css";

interface WeightEntry {
  date: string;
  weight: number;
}

// หาวันที่ปัจจุบันเป็นค่าเริ่มต้น
const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const WeightTracker: React.FC = () => {
  const navigate = useNavigate();
  const [weightLogs, setWeightLogs] = useState<WeightEntry[]>([]);
  const [inputDate, setInputDate] = useState<string>(getTodayStr());
  const [inputWeight, setInputWeight] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // โหลดข้อมูลน้ำหนักตอนเปิดหน้า
  const fetchWeights = async () => {
    try {
      const res = await axios.get(
        "https://my-food-diary-n1tf.onrender.com/api/weight",
      );

      // จัดรูปแบบตัวเลขให้เรียบร้อยก่อนนำไปวาดกราฟ
      const formattedData = res.data.map((item: any) => ({
        date: item.date,
        weight: Number(item.weight),
      }));

      setWeightLogs(formattedData);
    } catch (error) {
      console.error("ดึงข้อมูลน้ำหนักล้มเหลว", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeights();
  }, []);

  // บันทึกน้ำหนักลง Database
  const handleSaveWeight = async () => {
    if (!inputWeight || isNaN(Number(inputWeight))) {
      toast.error("กรุณากรอกน้ำหนักเป็นตัวเลขครับ");
      return;
    }

    try {
      await axios.post("https://my-food-diary-n1tf.onrender.com/api/weight", {
        date: inputDate,
        weight: Number(inputWeight),
      });
      toast.success("บันทึกน้ำหนักเรียบร้อย!");
      setInputWeight("");
      fetchWeights(); // รีเฟรชข้อมูลกราฟใหม่
    } catch (error) {
      toast.error("บันทึกข้อมูลไม่สำเร็จ");
    }
  };

  if (loading)
    return <div className={styles.pageContainer}>กำลังโหลดข้อมูล...</div>;

  // นำข้อมูลมาเรียงจากใหม่ไปเก่าสำหรับโชว์ในลิสต์ด้านล่าง
  const reversedLogs = [...weightLogs].reverse();

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate("/")}>
          <span className="material-symbols-outlined">arrow_back</span>{" "}
          กลับหน้าหลัก
        </button>
        <h1 style={{ fontFamily: "var(--font-heading)", margin: 0 }}>
          Weight Tracker
        </h1>
        <div style={{ width: "40px" }}></div>
      </header>

      {/* ฟอร์มบันทึกน้ำหนัก */}
      <div className={styles.card}>
        <div className={styles.inputForm}>
          <div className={styles.inputGroup}>
            <label>วันที่ชั่งน้ำหนัก</label>
            <input
              type="date"
              value={inputDate}
              onChange={(e) => setInputDate(e.target.value)}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>น้ำหนัก (กิโลกรัม)</label>
            <input
              type="number"
              step="0.1"
              placeholder="เช่น 75.5"
              value={inputWeight}
              onChange={(e) => setInputWeight(e.target.value)}
            />
          </div>
          <button className={styles.submitBtn} onClick={handleSaveWeight}>
            บันทึกน้ำหนัก
          </button>
        </div>
      </div>

      {/* กราฟแสดงแนวโน้มน้ำหนัก */}
      {weightLogs.length > 0 && (
        <div className={styles.card}>
          <h3 className={styles.chartTitle}>แนวโน้มน้ำหนักของคุณ 📉</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={weightLogs}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />

              {/* ตั้งโดเมนให้กราฟดูสมจริง ไม่ติดดินเกินไป */}
              <YAxis domain={["dataMin - 2", "dataMax + 2"]} />

              <Tooltip
                formatter={(value) => [`${value} kg`, "น้ำหนัก"]}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #0288d1",
                }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#0288d1"
                strokeWidth={3}
                dot={{ r: 5, fill: "#0288d1" }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ประวัติการชั่งน้ำหนักแบบรายการ */}
      <div className={styles.card}>
        <h3 style={{ margin: "0 0 16px 0", color: "var(--on-surface)" }}>
          ประวัติการชั่งย้อนหลัง
        </h3>
        {reversedLogs.length === 0 ? (
          <p style={{ color: "var(--on-surface-variant)" }}>
            ยังไม่มีข้อมูล เริ่มบันทึกน้ำหนักวันแรกได้เลยครับ!
          </p>
        ) : (
          <div className={styles.historyList}>
            {reversedLogs.map((log, index) => {
              const d = new Date(log.date);
              const dateStr = d.toLocaleDateString("th-TH", {
                year: "numeric",
                month: "short",
                day: "numeric",
                weekday: "short",
              });
              return (
                <div key={index} className={styles.historyItem}>
                  <span>📅 {dateStr}</span>
                  <span className={styles.weightValue}>
                    {log.weight.toFixed(1)} kg
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WeightTracker;
