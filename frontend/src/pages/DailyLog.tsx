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
  calories: number; // เพิ่มแคลอรี่เข้ามาใน Interface
  options: MealOption[];
}

const DailyLog: React.FC = () => {
  const navigate = useNavigate();
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [waterGlasses, setWaterGlasses] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [editingMeal, setEditingMeal] = useState<MealEntry | null>(null);

  const fetchData = async () => {
    try {
      const mealsRes = await axios.get(
        `http://localhost:3000/api/meals?date=${selectedDate}`,
      );
      setMeals(mealsRes.data);
      const waterRes = await axios.get(
        `http://localhost:3000/api/water?date=${selectedDate}`,
      );
      setWaterGlasses(waterRes.data.glasses);
    } catch (error) {
      console.error("ดึงข้อมูลไม่สำเร็จ:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const handleUpdateWater = async (newAmount: number) => {
    if (newAmount < 0) return;
    setWaterGlasses(newAmount);
    try {
      await axios.post("http://localhost:3000/api/water", {
        date: selectedDate,
        glasses: newAmount,
      });
    } catch (error) {
      console.error("อัปเดตน้ำไม่สำเร็จ", error);
    }
  };

  const handleDelete = async (id: number) => {
    const isConfirm = window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?");
    if (!isConfirm) return;
    try {
      await axios.delete(`http://localhost:3000/api/meals/${id}`);
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
        `http://localhost:3000/api/meals/${editingMeal.id}`,
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

  const formattedDate = new Date(selectedDate).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const groupedMeals = meals.reduce(
    (acc, meal) => {
      const cat = meal.category || "อื่นๆ";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(meal);
      return acc;
    },
    {} as Record<string, MealEntry[]>,
  );

  const categoryOrder = ["มื้อเช้า", "มื้อกลางวัน", "มื้อเย็น", "ระหว่างวัน"];
  const getCategoryTheme = (cat: string) => {
    if (cat === "มื้อเช้า") return styles.themeOrange;
    if (cat === "มื้อกลางวัน") return styles.themeRed;
    if (cat === "มื้อเย็น") return styles.themeYellow;
    return styles.themeBlue;
  };

  // --- คำนวณสถิติของวันนี้ ---
  const totalCalories = meals.reduce(
    (sum, meal) => sum + (meal.calories || 0),
    0,
  );
  const foodCount = meals.filter((m) => m.item_type === "อาหาร").length;
  const snackCount = meals.filter((m) => m.item_type === "ขนม").length;

  // --- Logic สำหรับหลอดพลัง (Daily Goal) ---
  const DAILY_CALORIE_GOAL = 1600; // ตั้งเป้าไว้ที่ 2000 kcal
  const isOverGoal = totalCalories > DAILY_CALORIE_GOAL;
  // คำนวณ % (ห้ามเกิน 100% เพื่อไม่ให้หลอดทะลุขอบ)
  const calPercentage = Math.min(
    (totalCalories / DAILY_CALORIE_GOAL) * 100,
    100,
  );

  // กำหนดสีของหลอดพลังตามปริมาณการกิน
  let barColor = "#4caf50"; // สีเขียว (ปลอดภัย)
  let messageColor = "var(--on-surface-variant)";
  let motivationMessage = "เริ่มต้นวันใหม่! ทานอาหารที่มีประโยชน์นะ";

  if (totalCalories > 0 && totalCalories <= DAILY_CALORIE_GOAL * 0.8) {
    motivationMessage = "เยี่ยมมาก! ยังทานได้อีกเรื่อยๆ ตามเป้าหมาย";
  } else if (
    totalCalories > DAILY_CALORIE_GOAL * 0.8 &&
    totalCalories <= DAILY_CALORIE_GOAL
  ) {
    barColor = "#ff9800"; // สีส้ม (เตือนว่าใกล้เต็มแล้ว)
    messageColor = "#f57c00";
    motivationMessage = "ใกล้ถึงเป้าหมายแล้ว ระวังแคลอรี่เกินนะ!";
  } else if (isOverGoal) {
    barColor = "#f44336"; // สีแดง (ทะลุเป้า)
    messageColor = "#d32f2f";
    motivationMessage = "แคลอรี่เกินเป้าหมายแล้ว!";
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
        <div className={styles.sectionHeader}>
          <h2>รายการอาหาร ({formattedDate})</h2>
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

        {/* --- Top Dashboard --- */}
        <div className={styles.topSummary}>
          <div className={styles.summaryCard}>
            <span className={styles.summaryValue}>{totalCalories}</span>
            <span className={styles.summaryLabel}>แคลอรี่รวม (kcal)</span>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryValue}>{waterGlasses * 22} oz</span>
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

        <div className={styles.goalContainer}>
          <div className={styles.goalHeader}>
            <div className={styles.goalTitle}>
              <span
                className="material-symbols-outlined"
                style={{ color: barColor }}
              >
                speed
              </span>
              เป้าหมายแคลอรี่รายวัน
            </div>
            <div className={styles.goalText}>
              {/* ถ้าแคลอรี่เกิน (isOverGoal เป็นจริง) ให้ใช้สีแดง ถ้าไม่เกินให้ใช้สีน้ำเงินเดิม */}
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
              style={{ width: `${calPercentage}%`, backgroundColor: barColor }}
            ></div>
          </div>
          <div className={styles.goalMessage} style={{ color: messageColor }}>
            {motivationMessage}
          </div>
        </div>

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

        {meals.length > 0 ? (
          categoryOrder.map((cat) => {
            const mealsInCat = groupedMeals[cat];
            if (!mealsInCat || mealsInCat.length === 0) return null;

            return (
              <section
                key={cat}
                className={`${styles.categorySection} ${getCategoryTheme(cat)}`}
              >
                <h3 className={styles.categoryTitle}>{cat}</h3>
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
                            เวลา • {meal.meal_time}
                          </span>
                          <h3 className={styles.dishTitle}>
                            {meal.main_dish}
                            <span
                              style={{
                                fontSize: "14px",
                                fontWeight: "normal",
                                color: "var(--on-surface-variant)",
                                marginLeft: "8px",
                              }}
                            >
                              ({meal.item_type})
                            </span>
                            {/* โชว์แคลอรี่ตรงหัวการ์ด */}
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
                          <p className={styles.detailLabel}>Main Item</p>
                          <p>{meal.main_dish}</p>
                        </div>
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
              restaurant
            </span>
            <p
              style={{ marginTop: "16px", color: "var(--on-surface-variant)" }}
            >
              ยังไม่มีการบันทึกอาหารในวันที่เลือก
            </p>
          </div>
        )}
      </main>

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

            {/* เพิ่มช่องแก้แคลอรี่ใน Edit Modal */}
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
    </div>
  );
};

export default DailyLog;
