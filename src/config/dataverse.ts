export const dataverseConfig = {
  baseUrl: import.meta.env.VITE_DATAVERSE_BASE_URL ?? '',
  expenseReportEntitySet: 'dw_nota_speses',
  expenseReportSelect: ['dw_name', 'dw_stato', 'dw_nota_speseid'],
  expenseReportExpand: ['dw_dipendente($select=fullname)', 'dw_codicedicommessa($select=dw_name)', 'dw_periodotempo($select=dw_name)'],
  contactLookup: 'dw_dipendente',
  projectLookup: 'dw_codicedicommessa',
};
