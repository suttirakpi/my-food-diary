import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import DailyLog from "./pages/DailyLog";
import AddMeal from "./pages/AddMeal";
import Trends from "./pages/Trends";
import MealHistory from "./pages/MealHistory";
import CalendarView from "./pages/CalendarView";
import WorkoutPlan from "./pages/WorkoutPlan"; // นำเข้าหน้า WorkoutPlan

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: "var(--font-body)",
            fontSize: "14px",
            borderRadius: "8px",
            padding: "16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            border: "1px solid var(--tertiary-fixed)",
            color: "var(--on-surface)",
          },
          success: {
            iconTheme: {
              primary: "#2196f3",
              secondary: "white",
            },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<DailyLog />} />
        <Route path="/add-meal" element={<AddMeal />} />
        <Route path="/trends" element={<Trends />} />
        <Route path="/history" element={<MealHistory />} />
        <Route path="/calendar" element={<CalendarView />} />

        {/* 🌟 เพิ่มบรรทัดนี้ลงไป เพื่อสร้างลิงก์ไปหน้า Workout */}
        <Route path="/workout-plan" element={<WorkoutPlan />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
