import { LogEntry, WorkType } from '../types';

// --- MOCK FIRESTORE SERVICE ---
const FAKE_DB_KEY = 'fake_db_logs';
let logsSnapshotListener: ((logs: LogEntry[]) => void) | null = null;
let logs: LogEntry[] = [];

const loadLogsFromStorage = () => {
    try {
        const storedLogs = localStorage.getItem(FAKE_DB_KEY);
        if (storedLogs) {
            logs = JSON.parse(storedLogs);
        } else {
            // Add some initial data if the DB is empty
            logs = [
                { id: '1', serialNumber: 1, numberPlate: 'MH12AB1234', sticker: 'VIP', description: 'Honda City', phoneNumber: '9876543210', workType: WorkType.NumberPlate, createdAt: new Date('2023-10-26T10:00:00Z').getTime(), advance: 500, baqaya: 200, isComplete: false },
                { id: '2', serialNumber: 2, numberPlate: 'The Smiths', sticker: '', description: 'House Name Plate', phoneNumber: '9876512345', workType: WorkType.NamePlate, createdAt: new Date('2023-10-26T11:30:00Z').getTime(), advance: 1000, baqaya: 0, isComplete: true },
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
    logsSnapshotListener([...logs].sort((a, b) => b.createdAt - a.createdAt));
  }
};

loadLogsFromStorage();

const dbService = {
  onLogsSnapshot: (callback: (logs: LogEntry[]) => void): (() => void) => {
    logsSnapshotListener = callback;
    // initial call
    callback([...logs].sort((a, b) => b.createdAt - a.createdAt));
    return () => {
      logsSnapshotListener = null;
    };
  },
  addLog: (data: Omit<LogEntry, 'id' | 'serialNumber' | 'createdAt' | 'isComplete'>): Promise<string> => {
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
  updateLog: (id: string, data: Partial<LogEntry>): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        logs = logs.map(log => log.id === id ? { ...log, ...data } : log);
        persistLogs();
        resolve();
      }, 200);
    });
  },
  deleteLog: (id: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        logs = logs.filter(log => log.id !== id);
        persistLogs();
        resolve();
      }, 200);
    });
  },
  importLogs: (newLogs: Omit<LogEntry, 'id' | 'serialNumber'>[]): Promise<void> => {
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

export { dbService };