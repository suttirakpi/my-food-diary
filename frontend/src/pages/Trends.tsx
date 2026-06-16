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
  ReferenceLine,
} from "recharts";
import styles from "./Trends.module.css";

interface TrendData {
  itemStats: { name: string; value: number }[];
  waterStats: { date: string; glasses: number }[];
  calorieTrend: { date: string; total_cal: number }[];
  exerciseTrend: { date: string; total_burned: number }[];
  summary: { cal_today: number; cal_month: number; cal_year: number };
}

const CustomWaterTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const glasses = payload[0].value;
    const oz = glasses * 22;
    const liters = ((glasses * 650) / 1000).toFixed(1);

    return (
      <div
        style={{
          backgroundColor: "white",
          padding: "16px",
          border: "1px solid #90caf9",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(33, 150, 243, 0.15)",
        }}
      >
        <p
          style={{
            margin: "0 0 8px 0",
            fontWeight: "bold",
            color: "var(--on-surface)",
          }}
        >
          📅 {label}
        </p>
        <p
          style={{
            margin: 0,
            color: "#1565c0",
            fontWeight: 600,
            fontSize: "15px",
          }}
        >
          💧 ดื่มไป:{" "}
          <span style={{ fontSize: "18px", fontWeight: "bold" }}>
            {glasses} แก้ว
          </span>
        </p>
        <p
          style={{
            margin: "6px 0 0 0",
            fontSize: "13px",
            color: "var(--on-surface-variant)",
          }}
        >
          เทียบเท่า: {oz} oz / {liters} ลิตร
        </p>
      </div>
    );
  }
  return null;
};

