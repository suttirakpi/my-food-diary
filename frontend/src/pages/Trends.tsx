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
  ReferenceLine, // 🌟 1. นำเข้า ReferenceLine เพิ่มเข้ามา
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

  // มัดรวมข้อมูล "กิน" กับ "เบิร์น"
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

    const allDates = Array.from(new Set([
      ...data.calorieTrend.map((d) => d.date),
      ...data.exerciseTrend.map((d) => d.date),
    ]));

    allDates.sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      const today = new Date().getDate();
      
      const scoreA = (today < 15 && numA > 20) ? numA - 31 : numA;
      const scoreB = (today < 15 && numB > 20) ? numB - 31 : numB;
      
      return scoreA - scoreB;
    });

    return allDates.map((date) => combined[date]);
  }, [data]);

  // 🌟 2. คำนวณค่าเฉลี่ยน้ำดื่ม 7 วัน
  const avgWater = useMemo(() => {
    if (!data || data.waterStats.length === 0) return 0;
    const total = data.waterStats.reduce((sum, item) => sum + item.glasses, 0);
    return (total / data.waterStats.length).toFixed(1);
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

      {/* สรุปแคลอรี่ และ น้ำดื่ม */}
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
        {/* 🌟 3. เพิ่มการ์ดสรุปน้ำดื่ม */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>น้ำดื่มเฉลี่ย (7 วัน)</div>
          <div className={styles.summaryValue}>
            {avgWater} <span>แก้ว/วัน</span>
          </div>
        </div>
      </div>

      <div className={styles.dashboardGrid}>
        
        {/* กราฟแท่งคู่: เปรียบเทียบ กิน vs เบิร์น */}
        <div className={styles.chartCard} style={{ gridColumn: "1 / -1" }}>
          <h3 className={styles.chartTitle}>เปรียบเทียบ กิน vs เบิร์น (7 วันล่าสุด)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mergedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                cursor={{ fill: 'rgba(0,0,0,0.05)' }} 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="total_cal" name="กินเข้า (kcal)" fill="#4caf50" radius={[6, 6, 0, 0]} />
              <Bar dataKey="total_burned" name="เบิร์นออก (kcal)" fill="#f44336" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* กราฟเส้น: แนวโน้มแคลอรี่ที่กิน */}
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

        {/* กราฟพื้นที่: แนวโน้มการเผาผลาญ */}
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

        {/* กราฟวงกลม: สัดส่วนอาหาร */}
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

        {/* 🌟 4. กราฟวิเคราะห์น้ำดื่ม (อัปเกรดใหม่) */}
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>วิเคราะห์การดื่มน้ำ</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.waterStats} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '12px' }} />
              
              {/* เส้นเป้าหมาย 8 แก้ว */}
              <ReferenceLine 
                y={8} 
                stroke="#ff9800" 
                strokeDasharray="3 3" 
                label={{ position: 'top', value: 'เป้าหมาย (8 แก้ว)', fill: '#ff9800', fontSize: 12, fontWeight: 'bold' }} 
              />
              
              {/* แท่งกราฟเปลี่ยนสีอัตโนมัติ */}
              <Bar dataKey="glasses" name="จำนวนแก้ว" radius={[6, 6, 0, 0]}>
                {data.waterStats.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.glasses >= 8 ? "#4caf50" : "#2196f3"} // ถึง 8 แก้วเป็นสีเขียว ไม่ถึงเป็นสีฟ้า
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
};

export default Trends;