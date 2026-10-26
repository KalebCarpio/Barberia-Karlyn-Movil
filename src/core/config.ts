const configuredUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export const API_URL = configuredUrl.replace(/\/$/, '');
