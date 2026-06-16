// frontend/src/pages/WorkoutPlan.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import styles from "./WorkoutPlan.module.css";
import AppLayout from "../components/AppLayout"; // 🌟 Import Layout

interface TaskItem {
  text: string;
  done: boolean;
}

interface WorkoutDay {
  title: string;
  target: string;
  tasks: TaskItem[];
}

const WorkoutPlan: React.FC = () => {
  const [activeDay, setActiveDay] = useState<number>(new Date().getDay());
  const [workoutPlans, setWorkoutPlans] = useState<Record<number, WorkoutDay>>(
    {},
  );
  const [newTaskText, setNewTaskText] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // โหลดข้อมูลจาก Database ทันทีที่เข้าหน้าเว็บ
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await axios.get(
          "https://my-food-diary-n1tf.onrender.com/api/workout-plans",
        );

        // สร้างโครงร่างเปล่าๆ
        const loadedPlans: Record<number, WorkoutDay> = {};
        for (let i = 0; i <= 6; i++) {
          loadedPlans[i] = {
            title: "",
            target: "",
            tasks: [],
          };
        }

        // เอาข้อมูลจาก DB มาใส่
        if (res.data && res.data.length > 0) {
          res.data.forEach((row: any) => {
            const parsed =
              typeof row.plan_data === "string"
                ? JSON.parse(row.plan_data)
                : row.plan_data;
            loadedPlans[row.day_index] = parsed;
          });
        }

        setWorkoutPlans(loadedPlans);
      } catch (error) {
        console.error("ดึงข้อมูลตารางออกกำลังกายไม่สำเร็จ", error);
        toast.error("ดึงข้อมูลไม่สำเร็จ");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlans();
  }, []);

  // ฟังก์ชันเซฟลง Database
  const savePlanToDB = async (dayIdx: number, planData: WorkoutDay) => {
    try {
      await axios.post(
        "https://my-food-diary-n1tf.onrender.com/api/workout-plans",
        {
          dayIndex: dayIdx,
          planData: planData,
        },
      );
    } catch (error) {
      toast.error("บันทึกข้อมูลไม่สำเร็จ");
    }
  };

  const handleToggleTask = (taskIndex: number) => {
    const updated = { ...workoutPlans };
    updated[activeDay].tasks[taskIndex].done =
      !updated[activeDay].tasks[taskIndex].done;
    setWorkoutPlans(updated);
    savePlanToDB(activeDay, updated[activeDay]);
  };

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    const updated = { ...workoutPlans };
    updated[activeDay].tasks.push({ text: newTaskText.trim(), done: false });
    setWorkoutPlans(updated);
    setNewTaskText("");
    savePlanToDB(activeDay, updated[activeDay]);
    toast.success("เพิ่มท่าออกกำลังกายเรียบร้อย!");
  };

  const handleDeleteTask = (indexToRemove: number) => {
    if (!window.confirm("ต้องการลบกิจกรรมนี้ใช่ไหม?")) return;
    const updated = { ...workoutPlans };
    updated[activeDay].tasks = updated[activeDay].tasks.filter(
      (_, idx) => idx !== indexToRemove,
    );
    setWorkoutPlans(updated);
    savePlanToDB(activeDay, updated[activeDay]);
    toast.success("ลบรายการเรียบร้อย");
  };

  const handleUpdateTarget = (newTarget: string) => {
    const updated = { ...workoutPlans };
    updated[activeDay].target = newTarget;
    setWorkoutPlans(updated);
  };

  const handleUpdateTitle = (newTitle: string) => {
    const updated = { ...workoutPlans };
    updated[activeDay].title = newTitle;
    setWorkoutPlans(updated);
  };

  const handleBlurInfo = () => {
    savePlanToDB(activeDay, workoutPlans[activeDay]);
    toast.success("บันทึกข้อมูลตารางแล้ว");
  };

  const dayNames: Record<number, string> = {
    1: "จันทร์",
    2: "อังคาร",
    3: "พุธ",
    4: "พฤหัสบดี",
    5: "ศุกร์",
    6: "เสาร์",
    0: "อาทิตย์",
  };
  const daysOrder = [1, 2, 3, 4, 5, 6, 0];

  return (
    <AppLayout>
      {/* 🌟 หน้าจอ Loading ระหว่างรอเซิร์ฟเวอร์ดึงข้อมูล */}
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
              กำลังโหลดตาราง...
            </h2>
            <p
              style={{
                color: "#64748b",
                margin: 0,
                fontSize: "14px",
                lineHeight: "1.6",
              }}
            >
              รอแป๊บนะฮะ ไวท์มอลกำลังเตรียมดัมเบลให้อยู่!
            </p>
            <div className="loadingBarContainer">
              <div className="loadingBar"></div>
            </div>
          </div>
        </div>
      )}

      {/* เนื้อหาหน้าเว็บ */}
      {!isLoading && Object.keys(workoutPlans).length > 0 && (
        <div className={styles.contentWrapper}>
          <div className={styles.pageHeader}>
            <h1>Workout Planner</h1>
            <p>Design and track your weekly fitness routine 🏋️‍♂️</p>
          </div>

          <div className={styles.layoutGrid}>
            {/* 📅 Sidebar สำหรับเลือกวัน (ภายในหน้า) */}
            <div className={styles.daysSidebar}>
              {daysOrder.map((dayNum: number) => (
                <button
                  key={dayNum}
                  className={`${styles.dayTab} ${activeDay === dayNum ? styles.activeTab : ""}`}
                  onClick={() => setActiveDay(dayNum)}
                >
                  วัน{dayNames[dayNum]}
                </button>
              ))}
            </div>

            {/* 🏋️‍♂️ การ์ดเนื้อหาการฝึก */}
            <div className={styles.workoutCard}>
              <div className={styles.inputGroup}>
                <label className={styles.formLabel}>
                  ชื่อธีมการฝึกประจำวัน
                </label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={workoutPlans[activeDay].title}
                  onChange={(e) => handleUpdateTitle(e.target.value)}
                  onBlur={handleBlurInfo}
                  placeholder="เช่น วันวิ่งระเบิดไขมัน หรือ Leg Day..."
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.formLabel}>เป้าหมายการฝึก</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={workoutPlans[activeDay].target}
                  onChange={(e) => handleUpdateTarget(e.target.value)}
                  onBlur={handleBlurInfo}
                  placeholder="เช่น เน้น Cardio สร้าง Afterburn..."
                />
              </div>

              <div className={styles.taskListContainer}>
                <h4>รายการกิจกรรมและท่าที่ต้องทำ</h4>
                {workoutPlans[activeDay].tasks.length === 0 ? (
                  <p className={styles.emptyText}>
                    วันนี้ยังไม่มีรายการกิจกรรม
                    พิมพ์เพิ่มที่ช่องด้านล่างได้เลยฮะ!
                  </p>
                ) : (
                  <div className={styles.taskList}>
                    {workoutPlans[activeDay].tasks.map(
                      (task: TaskItem, index: number) => (
                        <div
                          key={index}
                          className={`${styles.taskItem} ${task.done ? styles.taskItemCompleted : ""}`}
                        >
                          <input
                            type="checkbox"
                            className={styles.checkbox}
                            checked={task.done}
                            onChange={() => handleToggleTask(index)}
                          />
                          <span
                            className={
                              task.done
                                ? styles.taskTextCompleted
                                : styles.taskText
                            }
                          >
                            {task.text}
                          </span>
                          <button
                            className={styles.deleteBtn}
                            onClick={() => handleDeleteTask(index)}
                          >
                            <span
                              className="material-symbols-outlined"
                              style={{ fontSize: "18px" }}
                            >
                              delete
                            </span>
                          </button>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>

              <div className={styles.addTaskForm}>
                <input
                  type="text"
                  className={styles.formInput}
                  style={{ flex: 1 }}
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                  placeholder="พิมพ์ท่าออกกำลังกายใหม่ เช่น วิดพื้น 20 ที..."
                />
                <button onClick={handleAddTask} className={styles.addBtnSubmit}>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "20px" }}
                  >
                    add_task
                  </span>
                  เพิ่มรายการ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default WorkoutPlan;
