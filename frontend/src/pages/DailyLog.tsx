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
  options: MealOption[];
}
interface ExerciseEntry {
  id: number;
  activity_name: string;
  calories_burned: number;
}

const DailyLog: React.FC = () => {
  const navigate = useNavigate();
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [waterGlasses, setWaterGlasses] = useState<number>(0);
  const [proteinGrams, setProteinGrams] = useState<number>(0);

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );

  const [editingMeal, setEditingMeal] = useState<MealEntry | null>(null);
  const [exercises, setExercises] = useState<ExerciseEntry[]>([]);

  // States สำหรับเพิ่ม / แก้ไข ฟอร์มออกกำลังกาย
  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [exName, setExName] = useState("");
  const [exCal, setExCal] = useState<number | "">("");
  const [editingExercise, setEditingExercise] = useState<ExerciseEntry | null>(
    null,
  );

  const [isPetting, setIsPetting] = useState(false);
  const handlePetMascot = () => {
    setIsPetting(true);
    setTimeout(() => setIsPetting(false), 3000);
  };

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [mealsRes, waterRes, exRes, proteinRes] = await Promise.all([
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
            `https://my-food-diary-n1tf.onrender.com/api/protein?date=${selectedDate}`,
          )
          .catch(() => ({ data: { grams: 0 } })),
      ]);
      setMeals(mealsRes.data);
      setWaterGlasses(waterRes.data.glasses);
      setExercises(exRes.data);
      setProteinGrams(proteinRes.data.grams || 0);
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
    } catch (error) {
      console.error("อัปเดตน้ำไม่สำเร็จ", error);
    }
  };

  const handleAddProtein = async () => {
    const amount = Number(
      window.prompt("ใส่จำนวนโปรตีน (กรัม) ที่กินเพิ่ม:", "10"),
    );
    if (!amount || amount <= 0) return;
    const newTotal = proteinGrams + amount;
    setProteinGrams(newTotal);
    try {
      await axios.post("https://my-food-diary-n1tf.onrender.com/api/protein", {
        date: selectedDate,
        grams: newTotal,
      });
      toast.success(`เพิ่มโปรตีน ${amount}g เรียบร้อย!`);
    } catch (error) {
      toast.error("บันทึกข้อมูลไม่สำเร็จ");
    }
  };

  // ----------------------------------------
  // 🏋️‍♂️ การจัดการ ออกกำลังกาย (Exercises)
  // ----------------------------------------
  const handleAddExercise = async () => {
    if (!exName.trim() || !exCal) {
      toast.error("กรุณากรอกชื่อกิจกรรมและจำนวนแคลอรี่");
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
      setShowExerciseForm(false);
      fetchData();
      toast.success("บันทึกการออกกำลังกายสำเร็จ!");
    } catch (error) {
      toast.error("บันทึกข้อมูลไม่สำเร็จ");
    }
  };

  const handleDeleteExercise = async (id: number) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบการออกกำลังกายนี้?"))
      return;
    try {
      await axios.delete(
        `https://my-food-diary-n1tf.onrender.com/api/exercises/${id}`,
      );
      setExercises((prev) => prev.filter((ex) => ex.id !== id));
      toast.success("ลบรายการเรียบร้อย");
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการลบข้อมูล");
    }
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
      toast.success("อัปเดตข้อมูลสำเร็จ!");
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการแก้ไขข้อมูล");
    }
  };

  // ----------------------------------------
  // 🥗 การจัดการ อาหาร (Meals)
  // ----------------------------------------
  const handleDelete = async (id: number) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรายการอาหารนี้?")) return;
    try {
      await axios.delete(
        `https://my-food-diary-n1tf.onrender.com/api/meals/${id}`,
      );
      setMeals((prev) => prev.filter((meal) => meal.id !== id));
      toast.success("ลบรายการเรียบร้อย");
    } catch (error) {
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
      toast.error("เกิดข้อผิดพลาดในการแก้ไขข้อมูล");
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

  const DAILY_CALORIE_GOAL = 1400;
  const PROTEIN_GOAL = 140;

  const isOverGoal = netCalories > DAILY_CALORIE_GOAL;
  const percentage = Math.min(
    Math.max((netCalories / DAILY_CALORIE_GOAL) * 100, 0),
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
    mascotMessage = "แงะ! แคลอรี่ทะลุแล้วฮะ! 🍔";
    mascotEmoji = "🐹💦";
  } else if (waterGlasses >= 8) {
    mascotMood = "happy";
    mascotMessage = "ดื่มน้ำครบแล้ว ตูนเก่งที่สุดเลยฮะ! 💧";
    mascotEmoji = "🐹✨";
  }

  return (
    <AppLayout>
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingCard}>
            <div className={styles.loadingMascot}>🐹💨</div>
            <h2 style={{ fontFamily: "var(--font-heading)" }}>
              กำลังดึงข้อมูล...
            </h2>
          </div>
        </div>
      )}

      {/* 📅 Date Picker */}
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

      {/* 📊 Top Stat Cards */}
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

      {/* 🎯 Center Progress Card */}
      <div className={styles.centerCard}>
        <div className={styles.ringContainer} style={ringStyle}>
          <div className={styles.ringInner}>
            <div className={styles.ringLabel}>Net Calories:</div>
            <div
              className={styles.ringValue}
              style={{ color: isOverGoal ? "#ef4444" : "#0f172a" }}
            >
              {netCalories}
            </div>
            <div className={styles.ringGoal}>/ {DAILY_CALORIE_GOAL} kcal</div>
          </div>
        </div>

        <div className={styles.macrosRow}>
          <div className={styles.macroItem}>
            <div className={styles.macroHeader}>
              <span
                style={{
                  color: "#34d399",
                  display: "flex",
                  gap: "8px",
                  alignItems: "center",
                }}
              >
                Protein
                <span
                  style={{
                    color: "#10b981",
                    cursor: "pointer",
                    textDecoration: "underline",
                    fontSize: "13px",
                  }}
                  onClick={handleAddProtein}
                >
                  +Add
                </span>
              </span>
              <span>
                {proteinGrams}g{" "}
                <span style={{ color: "#94a3b8" }}>/ {PROTEIN_GOAL}g</span>
              </span>
            </div>
            <div className={styles.macroBarBg}>
              <div
                className={`${styles.macroBarFill} ${styles.fillGreen}`}
                style={{
                  width: `${Math.min((proteinGrams / PROTEIN_GOAL) * 100, 100)}%`,
                }}
              ></div>
            </div>
          </div>
          <div className={styles.macroItem}>
            <div className={styles.macroHeader}>
              <span style={{ color: "#fb923c" }}>Snacks/Sweets</span>
              <span>
                {meals.filter((m) => m.item_type === "ขนม").length} items
              </span>
            </div>
            <div className={styles.macroBarBg}>
              <div
                className={`${styles.macroBarFill} ${styles.fillOrange}`}
                style={{
                  width: `${Math.min((meals.filter((m) => m.item_type === "ขนม").length / 3) * 100, 100)}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* 🌟 Actions Row */}
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
                boxShadow: "0 4px 12px rgba(15, 23, 42, 0.15)",
                transition: "background-color 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = "#1e293b")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "#0f172a")
              }
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "20px" }}
              >
                add_circle
              </span>{" "}
              Add New Meal
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

      {/* 🥗 Meal & Exercise Cards Grid */}
      <div className={styles.mealCardsGrid}>
        {/* 🌟 1. กล่องแสดงรายการ ออกกำลังกาย (Workout) */}
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
                  {/* ไอคอน Edit/Delete จิ๋ว */}
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

        {/* 🌟 2. กล่องแสดงรายการ อาหาร (Meals) */}
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
                    {/* ไอคอน Edit/Delete จิ๋ว */}
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

      {/* 🛠 Modal แก้ไขอาหาร */}
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

      {/* 🛠 Modal แก้ไขการออกกำลังกาย */}
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

      {/* 🐹 Mascot น้องไวท์มอล */}
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
