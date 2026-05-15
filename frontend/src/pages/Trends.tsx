import React, { useState, useEffect, useMemo } from "react"; // เพิ่ม useMemo มาช่วย
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
} from "recharts";
import styles from "./Trends.module.css";

// แยก Interface ออกมาให้ชัดเจน
interface ItemStat {
  name: string;
  value: number;
}
interface WaterStat {
  date: string;
  glasses: number;
  oz: number;
}
interface TrendData {
  itemStats: ItemStat[];
  waterStats: WaterStat[];
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

  // ใช้ useMemo เพื่อป้องกันการคำนวณสีใหม่ทุกครั้งที่ Render
  const PIE_COLORS = useMemo(
    () => ({
      อาหาร: "#ff9800",
      เครื่องดื่ม: "#2196f3",
      ขนม: "#e91e63",
    }),
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

      <div className={styles.dashboardGrid}>
        {/* กราฟวงกลม */}
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

        {/* กราฟแท่ง */}
        <div className={styles.chartCard} style={{ minHeight: "350px" }}>
          <h3 className={styles.chartTitle}>น้ำดื่ม 7 วันย้อนหลัง</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.waterStats}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="glasses" name="จำนวนแก้ว" fill="#42a5f5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Trends;
