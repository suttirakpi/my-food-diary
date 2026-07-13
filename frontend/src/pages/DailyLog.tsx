import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import styles from "./DailyLog.module.css";
import AppLayout from "../components/AppLayout";

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
  protein?: number;
  carbs?: number;
  fats?: number;
  options: MealOption[];
}
interface ExerciseEntry {
  id: number;
  activity_name: string;
  calories_burned: number;
}

type MacroType = "protein" | "carbs" | "fats";

const DailyLog: React.FC = () => {
  const navigate = useNavigate();
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [waterGlasses, setWaterGlasses] = useState<number>(0);

  const [proteinGrams, setProteinGrams] = useState<number>(0);
  const [carbsGrams, setCarbsGrams] = useState<number>(0);
  const [fatsGrams, setFatsGrams] = useState<number>(0);

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [editingMeal, setEditingMeal] = useState<MealEntry | null>(null);
  const [exercises, setExercises] = useState<ExerciseEntry[]>([]);

  const [dailyCalGoal, setDailyCalGoal] = useState<number>(1400);
  const [proteinGoal, setProteinGoal] = useState<number>(140);
  const [carbsGoal, setCarbsGoal] = useState<number>(150);
  const [fatsGoal, setFatsGoal] = useState<number>(50);
  const [waterGoal, setWaterGoal] = useState<number>(8);

  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [exName, setExName] = useState("");
  const [exCal, setExCal] = useState<number | "">("");
  const [editingExercise, setEditingExercise] = useState<ExerciseEntry | null>(
    null,
  );

  const [showMacroModal, setShowMacroModal] = useState<boolean>(false);
  const [macroModalMode, setMacroModalMode] = useState<"add" | "edit">("add");
  const [macroActiveType, setMacroActiveType] = useState<MacroType>("protein");
  const [macroInput, setMacroInput] = useState<string>("");

  const [isPetting, setIsPetting] = useState(false);
  const handlePetMascot = () => {
    setIsPetting(true);
    setTimeout(() => setIsPetting(false), 3000);
  };
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [mealsRes, waterRes, exRes, macrosRes, settingsRes] =
        await Promise.all([
          axios.get(
            `https://my-food-diary-n1tf.onrender.com/api/meals?date=${selectedDate}`,
          ),
          axios.get(
            `https://my-food-diary-n1tf.onrender.com/api/water?date=${selectedDate}`,
          ),
          axios.get(
            `https://my-food-diary-n1tf.onrender.com/api/exercises?date=${selectedDate}`,
          ),
          axios
            .get(
              `https://my-food-diary-n1tf.onrender.com/api/macros?date=${selectedDate}`,
            )
            .catch(() => ({ data: { protein: 0, carbs: 0, fats: 0 } })),
          axios
            .get(`https://my-food-diary-n1tf.onrender.com/api/settings`)
            .catch(() => ({ data: null })),
        ]);

      setMeals(mealsRes.data);
      setWaterGlasses(waterRes.data.glasses);
      setExercises(exRes.data);

      setProteinGrams(macrosRes.data.protein || 0);
      setCarbsGrams(macrosRes.data.carbs || 0);
      setFatsGrams(macrosRes.data.fats || 0);

      if (settingsRes.data) {
        setDailyCalGoal(settingsRes.data.cal_goal || 1400);
        setProteinGoal(settingsRes.data.protein_goal || 140);
        setCarbsGoal(settingsRes.data.carbs_goal || 150);
        setFatsGoal(settingsRes.data.fats_goal || 50);
        setWaterGoal(settingsRes.data.water_goal || 8);
      }
    } catch (error) {
      console.error("ดึงข้อมูลไม่สำเร็จ:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const handleUpdateWater = async (newAmount: number) => {
    if (newAmount < 0) return;
    setWaterGlasses(newAmount);
    try {
      await axios.post("https://my-food-diary-n1tf.onrender.com/api/water", {
        date: selectedDate,
        glasses: newAmount,
      });
    } catch (error) {}
  };

  const handleOpenMacroModal = (type: MacroType, mode: "add" | "edit") => {
    setMacroActiveType(type);
    setMacroModalMode(mode);
    if (mode === "add") {
      setMacroInput("");
    } else {
      if (type === "protein") setMacroInput(proteinGrams.toString());
      if (type === "carbs") setMacroInput(carbsGrams.toString());
      if (type === "fats") setMacroInput(fatsGrams.toString());
    }
    setShowMacroModal(true);
  };

  const handleConfirmMacro = async () => {
    const amount = Number(macroInput);
    if (
      isNaN(amount) ||
      amount < 0 ||
      (macroModalMode === "add" && amount === 0)
    ) {
      toast.error("กรุณากรอกตัวเลขให้ถูกต้อง");
      return;
    }

    let currentVal = 0;
    if (macroActiveType === "protein") currentVal = proteinGrams;
    if (macroActiveType === "carbs") currentVal = carbsGrams;
    if (macroActiveType === "fats") currentVal = fatsGrams;

    const newTotal = macroModalMode === "add" ? currentVal + amount : amount;

    let newProtein = proteinGrams;
    let newCarbs = carbsGrams;
    let newFats = fatsGrams;

    if (macroActiveType === "protein") {
      setProteinGrams(newTotal);
      newProtein = newTotal;
    }
    if (macroActiveType === "carbs") {
      setCarbsGrams(newTotal);
      newCarbs = newTotal;
    }
    if (macroActiveType === "fats") {
      setFatsGrams(newTotal);
      newFats = newTotal;
    }

    try {
      await axios.post("https://my-food-diary-n1tf.onrender.com/api/macros", {
        date: selectedDate,
        protein: newProtein,
        carbs: newCarbs,
        fats: newFats,
      });
      toast.success(
        macroModalMode === "add"
          ? `เพิ่ม ${macroActiveType} ${amount}g เรียบร้อย!`
          : `อัปเดต ${macroActiveType} เรียบร้อย!`,
      );
      setShowMacroModal(false);
    } catch (error) {
      toast.error("บันทึกข้อมูลไม่สำเร็จ");
    }
  };

  const handleAddExercise = async () => {
    if (!exName.trim() || !exCal) return toast.error("กรุณากรอกข้อมูลให้ครบ");
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
      setShowExerciseForm(false);
      fetchData();
      toast.success("บันทึกสำเร็จ!");
    } catch (error) {}
  };

  const handleDeleteExercise = async (id: number) => {
    if (!window.confirm("ลบการออกกำลังกายนี้?")) return;
    try {
      await axios.delete(
        `https://my-food-diary-n1tf.onrender.com/api/exercises/${id}`,
      );
      setExercises((prev) => prev.filter((ex) => ex.id !== id));
      toast.success("ลบเรียบร้อย");
    } catch (error) {}
  };

  const handleSaveEditExercise = async () => {
    if (!editingExercise) return;
    try {
      await axios.put(
        `https://my-food-diary-n1tf.onrender.com/api/exercises/${editingExercise.id}`,
        {
          activityName: editingExercise.activity_name,
          caloriesBurned: Number(editingExercise.calories_burned),
        },
      );
      setEditingExercise(null);
      fetchData();
      toast.success("อัปเดตสำเร็จ!");
    } catch (error) {}
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("ลบรายการนี้?")) return;

    // 1. หาข้อมูลมื้ออาหารที่จะลบ เพื่อเอาค่าโปรตีน คาร์บ ไขมัน มาเตรียมหักลบ
    const mealToDelete = meals.find((m) => m.id === id);

    try {
      // 2. ลบมื้ออาหารออกจากฐานข้อมูล
      await axios.delete(
        `https://my-food-diary-n1tf.onrender.com/api/meals/${id}`,
      );

      // 3. ถ้ามื้ออาหารนั้นมีค่า Macros ให้เอาไปลบออกจากหลอดรายวันด้วย
      if (
        mealToDelete &&
        (mealToDelete.protein || mealToDelete.carbs || mealToDelete.fats)
      ) {
        const newProtein = Math.max(
          0,
          proteinGrams - (mealToDelete.protein || 0),
        );
        const newCarbs = Math.max(0, carbsGrams - (mealToDelete.carbs || 0));
        const newFats = Math.max(0, fatsGrams - (mealToDelete.fats || 0));

        await axios.post("https://my-food-diary-n1tf.onrender.com/api/macros", {
          date: selectedDate,
          protein: newProtein,
          carbs: newCarbs,
          fats: newFats,
        });

        // อัปเดต UI ทันที
        setProteinGrams(newProtein);
        setCarbsGrams(newCarbs);
        setFatsGrams(newFats);
      }

      setMeals((prev) => prev.filter((meal) => meal.id !== id));
      toast.success("ลบข้อมูลและอัปเดตสารอาหารเรียบร้อย!");
    } catch (error) {
      toast.error("ลบข้อมูลไม่สำเร็จ");
    }
  };

  const handleOpenEdit = (meal: MealEntry) =>
    setEditingMeal(JSON.parse(JSON.stringify(meal)));

  const handleSaveEdit = async () => {
    if (!editingMeal) return;

    const originalMeal = meals.find((m) => m.id === editingMeal.id);

    const validOptions = editingMeal.options
      .map((o) => o.option_name)
      .filter((val) => val.trim() !== "");

    const payload = {
      mainDish: editingMeal.main_dish,
      category: editingMeal.category,
      itemType: editingMeal.item_type,
      calories: Number(editingMeal.calories) || 0,
      protein: Number(editingMeal.protein) || 0,
      carbs: Number(editingMeal.carbs) || 0,
      fats: Number(editingMeal.fats) || 0,
      options: validOptions,
    };

    try {
      await axios.put(
        `https://my-food-diary-n1tf.onrender.com/api/meals/${editingMeal.id}`,
        payload,
      );

      if (originalMeal) {
        const diffProtein = payload.protein - (originalMeal.protein || 0);
        const diffCarbs = payload.carbs - (originalMeal.carbs || 0);
        const diffFats = payload.fats - (originalMeal.fats || 0);

        if (diffProtein !== 0 || diffCarbs !== 0 || diffFats !== 0) {
          const newProtein = Math.max(0, proteinGrams + diffProtein);
          const newCarbs = Math.max(0, carbsGrams + diffCarbs);
          const newFats = Math.max(0, fatsGrams + diffFats);

          await axios.post(
            "https://my-food-diary-n1tf.onrender.com/api/macros",
            {
              date: selectedDate,
              protein: newProtein,
              carbs: newCarbs,
              fats: newFats,
            },
          );

          setProteinGrams(newProtein);
          setCarbsGrams(newCarbs);
          setFatsGrams(newFats);
        }
      }

      setEditingMeal(null);
      fetchData();
      toast.success("อัปเดตข้อมูลและสารอาหารสำเร็จ!");
    } catch (error) {
      toast.error("อัปเดตข้อมูลล้มเหลว");
    }
  };

  const groupedMeals = useMemo(() => {
    return meals.reduce((acc: Record<string, MealEntry[]>, meal: MealEntry) => {
      const groupKey = meal.category || "อื่นๆ";
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(meal);
      return acc;
    }, {});
  }, [meals]);
  const groupsToRender = ["มื้อเช้า", "มื้อกลางวัน", "มื้อเย็น", "ระหว่างวัน"];

  const getThemeClass = (cat: string) => {
    if (cat === "มื้อเช้า") return styles.themeBreakfast;
    if (cat === "มื้อกลางวัน") return styles.themeLunch;
    if (cat === "มื้อเย็น") return styles.themeDinner;
    return styles.themeSnack;
  };
  const getIconForCat = (cat: string) => {
    if (cat === "มื้อเช้า") return "restaurant";
    if (cat === "มื้อกลางวัน") return "lunch_dining";
    if (cat === "มื้อเย็น") return "ramen_dining";
    return "icecream";
  };

  const totalCalories = meals.reduce(
    (sum, meal) => sum + (meal.calories || 0),
    0,
  );
  const totalBurned = exercises.reduce(
    (sum, ex) => sum + ex.calories_burned,
    0,
  );
  const netCalories = totalCalories - totalBurned;

  const isOverGoal = netCalories > dailyCalGoal;
  const percentage = Math.min(
    Math.max((netCalories / dailyCalGoal) * 100, 0),
    100,
  );
  const ringDegree = (percentage / 100) * 360;
  const ringColor = isOverGoal ? "#ef4444" : "#34d399";
  const ringStyle = {
    background: `conic-gradient(${ringColor} ${ringDegree}deg, #f1f5f9 ${ringDegree}deg)`,
  };

  let mascotMood = "normal";
  let mascotMessage = "สวัสดีฮะตูน! ไวท์มอลมาช่วยดูแลหุ่นแล้ว (๑˃ᴗ˂)ﻭ 🐹";
  let mascotEmoji = "🐹";
  if (isPetting) {
    mascotMood = "love";
    mascotMessage = "งื้ออออ~ ฟินจุงเบยยย รักตูนน้าา 💕";
    mascotEmoji = "🐹💖";
  } else if (isOverGoal) {
    mascotMood = "warning";
    mascotMessage = "แงะ! แคลอรี่ทะลุเป้าหมายแล้วฮะ! 🍔";
    mascotEmoji = "🐹💦";
  } else if (waterGlasses >= waterGoal) {
    mascotMood = "happy";
    mascotMessage = `ดื่มน้ำครบ ${waterGoal} แก้วตามเป้าแล้ว ตูนเก่งที่สุดเลยฮะ! 💧`;
    mascotEmoji = "🐹✨";
  }

  const macroConfigs = [
    {
      type: "protein" as MacroType,
      label: "Protein",
      current: proteinGrams,
      goal: proteinGoal,
      color: "#10b981",
      bg: "#d1fae5",
    },
    {
      type: "carbs" as MacroType,
      label: "Carbs",
      current: carbsGrams,
      goal: carbsGoal,
      color: "#3b82f6",
      bg: "#dbeafe",
    },
    {
      type: "fats" as MacroType,
      label: "Fats",
      current: fatsGrams,
      goal: fatsGoal,
      color: "#f59e0b",
      bg: "#fef3c7",
    },
  ];

  return (
    <AppLayout>
      {isLoading && (
        <div className="loadingOverlay">
          <div className="loadingCard">
            <div className="loadingMascot">🐹💨</div>
            <h2 style={{ fontFamily: "var(--font-heading)" }}>
              กำลังดึงข้อมูล...
            </h2>
          </div>
        </div>
      )}

      <div className={styles.topHeader}>
        <div className={styles.datePickerWrapper}>
          <span
            className="material-symbols-outlined"
            style={{ color: "#64748b" }}
          >
            calendar_today
          </span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>Calories Consumed</div>
          <div className={styles.statValue}>
            {totalCalories} <span className={styles.statSub}>kcal</span>
          </div>
          <div className={`${styles.statIconWrapper} ${styles.bgBlue}`}>
            <span className="material-symbols-outlined">restaurant</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>Water Intake</div>
          <div className={styles.statValue}>
            {waterGlasses * 22} <span className={styles.statSub}>oz</span>
          </div>
          <div style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>
            (~{((waterGlasses * 650) / 1000).toFixed(1)} L)
          </div>
          <div className={`${styles.statIconWrapper} ${styles.bgBlue}`}>
            <span className="material-symbols-outlined">water_drop</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>Calories Burned</div>
          <div className={styles.statValue}>
            {totalBurned} <span className={styles.statSub}>kcal</span>
          </div>
          <button
            className={styles.actionBtnSmall}
            onClick={() => setShowExerciseForm(!showExerciseForm)}
          >
            Log Exercise
          </button>
          <div className={`${styles.statIconWrapper} ${styles.bgRed}`}>
            <span className="material-symbols-outlined">
              local_fire_department
            </span>
          </div>
          {showExerciseForm && (
            <div className={styles.exercisePanel}>
              <input
                type="text"
                placeholder="Activity name..."
                value={exName}
                onChange={(e) => setExName(e.target.value)}
              />
              <input
                type="number"
                placeholder="Kcal burned..."
                value={exCal}
                onChange={(e) =>
                  setExCal(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
              <button onClick={handleAddExercise}>Add</button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.centerCard}>
        <div className={styles.ringContainer} style={ringStyle}>
          {/* 🌟 อัปเดตส่วนแสดงผล แคลอรี่ที่กินได้อีก อยู่ตรงนี้ครับ! */}
          <div className={styles.ringInner}>
            <div className={styles.ringLabel}>Net Calories:</div>
            <div
              className={styles.ringValue}
              style={{ color: isOverGoal ? "#ef4444" : "#0f172a" }}
            >
              {netCalories}
            </div>
            <div className={styles.ringGoal}>/ {dailyCalGoal} kcal</div>

            <div
              style={{
                marginTop: "8px",
                fontSize: "14px",
                fontWeight: "bold",
                color: dailyCalGoal - netCalories >= 0 ? "#2563eb" : "#ef4444",
              }}
            >
              {dailyCalGoal - netCalories >= 0
                ? `กินได้อีก: ${dailyCalGoal - netCalories} kcal`
                : `กินเกินเป้า: ${Math.abs(dailyCalGoal - netCalories)} kcal`}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "24px",
            marginBottom: "32px",
            paddingBottom: "32px",
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          {macroConfigs.map((macro) => {
            const isReachedGoal = macro.current >= macro.goal;
            return (
              <div key={macro.type}>
                <div
                  className={styles.macroHeader}
                  style={{
                    marginBottom: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      color: isReachedGoal ? "#10b981" : macro.color,
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                      fontWeight: "bold",
                    }}
                  >
                    {macro.label}
                    <span
                      style={{
                        display: "flex",
                        gap: "6px",
                        fontWeight: "normal",
                      }}
                    >
                      <span
                        style={{
                          color: macro.color,
                          cursor: "pointer",
                          textDecoration: "underline",
                          fontSize: "12px",
                        }}
                        onClick={() => handleOpenMacroModal(macro.type, "add")}
                      >
                        +Add
                      </span>
                      <span
                        style={{
                          color: "#94a3b8",
                          cursor: "pointer",
                          textDecoration: "underline",
                          fontSize: "12px",
                        }}
                        onClick={() => handleOpenMacroModal(macro.type, "edit")}
                      >
                        Edit
                      </span>
                    </span>
                  </span>
                  <span style={{ fontWeight: "bold", color: "#334155" }}>
                    {macro.current}g{" "}
                    <span style={{ color: "#94a3b8", fontWeight: "normal" }}>
                      / {macro.goal}g
                    </span>
                  </span>
                </div>
                <div
                  style={{
                    height: "10px",
                    backgroundColor: macro.bg,
                    borderRadius: "6px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      backgroundColor: macro.color,
                      width: `${Math.min((macro.current / macro.goal) * 100, 100)}%`,
                      transition: "width 0.5s ease-out",
                      borderRadius: "6px",
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.actionsRow}>
          <div className={styles.quickAddSection}>
            <div className={styles.quickAddLabel}>Quick Add</div>
            <button
              onClick={() => navigate("/add-meal")}
              style={{
                width: "100%",
                height: "48px",
                backgroundColor: "#0f172a",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                fontSize: "15px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <span className="material-symbols-outlined">add_circle</span> Add
              New Meal
            </button>
          </div>
          <div className={styles.waterTrackerSection}>
            <div className={styles.quickAddLabel}>Water Tracker</div>
            <div className={styles.waterTrackerControls}>
              <button
                className={styles.waterControlBtn}
                onClick={() => handleUpdateWater(waterGlasses - 1)}
              >
                -
              </button>
              <span
                className={`material-symbols-outlined ${styles.waterGlassIcon}`}
              >
                local_drink
              </span>
              <button
                className={styles.waterControlBtn}
                onClick={() => handleUpdateWater(waterGlasses + 1)}
              >
                +
              </button>
              <span
                style={{
                  marginLeft: "auto",
                  fontWeight: 700,
                  color: "#334155",
                }}
              >
                {waterGlasses} glasses
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.mealCardsGrid}>
        {exercises.length > 0 && (
          <div
            className={styles.mealCardPremium}
            style={{
              background: "linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)",
              border: "1px solid #fecaca",
            }}
          >
            <div className={styles.mealCardHeader}>
              <div className={styles.mealCardTitleGroup}>
                <div
                  className={styles.mealIconBox}
                  style={{
                    backgroundColor: "rgba(254, 226, 226, 0.8)",
                    color: "#ef4444",
                  }}
                >
                  <span className="material-symbols-outlined">
                    local_fire_department
                  </span>
                </div>
                <h3 className={styles.mealCardTitle}>Workout</h3>
              </div>
              <div className={styles.mealCardCal} style={{ color: "#ef4444" }}>
                {totalBurned} kcal
              </div>
            </div>
            <div className={styles.mealItemList}>
              {exercises.map((ex) => (
                <div
                  key={ex.id}
                  className={styles.mealItem}
                  style={{ alignItems: "center", marginBottom: "12px" }}
                >
                  <span
                    style={{
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {ex.activity_name}
                  </span>
                  <span
                    style={{
                      fontWeight: 600,
                      color: "#ef4444",
                      marginRight: "12px",
                    }}
                  >
                    {ex.calories_burned} kcal
                  </span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: "18px",
                        cursor: "pointer",
                        color: "#94a3b8",
                      }}
                      onClick={() => setEditingExercise(ex)}
                    >
                      edit
                    </span>
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: "18px",
                        cursor: "pointer",
                        color: "#f87171",
                      }}
                      onClick={() => handleDeleteExercise(ex.id)}
                    >
                      delete
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {groupsToRender.map((cat: string) => {
          const mealsInCat = groupedMeals[cat];
          if (!mealsInCat || mealsInCat.length === 0) return null;
          const catCals = mealsInCat.reduce((s, m) => s + (m.calories || 0), 0);
          return (
            <div
              key={cat}
              className={`${styles.mealCardPremium} ${getThemeClass(cat)}`}
            >
              <div className={styles.mealCardHeader}>
                <div className={styles.mealCardTitleGroup}>
                  <div className={styles.mealIconBox}>
                    <span className="material-symbols-outlined">
                      {getIconForCat(cat)}
                    </span>
                  </div>
                  <h3 className={styles.mealCardTitle}>{cat}</h3>
                </div>
                <div className={styles.mealCardCal}>{catCals} kcal</div>
              </div>
              <div className={styles.mealItemList}>
                {mealsInCat.map((meal) => (
                  <div
                    key={meal.id}
                    className={styles.mealItem}
                    style={{ alignItems: "center", marginBottom: "12px" }}
                  >
                    <span
                      style={{
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {meal.main_dish}
                      {meal.options && meal.options.length > 0 && (
                        <span
                          style={{
                            color: "#94a3b8",
                            fontSize: "12px",
                            marginLeft: "4px",
                          }}
                        >
                          (+{meal.options.length})
                        </span>
                      )}
                    </span>
                    <span style={{ fontWeight: 600, marginRight: "12px" }}>
                      {meal.calories > 0 ? `${meal.calories} kcal` : "-"}
                    </span>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: "18px",
                          cursor: "pointer",
                          color: "#94a3b8",
                        }}
                        onClick={() => handleOpenEdit(meal)}
                      >
                        edit
                      </span>
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: "18px",
                          cursor: "pointer",
                          color: "#f87171",
                        }}
                        onClick={() => handleDelete(meal.id)}
                      >
                        delete
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {meals.length === 0 && exercises.length === 0 && (
          <div
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: "40px",
              backgroundColor: "white",
              borderRadius: "24px",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "48px", color: "#cbd5e1" }}
            >
              restaurant
            </span>
            <p style={{ color: "#64748b", fontWeight: 500 }}>
              No meals or workouts logged today.
            </p>
          </div>
        )}
      </div>

      {/* 🌟 Modal แก้ไขมื้ออาหาร (อัปเกรดให้แก้ได้ทุกอย่าง) */}
      {editingMeal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>แก้ไขมื้ออาหาร</h2>

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

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div className={styles.modalInputGroup}>
                <label>มื้ออาหาร</label>
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
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: 600,
                  fontSize: "14px",
                }}
              >
                สารอาหาร (Protein / Carbs / Fats)
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "8px",
                }}
              >
                <input
                  type="number"
                  placeholder="Pro (g)"
                  value={editingMeal.protein || ""}
                  onChange={(e) =>
                    setEditingMeal({
                      ...editingMeal,
                      protein: Number(e.target.value) || 0,
                    })
                  }
                />
                <input
                  type="number"
                  placeholder="Carb (g)"
                  value={editingMeal.carbs || ""}
                  onChange={(e) =>
                    setEditingMeal({
                      ...editingMeal,
                      carbs: Number(e.target.value) || 0,
                    })
                  }
                />
                <input
                  type="number"
                  placeholder="Fat (g)"
                  value={editingMeal.fats || ""}
                  onChange={(e) =>
                    setEditingMeal({
                      ...editingMeal,
                      fats: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>
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

      {/* Modal แก้ไขการออกกำลังกาย */}
      {editingExercise && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>แก้ไขการออกกำลังกาย</h2>
            <div className={styles.modalInputGroup}>
              <label>ชื่อกิจกรรม</label>
              <input
                type="text"
                value={editingExercise.activity_name}
                onChange={(e) =>
                  setEditingExercise({
                    ...editingExercise,
                    activity_name: e.target.value,
                  })
                }
              />
            </div>
            <div className={styles.modalInputGroup}>
              <label>แคลอรี่ที่เผาผลาญ (kcal)</label>
              <input
                type="number"
                value={editingExercise.calories_burned}
                onChange={(e) =>
                  setEditingExercise({
                    ...editingExercise,
                    calories_burned: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.btnCancel}
                onClick={() => setEditingExercise(null)}
              >
                ยกเลิก
              </button>
              <button
                className={styles.btnSave}
                onClick={handleSaveEditExercise}
              >
                บันทึกข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}

      {showMacroModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: "400px" }}>
            <h2
              className={styles.modalTitle}
              style={{ fontSize: "20px", textTransform: "capitalize" }}
            >
              {macroModalMode === "add"
                ? `เพิ่ม ${macroActiveType}`
                : `แก้ไขปริมาณ ${macroActiveType}`}
            </h2>
            <div className={styles.modalInputGroup}>
              <label>
                {macroModalMode === "add"
                  ? `ใส่จำนวน ${macroActiveType} (กรัม) ที่กินเพิ่ม:`
                  : `จำนวน ${macroActiveType} ทั้งหมดวันนี้ (กรัม):`}
              </label>
              <input
                type="number"
                value={macroInput}
                onChange={(e) => setMacroInput(e.target.value)}
                autoFocus
              />
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.btnCancel}
                onClick={() => setShowMacroModal(false)}
              >
                ยกเลิก
              </button>
              <button className={styles.btnSave} onClick={handleConfirmMacro}>
                {macroModalMode === "add" ? "เพิ่ม" : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.mascotContainer}>
        <div
          className={styles.mascotBubble}
          style={{
            borderColor: mascotMood === "warning" ? "#ef5350" : "#81c784",
          }}
        >
          {mascotMessage}
        </div>
        <div
          className={`${styles.mascotAvatar} ${isPetting ? styles.petting : ""}`}
          onClick={handlePetMascot}
          style={{
            borderColor: mascotMood === "warning" ? "#ef5350" : "#4caf50",
          }}
        >
          {mascotEmoji}
        </div>
      </div>
    </AppLayout>
  );
};

export default DailyLog;
