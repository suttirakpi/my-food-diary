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
  CartesianGrid,
  AreaChart,
  Area,
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
  const [monthlyData, setMonthlyData] = useState<any[]>([]); // 🌟 State สำหรับเก็บข้อมูล 30 วัน
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 🌟 โหลดข้อมูล 2 เส้นทางพร้อมกัน (สถิติ 7 วัน และ ปฏิทินทั้งหมด)
        const [trendsRes, calendarRes] = await Promise.all([
          axios.get("https://my-food-diary-n1tf.onrender.com/api/trends"),
          axios.get("https://my-food-diary-n1tf.onrender.com/api/calendar"),
        ]);

        setData(trendsRes.data);

        // 🌟 คำนวณข้อมูล 30 วันย้อนหลังสำหรับกราฟใหม่
        const calData = calendarRes.data;
        const last30Days = [];
        for (let i = 29; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          const dateStr = `${year}-${month}-${day}`;
          const displayDate = `${d.getDate()}/${d.getMonth() + 1}`; // แสดงผลแบบ วัน/เดือน

          const meal = calData.meals.find((m: any) => m.date === dateStr);
          const ex = calData.exercises.find((e: any) => e.date === dateStr);

          last30Days.push({
            date: displayDate,
            total_cal: meal ? meal.total_cal : 0,
            total_burned: ex ? ex.total_burned : 0,
          });
        }
        setMonthlyData(last30Days);
      } catch (error) {
        console.error("ดึงข้อมูลสถิติไม่สำเร็จ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const PIE_COLORS = useMemo(
    () => ({ อาหาร: "#ff9800", เครื่องดื่ม: "#2196f3", ขนม: "#e91e63" }),
    [],
  );

  const mergedChartData = useMemo(() => {
    if (!data) return [];

    const combined: Record<string, any> = {};

    data.calorieTrend.forEach((item) => {
      combined[item.date] = {
        date: item.date,
        total_cal: item.total_cal,
        total_burned: 0,
      };
    });

    data.exerciseTrend.forEach((item) => {
      if (combined[item.date]) {
        combined[item.date].total_burned = item.total_burned;
      } else {
        combined[item.date] = {
          date: item.date,
          total_cal: 0,
          total_burned: item.total_burned,
        };
      }
    });

    const allDates = Array.from(
      new Set([
        ...data.calorieTrend.map((d) => d.date),
        ...data.exerciseTrend.map((d) => d.date),
      ]),
    );

    allDates.sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, "")) || 0;
      const numB = parseInt(b.replace(/\D/g, "")) || 0;
      const today = new Date().getDate();

      const scoreA = today < 15 && numA > 20 ? numA - 31 : numA;
      const scoreB = today < 15 && numB > 20 ? numB - 31 : numB;

      return scoreA - scoreB;
    });

    return allDates.map((date) => combined[date]).slice(-7);
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
        {/* 🌟 1. กราฟใหม่: ภาพรวม 30 วัน (อยู่บนสุดให้เห็นชัดๆ) */}
        <div
          className={styles.chartCard}
          style={{ gridColumn: "1 / -1", backgroundColor: "#f8fafc" }}
        >
          <h3 className={styles.chartTitle}>
            ภาพรวม กิน vs เบิร์น (30 วันล่าสุด)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={monthlyData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorCal30" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4caf50" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#4caf50" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorBurn30" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f44336" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#f44336" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
                minTickGap={20}
              />
              <YAxis />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              />
              <Legend wrapperStyle={{ paddingTop: "20px" }} />
              <Area
                type="monotone"
                dataKey="total_cal"
                name="กินเข้า (kcal)"
                stroke="#4caf50"
                fillOpacity={1}
                fill="url(#colorCal30)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="total_burned"
                name="เบิร์นออก (kcal)"
                stroke="#f44336"
                fillOpacity={1}
                fill="url(#colorBurn30)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 🌟 2. กราฟแท่งคู่: เปรียบเทียบ กิน vs เบิร์น (7 วันล่าสุด) */}
        <div className={styles.chartCard} style={{ gridColumn: "1 / -1" }}>
          <h3 className={styles.chartTitle}>
            เจาะลึก กิน vs เบิร์น (7 วันล่าสุด)
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
              <Bar
                dataKey="total_cal"
                name="กินเข้า (kcal)"
                fill="#4caf50"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="total_burned"
                name="เบิร์นออก (kcal)"
                fill="#f44336"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 🌟 3. กราฟเส้น: แนวโน้มแคลอรี่ที่กิน */}
        <div className={styles.chartCard} style={{ gridColumn: "1 / -1" }}>
          <h3 className={styles.chartTitle}>แนวโน้มการกิน 7 วันล่าสุด</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.calorieTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} kcal`, "กินเข้า"]} />
              <Line
                type="monotone"
                dataKey="total_cal"
                stroke="#4caf50"
                strokeWidth={3}
                dot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 🌟 4. กราฟพื้นที่: แนวโน้มการเผาผลาญ */}
        <div
          className={styles.chartCard}
          style={{ gridColumn: "1 / -1", backgroundColor: "#fff5f5" }}
        >
          <h3 className={styles.chartTitle} style={{ color: "#d32f2f" }}>
            แนวโน้มการเผาผลาญ (Exercise)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={data.exerciseTrend}>
              <defs>
                <linearGradient id="colorBurn" x1="0" y1="0" x2="0" y2="100%">
                  <stop offset="5%" stopColor="#f44336" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f44336" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} kcal`, "เบิร์นออก"]} />
              <Area
                type="monotone"
                dataKey="total_burned"
                stroke="#d32f2f"
                fillOpacity={1}
                fill="url(#colorBurn)"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 5. กราฟวงกลม: สัดส่วนอาหาร */}
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

        {/* 6. กราฟแท่ง: น้ำดื่ม */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>สถิติน้ำดื่ม 7 วัน</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.waterStats}>
              <XAxis dataKey="date" />
              <YAxis />
              {/* 🌟 ปรับ Tooltip ให้คำนวณและแสดงผลทั้ง แก้ว, ออนซ์ (oz) และ ลิตร (L) */}
              <Tooltip 
                formatter={(value: number) => [
                  `${value} แก้ว (${value * 22} oz / ${((value * 650) / 1000).toFixed(1)} L)`, 
                  "ปริมาณน้ำที่ดื่ม"
                ]} 
              />
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
