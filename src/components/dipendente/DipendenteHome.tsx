/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {useEffect, useState} from "react";
import { getContext } from "@microsoft/power-apps/app"; 
import { ContactsService, Dw_nota_spesesService } from "@/generated";
import MainLayout from "../MainLayout";
import DipendenteDettagliDrawer from "./DipendenteDettagliDrawer";
import DipendenteDettaglioFullView from "./DipendenteDettaglioFullView";

type NotaSpesa = {
  dw_nota_speseid: string;
  dw_name?: string;
  createdon?: string;
  dw_stato?: number;
}

interface DipendenteHomeProps {
  currentUserName: string;
  currentUserEmail: string;
}

const DipendeteHome: React.FC<DipendenteHomeProps> = ({
  currentUserName,
  currentUserEmail
}) =>{

  const [loading, setLoading] = useState(true)
  const [noteSpese, setNoteSpese] = useState<NotaSpesa[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedName, setSelectedName] = useState("")
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedRejectionReason, setSelectedRejectionReason] = useState("")
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null)

  const loadMyNoteSpese = async () => {
  try {
    setLoading(true);

    const ctx = await getContext();

    const objId = ctx.user.objectId;

    if (!objId) {
      setNoteSpese([]);
      return;
    }

    const safeObjId = objId.replace(/'/g, "''");

    const contactResult = await ContactsService.getAll({
      filter: `externaluseridentifier eq '${safeObjId}'`,
    });

    const contacts =
      ((contactResult as any)?.data ??
        (contactResult as any)?.value ??
        []) as any[];

    const contact = contacts[0];
    const contactId = contact?.contactid;


    if (!contactId) {
      setNoteSpese([]);
      return;
    }

    const result = await Dw_nota_spesesService.getAll({
      filter: `_dw_dipendente_value eq ${contactId} and (dw_stato eq 121950003 or dw_stato eq 121950001)`,
    });

    const records =
      ((result as any)?.data ??
        (result as any)?.value ??
        []) as NotaSpesa[];

    console.log("[Dipendente] Fetched note spese:", records);

    setNoteSpese(records);
  } catch (err) {
    console.error("[Dipendente] Error fetching note spese:", err);
  } finally {
    setLoading(false);
  }
};

    useEffect(() => {
    loadMyNoteSpese()
  }, [])

  if(selectedDetailId){
    return (
      <DipendenteDettaglioFullView
      detailId={selectedDetailId}
      onBack={() => {
        setSelectedDetailId(null)
        setIsDrawerOpen(true)
      }}
      onSaved={() => {
        loadMyNoteSpese()
      }}
      />

    )
  }


  return(
    <MainLayout activeTab="dashboard" title="Note Spese - Dipendente">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100">
            Le mie Note Spese
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Note spese in composizione o rifiutate.
          </p>
        </div>
        {loading ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-10 text-center">
            <p className="text-slate-500 dark:text-slate-400">
              Caricamento note spese...
            </p>
          </div>
        ) : noteSpese.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-10 text-center">
            <p className="text-slate-500 dark:text-slate-400">
              Nessuna Nota Spesa disponibile.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            <DipendenteDettagliDrawer
  isOpen={isDrawerOpen}
  onClose={() => setIsDrawerOpen(false)}
  notaSpesaId={selectedId}
  notaSpesaName={selectedName}
  rejectionReason={selectedRejectionReason}
  onResend={() => {
    console.log("Reinvia clicked");
  }}
  onSetSelectedDetail={(detailId) => {
    setSelectedDetailId(detailId);
    setIsDrawerOpen(false);
  }}
/>
            {noteSpese.map((nota) => (
              <button
                key={nota.dw_nota_speseid}
                className="w-full text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 hover:border-[#E85C24] transition-all"
                onClick={() => {
                  setSelectedId(nota.dw_nota_speseid);
                  setSelectedName(nota.dw_name || "Nota Spesa");
                  setIsDrawerOpen(true);
                  setSelectedRejectionReason((nota as any).dw_noteaggiuntive || "")
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
                      {nota.dw_name || "Nota Spesa"}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Creata il{" "}
                      {nota.createdon
                        ? new Date(nota.createdon).toLocaleDateString("it-IT")
                        : "-"}
                    </p>
                  </div>

                  <div>
                    <span className="px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300">
                      {nota.dw_stato === 121950003
                        ? "Rifiutata"
                        : "In Composizione"}
                    </span>
                  </div>
                </div>
              </button>
              
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}

export default DipendeteHome;