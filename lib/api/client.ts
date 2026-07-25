import axios from 'axios';

import { Config } from '@/constants/Config';
import { getToken } from '@/lib/auth/storage';

export const apiClient = axios.create({
  baseURL: Config.apiUrl,
});

apiClient.interceptors.request.use(async (requestConfig) => {
  const token = await getToken();
  if (token) {
    requestConfig.headers.Authorization = `Bearer ${token}`;
  }
  return requestConfig;
});
