const DATAVERSE_URL = "https://orgb05b7e94.crm4.dynamics.com";

const DETAIL_ENTITY_LOGICAL_NAME = "dw_detaglinotespesa";
const DETAIL_PRIMARY_KEY = "dw_detaglinotespesaid";
const RECEIPT_COLUMN = "dw_receipt";

export function getReceiptType(fileName?: string): "image" | "pdf" | "other" {
  const lower = (fileName ?? "").toLowerCase();

  if (/\.(png|jpg|jpeg|webp|gif|svg)$/i.test(lower)) return "image";
  if (lower.endsWith(".pdf")) return "pdf";

  return "other";
}

export async function getReceiptSasUrl(detailId: string): Promise<string> {
  const response = await fetch(`${DATAVERSE_URL}/api/data/v9.2/GetFileSasUrl`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "OData-MaxVersion": "4.0",
      "OData-Version": "4.0",
    },
    body: JSON.stringify({
      Target: {
        "@odata.type": `Microsoft.Dynamics.CRM.${DETAIL_ENTITY_LOGICAL_NAME}`,
        [DETAIL_PRIMARY_KEY]: detailId,
      },
      FileAttributeName: RECEIPT_COLUMN,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    console.error("GetFileSasUrl failed:", response.status, errorText);
    throw new Error(`GetFileSasUrl failed: ${response.status}`);
  }

  const json = await response.json();

  const result = json.Result ?? json.result ?? json;

  if (!result.SasUrl) {
    console.error("Unexpected GetFileSasUrl response:", json);
    throw new Error("SasUrl was not returned.");
  }

  return result.SasUrl;
}