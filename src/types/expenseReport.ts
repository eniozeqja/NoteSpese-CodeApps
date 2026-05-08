export interface ExpenseReport {
  id: string;
  name: string;
  status: string;
  contactName?: string;
  projectCode?: string;
  timePeriodLabel?: string;
}

export interface RawExpenseReportEntity {
  dw_nota_speseid: string;
  dw_name?: string;
  dw_stato?: string;
  ['dw_stato@OData.Community.Display.V1.FormattedValue']?: string;
  dw_dipendente?: {
    fullname?: string;
  };
  dw_codicedicommessa?: {
    dw_name?: string;
  };
  dw_periodotempo?: {
    dw_name?: string;
  };
  [key: string]: unknown;
}
