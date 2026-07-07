// frontend/src/pages/Trends.tsx
import React, { useState, useEffect, useMemo } from "react";
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
  Line,
  CartesianGrid,
  AreaChart,
  Area,
  ReferenceLine,
  ComposedChart,
} from "recharts";
import styles from "./Trends.module.css";
import AppLayout from "../components/AppLayout";

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
          style={{ margin: "0 0 8px 0", fontWeight: "bold", color: "#0f172a" }}
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
        <p style={{ margin: "6px 0 0 0", fontSize: "13px", color: "#64748b" }}>
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
  const [data, setData] = useState<TrendData | null>(null);

  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [proteinTrend, setProteinTrend] = useState<any[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<any[]>([]);
  const [monthlyAvgTrend, setMonthlyAvgTrend] = useState<any[]>([]);
  const [allInOneTrend, setAllInOneTrend] = useState<any[]>([]);

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

        const last7Dates = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return getLocalDateStr(d);
        });

        // ดึงของเก่าเผื่อไว้สำหรับโปรตีน (Legacy API)
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
          const macro = calData.macros?.find((m: any) => m.date === date);
          const legacyProtein = Number(proteinResults[index].data.grams) || 0;

          return {
            date: `${d.getDate()}/${d.getMonth() + 1}`,
            grams: macro?.protein || legacyProtein || 0,
          };
        });
        setProteinTrend(pData);

        // 🌟 สร้างข้อมูล All-In-One Trend (1 เดือน / 30 วันล่าสุด) แบบเรียงวันที่ถูกต้อง
        const allInOneData = [];
        for (let i = 29; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = getLocalDateStr(d);
          const displayDate = `${d.getDate()}/${d.getMonth() + 1}`;

          const meal = calData.meals.find((m: any) => m.date === dateStr);
          const macro = calData.macros?.find((m: any) => m.date === dateStr);
          const water = calData.water.find((w: any) => w.date === dateStr);
          const ex = calData.exercises.find((e: any) => e.date === dateStr);

          let legacyProtein = 0;
          if (i < 7 && proteinResults[6 - i]) {
            legacyProtein = Number(proteinResults[6 - i].data.grams) || 0;
          }

          allInOneData.push({
            date: displayDate,
            calories: Number(meal?.total_cal) || 0,
            burned: Number(ex?.total_burned) || 0,
            protein: macro?.protein || legacyProtein || 0,
            carbs: macro?.carbs || 0,
            fats: macro?.fats || 0,
            water: Number(water?.glasses) || 0,
          });
        }
        setAllInOneTrend(allInOneData);

        // คำนวณข้อมูลรายสัปดาห์
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
            totalCal: sum,
          });
        }
        setWeeklyTrend(wData);

        // คำนวณข้อมูลรายเดือน
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
            totalCal: totalCal,
          });
        }
        setMonthlyAvgTrend(mData);

        // ภาพรวม 30 วัน (Area Chart)
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

  // 🌟 ดึงข้อมูล 7 วันล่าสุดจาก allInOneTrend ไว้สำหรับกราฟย่อย (เรียงวันที่ถูกต้อง 100%)
  const last7DaysTrend = useMemo(
    () => allInOneTrend.slice(-7),
    [allInOneTrend],
  );

  return (
    <AppLayout>
      {loading && (
        <div className="loadingOverlay">
          <div className="loadingCard">
            <div className="loadingMascot">🐹💨</div>
            <h2
              style={{ fontFamily: "var(--font-heading)", margin: "0 0 8px 0" }}
            >
              กำลังโหลดข้อมูลสถิติ...
            </h2>
            <div className="loadingBarContainer">
              <div className="loadingBar"></div>
            </div>
          </div>
        </div>
      )}

      {!loading && !data && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "60vh",
            color: "#ef4444",
            fontSize: "18px",
            fontWeight: 600,
          }}
        >
          ไม่พบข้อมูล กรุณาลองใหม่อีกครั้ง
        </div>
      )}

      {!loading && data && (
        <div className={styles.contentWrapper}>
          <div className={styles.pageHeader}>
            <h1>Your Trends</h1>
            <p>Track your progress and stay on top of your goals 📈</p>
          </div>

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
            {/* 🌟 1. ภาพรวมโภชนาการแบบครบจบในที่เดียว (1 เดือนล่าสุด) */}
            <div
              className={styles.chartCard}
              style={{
                gridColumn: "1 / -1",
                backgroundColor: "#f8fafc",
                border: "2px solid #e2e8f0",
              }}
            >
              <h3
                className={styles.chartTitle}
                style={{ color: "#0f172a", fontSize: "20px" }}
              >
                🌟 ภาพรวมโภชนาการแบบครบจบในที่เดียว (1 เดือนล่าสุด)
              </h3>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart
                  data={allInOneTrend}
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                >
                  <CartesianGrid
                    stroke="#e2e8f0"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    interval="preserveStartEnd"
                    minTickGap={20}
                  />
                  <YAxis
                    yAxisId="left"
                    orientation="left"
                    stroke="#ef4444"
                    tick={{ fill: "#ef4444" }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#64748b"
                    tick={{ fill: "#64748b" }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    }}
                    itemStyle={{ fontWeight: 600 }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} />

                  <Bar
                    yAxisId="right"
                    dataKey="protein"
                    name="โปรตีน (g)"
                    stackId="a"
                    fill="#10b981"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="carbs"
                    name="คาร์บ (g)"
                    stackId="a"
                    fill="#3b82f6"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="fats"
                    name="ไขมัน (g)"
                    stackId="a"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                  />

                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="calories"
                    name="แคลอรี่กิน (kcal)"
                    stroke="#ef4444"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="burned"
                    name="แคลอรี่เบิร์น (kcal)"
                    stroke="#a855f7"
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={{ r: 7 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="water"
                    name="น้ำ (แก้ว)"
                    stroke="#0ea5e9"
                    strokeWidth={3}
                    strokeDasharray="3 3"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* 🌟 เจาะลึก กิน vs เบิร์น (7 วันล่าสุด) - อัปเดตใช้ข้อมูลจาก last7DaysTrend ให้วันที่ตรงเป๊ะ */}
            <div className={styles.chartCard} style={{ gridColumn: "1 / -1" }}>
              <h3 className={styles.chartTitle}>
                เจาะลึก กิน vs เบิร์น (7 วันล่าสุด)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={last7DaysTrend}
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
                    dataKey="calories"
                    name="กินเข้า (kcal)"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="burned"
                    name="เบิร์นออก (kcal)"
                    fill="#ef4444"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
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
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorBurn30"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
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
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorCal30)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="total_burned"
                    name="เบิร์นออก (kcal)"
                    stroke="#ef4444"
                    fillOpacity={1}
                    fill="url(#colorBurn30)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* สถิติโปรตีน 7 วันล่าสุด */}
            <div
              className={styles.chartCard}
              style={{ backgroundColor: "#fff8e1" }}
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

            {/* สถิติคาร์บ 7 วันล่าสุด */}
            <div
              className={styles.chartCard}
              style={{ backgroundColor: "#eff6ff" }}
            >
              <h3 className={styles.chartTitle} style={{ color: "#1d4ed8" }}>
                🍚 สถิติคาร์โบไฮเดรต 7 วันล่าสุด
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={last7DaysTrend}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [`${value} กรัม`, "คาร์บ"]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #bfdbfe",
                    }}
                  />
                  <ReferenceLine
                    y={150}
                    label="เป้าหมาย 150g"
                    stroke="#2563eb"
                    strokeDasharray="3 3"
                  />
                  <Bar
                    dataKey="carbs"
                    name="คาร์บ (กรัม)"
                    fill="#3b82f6"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* สถิติไขมัน 7 วันล่าสุด */}
            <div
              className={styles.chartCard}
              style={{ backgroundColor: "#fffbeb" }}
            >
              <h3 className={styles.chartTitle} style={{ color: "#b45309" }}>
                🥑 สถิติไขมัน 7 วันล่าสุด
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={last7DaysTrend}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [`${value} กรัม`, "ไขมัน"]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #fde68a",
                    }}
                  />
                  <ReferenceLine
                    y={50}
                    label="เป้าหมาย 50g"
                    stroke="#d97706"
                    strokeDasharray="3 3"
                  />
                  <Bar
                    dataKey="fats"
                    name="ไขมัน (กรัม)"
                    fill="#f59e0b"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* สถิติเบิร์น 7 วันล่าสุด */}
            <div
              className={styles.chartCard}
              style={{ backgroundColor: "#fef2f2" }}
            >
              <h3 className={styles.chartTitle} style={{ color: "#b91c1c" }}>
                🔥 สถิติเผาผลาญ 7 วันล่าสุด
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={last7DaysTrend}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [`${value} kcal`, "เบิร์นออก"]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #fecaca",
                    }}
                  />
                  <Bar
                    dataKey="burned"
                    name="เผาผลาญ (kcal)"
                    fill="#ef4444"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* แคลอรี่รวมรายสัปดาห์ */}
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>แคลอรี่รวมรายสัปดาห์</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [
                      `${value} kcal`,
                      "แคลรวมทั้งสัปดาห์",
                    ]}
                  />
                  <Bar
                    dataKey="totalCal"
                    name="รวมรายสัปดาห์"
                    fill="#14b8a6"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
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
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* แคลอรี่รวมรายเดือน */}
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>
                แคลอรี่รวมรายเดือน (6 เดือนย้อนหลัง)
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyAvgTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [`${value} kcal`, "แคลรวมทั้งเดือน"]}
                  />
                  <Bar
                    dataKey="totalCal"
                    name="รวมรายเดือน"
                    fill="#8b5cf6"
                    radius={[8, 8, 0, 0]}
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
                    fill="#38bdf8"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Trends;
