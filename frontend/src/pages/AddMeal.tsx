// frontend/src/pages/AddMeal.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import styles from "./AddMeal.module.css";
import AppLayout from "../components/AppLayout";

interface SideOption {
  id: number;
  value: string;
}

const AddMeal = () => {
  const navigate = useNavigate();

  // 🌟 State สำหรับ Loading หน้าเว็บตอนโหลดเข้า
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [mealDate, setMealDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  // 🌟 1. ดึงเวลาปัจจุบันในรูปแบบ HH:MM
  const initialTime = new Date().toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  // 🌟 2. ฟังก์ชันช่วยคำนวณมื้ออาหารอัตโนมัติตามช่วงเวลาที่ตูนตั้งเงื่อนไขไว้
  const getMealCategoryByTime = (timeStr: string): string => {
    if (!timeStr) return "มื้อเช้า";
    const hour = parseInt(timeStr.split(":")[0], 10);
    if (isNaN(hour)) return "มื้อเช้า";

    if (hour >= 12 && hour <= 15) return "มื้อกลางวัน"; // 12:00 - 15:59
    if (hour >= 16 && hour <= 23) return "มื้อเย็น"; // 16:00 - 23:59
    return "มื้อเช้า"; // 00:00 - 11:59
  };

  const [mealTime, setMealTime] = useState(initialTime);
  const [mainDish, setMainDish] = useState("");

  // 🌟 3. กำหนดค่าเริ่มต้นมื้ออาหารโดยใช้ฟังก์ชันคำนวณจากเวลาปัจจุบัน
  const [category, setCategory] = useState(getMealCategoryByTime(initialTime));
  const [itemType, setItemType] = useState("อาหาร");
  const [calories, setCalories] = useState<number | "">("");

  // State สำหรับ Macros
  const [protein, setProtein] = useState<number | "">("");
  const [carbs, setCarbs] = useState<number | "">("");
  const [fats, setFats] = useState<number | "">("");

  const [sideOptions, setSideOptions] = useState<SideOption[]>([
    { id: Date.now(), value: "" },
  ]);

  // จำลองการเช็คเซิร์ฟเวอร์ว่าตื่นหรือยัง
  useEffect(() => {
    const wakeupServer = async () => {
      try {
        await axios.get(
          "https://my-food-diary-n1tf.onrender.com/api/meals?date=" + mealDate,
        );
      } catch (error) {
        console.error("ตื่นสิเซิร์ฟเวอร์", error);
      } finally {
        setIsLoading(false);
      }
    };
    wakeupServer();
  }, [mealDate]);

  const handleAddSide = () =>
    setSideOptions([...sideOptions, { id: Date.now(), value: "" }]);
  const handleRemoveSide = (id: number) =>
    setSideOptions(sideOptions.filter((side) => side.id !== id));
  const handleSideChange = (id: number, newValue: string) => {
    setSideOptions(
      sideOptions.map((side) =>
        side.id === id ? { ...side, value: newValue } : side,
      ),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = sideOptions
      .map((s) => s.value)
      .filter((val) => val.trim() !== "");

    const addedProtein = Number(protein) || 0;
    const addedCarbs = Number(carbs) || 0;
    const addedFats = Number(fats) || 0;

    const mealPayload = {
      mainDish,
      category,
      itemType,
      options: validOptions,
      calories: Number(calories) || 0,
      protein: addedProtein,
      carbs: addedCarbs,
      fats: addedFats,
      date: mealDate,
      time: mealTime,
    };

    try {
      const loadingToast = toast.loading("กำลังบันทึกข้อมูล...");
      await axios.post(
        "https://my-food-diary-n1tf.onrender.com/api/meals",
        mealPayload,
      );

      if (addedProtein > 0 || addedCarbs > 0 || addedFats > 0) {
        const macroRes = await axios
          .get(
            `https://my-food-diary-n1tf.onrender.com/api/macros?date=${mealDate}`,
          )
          .catch(() => ({ data: { protein: 0, carbs: 0, fats: 0 } }));

        const newProtein = (macroRes.data.protein || 0) + addedProtein;
        const newCarbs = (macroRes.data.carbs || 0) + addedCarbs;
        const newFats = (macroRes.data.fats || 0) + addedFats;

        await axios.post("https://my-food-diary-n1tf.onrender.com/api/macros", {
          date: mealDate,
          protein: newProtein,
          carbs: newCarbs,
          fats: newFats,
        });
      }

      toast.success("บันทึกมื้ออาหารและสารอาหารเรียบร้อย!", {
        id: loadingToast,
      });
      navigate("/");
    } catch (error) {
      console.error(error);
      toast.error("บันทึกล้มเหลว ตรวจสอบระบบ Backend");
    }
  };

  return (
    <AppLayout>
      {isLoading && (
        <div className="loadingOverlay">
          <div className="loadingCard">
            <div className="loadingMascot">🐹💨</div>
            <h2
              style={{ fontFamily: "var(--font-heading)", margin: "0 0 8px 0" }}
            >
              กำลังปลุกเซิร์ฟเวอร์...
            </h2>
            <p
              style={{
                color: "#64748b",
                margin: 0,
                fontSize: "14px",
                lineHeight: "1.6",
              }}
            >
              รอแป๊บนะฮะ ไวท์มอลกำลังเตรียมกระทะให้อยู่!
              <br />
              (อาจใช้เวลา 30-50 วินาทีหากเซิร์ฟเวอร์หลับ)
            </p>
            <div className="loadingBarContainer">
              <div className="loadingBar"></div>
            </div>
          </div>
        </div>
      )}

      <div className={styles.contentWrapper}>
        <div className={styles.header}>
          <h1>Log Your Meal</h1>
          <p>Take a moment to reflect on your nourishment 🥗</p>
        </div>

        <div className={styles.formCard}>
          <form onSubmit={handleSubmit}>
            {/* Row 1: Date & Time */}
            <div className={styles.formGrid}>
              <div>
                <label className={styles.formLabel}>Date (วันที่)</label>
                <input
                  type="date"
                  value={mealDate}
                  onChange={(e) => setMealDate(e.target.value)}
                  className={styles.formInput}
                  required
                />
              </div>
              <div>
                <label className={styles.formLabel}>Time (เวลา)</label>
                <input
                  type="time"
                  value={mealTime}
                  // 🌟 เมื่อเวลามีการเปลี่ยนแปลง ให้ระบบคำนวณสลับมื้อ (Category) ให้เองอัตโนมัติด้วยเลยครับ
                  onChange={(e) => {
                    const newTime = e.target.value;
                    setMealTime(newTime);
                    setCategory(getMealCategoryByTime(newTime));
                  }}
                  className={styles.formInput}
                  required
                />
              </div>
            </div>

            {/* Row 2: Category & Type */}
            <div className={styles.formGrid}>
              <div>
                <label className={styles.formLabel}>
                  Meal Time (มื้ออาหาร)
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={styles.formSelect}
                >
                  <option value="มื้อเช้า">มื้อเช้า</option>
                  <option value="มื้อกลางวัน">มื้อกลางวัน</option>
                  <option value="มื้อเย็น">มื้อเย็น</option>
                  <option value="ระหว่างวัน">ระหว่างวัน</option>
                </select>
              </div>
              <div>
                <label className={styles.formLabel}>Item Type (ประเภท)</label>
                <select
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value)}
                  className={styles.formSelect}
                >
                  <option value="อาหาร">อาหาร</option>
                  <option value="เครื่องดื่ม">เครื่องดื่ม</option>
                  <option value="ขนม">ขนม</option>
                </select>
              </div>
            </div>

            {/* Row 3: Dish Name & Calories */}
            <div className={styles.dishGrid}>
              <div>
                <label className={styles.formLabel}>
                  Main Dish / Drink Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., ข้าวกะเพราไก่ไข่ดาว"
                  value={mainDish}
                  onChange={(e) => setMainDish(e.target.value)}
                  className={styles.formInput}
                  required
                />
              </div>
              <div>
                <label className={styles.formLabel}>Calories (kcal)</label>
                <input
                  type="number"
                  placeholder="e.g., 450"
                  value={calories}
                  onChange={(e) =>
                    setCalories(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  className={styles.formInput}
                />
              </div>
            </div>

            {/* Row 4: Macros */}
            <div className={styles.macroGrid}>
              <div>
                <label className={styles.formLabel}>Protein (g)</label>
                <input
                  type="number"
                  placeholder="e.g., 30"
                  value={protein}
                  onChange={(e) =>
                    setProtein(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  className={styles.formInput}
                />
              </div>
              <div>
                <label className={styles.formLabel}>Carbs (g)</label>
                <input
                  type="number"
                  placeholder="e.g., 50"
                  value={carbs}
                  onChange={(e) =>
                    setCarbs(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  className={styles.formInput}
                />
              </div>
              <div>
                <label className={styles.formLabel}>Fats (g)</label>
                <input
                  type="number"
                  placeholder="e.g., 15"
                  value={fats}
                  onChange={(e) =>
                    setFats(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className={styles.formInput}
                />
              </div>
            </div>

            {/* Options & Toppings */}
            <div className={styles.optionsSection}>
              <div className={styles.optionsHeader}>
                <label className={styles.formLabel} style={{ marginBottom: 0 }}>
                  Side Options / Toppings
                </label>
                <button
                  type="button"
                  onClick={handleAddSide}
                  className={styles.addSideBtn}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "18px" }}
                  >
                    add
                  </span>{" "}
                  Add Item
                </button>
              </div>

              <div className={styles.optionsList}>
                {sideOptions.map((option) => (
                  <div key={option.id} className={styles.optionRow}>
                    <input
                      type="text"
                      placeholder="e.g., ไข่ดาว, หวานน้อย, เพิ่มช็อต"
                      value={option.value}
                      onChange={(e) =>
                        handleSideChange(option.id, e.target.value)
                      }
                      className={styles.formInput}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSide(option.id)}
                      className={styles.deleteBtn}
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit & Cancel Buttons */}
            <div className={styles.formFooter}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => navigate("/")}
              >
                Cancel
              </button>
              <button type="submit" className={styles.saveBtn}>
                <span className="material-symbols-outlined">done</span> Save
                Meal
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
};

export default AddMeal;
