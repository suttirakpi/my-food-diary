import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AddMeal.module.css";

// โครงสร้างข้อมูลของ Option แต่ละอัน
interface SideOption {
  id: number;
  value: string;
}

const AddMeal: React.FC = () => {
  const navigate = useNavigate(); // ประกาศใช้งาน useNavigate แค่ครั้งเดียวตรงนี้

  // State เก็บรายการอาหารหลัก
  const [mainDish, setMainDish] = useState("");

  // State เก็บรายการ Option (เริ่มต้นให้มี 1 ช่อง)
  const [sideOptions, setSideOptions] = useState<SideOption[]>([
    { id: Date.now(), value: "" },
  ]);

  // ฟังก์ชันเพิ่มช่องกรอก Option
  const handleAddSide = () => {
    setSideOptions([...sideOptions, { id: Date.now(), value: "" }]);
  };

  // ฟังก์ชันลบช่องกรอก Option
  const handleRemoveSide = (id: number) => {
    setSideOptions(sideOptions.filter((side) => side.id !== id));
  };

  // อัปเดตข้อความเวลาพิมพ์ในช่อง Option
  const handleSideChange = (id: number, newValue: string) => {
    setSideOptions(
      sideOptions.map((side) =>
        side.id === id ? { ...side, value: newValue } : side,
      ),
    );
  };

  // ฟังก์ชันเมื่อกดปุ่ม Save
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // กรองเอาเฉพาะช่องที่พิมพ์ข้อความแล้ว (ไม่เอาช่องว่าง)
    const validOptions = sideOptions
      .map((s) => s.value)
      .filter((val) => val.trim() !== "");

    // ข้อมูลที่พร้อมส่งไป Backend
    const payload = {
      mainDish: mainDish,
      options: validOptions,
    };

    console.log("ข้อมูลที่จะส่งไป Backend:", payload);
    alert("บันทึกสำเร็จ! กำลังกลับไปหน้าแรก");

    // พอบันทึกเสร็จ ให้เด้งกลับไปหน้าแรก (/)
    navigate("/");
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1>Mindful Entry</h1>
        <p>Take a moment to reflect on your nourishment.</p>
      </div>

      <div className={styles.formCard}>
        <form onSubmit={handleSubmit}>
          {/* Main Dish */}
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

          {/* Side Options */}
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

          {/* Footer Buttons */}
          <div className={styles.formFooter}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => navigate("/")} // กดปุ่ม Cancel แล้วให้กลับไปหน้าแรก
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
