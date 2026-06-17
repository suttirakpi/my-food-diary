import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import styles from "./Settings.module.css";
import AppLayout from "../components/AppLayout";

const Settings: React.FC = () => {
  const [calGoal, setCalGoal] = useState<number | "">("");
  const [proteinGoal, setProteinGoal] = useState<number | "">("");
  const [carbsGoal, setCarbsGoal] = useState<number | "">(""); // 🌟 เพิ่มคาร์บ
  const [fatsGoal, setFatsGoal] = useState<number | "">(""); // 🌟 เพิ่มไขมัน
  const [waterGoal, setWaterGoal] = useState<number | "">("");
  const [currentWeight, setCurrentWeight] = useState<number | "">("");
  const [targetWeight, setTargetWeight] = useState<number | "">("");

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(
          "https://my-food-diary-n1tf.onrender.com/api/settings",
        );
        if (res.data) {
          setCalGoal(res.data.cal_goal || 1400);
          setProteinGoal(res.data.protein_goal || 140);
          setCarbsGoal(res.data.carbs_goal || 150); // ดึงคาร์บ
          setFatsGoal(res.data.fats_goal || 50); // ดึงไขมัน
          setWaterGoal(res.data.water_goal || 8);
          setCurrentWeight(res.data.current_weight || "");
          setTargetWeight(res.data.target_weight || "");
        }
      } catch (error) {
        toast.error("ดึงข้อมูลไม่สำเร็จ");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    try {
      const loadingToast = toast.loading("กำลังบันทึกการตั้งค่า...");
      await axios.post("https://my-food-diary-n1tf.onrender.com/api/settings", {
        cal_goal: Number(calGoal) || 1400,
        protein_goal: Number(proteinGoal) || 140,
        carbs_goal: Number(carbsGoal) || 150, // เซฟคาร์บ
        fats_goal: Number(fatsGoal) || 50, // เซฟไขมัน
        water_goal: Number(waterGoal) || 8,
        current_weight: Number(currentWeight) || 0,
        target_weight: Number(targetWeight) || 0,
      });
      toast.success("บันทึกการตั้งค่าเรียบร้อย!", { id: loadingToast });
    } catch (error) {
      toast.error("บันทึกข้อมูลไม่สำเร็จ");
    }
  };

  return (
    <AppLayout>
      {isLoading && (
        <div className="loadingOverlay">
          <div className="loadingCard">
            <div className="loadingMascot">🐹💨</div>
            <h2 style={{ fontFamily: "var(--font-heading)" }}>
              กำลังโหลดการตั้งค่า...
            </h2>
          </div>
        </div>
      )}

      {!isLoading && (
        <div className={styles.contentWrapper}>
          <div className={styles.pageHeader}>
            <h1>Personal Settings</h1>
            <p>Customize your daily nutrition and fitness goals 🎯</p>
          </div>

          <div className={styles.settingsCard}>
            <h3 className={styles.sectionTitle}>
              <span
                className="material-symbols-outlined"
                style={{ color: "#10b981" }}
              >
                track_changes
              </span>
              เป้าหมายสารอาหาร (Macros)
            </h3>

            {/* 🌟 ปรับ Grid ให้รองรับ 4 ช่องสวยๆ */}
            <div
              className={styles.formGrid}
              style={{ gridTemplateColumns: "1fr 1fr", gap: "24px" }}
            >
              <div className={styles.inputGroup}>
                <label className={styles.formLabel}>
                  เป้าหมายแคลอรี่ (kcal)
                </label>
                <input
                  type="number"
                  className={styles.formInput}
                  value={calGoal}
                  onChange={(e) =>
                    setCalGoal(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.formLabel}>โปรตีน (Protein - g)</label>
                <input
                  type="number"
                  className={styles.formInput}
                  value={proteinGoal}
                  onChange={(e) =>
                    setProteinGoal(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.formLabel}>
                  คาร์โบไฮเดรต (Carbs - g)
                </label>
                <input
                  type="number"
                  className={styles.formInput}
                  value={carbsGoal}
                  onChange={(e) =>
                    setCarbsGoal(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.formLabel}>ไขมัน (Fats - g)</label>
                <input
                  type="number"
                  className={styles.formInput}
                  value={fatsGoal}
                  onChange={(e) =>
                    setFatsGoal(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                />
              </div>
            </div>
          </div>

          <div className={styles.settingsCard}>
            <h3 className={styles.sectionTitle}>
              <span
                className="material-symbols-outlined"
                style={{ color: "#0288d1" }}
              >
                monitor_weight
              </span>
              เป้าหมายอื่นๆ
            </h3>
            <div className={styles.formGrid}>
              <div className={styles.inputGroup}>
                <label className={styles.formLabel}>น้ำหนักปัจจุบัน (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  className={styles.formInput}
                  value={currentWeight}
                  onChange={(e) =>
                    setCurrentWeight(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.formLabel}>น้ำหนักเป้าหมาย (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  className={styles.formInput}
                  value={targetWeight}
                  onChange={(e) =>
                    setTargetWeight(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.formLabel}>
                  เป้าหมายดื่มน้ำ (แก้ว)
                </label>
                <input
                  type="number"
                  className={styles.formInput}
                  value={waterGoal}
                  onChange={(e) =>
                    setWaterGoal(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                />
              </div>
            </div>

            <button className={styles.saveBtn} onClick={handleSaveSettings}>
              <span className="material-symbols-outlined">save</span>
              บันทึกการตั้งค่า
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Settings;
