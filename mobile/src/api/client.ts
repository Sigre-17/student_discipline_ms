import { Platform } from 'react-native';

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

async function request(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.message || 'Mobile API request failed.');
  }
  return body;
}

export const api = {
  login: (credentials: { username: string; password: string }) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  getTables: () => request('/tables'),

  getSeedStatus: () => request('/seed-status'),
};
