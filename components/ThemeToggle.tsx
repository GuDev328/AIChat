"use client";

import { Sun, Moon } from "lucide-react";
import { useContext, useState, useEffect } from "react";
import { ThemeContext } from "./ThemeProvider";

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const context = useContext(ThemeContext);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !context) {
    return (
      <button className={`header-theme-toggle ${className}`} disabled>
        <Moon size={18} />
      </button>
    );
  }

  const { theme, toggleTheme } = context;

  return (
    <button
      onClick={toggleTheme}
      className={`header-theme-toggle ${className}`}
      title={
        theme === "light" ? "Chuyển sang Dark Mode" : "Chuyển sang Light Mode"
      }
    >
      {theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
