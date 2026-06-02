/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useRef, useState } from "react";
import { Bell, Clock, Inbox, X } from "lucide-react";
import { getContext } from "@microsoft/power-apps/app";

import {
  Dw_notificationtrackersService,
  Dw_utentenotifstatosService,
} from "@/generated";

type UserRole = "Operatore" | "Dipendente";

interface NotificationBellProps {
  notificationsEnabled?: boolean;
  role?: UserRole;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  notificationsEnabled = true,
  role = "Dipendente",
}) => {
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [latestNotifications, setLatestNotifications] = useState<any[]>([]);

  const [currentObjectId, setCurrentObjectId] = useState<string | null>(null);
  const [userNotifStateId, setUserNotifStateId] = useState<string | null>(null);

  const notificationRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const removeNotification = (notificationId: string) => {
    setLatestNotifications((prev) =>
      prev.filter((note) => note.dw_notificationtrackerid !== notificationId),
    );

    setNotificationCount((prev) => Math.max(prev - 1, 0));
  };

  const clearAllNotifications = async () => {
    const now = new Date().toISOString();

    try {
      if (userNotifStateId) {
        await Dw_utentenotifstatosService.update(userNotifStateId, {
          dw_dw_hiddenbefore: now,
          dw_ultimovisualizza: now,
        } as any);
      }

      setLatestNotifications([]);
      setNotificationCount(0);
      setShowNotifications(false);
    } catch (err) {
      console.error("Errore cancellazione notifiche:", err);
    }
  };

  const markNotificationsAsViewed = async () => {
    if (!userNotifStateId || !currentObjectId) {
      return;
    }

    const now = new Date().toISOString();

    try {
      await Dw_utentenotifstatosService.update(userNotifStateId, {
        dw_ultimovisualizza: now,
      } as any);

      setNotificationCount(0);
    } catch (err) {
      console.log("Errore aggiornamento ultimo visualizza", err);
    }
  };

  const getDateValue = (date?: string | null) => {
    if (!date) return 0;
    return new Date(date).getTime();
  };

  useEffect(() => {
    if (!notificationsEnabled) {
      return;
    }

    const loadNotifications = async () => {
      try {
        const ctx = await getContext();
        const objectId = ctx.user.objectId;
        const fullName = ctx.user.fullName || "Utente";

        if (!objectId) {
          setLatestNotifications([]);
          setNotificationCount(0);
          return;
        }

        setCurrentObjectId(objectId);

        const safeObjectId = objectId.replace(/'/g, "''");

        const userStateResult = await Dw_utentenotifstatosService.getAll({
          filter: `dw_userobjid eq '${safeObjectId}'`,
        });

        const userStates = ((userStateResult as any)?.data ??
          (userStateResult as any)?.value ??
          []) as any[];

        let userState = userStates[0];

        if (!userState) {
          const createdState = await Dw_utentenotifstatosService.create({
            dw_name: objectId,
            dw_userobjid: objectId,
            dw_username: fullName,
            dw_ultimovisualizza: new Date(0).toISOString(),
            dw_dw_hiddenbefore: new Date(0).toISOString(),
          } as any);

          userState = (createdState as any)?.data ?? createdState;
        }
        const stateId = userState.dw_utentenotifstatoid;
        const viewDate =
          userState.dw_ultimovisualizza ?? new Date(0).toISOString();
        const hiddenDate =
          userState.dw_dw_hiddenbefore ?? new Date(0).toISOString();

        setUserNotifStateId(stateId);

        const trackerResult = await Dw_notificationtrackersService.getAll();

        const allNotifications = ((trackerResult as any)?.data ??
          (trackerResult as any)?.value ??
          []) as any[];

        const visibleNotifications = allNotifications
          .filter((notification) => {
            const createdOn = notification.createdon;

            if (!createdOn) return false;

            const isAfterHiddenBefore =
              getDateValue(createdOn) > getDateValue(hiddenDate);

            if (!isAfterHiddenBefore) return false;

            if (role === "Operatore") {
              return Boolean(notification.dw_name?.trim());
            }

            return (
              notification.dw_utenteobjectid === objectId &&
              notification.dw_operation === 2 &&
              notification.dw_type === 2 &&
              (notification.dw_visualizedstate === 2 ||
                notification.dw_visualizedstate === 3)
            );
          })
          .sort(
            (a, b) => getDateValue(b.createdon) - getDateValue(a.createdon),
          );

        const unreadCount = visibleNotifications.filter(
          (notification) =>
            getDateValue(notification.createdon) > getDateValue(viewDate),
        ).length;

        setLatestNotifications(visibleNotifications.slice(0, 8));
        setNotificationCount(unreadCount);
      } catch (err) {
        console.log("Errore caricamento notifiche", err);
      }
    };

    loadNotifications();
    const intervalId = window.setInterval(loadNotifications, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [notificationsEnabled, role]);

  return (
    <div className="relative" ref={notificationRef}>
      <button
        type="button"
        onClick={() => {
          setShowNotifications((prev) => {
            const next = !prev;

            if (next) {
              markNotificationsAsViewed();
            }

            return next;
          });
        }}
        className={`p-2 rounded-lg transition-all relative ${
          showNotifications
            ? "bg-orange-50 dark:bg-orange-950/30 text-[#E85C24]"
            : "text-slate-400 dark:text-slate-500 hover:text-[#E85C24] hover:bg-orange-50 dark:hover:bg-orange-950/30"
        }`}
        title="Notifiche"
      >
        <Bell
          className={`w-5 h-5 ${notificationCount > 0 ? "animate-pulse" : ""}`}
        />

        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E85C24] text-white text-[10px] font-bold flex items-center justify-center">
            {notificationCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Notifiche
              </h3>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                {notificationCount} Nuovi aggiornamenti
              </p>
            </div>

            {latestNotifications.length > 0 && (
              <button
                type="button"
                onClick={clearAllNotifications}
                className="text-xs font-semibold text-[#E85C24] hover:underline"
              >
                Cancella tutto
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {latestNotifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Inbox className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Nessuna nuova notifica
                </p>
              </div>
            ) : (
              latestNotifications.map((note) => (
                <div
                  key={note.dw_notificationtrackerid}
                  className="group px-4 py-3 border-b border-slate-100 dark:border-slate-800 hover:bg-orange-50/50 dark:hover:bg-orange-950/20 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {note.notificationMessage ??
                          note.dw_name ??
                          "Nuova Nota Spesa"}
                      </p>

                      {note.notificationMessage && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          {note.dw_name ?? "Nota spesa"}
                        </p>
                      )}

                      <div className="flex items-center gap-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <Clock className="w-3 h-3" />

                        <span>
                          {new Date(note.createdon).toLocaleString("it-IT", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(note.dw_notificationtrackerid);
                      }}
                      className="w-6 h-6 flex items-center justify-center rounded-full text-slate-300 dark:text-slate-600 hover:text-white hover:bg-red-500 transition-all opacity-0 group-hover:opacity-100"
                      title="Rimuovi"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {latestNotifications.length > 0 && (
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                Vedi tutte le note spese
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
