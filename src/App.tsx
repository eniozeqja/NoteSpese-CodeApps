/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import "./App.css";
import { getContext } from "@microsoft/power-apps/app";
import OperatorApp from "./OperatoreApp";
import DipendenteApp from "./DipendenteApp";
import { ContactsService } from "./generated/services/ContactsService";

type Theme = "light" | "dark";
type UserSide = "operator" | "dipendente";

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function isOperatorRole(roleName: string) {
  const role = normalize(roleName);

  return (
    role.includes("system customizer") ||
    role.includes("operatore") ||
    role.includes("approvatore") ||
    role.includes("admin")
  );
}

function getContactRoleName(contact: any): string {
  return (
    contact?.[
      "_cr098_ruolosicurezza_value@OData.Community.Display.V1.FormattedValue"
    ] ??
    contact?.cr098_ruolosicurezzaname ??
    contact?.cr098_ruolosicurezza ??
    ""
  );
}

function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "dark" ? "dark" : "light";
  });

  const [checkingUser, setCheckingUser] = useState(true);
  const [userSide, setUserSide] = useState<UserSide>("dipendente");

  const [currentUser, setCurrentUser] = useState({
    fullName: "Utente",
    email: "",
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

  useEffect(() => {
    const checkCurrentUserRole = async () => {
      setCheckingUser(true);

      try {
        const ctx = await getContext();

        const fullName = ctx.user.fullName || "Utente";
        const email = ctx.user.userPrincipalName || "";

        setCurrentUser({ fullName, email });

        if (!email) {
          setUserSide("dipendente");
          return;
        }

        const safeEmail = email.replace(/'/g, "''");

        const contactsResult = await ContactsService.getAll({
          filter: `emailaddress1 eq '${safeEmail}'`,
        });

        const contacts = ((contactsResult as any)?.data ??
          (contactsResult as any)?.value ??
          []) as any[];

        const contact = contacts[0];
        const roleName = getContactRoleName(contact);

        if (isOperatorRole(roleName)) {
          setUserSide("operator");
        } else {
          setUserSide("dipendente");
        }
      } catch (err) {
        console.error("[Role Check] Failed:", err);
        setUserSide("dipendente");
      } finally {
        setCheckingUser(false);
      }
    };

    checkCurrentUserRole();
  }, []);

  if (checkingUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-8 text-center">
          <p className="text-lg font-black text-slate-900 dark:text-slate-100">
            Caricamento profilo utente...
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
            Verifica ruolo e autorizzazioni.
          </p>
        </div>
      </div>
    );
  }

  if (userSide === "operator") {
    return <OperatorApp theme={theme} setTheme={setTheme} />;
  }

  return (
    <DipendenteApp
      currentUserName={currentUser.fullName}
      currentUserEmail={currentUser.email}
      theme={theme}
      setTheme={setTheme}
    />
  );
}

export default App;
