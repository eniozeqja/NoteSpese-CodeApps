import { dataverseConfig } from '../config/dataverse';

const getDataverseAccessToken = async (): Promise<string> => {
  if (typeof window !== 'undefined') {
    const maybePowerApps = (window as any).PowerApps;
    if (maybePowerApps?.getAuthToken) {
      return await maybePowerApps.getAuthToken();
    }
  }

  if (import.meta.env.VITE_DATAVERSE_TOKEN) {
    return import.meta.env.VITE_DATAVERSE_TOKEN;
  }

  throw new Error(
    'Dataverse auth token is not configured. Set VITE_DATAVERSE_TOKEN or implement a token provider for Power Apps auth.',
  );
};

const getBaseUrl = (): string => {
  if (!dataverseConfig.baseUrl) {
    throw new Error('VITE_DATAVERSE_BASE_URL is not configured.');
  }

  return dataverseConfig.baseUrl.replace(/\/+$/, '');
};

export const fetchDataverse = async <T>(path: string): Promise<T> => {
  const token = await getDataverseAccessToken();
  const response = await fetch(`${getBaseUrl()}/${path}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Dataverse request failed: ${response.status} ${response.statusText} - ${text}`);
  }

  return response.json();
};
