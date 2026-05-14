import React from "react";
// นำเข้าตัวจัดการ Router
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import DailyLog from "./pages/dailylog";
import AddMeal from "./pages/AddMeal";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* หน้าแรก (Path: "/") ให้แสดง DailyLog */}
        <Route path="/" element={<DailyLog />} />

        {/* หน้าเพิ่มอาหาร (Path: "/add-meal") ให้แสดง AddMeal */}
        <Route path="/add-meal" element={<AddMeal />} />
      </Routes>
    </Router>
  );
};

export default App;
