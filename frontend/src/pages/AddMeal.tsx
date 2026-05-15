import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./AddMeal.module.css";

interface SideOption {
  id: number;
  value: string;
}

const AddMeal: React.FC = () => {
  const navigate = useNavigate();
  const [mainDish, setMainDish] = useState("");
  const [category, setCategory] = useState("มื้อเช้า");
  const [itemType, setItemType] = useState("อาหาร");
  const [sideOptions, setSideOptions] = useState<SideOption[]>([
    { id: Date.now(), value: "" },
  ]);

  const handleAddSide = () => {
    setSideOptions([...sideOptions, { id: Date.now(), value: "" }]);
  };

  const handleRemoveSide = (id: number) => {
    setSideOptions(sideOptions.filter((side) => side.id !== id));
  };

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
      .map((s: SideOption) => s.value)
      .filter((val: string) => val.trim() !== "");

    const payload = {
      mainDish: mainDish,
      options: validOptions,
      category: category,
      itemType: itemType,
    };

    try {
      await axios.post("http://localhost:3000/api/meals", payload);
      alert("บันทึกมื้ออาหารลง Database เรียบร้อย!");
      navigate("/");
    } catch (error) {
      console.error(error);
      alert("บันทึกล้มเหลว ตรวจสอบว่าเปิด Backend หรือยัง?");
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
            {/* เลือกมื้ออาหาร (เวลา) */}
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
                  backgroundColor: "var(--background)",
                  fontFamily: "var(--font-body)",
                  outline: "none",
                }}
              >
                <option value="มื้อเช้า">มื้อเช้า (Breakfast)</option>
                <option value="มื้อกลางวัน">มื้อกลางวัน (Lunch)</option>
                <option value="มื้อเย็น">มื้อเย็น (Dinner)</option>
                <option value="ระหว่างวัน">ระหว่างวัน (Snack)</option>
              </select>
            </div>

            {/* เลือกประเภท (ของกิน) */}
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
                  backgroundColor: "var(--background)",
                  fontFamily: "var(--font-body)",
                  outline: "none",
                }}
              >
                <option value="อาหาร">อาหาร (Food)</option>
                <option value="เครื่องดื่ม">เครื่องดื่ม (Beverage)</option>
                <option value="ขนม">ขนม/ของหวาน (Snack)</option>
              </select>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>MAIN DISH / DRINK NAME</label>
            <input
              type="text"
              placeholder="e.g., ชาเขียวเย็น, ข้าวกะเพรา..."
              value={mainDish}
              onChange={(e) => setMainDish(e.target.value)}
              required
            />
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
                    placeholder="e.g., ไข่ดาว, หวานน้อย, เพิ่มวิปครีม"
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
