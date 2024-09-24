import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Suppress Firebase Analytics warning if not using Analytics
const originalConsoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Firebase Analytics')) {
    return;
  }
  originalConsoleError.apply(console, args);
};

export interface Dashboard {
  id: string;
  name: string;
  widgets: Widget[];
}

export interface Widget {
  id: string;
  type: string;
  data: any;
}

export const createDashboard = async (userId: string, name: string) => {
  const dashboardRef = doc(collection(db, 'users', userId, 'dashboards'));
  const dashboard: Dashboard = {
    id: dashboardRef.id,
    name,
    widgets: [],
  };
  await setDoc(dashboardRef, dashboard);
  return dashboard;
};

export const getDashboards = async (userId: string) => {
  const dashboardsRef = collection(db, 'users', userId, 'dashboards');
  const snapshot = await getDocs(dashboardsRef);
  return snapshot.docs.map((doc) => doc.data() as Dashboard);
};

export const updateDashboard = async (userId: string, dashboard: Dashboard) => {
  const dashboardRef = doc(db, 'users', userId, 'dashboards', dashboard.id);
  await updateDoc(dashboardRef, dashboard);
};

export { db, auth, storage };
