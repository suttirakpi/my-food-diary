import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid, // นำเข้ากราฟเส้นเพิ่ม
} from "recharts";
import styles from "./Trends.module.css";

interface TrendData {
  itemStats: { name: string; value: number }[];
  waterStats: { date: string; glasses: number }[];
  calorieTrend: { date: string; total_cal: number }[];
  summary: { cal_today: number; cal_month: number; cal_year: number };
}

const Trends: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/trends");
        setData(response.data);
      } catch (error) {
        console.error("ดึงข้อมูลสถิติไม่สำเร็จ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrends();
  }, []);

  const PIE_COLORS = useMemo(
    () => ({ อาหาร: "#ff9800", เครื่องดื่ม: "#2196f3", ขนม: "#e91e63" }),
    [],
  );

  if (loading) return <div className={styles.pageContainer}>กำลังโหลด...</div>;
  if (!data) return <div className={styles.pageContainer}>ไม่พบข้อมูล</div>;

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate("/")}>
          <span className="material-symbols-outlined">arrow_back</span>{" "}
          กลับหน้ารายการ
        </button>
        <h1 style={{ fontFamily: "var(--font-heading)", margin: 0 }}>
          Your Trends
        </h1>
        <div style={{ width: "40px" }}></div>
      </header>

      {/* ---------------- Section 1: ตัวเลขสรุป (Summary) ---------------- */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>แคลอรี่วันนี้</div>
          <div className={styles.summaryValue}>
            {data.summary.cal_today || 0} <span>kcal</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>แคลอรี่เดือนนี้</div>
          <div className={styles.summaryValue}>
            {data.summary.cal_month || 0} <span>kcal</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>แคลอรี่ปีนี้</div>
          <div className={styles.summaryValue}>
            {data.summary.cal_year || 0} <span>kcal</span>
          </div>
        </div>
      </div>

      {/* ---------------- Section 2: กราฟ (Charts) ---------------- */}
      <div className={styles.dashboardGrid}>
        {/* กราฟเส้น: แนวโน้มแคลอรี่ */}
        <div
          className={styles.chartCard}
          style={{ gridColumn: "1 / -1", minHeight: "350px" }}
        >
          <h3 className={styles.chartTitle}>แนวโน้มแคลอรี่ 7 วันล่าสุด</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.calorieTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} kcal`, "แคลอรี่รวม"]} />
              <Legend />
              <Line
                type="monotone"
                dataKey="total_cal"
                name="แคลอรี่"
                stroke="#ff5722"
                strokeWidth={3}
                dot={{ r: 6 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* กราฟวงกลม: สัดส่วน */}
        <div className={styles.chartCard} style={{ minHeight: "350px" }}>
          <h3 className={styles.chartTitle}>สัดส่วนประเภทอาหาร</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.itemStats}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label
              >
                {data.itemStats.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      PIE_COLORS[entry.name as keyof typeof PIE_COLORS] ||
                      "#9e9e9e"
                    }
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* กราฟแท่ง: น้ำดื่ม */}
        <div className={styles.chartCard} style={{ minHeight: "350px" }}>
          <h3 className={styles.chartTitle}>น้ำดื่ม 7 วันย้อนหลัง</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.waterStats}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="glasses"
                name="จำนวนแก้ว"
                fill="#42a5f5"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Trends;
