export const config = {
  apiUrl: import.meta.env.VITE_API_URL || '/api',
  appName: import.meta.env.VITE_APP_NAME || 'Haivoly',
};

export const colors = {
  primary: '#2E7D32',
  primaryHover: '#256628',
  primaryLight: '#EDF7ED',
  primaryBorder: '#ABEFC6',
  neutral900: '#101828',
  neutral700: '#344054',
  neutral500: '#667085',
  neutral400: '#98A2B3',
  neutral200: '#EAECF0',
  neutral100: '#F9FAFB',
  bg: '#F8FAF8',
  card: '#FFFFFF',
  border: '#EAECF0',
  success: '#039855',
  warning: '#F79009',
  error: '#D92D20',
  info: '#1570EF',
} as const;
