import { useEffect, useState } from "react";
import "./App.css";
import ExpenseDashboard from "./components/Dashboard";
import AnalyticsPage from "./components/Analytics";
import SettingsPage from "./components/Settings";

type AppPage = "dashboard" | "analytics" | "approvals" | "settings";
type Theme = "light" | "dark";

function App() {
  const [activePage, setActivePage] = useState<AppPage>("dashboard");

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem("theme");

    return savedTheme === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    localStorage.setItem("theme", theme);
  }, [theme]);

  if (activePage === "analytics") {
    return <AnalyticsPage onNavigate={setActivePage} />;
  }

  if (activePage === "settings") {
    return (
      <SettingsPage
        onNavigate={setActivePage}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        notificationsEnabled={notificationsEnabled}
        setNotificationsEnabled={setNotificationsEnabled}
        theme={theme}
        setTheme={setTheme}
      />
    );
  }

  return (
    <ExpenseDashboard
      onNavigate={setActivePage}
      itemsPerPage={itemsPerPage}
      notificationsEnabled={notificationsEnabled}
    />
  );
}

export default App;