const getLocalDateStr = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const Trends: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<TrendData | null>(null);

  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [proteinTrend, setProteinTrend] = useState<any[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<any[]>([]);
  const [monthlyAvgTrend, setMonthlyAvgTrend] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trendsRes, calendarRes] = await Promise.all([
          axios.get("https://my-food-diary-n1tf.onrender.com/api/trends"),
          axios.get("https://my-food-diary-n1tf.onrender.com/api/calendar"),
        ]);

        setData(trendsRes.data);
        const calData = calendarRes.data;

        // 🌟 1. ดึงข้อมูลโปรตีนย้อนหลัง 7 วัน
        const last7Dates = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return getLocalDateStr(d);
        });

        const proteinPromises = last7Dates.map((date) =>
          axios
            .get(
              `https://my-food-diary-n1tf.onrender.com/api/protein?date=${date}`,
            )
            .catch(() => ({ data: { grams: 0 } })),
        );
        const proteinResults = await Promise.all(proteinPromises);

        const pData = last7Dates.map((date, index) => {
          const d = new Date(date);
          return {
            date: `${d.getDate()}/${d.getMonth() + 1}`,
            grams: Number(proteinResults[index].data.grams) || 0,
          };
        });
        setProteinTrend(pData);

        // 🌟 2. คำนวณข้อมูลรายสัปดาห์
        const wData = [];
        for (let w = 0; w < 4; w++) {
          let sum = 0;
          for (let d = 0; d < 7; d++) {
            const dateObj = new Date();
            dateObj.setDate(dateObj.getDate() - (w * 7 + d));
            const dateStr = getLocalDateStr(dateObj);
            const meal = calData.meals.find((m: any) => m.date === dateStr);
            if (meal) sum += Number(meal.total_cal) || 0;
          }
          const label = w === 0 ? "สัปดาห์นี้" : `${w} สัปดาห์ก่อน`;
          wData.unshift({
            name: label,
            avgCal: Math.round(sum / 7),
          });
        }
        setWeeklyTrend(wData);

        // 🌟 3. คำนวณข้อมูลรายเดือน
        const monthNames = [
          "ม.ค.",
          "ก.พ.",
          "มี.ค.",
          "เม.ย.",
          "พ.ค.",
          "มิ.ย.",
          "ก.ค.",
          "ส.ค.",
          "ก.ย.",
          "ต.ค.",
          "พ.ย.",
          "ธ.ค.",
        ];
        const mData = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const targetPrefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

          const mealsInMonth = calData.meals.filter((m: any) =>
            m.date.startsWith(targetPrefix),
          );
          const totalCal = mealsInMonth.reduce(
            (acc: number, m: any) => acc + (Number(m.total_cal) || 0),
            0,
          );

          const avg =
            mealsInMonth.length > 0
              ? Math.round(totalCal / mealsInMonth.length)
              : 0;

          mData.push({
            month: monthNames[d.getMonth()],
            avgCal: avg,
          });
        }
        setMonthlyAvgTrend(mData);

        // 🌟 4. ภาพรวม 30 วัน (กิน vs เบิร์น)
        const last30Days = [];
        for (let i = 29; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = getLocalDateStr(d);
          const displayDate = `${d.getDate()}/${d.getMonth() + 1}`;

          const meal = calData.meals.find((m: any) => m.date === dateStr);
          const ex = calData.exercises.find((e: any) => e.date === dateStr);

          last30Days.push({
            date: displayDate,
            total_cal: meal ? Number(meal.total_cal) || 0 : 0,
            total_burned: ex ? Number(ex.total_burned) || 0 : 0,
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

  // 🌟 นำข้อมูลเจาะลึก 7 วัน (กราฟแท่งคู่ของเดิม) กลับมา
  const mergedChartData = useMemo(() => {
    if (!data) return [];

    const combined: Record<string, any> = {};

    data.calorieTrend.forEach((item) => {
      combined[item.date] = {
        date: item.date,
        total_cal: Number(item.total_cal) || 0,
        total_burned: 0,
      };
    });

    data.exerciseTrend.forEach((item) => {
      if (combined[item.date]) {
        combined[item.date].total_burned = Number(item.total_burned) || 0;
      } else {
        combined[item.date] = {
          date: item.date,
          total_cal: 0,
          total_burned: Number(item.total_burned) || 0,
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
        {/* กราฟโปรตีน 7 วันล่าสุด */}
        <div
          className={styles.chartCard}
          style={{ gridColumn: "1 / -1", backgroundColor: "#fff8e1" }}
        >
          <h3 className={styles.chartTitle} style={{ color: "#e65100" }}>
            💪 สถิติโปรตีน 7 วันล่าสุด
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={proteinTrend}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                formatter={(value) => [`${value} กรัม`, "โปรตีน"]}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #ffcc80",
                }}
              />
              <ReferenceLine
                y={140}
                label="เป้าหมาย 140g"
                stroke="#f44336"
                strokeDasharray="3 3"
              />
              <Bar
                dataKey="grams"
                name="โปรตีน (กรัม)"
                fill="#ff9800"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 🌟 เจาะลึก กิน vs เบิร์น (7 วันล่าสุด) [ของเดิมกลับมาแล้ว] */}
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

        {/* 🌟 กราฟเส้น: แนวโน้มแคลอรี่ที่กิน [ของเดิมกลับมาแล้ว] */}
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

        {/* 🌟 กราฟพื้นที่: แนวโน้มการเผาผลาญ [ของเดิมกลับมาแล้ว] */}
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

        {/* ภาพรวม กิน vs เบิร์น (30 วัน) */}
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

        {/* แคลอรี่เฉลี่ยรายสัปดาห์ */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>แคลอรี่เฉลี่ยรายสัปดาห์</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value) => [`${value} kcal/วัน`, "แคลเฉลี่ย"]}
              />
              <Bar
                dataKey="avgCal"
                name="เฉลี่ย/วัน"
                fill="#8d6e63"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* แคลอรี่เฉลี่ยรายเดือน */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>
            แคลอรี่เฉลี่ยรายเดือน (6 เดือนย้อนหลัง)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={monthlyAvgTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value) => [`${value} kcal/วัน`, "แคลเฉลี่ย"]}
              />
              <Area
                type="monotone"
                dataKey="avgCal"
                name="เฉลี่ย/วัน"
                stroke="#9c27b0"
                fill="#e1bee7"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* กราฟวงกลม: สัดส่วนอาหาร */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>สัดส่วนประเภทที่กิน (7 วัน)</h3>
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

        {/* กราฟแท่ง: น้ำดื่ม */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>สถิติน้ำดื่ม 7 วัน</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.waterStats}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                content={<CustomWaterTooltip />}
                cursor={{ fill: "rgba(33, 150, 243, 0.05)" }}
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
