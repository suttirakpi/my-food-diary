import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import styles from "./DailyLog.module.css";

interface MealOption {
  id: number;
  option_name: string;
}
interface MealEntry {
  id: number;
  meal_date: string;
  meal_time: string;
  main_dish: string;
  category: string;
  item_type: string;
  calories: number;
  options: MealOption[];
}
// 🌟 1. เพิ่ม Interface สำหรับการออกกำลังกาย
interface ExerciseEntry {
  id: number;
  activity_name: string;
  calories_burned: number;
}

const DailyLog: React.FC = () => {
  const navigate = useNavigate();
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [waterGlasses, setWaterGlasses] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [editingMeal, setEditingMeal] = useState<MealEntry | null>(null);

  // 🌟 2. เพิ่ม State สำหรับการออกกำลังกาย
  const [exercises, setExercises] = useState<ExerciseEntry[]>([]);
  const [exName, setExName] = useState("");
  const [exCal, setExCal] = useState<number | "">("");

  // --- State สำหรับค้นหา ---
  const [searchQuery, setSearchQuery] = useState("");
  const isSearching = searchQuery.trim() !== "";

  // 🌟 State สำหรับ IF 16/8
  const [isFasting, setIsFasting] = useState<boolean>(() => {
    return localStorage.getItem("isFasting") === "true";
  });
  const [fastStartTime, setFastStartTime] = useState<number | null>(() => {
    const savedTime = localStorage.getItem("fastStartTime");
    return savedTime ? parseInt(savedTime) : null;
  });
  const [fastTimeLeft, setFastTimeLeft] = useState<string>("16:00:00");
  const [fastProgress, setFastProgress] = useState<number>(0);

  const fetchData = async () => {
    try {
      const mealsRes = await axios.get(
        `https://my-food-diary-n1tf.onrender.com/api/meals?date=${selectedDate}`,
      );
      setMeals(mealsRes.data);

      const waterRes = await axios.get(
        `https://my-food-diary-n1tf.onrender.com/api/water?date=${selectedDate}`,
      );
      setWaterGlasses(waterRes.data.glasses);

      // 🌟 ดึงข้อมูลการออกกำลังกาย
      const exRes = await axios.get(
        `https://my-food-diary-n1tf.onrender.com/api/exercises?date=${selectedDate}`,
      );
      setExercises(exRes.data);
    } catch (error) {
      console.error("ดึงข้อมูลไม่สำเร็จ:", error);
    }
  };

  // 🌟 ระบบจับเวลา IF 16/8
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isFasting && fastStartTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsed = now - fastStartTime;
        const targetMs = 16 * 60 * 60 * 1000; // 16 ชั่วโมง
        const remaining = targetMs - elapsed;

        if (remaining <= 0) {
          setFastTimeLeft("00:00:00");
          setFastProgress(100);
          // ถ้าอยากให้แจ้งเตือนตอนครบเวลา เอาคอมเมนต์ออกได้ครับ
          // toast.success("ทำ IF ครบ 16 ชั่วโมงแล้ว! เก่งมาก!");
        } else {
          const h = Math.floor(remaining / (1000 * 60 * 60));
          const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
          const s = Math.floor((remaining % (1000 * 60)) / 1000);
          setFastTimeLeft(
            `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`,
          );
          setFastProgress((elapsed / targetMs) * 100);
        }
      }, 1000); // อัปเดตทุก 1 วินาที
    } else {
      setFastTimeLeft("16:00:00");
      setFastProgress(0);
    }

    return () => clearInterval(interval);
  }, [isFasting, fastStartTime]);

  const toggleFasting = () => {
    if (isFasting) {
      setIsFasting(false);
      setFastStartTime(null);
      localStorage.removeItem("isFasting");
      localStorage.removeItem("fastStartTime");
      toast.success("จบการ Fasting! ได้เวลาเติมพลังแล้ว 🍽️");
    } else {
      const now = Date.now();
      setIsFasting(true);
      setFastStartTime(now);
      localStorage.setItem("isFasting", "true");
      localStorage.setItem("fastStartTime", now.toString());
      toast.success("เริ่ม Fasting 16 ชั่วโมง! ลุย! ✌️");
    }
  };

  // 🌟 3. ฟังก์ชันเพิ่ม/ลบ การออกกำลังกาย
  const handleAddExercise = async () => {
    if (!exName.trim() || !exCal) {
      toast.error("กรุณากรอกชื่อกิจกรรมและจำนวนแคลอรี่ให้ครบ");
      return;
    }
    try {
      await axios.post(
        "https://my-food-diary-n1tf.onrender.com/api/exercises",
        {
          date: selectedDate,
          activityName: exName,
          caloriesBurned: Number(exCal),
        },
      );
      setExName("");
      setExCal("");
      fetchData(); // ดึงข้อมูลใหม่หลังบันทึก
      toast.success("บันทึกการออกกำลังกายสำเร็จ!");
    } catch (error) {
      console.error("เพิ่มการออกกำลังกายไม่สำเร็จ:", error);
      toast.error("บันทึกข้อมูลไม่สำเร็จ");
    }
  };

  const handleDeleteExercise = async (id: number) => {
    const isConfirm = window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?");
    if (!isConfirm) return;
    try {
      await axios.delete(
        `https://my-food-diary-n1tf.onrender.com/api/exercises/${id}`,
      );
      setExercises((prev) => prev.filter((ex) => ex.id !== id));
      toast.success("ลบรายการเรียบร้อย");
    } catch (error) {
      console.error("ลบข้อมูลไม่สำเร็จ:", error);
      toast.error("เกิดข้อผิดพลาดในการลบข้อมูล");
    }
  };

  const handleUpdateWater = async (newAmount: number) => {
    if (newAmount < 0) return;
    setWaterGlasses(newAmount);
    try {
      await axios.post("https://my-food-diary-n1tf.onrender.com/api/water", {
        date: selectedDate,
        glasses: newAmount,
      });
    } catch (error) {
      console.error("อัปเดตน้ำไม่สำเร็จ", error);
    }
  };

  const handleDelete = async (id: number) => {
    const isConfirm = window.confirm(
      "คุณแน่ใจหรือไม่ว่าต้องการลบรายการอาหารนี้?",
    );
    if (!isConfirm) return;
    try {
      await axios.delete(
        `https://my-food-diary-n1tf.onrender.com/api/meals/${id}`,
      );
      setMeals((prevMeals) => prevMeals.filter((meal) => meal.id !== id));
      toast.success("ลบรายการเรียบร้อย");
    } catch (error) {
      console.error("ลบข้อมูลไม่สำเร็จ:", error);
      toast.error("เกิดข้อผิดพลาดในการลบข้อมูล");
    }
  };

  const handleOpenEdit = (meal: MealEntry) =>
    setEditingMeal(JSON.parse(JSON.stringify(meal)));

  const handleSaveEdit = async () => {
    if (!editingMeal) return;
    const validOptions = editingMeal.options
      .map((o) => o.option_name)
      .filter((val) => val.trim() !== "");
    const payload = {
      mainDish: editingMeal.main_dish,
      category: editingMeal.category,
      itemType: editingMeal.item_type,
      calories: Number(editingMeal.calories) || 0,
      options: validOptions,
    };

    try {
      await axios.put(
        `https://my-food-diary-n1tf.onrender.com/api/meals/${editingMeal.id}`,
        payload,
      );
      setEditingMeal(null);
      fetchData();
      toast.success("อัปเดตข้อมูลสำเร็จ!");
    } catch (error) {
      console.error("แก้ไขไม่สำเร็จ", error);
      toast.error("เกิดข้อผิดพลาดในการแก้ไขข้อมูล");
    }
  };

  const handleEditOptionChange = (idx: number, val: string) => {
    if (!editingMeal) return;
    const newOptions = [...editingMeal.options];
    newOptions[idx].option_name = val;
    setEditingMeal({ ...editingMeal, options: newOptions });
  };
  const handleAddEditOption = () => {
    if (!editingMeal) return;
    setEditingMeal({
      ...editingMeal,
      options: [...editingMeal.options, { id: Date.now(), option_name: "" }],
    });
  };
  const handleRemoveEditOption = (idToRemove: number) => {
    if (!editingMeal) return;
    setEditingMeal({
      ...editingMeal,
      options: editingMeal.options.filter((opt) => opt.id !== idToRemove),
    });
  };

  const groupedMeals = meals.reduce(
    (acc, meal) => {
      const groupKey = isSearching
        ? meal.meal_date.split("T")[0]
        : meal.category || "อื่นๆ";
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(meal);
      return acc;
    },
    {} as Record<string, MealEntry[]>,
  );

  const groupsToRender = isSearching
    ? Object.keys(groupedMeals).sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime(),
      )
    : ["มื้อเช้า", "มื้อกลางวัน", "มื้อเย็น", "ระหว่างวัน"];

  const getCategoryTheme = (cat: string) => {
    if (cat === "มื้อเช้า") return styles.themeOrange;
    if (cat === "มื้อกลางวัน") return styles.themeRed;
    if (cat === "มื้อเย็น") return styles.themeYellow;
    return styles.themeBlue;
  };

  const formattedDate = new Date(selectedDate).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // 🌟 4. คำนวณสถิติทั้งหมด (อาหาร, ออกกำลังกาย, สุทธิ)
  const totalCalories = meals.reduce(
    (sum, meal) => sum + (meal.calories || 0),
    0,
  );
  const totalBurned = exercises.reduce(
    (sum, ex) => sum + ex.calories_burned,
    0,
  );
  const netCalories = totalCalories - totalBurned; // แคลอรี่สุทธิ

  const snackCount = meals.filter((m) => m.item_type === "ขนม").length;

  // --- Logic สำหรับหลอดพลังเป้าหมายกินอาหาร (ของเดิม ไม่แตะต้อง) ---
  const DAILY_CALORIE_GOAL = 1600;
  const isOverGoal = totalCalories > DAILY_CALORIE_GOAL;
  const calPercentage = Math.min(
    (totalCalories / DAILY_CALORIE_GOAL) * 100,
    100,
  );

  let barColor = "#4caf50";
  let messageColor = "var(--on-surface-variant)";
  let motivationMessage = "เริ่มต้นวันใหม่! ทานอาหารที่มีประโยชน์นะ";

  if (totalCalories > 0 && totalCalories <= DAILY_CALORIE_GOAL * 0.8) {
    motivationMessage = "เยี่ยมมาก! ยังทานได้อีกเรื่อยๆ ตามเป้าหมาย";
  } else if (
    totalCalories > DAILY_CALORIE_GOAL * 0.8 &&
    totalCalories <= DAILY_CALORIE_GOAL
  ) {
    barColor = "#ff9800";
    messageColor = "#f57c00";
    motivationMessage = "ใกล้ถึงเป้าหมายแล้ว ระวังแคลอรี่เกินนะ!";
  } else if (isOverGoal) {
    barColor = "#f44336";
    messageColor = "#d32f2f";
    motivationMessage = "แคลอรี่กินเข้าไปเกินเป้าหมายแล้ว! ไปออกกำลังกายด่วน!";
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.logo}>Vitality Food Diary</div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => navigate("/trends")}
            style={{
              background: "white",
              border: "1px solid var(--primary)",
              color: "var(--primary)",
              padding: "10px 16px",
              borderRadius: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: 600,
            }}
          >
            <span className="material-symbols-outlined">analytics</span> Trends
          </button>
          <button
            className={styles.addBtn}
            onClick={() => navigate("/add-meal")}
          >
            <span className="material-symbols-outlined">add</span> Add Meal
          </button>
        </div>
      </header>

      <main className={styles.mainContent}>
        {/* --- ช่องค้นหา (Search Bar) --- */}
        <div className={styles.searchContainer}>
          <span className={`material-symbols-outlined ${styles.searchIcon}`}>
            search
          </span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="ค้นหาเมนูอาหาร, หมวดหมู่ เช่น ชานม, ขนม..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* --- Header วันที่ --- */}
        {!isSearching && (
          <div className={styles.sectionHeader}>
            <h2>สรุปประจำวัน ({formattedDate})</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label
                htmlFor="datePicker"
                style={{ fontWeight: 600, color: "var(--on-surface-variant)" }}
              >
                เลือกวันที่:
              </label>
              <input
                type="date"
                id="datePicker"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--tertiary-fixed)",
                  outline: "none",
                }}
              />
            </div>
          </div>
        )}

        {isSearching && (
          <h2 style={{ marginBottom: "24px" }}>
            ผลการค้นหา: "{searchQuery}"
            <span className={styles.searchBadge}>
              เจอ {meals.length} รายการ
            </span>
          </h2>
        )}

        {!isSearching && (
          <>
            {/* 🌟 Widget ติดตาม Intermittent Fasting (16/8) */}
            <div
              style={{
                backgroundColor: isFasting ? "#fff3e0" : "#e8f5e9",
                borderRadius: "16px",
                padding: "24px",
                marginBottom: "32px",
                borderLeft: `6px solid ${isFasting ? "#ff9800" : "#4caf50"}`,
                boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                transition: "all 0.3s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "16px",
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: "0 0 8px 0",
                      color: isFasting ? "#e65100" : "#2e7d32",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span className="material-symbols-outlined">timer</span>
                    Intermittent Fasting (16/8)
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      color: isFasting ? "#f57c00" : "#4caf50",
                      fontSize: "14px",
                      fontWeight: 500,
                    }}
                  >
                    {isFasting
                      ? "🔥 ร่างกายกำลังดึงไขมันมาใช้! อดทนอีกนิดเพื่อเป้าหมาย 70kg"
                      : "🍽️ ช่วงเวลากิน (Feeding Window) เติมพลังให้เต็มที่!"}
                  </p>
                </div>

                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "36px",
                      fontWeight: "bold",
                      color: isFasting ? "#e65100" : "#2e7d32",
                      fontFamily: "monospace",
                    }}
                  >
                    {isFasting ? fastTimeLeft : "08:00:00"}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: isFasting ? "#f57c00" : "#4caf50",
                      fontWeight: 600,
                    }}
                  >
                    {isFasting
                      ? "เวลา Fasting ที่เหลือ"
                      : "เวลา Feeding (โดยประมาณ)"}
                  </div>
                </div>

                <button
                  onClick={toggleFasting}
                  style={{
                    backgroundColor: isFasting ? "#f44336" : "#4caf50",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "12px 24px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontFamily: "var(--font-body)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                  }}
                >
                  {isFasting ? "🛑 จบการ Fasting" : "▶️ เริ่ม Fasting 16 ชม."}
                </button>
              </div>

              {/* Progress Bar หลอดพลังงาน */}
              {isFasting && (
                <div style={{ marginTop: "20px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "12px",
                      color: "#e65100",
                      marginBottom: "8px",
                      fontWeight: "bold",
                    }}
                  >
                    <span>0 ชม.</span>
                    <span>เป้าหมาย 16 ชม.</span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: "12px",
                      backgroundColor: "#ffe0b2",
                      borderRadius: "6px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${fastProgress}%`,
                        backgroundColor:
                          fastProgress >= 100 ? "#4caf50" : "#ff9800",
                        transition: "width 1s linear",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            {/* Top Summary Dashboard */}
            <div className={styles.topSummary}>
              <div className={styles.summaryCard}>
                <span className={styles.summaryValue}>{totalCalories}</span>
                <span className={styles.summaryLabel}>
                  แคลอรี่รวมที่กิน (kcal)
                </span>
              </div>
              <div className={styles.summaryCard}>
                <span className={styles.summaryValue}>
                  {waterGlasses * 22} oz
                </span>
                <span className={styles.summaryLabel}>
                  น้ำที่ดื่มไป (~{((waterGlasses * 650) / 1000).toFixed(1)} L)
                </span>
              </div>
              <div className={styles.summaryCard}>
                <span
                  className={styles.summaryValue}
                  style={{ color: snackCount > 0 ? "#ff4d4f" : "inherit" }}
                >
                  {snackCount}
                </span>
                <span className={styles.summaryLabel}>จำนวนขนมวันนี้</span>
              </div>
            </div>

            {/* 🌟 5. กล่องแสดงแคลอรี่สุทธิ (Net Calories) */}
            <div
              style={{
                backgroundColor: "#fff3e0",
                borderRadius: "16px",
                padding: "24px",
                marginBottom: "32px",
                borderLeft: "6px solid #ff9800",
                boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "16px",
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: "0 0 8px 0",
                      color: "#e65100",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span className="material-symbols-outlined">
                      local_fire_department
                    </span>
                    แคลอรี่สุทธิ (Net Calories)
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      color: "#f57c00",
                      fontSize: "14px",
                      fontWeight: 500,
                    }}
                  >
                    กินเข้า{" "}
                    <span style={{ fontWeight: "bold" }}>{totalCalories}</span>{" "}
                    - เผาผลาญ{" "}
                    <span style={{ fontWeight: "bold" }}>{totalBurned}</span>
                  </p>
                </div>
                <div
                  style={{
                    fontSize: "36px",
                    fontWeight: "bold",
                    color: "#e65100",
                  }}
                >
                  {netCalories}{" "}
                  <span style={{ fontSize: "16px", fontWeight: "normal" }}>
                    kcal
                  </span>
                </div>
              </div>
            </div>

            {/* เป้าหมายการกิน (หลอดเดิม) */}
            <div className={styles.goalContainer}>
              <div className={styles.goalHeader}>
                <div className={styles.goalTitle}>
                  <span
                    className="material-symbols-outlined"
                    style={{ color: barColor }}
                  >
                    speed
                  </span>
                  เป้าหมายการกิน (หลอดเดิม)
                </div>
                <div className={styles.goalText}>
                  <span
                    style={{ color: isOverGoal ? "#f44336" : "var(--primary)" }}
                  >
                    {totalCalories}
                  </span>{" "}
                  / {DAILY_CALORIE_GOAL} kcal
                </div>
              </div>
              <div className={styles.progressBarBg}>
                <div
                  className={styles.progressBarFill}
                  style={{
                    width: `${calPercentage}%`,
                    backgroundColor: barColor,
                  }}
                ></div>
              </div>
              <div
                className={styles.goalMessage}
                style={{ color: messageColor }}
              >
                {motivationMessage}
              </div>
            </div>

            {/* 🌟 6. ระบบบันทึกการออกกำลังกาย */}
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "16px",
                padding: "24px",
                marginBottom: "32px",
                border: "1px solid var(--tertiary-fixed)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
              }}
            >
              <h3
                style={{
                  margin: "0 0 16px 0",
                  fontFamily: "var(--font-heading)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span className="material-symbols-outlined">
                  fitness_center
                </span>
                บันทึกการออกกำลังกาย
              </h3>

              {/* ฟอร์มกรอกแบบ Flexbox หดตามมือถือ */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                <input
                  type="text"
                  placeholder="เช่น วิ่ง, ยกเวท, ว่ายน้ำ"
                  value={exName}
                  onChange={(e) => setExName(e.target.value)}
                  style={{
                    flex: "2",
                    minWidth: "200px",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid var(--tertiary-fixed)",
                    outline: "none",
                    fontFamily: "var(--font-body)",
                  }}
                />
                <input
                  type="number"
                  placeholder="kcal ที่เบิร์น"
                  value={exCal}
                  onChange={(e) =>
                    setExCal(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  style={{
                    flex: "1",
                    minWidth: "120px",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid var(--tertiary-fixed)",
                    outline: "none",
                    fontFamily: "var(--font-body)",
                  }}
                />
                <button
                  onClick={handleAddExercise}
                  style={{
                    flex: "0 1 auto",
                    backgroundColor: "#e65100",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "12px 24px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  บันทึก
                </button>
              </div>

              {/* รายการที่ออกกำลังกายไปแล้ว */}
              {exercises.length > 0 && (
                <div
                  style={{
                    marginTop: "16px",
                    borderTop: "1px solid var(--tertiary-fixed)",
                    paddingTop: "16px",
                  }}
                >
                  {exercises.map((ex) => (
                    <div
                      key={ex.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "8px",
                        padding: "12px",
                        backgroundColor: "#fff3e0",
                        borderRadius: "8px",
                        border: "1px solid #ffe0b2",
                      }}
                    >
                      <span style={{ fontWeight: 600, color: "#e65100" }}>
                        {ex.activity_name}
                      </span>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                        }}
                      >
                        <span style={{ color: "#e65100", fontWeight: "bold" }}>
                          - {ex.calories_burned} kcal
                        </span>
                        <button
                          onClick={() => handleDeleteExercise(ex.id)}
                          style={{
                            background: "white",
                            border: "1px solid #ffcc80",
                            color: "#f44336",
                            cursor: "pointer",
                            display: "flex",
                            padding: "6px",
                            borderRadius: "50%",
                          }}
                          title="ลบรายการ"
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: "18px" }}
                          >
                            delete
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Widget น้ำดื่ม */}
            <div className={styles.waterWidget}>
              <div className={styles.waterInfo}>
                <h3>
                  <span className="material-symbols-outlined">water_drop</span>{" "}
                  ติดตามการดื่มน้ำ
                </h3>
                <p>ดื่มน้ำไปแล้ว {waterGlasses} แก้ว</p>
              </div>
              <div className={styles.waterControls}>
                <button
                  className={styles.waterBtn}
                  onClick={() => handleUpdateWater(waterGlasses - 1)}
                >
                  <span className="material-symbols-outlined">remove</span>
                </button>
                <div className={styles.waterCount}>{waterGlasses}</div>
                <button
                  className={styles.waterBtn}
                  onClick={() => handleUpdateWater(waterGlasses + 1)}
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* --- รายการอาหาร (ของเดิม) --- */}
        {meals.length > 0 ? (
          groupsToRender.map((cat) => {
            const mealsInCat = groupedMeals[cat];
            if (!mealsInCat || mealsInCat.length === 0) return null;

            return (
              <section
                key={cat}
                className={`${styles.categorySection} ${
                  isSearching ? styles.themeOrange : getCategoryTheme(cat)
                }`}
              >
                <h3 className={styles.categoryTitle}>
                  {isSearching
                    ? `📅 วันที่ ${new Date(cat).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}`
                    : cat}
                </h3>
                <div className={styles.mealGrid}>
                  {mealsInCat.map((meal) => (
                    <div key={meal.id} className={styles.mealCard}>
                      <div
                        className={styles.cardHeader}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <div>
                          <span className={styles.timeTag}>
                            {meal.category} • {meal.meal_time}
                          </span>
                          <h3 className={styles.dishTitle}>
                            {meal.main_dish}{" "}
                            <span
                              style={{
                                fontSize: "14px",
                                fontWeight: "normal",
                                color: "var(--on-surface-variant)",
                              }}
                            >
                              ({meal.item_type})
                            </span>
                            {meal.calories > 0 && (
                              <span
                                style={{
                                  display: "inline-block",
                                  marginLeft: "12px",
                                  padding: "4px 8px",
                                  backgroundColor: "#fff3e0",
                                  color: "#e65100",
                                  borderRadius: "12px",
                                  fontSize: "12px",
                                  fontWeight: "bold",
                                }}
                              >
                                🔥 {meal.calories} kcal
                              </span>
                            )}
                          </h3>
                        </div>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button
                            onClick={() => handleOpenEdit(meal)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#2196f3",
                              cursor: "pointer",
                              padding: "8px",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                            }}
                            title="แก้ไขรายการ"
                          >
                            <span className="material-symbols-outlined">
                              edit
                            </span>
                          </button>
                          <button
                            onClick={() => handleDelete(meal.id)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#ff4d4f",
                              cursor: "pointer",
                              padding: "8px",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                            }}
                            title="ลบรายการนี้"
                          >
                            <span className="material-symbols-outlined">
                              delete
                            </span>
                          </button>
                        </div>
                      </div>
                      <div className={styles.cardBody}>
                        <div className={styles.detailColumn}>
                          <p className={styles.detailLabel}>Toppings</p>
                          {meal.options && meal.options.length > 0 ? (
                            <ul>
                              {meal.options.map((opt) => (
                                <li key={opt.id}>{opt.option_name}</li>
                              ))}
                            </ul>
                          ) : (
                            <p style={{ color: "var(--on-surface-variant)" }}>
                              -
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })
        ) : (
          <div
            style={{
              textAlign: "center",
              marginTop: "40px",
              padding: "40px",
              backgroundColor: "white",
              borderRadius: "12px",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "48px", color: "var(--outline-variant)" }}
            >
              {isSearching ? "search_off" : "restaurant"}
            </span>
            <p
              style={{ marginTop: "16px", color: "var(--on-surface-variant)" }}
            >
              {isSearching
                ? `ไม่พบประวัติการกินคำว่า "${searchQuery}"`
                : "ยังไม่มีการบันทึกอาหารในวันที่เลือก"}
            </p>
          </div>
        )}
      </main>

      {/* --- Edit Modal --- */}
      {editingMeal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>แก้ไขมื้ออาหาร</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div className={styles.modalInputGroup}>
                <label>หมวดหมู่</label>
                <select
                  value={editingMeal.category}
                  onChange={(e) =>
                    setEditingMeal({ ...editingMeal, category: e.target.value })
                  }
                >
                  <option value="มื้อเช้า">มื้อเช้า</option>
                  <option value="มื้อกลางวัน">มื้อกลางวัน</option>
                  <option value="มื้อเย็น">มื้อเย็น</option>
                  <option value="ระหว่างวัน">ระหว่างวัน</option>
                </select>
              </div>
              <div className={styles.modalInputGroup}>
                <label>ประเภท</label>
                <select
                  value={editingMeal.item_type}
                  onChange={(e) =>
                    setEditingMeal({
                      ...editingMeal,
                      item_type: e.target.value,
                    })
                  }
                >
                  <option value="อาหาร">อาหาร</option>
                  <option value="เครื่องดื่ม">เครื่องดื่ม</option>
                  <option value="ขนม">ขนม</option>
                </select>
              </div>
            </div>

            <div className={styles.modalInputGroup}>
              <label>ชื่อเมนู</label>
              <input
                type="text"
                value={editingMeal.main_dish}
                onChange={(e) =>
                  setEditingMeal({ ...editingMeal, main_dish: e.target.value })
                }
              />
            </div>

            <div className={styles.modalInputGroup}>
              <label>แคลอรี่ (kcal)</label>
              <input
                type="number"
                value={editingMeal.calories}
                onChange={(e) =>
                  setEditingMeal({
                    ...editingMeal,
                    calories: Number(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className={styles.modalInputGroup}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <label style={{ margin: 0 }}>Toppings</label>
                <button
                  type="button"
                  onClick={handleAddEditOption}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--primary)",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  + เพิ่ม
                </button>
              </div>
              {editingMeal.options.map((opt, idx) => (
                <div
                  key={opt.id}
                  style={{ display: "flex", gap: "8px", marginBottom: "8px" }}
                >
                  <input
                    type="text"
                    value={opt.option_name}
                    onChange={(e) =>
                      handleEditOptionChange(idx, e.target.value)
                    }
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveEditOption(opt.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#ff4d4f",
                      cursor: "pointer",
                    }}
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              ))}
            </div>

            <div className={styles.modalActions}>
              <button
                className={styles.btnCancel}
                onClick={() => setEditingMeal(null)}
              >
                ยกเลิก
              </button>
              <button className={styles.btnSave} onClick={handleSaveEdit}>
                บันทึกข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Footer --- */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerInfo}>
            <div className={styles.footerLogo}>Food Diary</div>
            <div className={styles.footerCopyright}>
              © 2026 Food Diary. Mindful Eating, Better Living.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DailyLog;
