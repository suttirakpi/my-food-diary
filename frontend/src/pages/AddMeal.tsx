// frontend/src/pages/AddMeal.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import styles from "./AddMeal.module.css";
import AppLayout from "../components/AppLayout"; // 🌟 Import Layout เข้ามา

interface SideOption {
  id: number;
  value: string;
}

const AddMeal = () => {
  const navigate = useNavigate();

  const [mealDate, setMealDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [mealTime, setMealTime] = useState(
    new Date().toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  );

  const [mainDish, setMainDish] = useState("");
  const [category, setCategory] = useState("มื้อเช้า");
  const [itemType, setItemType] = useState("อาหาร");
  const [calories, setCalories] = useState<number | "">("");
  const [sideOptions, setSideOptions] = useState<SideOption[]>([
    { id: Date.now(), value: "" },
  ]);

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

    const payload = {
      mainDish,
      category,
      itemType,
      options: validOptions,
      calories: Number(calories) || 0,
      date: mealDate,
      time: mealTime,
    };

    try {
      const loadingToast = toast.loading("กำลังบันทึกข้อมูล...");
      await axios.post(
        "https://my-food-diary-n1tf.onrender.com/api/meals",
        payload,
      );
      toast.success("บันทึกมื้ออาหารเรียบร้อย!", { id: loadingToast });
      navigate("/");
    } catch (error) {
      console.error(error);
      toast.error("บันทึกล้มเหลว ตรวจสอบระบบ Backend");
    }
  };

  return (
    // 🌟 ครอบเนื้อหาทั้งหมดด้วย AppLayout เพื่อให้มี Sidebar แบบหน้า Dashboard
    <AppLayout>
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
                  onChange={(e) => setMealTime(e.target.value)}
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
