import React, { useState } from "react";
import DipendenteHome from "./components/dipendente/DipendenteHome";
import SettingsPage from "./components/Settings";
import DipendenteAnalytics from "./components/dipendente/DipendenteAnalytics";

type AppPage = "dashboard" | "analytics" | "settings";
type Theme = "light" | "dark";

interface DipendenteAppProps {
  currentUserName: string;
  currentUserEmail: string;
  theme: Theme;
  setTheme: (value: Theme) => void;
}

const DipendenteApp: React.FC<DipendenteAppProps> = ({
  currentUserName,
  currentUserEmail,
  theme,
  setTheme,
}) => {
  const [activePage, setActivePage] = useState<AppPage>("dashboard");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  if (activePage === "analytics") {
    return (
      <DipendenteAnalytics
        onNavigate={setActivePage}
        notificationsEnabled={notificationsEnabled}
      />
    );
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
        role="dipendente"
      />
    );
  }

  return (
    <DipendenteHome
      currentUserName={currentUserName}
      currentUserEmail={currentUserEmail}
      onNavigate={setActivePage}
      notificationsEnabled={notificationsEnabled}
    />
  );
};

export default DipendenteApp;
