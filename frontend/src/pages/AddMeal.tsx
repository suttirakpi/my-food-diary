import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // อย่าลืมลง axios ก่อนนะ
import styles from "./AddMeal.module.css";

interface SideOption {
  id: number;
  value: string;
}

const AddMeal: React.FC = () => {
  const navigate = useNavigate();
  const [mainDish, setMainDish] = useState("");
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

    // ระบุ Type ให้ s และ val เพื่อแก้ปัญหา implicit any
    const validOptions = sideOptions
      .map((s: SideOption) => s.value)
      .filter((val: string) => val.trim() !== "");

    const payload = {
      mainDish: mainDish,
      options: validOptions,
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
          <div className={styles.inputGroup}>
            <label>MAIN DISH</label>
            <input
              type="text"
              placeholder="e.g., Grilled Chicken Rice"
              value={mainDish}
              onChange={(e) => setMainDish(e.target.value)}
              required
            />
          </div>

          <div className={styles.optionsSection}>
            <div className={styles.optionsHeader}>
              <label>SIDE OPTIONS</label>
              <button
                type="button"
                onClick={handleAddSide}
                className={styles.addSideBtn}
              >
                <span className="material-symbols-outlined">add</span> Add Side
              </button>
            </div>
            <div className={styles.optionsList}>
              {sideOptions.map((option) => (
                <div key={option.id} className={styles.optionRow}>
                  <input
                    type="text"
                    placeholder="e.g., Steamed Broccoli"
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
