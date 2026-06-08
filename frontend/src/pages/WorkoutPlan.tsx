import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import styles from "./WorkoutPlan.module.css";

const DEFAULT_WORKOUT_PLANS: Record<
  number,
  { title: string; target: string; tasks: string[] }
> = {
  1: {
    title: "🔥 วันวิ่งระเบิดไขมัน (+Core)",
    target: "สร้าง Afterburn Effect เผาผลาญไขมัน 24 ชม.",
    tasks: [
      "นาทีที่ 0-3: เดินเร็วๆ ยืดเหยียดขาและข้อเท้า",
      "นาทีที่ 3-23: วิ่งสปีดเต็มที่ 30 วิ สลับเดิน 30 วิ (20 นาที)",
      "นาทีที่ 23-30: ท่า Plank 45 วิ / พัก 15 วิ (วน 7 รอบ)",
    ],
  },
  2: {
    title: "💪 วันสร้างกล้ามเนื้อ (Circuit Training)",
    target: "หัวใจเต้นแรงพร้อมได้กล้ามเนื้อ",
    tasks: [
      "นาทีที่ 0-3: วอร์มอัพ หมุนไหล่ แกว่งแขน ย่ำเท้า",
      "ท่าที่ 1: Squat 45 วิ / พัก 15 วิ",
      "ท่าที่ 2: Push-up (วิดพื้น) 45 วิ / พัก 15 วิ",
      "ท่าที่ 3: Reverse Lunge 45 วิ / พัก 15 วิ",
      "ท่าที่ 4: Mountain Climber 45 วิ / พัก 15 วิ",
      "ท่าที่ 5: Plank 45 วิ / พัก 15 วิ",
    ],
  },
  3: {
    title: "🔥 วันวิ่งระเบิดไขมัน (+ยืดเหยียด)",
    target: "สร้าง Afterburn Effect เผาผลาญไขมัน 24 ชม.",
    tasks: [
      "นาทีที่ 0-3: เดินเร็วๆ ยืดเหยียดขาและข้อเท้า",
      "นาทีที่ 3-23: วิ่งสปีดเต็มที่ 30 วิ สลับเดิน 30 วิ (20 นาที)",
      "นาทีที่ 23-30: นั่งเหยียดขาแตะปลายเท้า, ท่าโยคะเด็ก (Child's Pose)",
    ],
  },
  4: {
    title: "💪 วันสร้างกล้ามเนื้อ (Circuit Training)",
    target: "หัวใจเต้นแรงพร้อมได้กล้ามเนื้อ",
    tasks: [
      "นาทีที่ 0-3: วอร์มอัพ หมุนไหล่ แกว่งแขน ย่ำเท้า",
      "ท่าที่ 1: Squat 45 วิ / พัก 15 วิ",
      "ท่าที่ 2: Push-up (วิดพื้น) 45 วิ / พัก 15 วิ",
      "ท่าที่ 3: Reverse Lunge 45 วิ / พัก 15 วิ",
    ],
  },
  5: {
    title: "🔥 วันวิ่งระเบิดไขมัน (+Burnout)",
    target: "สร้าง Afterburn Effect เผาผลาญไขมัน 24 ชม.",
    tasks: [
      "นาทีที่ 0-3: เดินเร็วๆ ยืดเหยียดขาและข้อเท้า",
      "นาทีที่ 3-23: วิ่งสปีดเต็มที่ 30 วิ สลับเดิน 30 วิ (20 นาที)",
      "นาทีที่ 23-30: Jumping Jacks หรือ Jump Squat ต่อเนื่องจนหมดแรง!",
    ],
  },
  6: {
    title: "👑 วันท้าทายขีดจำกัด (Challenge)",
    target: "ฝึกความอึดและทำลายสถิติตัวเอง",
    tasks: [
      "เลือก 1 อย่าง: จ็อกกิ้งต่อเนื่อง (Zone 2-3) 45-60 นาที",
      "หรือ Bodyweight Challenge: วิดพื้น 100 ครั้ง + สควอท 100 ครั้ง",
    ],
  },
  0: {
    title: "💤 วันหยุดพัก (Rest Day)",
    target: "ซ่อมแซมกล้ามเนื้อ 100%",
    tasks: [
      "งดออกกำลังกายหนักทุกชนิด",
      "ขยับตัวทำงานบ้าน หรือเดินเล่นนิดหน่อย",
      "กินอาหารดีๆ ให้ร่างกายได้ฟื้นฟู",
    ],
  },
};

