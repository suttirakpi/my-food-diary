import { BrowserRouter, Routes, Route } from "react-router-dom";
import DailyLog from "./pages/DailyLog"; // เปลี่ยนเป็น D ตัวใหญ่
import AddMeal from "./pages/AddMeal";
import Trends from "./pages/Trends"; // 1. นำเข้าหน้า Trends

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DailyLog />} />
        <Route path="/add-meal" element={<AddMeal />} />
        <Route path="/trends" element={<Trends />} /> {/* 2. เพิ่มบรรทัดนี้ */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
