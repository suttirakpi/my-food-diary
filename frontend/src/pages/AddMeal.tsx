import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import styles from "./AddMeal.module.css";

interface SideOption {
  id: number;
  value: string;
}

const AddMeal = () => {
  const navigate = useNavigate();
  const [mainDish, setMainDish] = useState("");
  const [category, setCategory] = useState("มื้อเช้า");
  const [itemType, setItemType] = useState("อาหาร");
  const [calories, setCalories] = useState<number | "">(""); // เพิ่ม State แคลอรี่
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
      calories: Number(calories) || 0, // ส่งค่าแคลอรี่ไป Backend
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
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1>Mindful Entry</h1>
        <p>Take a moment to reflect on your nourishment.</p>
      </div>
      <div className={styles.formCard}>
        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--on-surface-variant)",
                  marginBottom: "8px",
                }}
              >
                MEAL TYPE (มื้ออาหาร)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "8px",
                  border: "1px solid var(--tertiary-fixed)",
                  fontSize: "16px",
                  outline: "none",
                }}
              >
                <option value="มื้อเช้า">มื้อเช้า</option>
                <option value="มื้อกลางวัน">มื้อกลางวัน</option>
                <option value="มื้อเย็น">มื้อเย็น</option>
                <option value="ระหว่างวัน">ระหว่างวัน</option>
              </select>
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--on-surface-variant)",
                  marginBottom: "8px",
                }}
              >
                ITEM TYPE (ประเภท)
              </label>
              <select
                value={itemType}
                onChange={(e) => setItemType(e.target.value)}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "8px",
                  border: "1px solid var(--tertiary-fixed)",
                  fontSize: "16px",
                  outline: "none",
                }}
              >
                <option value="อาหาร">อาหาร</option>
                <option value="เครื่องดื่ม">เครื่องดื่ม</option>
                <option value="ขนม">ขนม</option>
              </select>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
              <label>MAIN DISH / DRINK NAME</label>
              <input
                type="text"
                placeholder="e.g., ข้าวกะเพราไก่ไข่ดาว"
                value={mainDish}
                onChange={(e) => setMainDish(e.target.value)}
                required
              />
            </div>
            <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
              <label>CALORIES (kcal)</label>
              <input
                type="number"
                placeholder="e.g., 450"
                value={calories}
                onChange={(e) =>
                  setCalories(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
              />
            </div>
          </div>

          <div className={styles.optionsSection}>
            <div className={styles.optionsHeader}>
              <label>SIDE OPTIONS / TOPPINGS</label>
              <button
                type="button"
                onClick={handleAddSide}
                className={styles.addSideBtn}
              >
                <span className="material-symbols-outlined">add</span> Add Item
              </button>
            </div>
            <div className={styles.optionsList}>
              {sideOptions.map((option) => (
                <div key={option.id} className={styles.optionRow}>
                  <input
                    type="text"
                    placeholder="e.g., ไข่ดาว, หวานน้อย"
                    value={option.value}
                    onChange={(e) =>
                      handleSideChange(option.id, e.target.value)
                    }
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

          <div className={styles.formFooter}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => navigate("/")}
            >
              Cancel
            </button>
            <button type="submit" className={styles.saveBtn}>
              <span className="material-symbols-outlined">save</span> Save Meal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMeal;
