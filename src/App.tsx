import { useState } from "react";
import "./App.css";
import ExpenseDashboard from "./components/Dashboard";
import AnalyticsPage from "./components/Analytics";

type AppPage = "dashboard" | "analytics" | "approvals" | "settings";

function App() {
  const [activePage, setActivePage] = useState<AppPage>("dashboard");

  if (activePage === "analytics") {
    return <AnalyticsPage onNavigate={setActivePage} />;
  }

  return <ExpenseDashboard onNavigate={setActivePage} />;
}

export default App;