const WorkoutPlan: React.FC = () => {
  const navigate = useNavigate();
  const [activeDay, setActiveDay] = useState<number>(1); // เริ่มต้นที่วันจันทร์
  const [workoutPlans, setWorkoutPlans] = useState(() => {
    const saved = localStorage.getItem("customWorkoutPlans");
    return saved ? JSON.parse(saved) : DEFAULT_WORKOUT_PLANS;
  });
  const [newTaskText, setNewTaskText] = useState<string>("");

  useEffect(() => {
    localStorage.setItem("customWorkoutPlans", JSON.stringify(workoutPlans));
  }, [workoutPlans]);

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    const updated = { ...workoutPlans };
    updated[activeDay].tasks.push(newTaskText.trim());
    setWorkoutPlans(updated);
    setNewTaskText("");
    toast.success("เพิ่มท่าออกกำลังกายเรียบร้อย!");
  };

  const handleDeleteTask = (indexToRemove: number) => {
    const updated = { ...workoutPlans };
    updated[activeDay].tasks = updated[activeDay].tasks.filter(
      (_: string, idx: number) => idx !== indexToRemove,
    );
    setWorkoutPlans(updated);
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
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate("/")}>
          <span className="material-symbols-outlined">arrow_back</span>{" "}
          กลับหน้าหลัก
        </button>
        <h1 className={styles.title}>Workout Planner</h1>
        <div style={{ width: "40px" }}></div>
      </header>

      <div className={styles.layoutGrid}>
        {/* แถบเลือกวันย้ายมาด้านซ้ายเพื่อความชัดเจน */}
        <div className={styles.sidebar}>
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

        {/* ฟอร์มจัดการตารางฝั่งขวา */}
        <div className={styles.mainContent}>
          <div className={styles.inputGroup}>
            <label>ชื่อธีมการฝึกประจำวัน</label>
            <input
              type="text"
              value={workoutPlans[activeDay].title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleUpdateTitle(e.target.value)
              }
              placeholder="เช่น วันวิ่งระเบิดไขมัน"
            />
          </div>

          <div className={styles.inputGroup}>
            <label>เป้าหมายการฝึก</label>
            <input
              type="text"
              value={workoutPlans[activeDay].target}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleUpdateTarget(e.target.value)
              }
              placeholder="เช่น เน้น Cardio สร้าง Afterburn"
            />
          </div>

          <div className={styles.taskListContainer}>
            <h4>รายการกิจกรรมและท่าที่ต้องทำ</h4>
            {workoutPlans[activeDay].tasks.length === 0 ? (
              <p className={styles.emptyText}>
                วันนี้ยังไม่มีรายการกิจกรรม พิมพ์เพิ่มได้เลยฮะ!
              </p>
            ) : (
              <div className={styles.taskList}>
                {workoutPlans[activeDay].tasks.map(
                  (task: string, index: number) => (
                    <div key={index} className={styles.taskItem}>
                      <span className={styles.taskText}>{task}</span>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDeleteTask(index)}
                      >
                        <span className="material-symbols-outlined">
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
              value={newTaskText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewTaskText(e.target.value)
              }
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                e.key === "Enter" && handleAddTask()
              }
              placeholder="พิมพ์ท่าออกกำลังกายใหม่ เช่น วิดพื้น 20 ที..."
            />
            <button onClick={handleAddTask} className={styles.addBtnSubmit}>
              เพิ่มรายการ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutPlan;
