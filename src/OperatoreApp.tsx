import React, { useState } from "react";
import ExpenseDashboard from "./components/Dashboard";
import AnalyticsPage from "./components/Analytics";
import SettingsPage from "./components/Settings";

type AppPage = "dashboard" | "analytics" | "approvals" | "settings";
type Theme = "light" | "dark";

interface OperatorAppProps {
  theme: Theme;
  setTheme: (value: Theme) => void;
}

const OperatorApp: React.FC<OperatorAppProps> = ({ theme, setTheme }) => {
  const [activePage, setActivePage] = useState<AppPage>("dashboard");

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

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
};

export default OperatorApp;