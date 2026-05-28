/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useRef, useState } from "react";
import { Bell, Clock, Inbox, X } from "lucide-react";
import { Dw_nota_spesesService } from "@/generated";

type NotificationMode = "operatore" | "dipendente"
interface NotificationBellProps {
  notificationsEnabled?: boolean;
  mode?: NotificationMode;
  dipendenteId?: string | null
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  notificationsEnabled = true,
  mode = "operatore",
  dipendenteId = null,
}) => {
  const [notificationCount, setNotificationCount] = useState(0);
  const [latestCreatedOn, setLatestCreatedOn] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [latestNotifications, setLatestNotifications] = useState<any[]>([]);
    const [previousStatuses, setPreviousStatuses] = useState<Record<string, number>>({})
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

  const removeNotification = (noteId: string) => {
    setLatestNotifications((prev) =>
      prev.filter((note) => note.dw_nota_speseid !== noteId)
    );

    setNotificationCount((prev) => Math.max(prev - 1, 0));
  };

  const clearAllNotifications = () => {
    setLatestNotifications([]);
    setNotificationCount(0);
    setShowNotifications(false);
  };

  useEffect(() => {
    if (!notificationsEnabled) {
      return;
    }

    if(mode === "dipendente" && !dipendenteId){
        return
    }

    const checkNotifications = async () => {
        try {
            const result = await Dw_nota_spesesService.getAll(
                mode === "dipendente"
                ? {
                    filter: `_dw_dipendente_value eq ${dipendenteId}`
                }
                : undefined
            )

            const notes =((result as any)?.data ?? (result as any)?.value ?? []) as any[]

            if(!notes.length) return;

            if(mode === "operatore"){
                const sortedNotes = notes.filter((note) => note.createdon)
                .sort(
                    (a, b) => 
                        new Date(b.createdon).getTime() -
                        new Date(a.createdon).getTime()
                )
                const newestCreatedOn = sortedNotes[0]?.createdon;
                if(!newestCreatedOn) return

                if(!latestCreatedOn){
                    setLatestCreatedOn(newestCreatedOn)
                    return
                }

                const newNotes = sortedNotes.filter(
                    (note) => 
                        new Date(note.createdon).getTime() > 
                        new Date(latestCreatedOn).getTime()
                )

                if(newNotes.length > 0) {
                    setNotificationCount((prev) => prev + newNotes.length)
                    setLatestNotifications((prev) => [...newNotes, ...prev].slice(0, 8))
                    setLatestCreatedOn(newestCreatedOn)
                }

                return
            
            }

            if(mode === "dipendente") {
                const currentStatuses: Record<string, number> = {}

                const changedNotes = notes.filter((note) => {
                    const noteId = note.dw_note_speseid;
                    const currentStatus = note.dw_stato;

                    if(!noteId || currentStatus === undefined || currentStatus === null){
                        return false
                    }

                    currentStatuses[noteId] = currentStatus

                    const previousStatus = previousStatuses[noteId]

                    return(
                        previousStatus === 121950001 && 
                        (currentStatus === 121950002 || currentStatus === 121950003)
                    )
                })

                if(Object.keys(previousStatuses).length === 0){
                    setPreviousStatuses(currentStatuses)
                    return
                }

                if(changedNotes.length > 0){
                    setNotificationCount((prev) => prev + changedNotes.length)

                    setLatestNotifications((prev) => 
                    [
                        ...changedNotes.map((note) => ({
                            ...note,
                            notificationMessage:
                            note.dw_stato === 121950002
                            ? "La tua nota spesa è stata approvata"
                            : "La tua nota spesa è stata rifiutata"
                        })),
                        ...prev,
                    ].slice(0,8))
                }

                setPreviousStatuses(currentStatuses)
            }

            } catch(err) {
                console.log("Errore controllo notifiche note spese: ", err)
            }
        }
        checkNotifications()
        const intervalId = window.setInterval(checkNotifications, 5000)

        return() => {
            window.clearInterval(intervalId)
        }
    }, [notificationsEnabled, mode, dipendenteId, latestCreatedOn, previousStatuses])




  return (
    <div className="relative" ref={notificationRef}>
      <button
        type="button"
        onClick={() => setShowNotifications((prev) => !prev)}
        className={`p-2 rounded-lg transition-all relative ${
          showNotifications
            ? "bg-orange-50 dark:bg-orange-950/30 text-[#E85C24]"
            : "text-slate-400 dark:text-slate-500 hover:text-[#E85C24] hover:bg-orange-50 dark:hover:bg-orange-950/30"
        }`}
        title="Notifiche"
      >
        <Bell
          className={`w-5 h-5 ${
            notificationCount > 0 ? "animate-pulse" : ""
          }`}
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
                  key={note.dw_nota_speseid}
                  className="group px-4 py-3 border-b border-slate-100 dark:border-slate-800 hover:bg-orange-50/50 dark:hover:bg-orange-950/20 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                            {note.notificationMessage ?? note.dw_name ?? "Nuova Nota Spesa"}
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
                        removeNotification(note.dw_nota_speseid);
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