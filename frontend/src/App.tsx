import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast"; // นำเข้า Toaster
import DailyLog from "./pages/DailyLog";
import AddMeal from "./pages/AddMeal";
import Trends from "./pages/Trends";
import MealHistory from "./pages/MealHistory";

function App() {
  return (
    <BrowserRouter>
      {/* วาง Toaster ไว้ตรงนี้ พร้อมตั้งค่าสไตล์ให้ดู Official */}
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
              primary: "#2196f3", // เปลี่ยนสีติ๊กถูกเป็นสีฟ้าให้ดูเป็นทางการ
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
