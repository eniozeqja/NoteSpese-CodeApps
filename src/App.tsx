/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import "./App.css";
import { getContext } from "@microsoft/power-apps/app";
import OperatorApp from "../src/OperatoreApp";
import DipendenteHome from "./components/dipendente/DipendenteHome";
import { ContactsService } from "./generated//services/ContactsService";

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
    contact?.["_cr098_ruolosicurezza_value@OData.Community.Display.V1.FormattedValue"] ??
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

        const contacts =
          ((contactsResult as any)?.data ??
            (contactsResult as any)?.value ??
            []) as any[];

        const contact = contacts[0];

        console.log("[Role Check] Current user email:", email);
        console.log("[Role Check] Contact found:", contact);

        const roleName = getContactRoleName(contact);

        console.log("[Role Check] Role name:", roleName);

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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-sm text-center">
          <div className="w-12 h-12 rounded-full border-4 border-orange-100 border-t-[#E85C24] animate-spin mx-auto mb-5" />
          <p className="text-sm font-black text-slate-800 dark:text-slate-100">
            Caricamento profilo utente...
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
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
    <DipendenteHome
      currentUserName={currentUser.fullName}
      currentUserEmail={currentUser.email}
    />
  );
}

export default App;