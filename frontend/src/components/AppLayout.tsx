// src/components/AppLayout.tsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./AppLayout.module.css";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const checkActive = (path: string) => {
    return location.pathname === path ? styles.navItemActive : "";
  };

  return (
    <div className={styles.appLayout}>
      {/* 🌟 รวบปุ่มทั้งหมดเข้ามาอยู่ใน aside */}
      <aside className={styles.sidebar}>
        <div className={styles.brandLogo}>❤️</div>

        <button
          className={`${styles.navItem} ${checkActive("/")}`}
          onClick={() => navigate("/")}
        >
          <span className="material-symbols-outlined">home</span>
          Home
        </button>
        <button
          className={`${styles.navItem} ${checkActive("/add-meal")}`}
          onClick={() => navigate("/add-meal")}
        >
          <span className="material-symbols-outlined">restaurant_menu</span>
          Meals
        </button>
        <button
          className={`${styles.navItem} ${checkActive("/trends")}`}
          onClick={() => navigate("/trends")}
        >
          <span className="material-symbols-outlined">monitoring</span>
          Trends
        </button>
        <button
          className={`${styles.navItem} ${checkActive("/workout-plan")}`}
          onClick={() => navigate("/workout-plan")}
        >
          <span className="material-symbols-outlined">fitness_center</span>
          Workout
        </button>
        <button
          className={`${styles.navItem} ${checkActive("/calendar")}`}
          onClick={() => navigate("/calendar")}
        >
          <span className="material-symbols-outlined">calendar_month</span>
          Calendar
        </button>
        <button
          className={`${styles.navItem} ${checkActive("/history")}`}
          onClick={() => navigate("/history")}
        >
          <span className="material-symbols-outlined">history</span>
          History
        </button>
        <button
          className={`${styles.navItem} ${checkActive("/weight")}`}
          onClick={() => navigate("/weight")}
        >
          <span className="material-symbols-outlined">scale</span>
          Weight
        </button>
        <button
          className={`${styles.navItem} ${checkActive("/settings")}`}
          onClick={() => navigate("/settings")}
        >
          <span className="material-symbols-outlined">settings</span>
          Settings
        </button>
      </aside>

      <main className={styles.mainPanel}>{children}</main>
    </div>
  );
};

export default AppLayout;
