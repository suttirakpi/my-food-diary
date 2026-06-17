import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import styles from "./Settings.module.css";
import AppLayout from "../components/AppLayout";

const Settings: React.FC = () => {
  const [calGoal, setCalGoal] = useState<number | "">("");
  const [proteinGoal, setProteinGoal] = useState<number | "">("");
  const [waterGoal, setWaterGoal] = useState<number | "">("");
  const [currentWeight, setCurrentWeight] = useState<number | "">("");
  const [targetWeight, setTargetWeight] = useState<number | "">("");

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // ดึงข้อมูลการตั้งค่าตอนเข้าเว็บ
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(
          "https://my-food-diary-n1tf.onrender.com/api/settings",
        );
        if (res.data) {
          setCalGoal(res.data.cal_goal || 1400);
          setProteinGoal(res.data.protein_goal || 140);
          setWaterGoal(res.data.water_goal || 8);
          setCurrentWeight(res.data.current_weight || "");
          setTargetWeight(res.data.target_weight || "");
        }
      } catch (error) {
        console.error("ดึงข้อมูลการตั้งค่าล้มเหลว", error);
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
        water_goal: Number(waterGoal) || 8,
        current_weight: Number(currentWeight) || 0,
        target_weight: Number(targetWeight) || 0,
      });
      toast.success("บันทึกการตั้งค่าเรียบร้อย!", { id: loadingToast });
    } catch (error) {
      console.error(error);
      toast.error("บันทึกข้อมูลไม่สำเร็จ");
    }
  };

  return (
    <AppLayout>
      {isLoading && (
        <div className="loadingOverlay">
          <div className="loadingCard">
            <div className="loadingMascot">🐹💨</div>
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                margin: "0 0 8px 0",
                color: "#0f172a",
              }}
            >
              กำลังโหลดการตั้งค่า...
            </h2>
            <p
              style={{
                color: "#64748b",
                margin: 0,
                fontSize: "14px",
                lineHeight: "1.6",
              }}
            >
              รอแป๊บนะฮะ ไวท์มอลกำลังค้นแฟ้มประวัติอยู่!
            </p>
            <div className="loadingBarContainer">
              <div className="loadingBar"></div>
            </div>
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
              เป้าหมายโภชนาการรายวัน
            </h3>
            <div className={styles.formGrid}>
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
                  placeholder="เช่น 1400"
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.formLabel}>
                  เป้าหมายโปรตีน (กรัม)
                </label>
                <input
                  type="number"
                  className={styles.formInput}
                  value={proteinGoal}
                  onChange={(e) =>
                    setProteinGoal(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  placeholder="เช่น 140"
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.formLabel}>
                  เป้าหมายการดื่มน้ำ (แก้ว)
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
                  placeholder="เช่น 8"
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
              เป้าหมายน้ำหนัก
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
                  placeholder="เช่น 65.5"
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
                  placeholder="เช่น 60.0"
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
