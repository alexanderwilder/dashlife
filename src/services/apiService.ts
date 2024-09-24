import axios from 'axios';
import { getAuth } from 'firebase/auth';

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const fetchData = async (dataSource: string, params: any) => {
  try {
    const response = await apiClient.get(`/${dataSource}/data`, { params });
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${dataSource} data:`, error);
    throw error;
  }
};

export const fetchStravaData = (params: any) => fetchData('strava', params);
export const fetchGitHubData = (params: any) => fetchData('github', params);
