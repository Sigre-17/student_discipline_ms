import { Platform } from 'react-native';

declare const process: { env: Record<string, string | undefined> };

// Fallback logic: Android Emulator uses 10.0.2.2, iOS Simulator uses 127.0.0.1, Expo Go uses machine IP
const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api';
  }
  return 'http://127.0.0.1:8000/api';
};

export const API_BASE_URL = getBaseUrl();

let activeToken = '';

async function request(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.message || 'Mobile API request failed.');
  }
  return body;
}

export const api = {
  login: async (credentials: { username: string; password: string }) => {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (data.token) {
      activeToken = data.token;
    }
    return data;
  },

  getTestCredentials: () => request('/test-credentials'),

  getDashboardStats: () => request('/dashboard/stats'),

  getIncidents: () => request('/incidents'),

  getStudents: () => request('/students'),

  getSanctions: () => request('/sanctions'),

  reportIncident: (data: any) =>
    request('/incidents', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getTables: () => request('/tables'),

  getSeedStatus: () => request('/seed-status'),

  getCategories: () => request('/offence-categories'),
};
