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
  CartesianGrid,
} from "recharts";
import styles from "./Trends.module.css";

interface TrendData {
  itemStats: { name: string; value: number }[];
  waterStats: { date: string; glasses: number }[];
  calorieTrend: { date: string; total_cal: number }[];
  exerciseTrend: { date: string; total_burned: number }[];
  summary: { cal_today: number; cal_month: number; cal_year: number };
}

const Trends: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const response = await axios.get(
          "https://my-food-diary-n1tf.onrender.com/api/trends",
        );
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

  // 🌟 ฟังก์ชันมัดรวมข้อมูล "กิน" กับ "เบิร์น" ให้อยู่ในวันเดียวกัน
  const mergedChartData = useMemo(() => {
    if (!data) return [];

    const combined: Record<string, any> = {};

    // 1. ใส่ข้อมูลการกินเข้าไปก่อน
    data.calorieTrend.forEach((item) => {
      combined[item.date] = {
        date: item.date,
        total_cal: item.total_cal,
        total_burned: 0, // ค่าเริ่มต้นถ้าวันนี้ไม่ได้ออกกำลังกาย
      };
    });

    // 2. เอาข้อมูลเบิร์นมาประกบในวันเดียวกัน
    data.exerciseTrend.forEach((item) => {
      if (combined[item.date]) {
        combined[item.date].total_burned = item.total_burned;
      } else {
        combined[item.date] = {
          date: item.date,
          total_cal: 0, // ค่าเริ่มต้นถ้าวันนี้ไม่ได้กินแต่ดันออกกำลังกาย
          total_burned: item.total_burned,
        };
      }
    });

    // 3. ดึงวันที่ทั้งหมดมาเรียงลำดับให้สวยงาม
    const allDates = new Set([
      ...data.calorieTrend.map((d) => d.date),
      ...data.exerciseTrend.map((d) => d.date),
    ]);

    return Array.from(allDates).map((date) => combined[date]);
  }, [data]);

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

      {/* สรุปแคลอรี่ */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>แคลอรี่ที่กินวันนี้</div>
          <div className={styles.summaryValue}>
            {data.summary.cal_today || 0} <span>kcal</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>แคลอรี่เฉลี่ยเดือนนี้</div>
          <div className={styles.summaryValue}>
            {data.summary.cal_month || 0} <span>kcal</span>
          </div>
        </div>
      </div>

      <div className={styles.dashboardGrid}>
        {/* 🌟 1. กราฟแท่งคู่: เปรียบเทียบ กิน vs เบิร์น (Net Calories) */}
        <div className={styles.chartCard} style={{ gridColumn: "1 / -1" }}>
          <h3 className={styles.chartTitle}>
            เปรียบเทียบ กิน vs เบิร์น (7 วันล่าสุด)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={mergedChartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.05)" }}
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              />
              <Legend wrapperStyle={{ paddingTop: "20px" }} />
              {/* แท่งที่ 1: สีเขียว (กินเข้า) */}
              <Bar
                dataKey="total_cal"
                name="กินเข้า (kcal)"
                fill="#4caf50"
                radius={[6, 6, 0, 0]}
              />
              {/* แท่งที่ 2: สีแดง (เบิร์นออก) */}
              <Bar
                dataKey="total_burned"
                name="เบิร์นออก (kcal)"
                fill="#f44336"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 2. กราฟวงกลม: สัดส่วนอาหาร (ของเดิม) */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>สัดส่วนประเภทที่กิน</h3>
          <ResponsiveContainer width="100%" height={250}>
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

        {/* 3. กราฟแท่ง: น้ำดื่ม (ของเดิม) */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>สถิติน้ำดื่ม 7 วัน</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.waterStats}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="glasses"
                name="จำนวนแก้ว"
                fill="#2196f3"
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
