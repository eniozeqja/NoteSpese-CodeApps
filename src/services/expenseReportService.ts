import { fetchDataverse } from './dataverseService';
import { dataverseConfig } from '../config/dataverse';
import type { ExpenseReport, RawExpenseReportEntity } from '../types/expenseReport';

interface DataverseResponse {
  value: RawExpenseReportEntity[];
}

const formatExpenseReport = (item: RawExpenseReportEntity): ExpenseReport => {
  const statusLabel =
    item['dw_stato@OData.Community.Display.V1.FormattedValue'] || item.dw_stato || 'Unavailable';

  return {
    id: item.dw_nota_speseid,
    name: item.dw_name ?? 'Untitled report',
    status: statusLabel,
    contactName: item.dw_dipendente?.fullname,
    projectCode: item.dw_codicedicommessa?.dw_name,
    timePeriodLabel: item.dw_periodotempo?.dw_name,
  };
};

export const getExpenseReports = async (): Promise<ExpenseReport[]> => {
  const select = dataverseConfig.expenseReportSelect.join(',');
  const expand = dataverseConfig.expenseReportExpand.join(',');

  const path = `api/data/v9.2/${dataverseConfig.expenseReportEntitySet}?$select=${select}&$expand=${expand}`;
  const response = await fetchDataverse<DataverseResponse>(path);

  return response.value.map(formatExpenseReport);
};
