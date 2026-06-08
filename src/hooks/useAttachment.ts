/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from "react";
import { Dw_detaglinotespesasService } from "../generated/services/Dw_detaglinotespesasService";
import type { Dw_detaglinotespesas } from "../generated/models/Dw_detaglinotespesasModel";

function getMimeType(filename: string): string {
  const ext = filename.toLowerCase().split(".").pop();

  return (
    {
      pdf: "application/pdf",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
    }[ext ?? ""] ?? "application/octet-stream"
  );
}

export function useAttachment(record: Dw_detaglinotespesas | null) {
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const blobRef = useRef<string | null>(null);

  useEffect(() => {
    if (blobRef.current) {
      URL.revokeObjectURL(blobRef.current);
      blobRef.current = null;
    }

    setAttachmentUrl(null);
    setError(null);

    const id = record?.dw_detaglinotespesaid;
    const fileName = record?.dw_receipt_name ?? "";
    const hasReceipt = Boolean(record?.dw_receipt);

    if (!record || !id || !fileName || !hasReceipt) {
      return;
    }

    let cancelled = false;

    setLoading(true);

    Dw_detaglinotespesasService.downloadReceipt(id)
      .then(async (res: any) => {
        if (cancelled) return;

        const raw = (res as any)?.data ?? (res as any)?.value;

        if (!raw) {
          throw new Error("No file data returned.");
        }

        let bytes: Uint8Array;

        if (raw instanceof Uint8Array) {
          bytes = raw;
        } else if (raw instanceof ArrayBuffer) {
          bytes = new Uint8Array(raw);
        } else if (raw instanceof Blob) {
          bytes = new Uint8Array(await raw.arrayBuffer());
        } else if (ArrayBuffer.isView(raw)) {
          bytes = new Uint8Array(raw.buffer as ArrayBuffer);
        } else {
          return;
        }

        const blob = new Blob([bytes.buffer as ArrayBuffer], {
          type: getMimeType(fileName),
        });
        const reader = new FileReader();
        reader.onloadend = () => {
          setAttachmentUrl(reader.result as string);
        };
        reader.readAsDataURL(blob);
      })

      .catch((err: any) => {
        console.error("Download receipt failed:", err);
        if (!cancelled) {
          setAttachmentUrl(null);
          setError("Impossibile caricare la ricevuta.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;

      if (blobRef.current) {
        URL.revokeObjectURL(blobRef.current);
        blobRef.current = null;
      }
    };
  }, [record]);

  return {
    attachmentUrl,
    loading,
    error,
  };
}
