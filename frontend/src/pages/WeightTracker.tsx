// frontend/src/pages/WeightTracker.tsx
import React, { useState, useEffect } from "react";
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
import AppLayout from "../components/AppLayout";

interface WeightEntry {
  date: string;
  weight: number;
}

const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const WeightTracker: React.FC = () => {
  const [weightLogs, setWeightLogs] = useState<WeightEntry[]>([]);
  const [inputDate, setInputDate] = useState<string>(getTodayStr());
  const [inputWeight, setInputWeight] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  const fetchWeights = async () => {
    try {
      const res = await axios.get(
        "https://my-food-diary-n1tf.onrender.com/api/weight",
      );

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

  const handleSaveWeight = async () => {
    if (!inputWeight || isNaN(Number(inputWeight))) {
      toast.error("กรุณากรอกน้ำหนักเป็นตัวเลขครับ");
      return;
    }

    try {
      // 1. บันทึกประวัติน้ำหนัก (Weight Tracker)
      await axios.post("https://my-food-diary-n1tf.onrender.com/api/weight", {
        date: inputDate,
        weight: Number(inputWeight),
      });

      // 🌟 2. ดึง Settings ปัจจุบันมาก่อน (เพื่อไม่ให้ค่า Calorie/Protein ที่ตั้งไว้หาย)
      const settingsRes = await axios
        .get("https://my-food-diary-n1tf.onrender.com/api/settings")
        .catch(() => ({ data: {} }));
      const currentSettings = settingsRes.data;

      // 🌟 3. อัปเดต Settings โดยแก้แค่ current_weight
      await axios.post("https://my-food-diary-n1tf.onrender.com/api/settings", {
        cal_goal: currentSettings.cal_goal || 1400,
        protein_goal: currentSettings.protein_goal || 140,
        water_goal: currentSettings.water_goal || 8,
        target_weight: currentSettings.target_weight || 0,
        current_weight: Number(inputWeight), // อัปเดตน้ำหนักล่าสุด!
      });

      toast.success("บันทึกน้ำหนักและอัปเดตข้อมูลส่วนตัวเรียบร้อย!");
      setInputWeight("");
      fetchWeights();
    } catch (error) {
      toast.error("บันทึกข้อมูลไม่สำเร็จ");
    }
  };

  const reversedLogs = [...weightLogs].reverse();

  return (
    <AppLayout>
      {/* หน้าจอ Loading ระหว่างรอเซิร์ฟเวอร์ */}
      {loading && (
        <div className="loadingOverlay">
          <div className="loadingCard">
            <div className="loadingMascot">🐹💨</div>
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                margin: "0 0 8px 0",
                color: "#0f172a",
              }}
            >
              กำลังโหลดข้อมูล...
            </h2>
            <p
              style={{
                color: "#64748b",
                margin: 0,
                fontSize: "14px",
                lineHeight: "1.6",
              }}
            >
              รอแป๊บนะฮะ ไวท์มอลกำลังยกตาชั่งมาให้!
            </p>
            <div className="loadingBarContainer">
              <div className="loadingBar"></div>
            </div>
          </div>
        </div>
      )}

      {/* เนื้อหาหน้าเว็บ */}
      {!loading && (
        <div className={styles.contentWrapper}>
          <div className={styles.pageHeader}>
            <h1>Weight Tracker</h1>
            <p>Monitor your body weight progress ⚖️</p>
          </div>

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
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "20px" }}
                >
                  add_task
                </span>
                บันทึกน้ำหนัก
              </button>
            </div>
          </div>

          {/* กราฟแสดงแนวโน้มน้ำหนัก */}
          {weightLogs.length > 0 && (
            <div className={styles.card}>
              <h3 className={styles.chartTitle}>
                <span
                  className="material-symbols-outlined"
                  style={{ color: "#10b981" }}
                >
                  trending_down
                </span>
                แนวโน้มน้ำหนักของคุณ
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={weightLogs}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    axisLine={{ stroke: "#cbd5e1" }}
                  />

                  {/* ตั้งโดเมนให้กราฟดูสมจริง ไม่ติดดินเกินไป */}
                  <YAxis
                    domain={["dataMin - 2", "dataMax + 2"]}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    axisLine={{ stroke: "#cbd5e1" }}
                  />

                  <Tooltip
                    formatter={(value) => [`${value} kg`, "น้ำหนัก"]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #10b981",
                      boxShadow: "0 4px 12px rgba(16,185,129,0.15)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#10b981"
                    strokeWidth={4}
                    dot={{
                      r: 6,
                      fill: "#10b981",
                      strokeWidth: 2,
                      stroke: "white",
                    }}
                    activeDot={{ r: 8, fill: "#059669" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ประวัติการชั่งน้ำหนักแบบรายการ */}
          <div className={styles.card}>
            <h3 className={styles.chartTitle} style={{ marginBottom: "16px" }}>
              <span
                className="material-symbols-outlined"
                style={{ color: "#64748b" }}
              >
                history
              </span>
              ประวัติการชั่งย้อนหลัง
            </h3>
            {reversedLogs.length === 0 ? (
              <p
                style={{
                  color: "#64748b",
                  textAlign: "center",
                  padding: "20px 0",
                }}
              >
                ยังไม่มีข้อมูล เริ่มบันทึกน้ำหนักวันแรกได้เลยครับ!
              </p>
            ) : (
              <div className={styles.historyList}>
                {reversedLogs.map((log, index) => {
                  const d = new Date(log.date);
                  const dateStr = d.toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    weekday: "long",
                  });
                  return (
                    <div key={index} className={styles.historyItem}>
                      <span className={styles.weightDate}>📅 {dateStr}</span>
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
      )}
    </AppLayout>
  );
};

export default WeightTracker;
