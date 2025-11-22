import { LogEntry, WorkType } from '../types';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';

// --- FIREBASE CONFIGURATION ---
// To enable real Cloud Database sync:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project and add a Web App.
// 3. Copy the configuration values below.
// 4. Enable "Cloud Firestore" in the Firebase Console.
const firebaseConfig = {
  apiKey: "", // Paste your API Key here
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

// Export flag to let the UI know which mode is active
export const isCloudEnabled = !!(firebaseConfig.apiKey && firebaseConfig.apiKey.length > 0);

// --- INTERFACE DEFINITION ---
interface DBService {
  onLogsSnapshot: (callback: (logs: LogEntry[]) => void) => () => void;
  addLog: (data: Omit<LogEntry, 'id' | 'serialNumber' | 'createdAt' | 'isComplete'>) => Promise<string>;
  updateLog: (id: string, data: Partial<LogEntry>) => Promise<void>;
  deleteLog: (id: string) => Promise<void>;
  importLogs: (newLogs: Omit<LogEntry, 'id' | 'serialNumber'>[]) => Promise<void>;
}

// --- REAL FIRESTORE IMPLEMENTATION ---
const createFirestoreService = (): DBService => {
  console.log("Initializing Firebase Firestore Service...");
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const COLLECTION_NAME = 'work_logs';

  return {
    onLogsSnapshot: (callback) => {
      // Bind List -> Cloud Table with Auto Refresh
      const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            serialNumber: data.serialNumber || 0,
            numberPlate: data.numberPlate || '',
            sticker: data.sticker || '',
            description: data.description || '',
            phoneNumber: data.phoneNumber || '',
            workType: data.workType || WorkType.Other,
            createdAt: data.createdAt,
            advance: data.advance || 0,
            baqaya: data.baqaya || 0,
            isComplete: data.isComplete || false,
            imageUrl: data.imageUrl
          } as LogEntry;
        });
        // Calculate serial numbers dynamically
        const logsWithSerial = logs.map((log, index) => ({
            ...log,
            serialNumber: logs.length - index
        }));
        callback(logsWithSerial);
      });
    },
    addLog: async (data) => {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...data,
        createdAt: Date.now(),
        isComplete: false
      });
      return docRef.id;
    },
    updateLog: async (id, data) => {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, data);
    },
    deleteLog: async (id) => {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    },
    importLogs: async (newLogs) => {
      const batchPromises = newLogs.map(log => {
        return addDoc(collection(db, COLLECTION_NAME), {
            ...log,
            createdAt: log.createdAt || Date.now()
        });
      });
      await Promise.all(batchPromises);
    }
  };
};

// --- MOCK LOCAL STORAGE IMPLEMENTATION ---
const createMockService = (): DBService => {
  console.log("Using Mock Service (Local Storage)");
  const FAKE_DB_KEY = 'fake_db_logs';
  let logsSnapshotListener: ((logs: LogEntry[]) => void) | null = null;
  let logs: LogEntry[] = [];

  const loadLogsFromStorage = () => {
      try {
          const storedLogs = localStorage.getItem(FAKE_DB_KEY);
          if (storedLogs) {
              logs = JSON.parse(storedLogs);
          } else {
              logs = [
                  { id: '1', serialNumber: 1, numberPlate: 'MH12AB1234', sticker: 'VIP', description: 'Honda City', phoneNumber: '9876543210', workType: WorkType.NumberPlate, createdAt: new Date('2023-10-26T10:00:00Z').getTime(), advance: 500, baqaya: 200, isComplete: false },
                  { id: '2', serialNumber: 2, numberPlate: 'The Smiths', sticker: '', description: 'House Name Plate', phoneNumber: '9876512345', workType: WorkType.NamePlate, createdAt: new Date('2023-10-26T11:30:00Z').getTime(), advance: 1000, baqaya: 0, isComplete: true },
                  { id: '3', serialNumber: 3, numberPlate: '', sticker: '', description: 'Custom Bike Decal', phoneNumber: '9876543211', workType: WorkType.Other, createdAt: new Date('2023-10-27T12:00:00Z').getTime(), advance: 300, baqaya: 150, isComplete: false, imageUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cGF0aCBkPSJNNTAsMi41QTIyLjUsMjIuNSwwLDAsMCwyNy41LDI1SDIwYTIsMiwwLDAsMC0yLDJ2NDJhMiwyLDAsMCwwLDIsMkgzN2E1LDUsMCwwLDAsNS01VjI3LjVhMjIuNSwyMi41LDAsMCwwLDgtMi41WiIgZmlsbD0iIzYzNjZmMSIvPjxwYXRoIGQ9Ik01MCwzMC4zYTcuNSw3LjUsMCwxLDAsNy41LDcuNUE3LjUsNy41LDAsMCwwLDUwLDMwLjM5WiIgZmlsbD0iI2ZmZiIvPjxwYXRoIGQ9Ik03MywzNWgtNWEyLDIsMCwwLDAtMiwydjI1YTIsMiwwLDAsMCwyLDJoNWEyLDIsMCwwLDAsMi0yVjM3QTIsMiwwLDAsMCw3MywzNVoiIGZpbGw9IiM4MThjZjgiLz48L3N2Zz4=' },
              ];
              persistLogs();
          }
      } catch (e) {
          console.error("Failed to load or parse logs from localStorage", e);
          logs = [];
      }
  };

  const persistLogs = () => {
    localStorage.setItem(FAKE_DB_KEY, JSON.stringify(logs));
    if (logsSnapshotListener) {
      // Sort by newest first and trigger Auto Refresh
      logsSnapshotListener([...logs].sort((a, b) => b.createdAt - a.createdAt));
    }
  };

  loadLogsFromStorage();

  return {
    onLogsSnapshot: (callback) => {
      logsSnapshotListener = callback;
      // initial call
      callback([...logs].sort((a, b) => b.createdAt - a.createdAt));
      return () => {
        logsSnapshotListener = null;
      };
    },
    addLog: (data) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const newLog: LogEntry = {
            ...data,
            id: Date.now().toString(),
            createdAt: Date.now(),
            serialNumber: 0, // Will be set on the client from the latest data
            isComplete: false,
          };
          logs.push(newLog);
          persistLogs();
          resolve(newLog.id);
        }, 200);
      });
    },
    updateLog: (id, data) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          logs = logs.map(log => log.id === id ? { ...log, ...data } : log);
          persistLogs();
          resolve();
        }, 200);
      });
    },
    deleteLog: (id) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          logs = logs.filter(log => log.id !== id);
          persistLogs();
          resolve();
        }, 200);
      });
    },
    importLogs: (newLogs) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const imported: LogEntry[] = newLogs.map(log => ({
                    ...log,
                    id: `${log.createdAt}-${Math.random()}`,
                    serialNumber: 0,
                }));
                logs.push(...imported);
                persistLogs();
                resolve();
            }, 500);
        });
    }
  };
};

// --- EXPORT SERVICE ---
// Automatically select service based on config presence
const dbService = isCloudEnabled ? createFirestoreService() : createMockService();

export { dbService };