import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import styles from "./WorkoutPlan.module.css";

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
  const navigate = useNavigate();
  const [activeDay, setActiveDay] = useState<number>(new Date().getDay()); // เริ่มที่วันปัจจุบัน
  const [workoutPlans, setWorkoutPlans] = useState<Record<number, WorkoutDay>>(
    {},
  );
  const [newTaskText, setNewTaskText] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // 🌟 โหลดข้อมูลจาก Database ทันทีที่เข้าหน้าเว็บ
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await axios.get(
          "https://my-food-diary-n1tf.onrender.com/api/workout-plans",
        );

        // สร้างโครงร่างเปล่าๆ กันบั๊กหน้าขาวเผื่อ DB ไม่มีข้อมูล
        const loadedPlans: Record<number, WorkoutDay> = {};
        for (let i = 0; i <= 6; i++) {
          loadedPlans[i] = {
            title: "ยังไม่มีชื่อแผน",
            target: "ยังไม่ได้กำหนด",
            tasks: [],
          };
        }

        // เอาข้อมูลจาก DB มายัดใส่โครงร่าง
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

  // 🌟 ฟังก์ชันเซฟลง Database (เรียกใช้ตอนข้อมูลเปลี่ยน)
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

  // 🌟 ติ๊กถูก / เอาติ๊กออก
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

  // 🌟 เซฟ Title/Target เมื่อคลิกออกไปที่อื่น (onBlur)
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

  // ถ้ายังดึงข้อมูลจาก DB ไม่เสร็จ ให้โชว์หน้าโหลดไปก่อน
  if (isLoading || Object.keys(workoutPlans).length === 0) {
    return (
      <div
        className={styles.pageContainer}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <h2>กำลังดึงตารางออกกำลังกายจาก Database... 🏃‍♂️💨</h2>
      </div>
    );
  }

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

        <div className={styles.mainContent}>
          <div className={styles.inputGroup}>
            <label>ชื่อธีมการฝึกประจำวัน</label>
            <input
              type="text"
              value={workoutPlans[activeDay].title}
              onChange={(e) => handleUpdateTitle(e.target.value)}
              onBlur={handleBlurInfo} // เซฟลง DB ตอนคลิกออก
              placeholder="เช่น วันวิ่งระเบิดไขมัน"
            />
          </div>

          <div className={styles.inputGroup}>
            <label>เป้าหมายการฝึก</label>
            <input
              type="text"
              value={workoutPlans[activeDay].target}
              onChange={(e) => handleUpdateTarget(e.target.value)}
              onBlur={handleBlurInfo} // เซฟลง DB ตอนคลิกออก
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
                  (task: TaskItem, index: number) => (
                    <div
                      key={index}
                      className={styles.taskItem}
                      style={{
                        backgroundColor: task.done ? "#f1f8e9" : "#f8fafc",
                      }}
                    >
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={task.done}
                        onChange={() => handleToggleTask(index)}
                      />

                      <span
                        className={
                          task.done ? styles.taskTextCompleted : styles.taskText
                        }
                      >
                        {task.text}
                      </span>

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
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
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
