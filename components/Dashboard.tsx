import React, { useState, useEffect, useMemo } from 'react';
import { dbService, isCloudEnabled } from '../services/firebaseService';
import { LogEntry, WorkType } from '../types';
import { exportToCsv, generateTabSeparated, copyToClipboard } from '../utils/helpers';
import Header from './Header';
import LogTable from './LogTable';
import LogForm from './LogForm';
import { MoneyIcon } from './icons/MoneyIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ClockIcon } from './icons/ClockIcon';
import { SearchIcon } from './icons/SearchIcon';
import { ClearIcon } from './icons/ClearIcon';
import { CloudIcon } from './icons/CloudIcon';
import Papa from 'papaparse';

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string; color: string; }> = ({ icon, title, value, color }) => (
    <div className="relative p-5 overflow-hidden bg-white rounded-xl shadow-lg dark:bg-slate-900/70 dark:backdrop-blur-sm">
        <div className="flex items-center gap-4">
            <div className={`p-3 text-white bg-gradient-to-br ${color} rounded-xl shadow-md`}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
            </div>
        </div>
    </div>
);


const Dashboard: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [logToEdit, setLogToEdit] = useState<LogEntry | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [workTypeFilter, setWorkTypeFilter] = useState('');
    const [completionFilter, setCompletionFilter] = useState('');
    const [notification, setNotification] = useState('');

    useEffect(() => {
        // Bind List -> Cloud Table (Automatic Listener)
        const unsubscribe = dbService.onLogsSnapshot((snapshotLogs) => {
            const logsWithSerial = snapshotLogs.map((log, index) => ({
                ...log,
                serialNumber: snapshotLogs.length - index
            }));
            setLogs(logsWithSerial);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filteredLogs = useMemo(() => {
        let tempLogs = [...logs];

        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            tempLogs = tempLogs.filter(log =>
                log.numberPlate.toLowerCase().includes(lowercasedTerm) ||
                log.sticker.toLowerCase().includes(lowercasedTerm) ||
                log.description.toLowerCase().includes(lowercasedTerm) ||
                log.phoneNumber.includes(searchTerm) ||
                String(log.advance).includes(lowercasedTerm) ||
                String(log.baqaya).includes(lowercasedTerm)
            );
        }

        if (dateFilter) {
            tempLogs = tempLogs.filter(log => {
                const logDate = new Date(log.createdAt).toISOString().split('T')[0];
                return logDate === dateFilter;
            });
        }
        
        if (workTypeFilter) {
            tempLogs = tempLogs.filter(log => log.workType === workTypeFilter);
        }

        if (completionFilter) {
            const isComplete = completionFilter === 'completed';
            tempLogs = tempLogs.filter(log => log.isComplete === isComplete);
        }

        return tempLogs;
    }, [logs, searchTerm, dateFilter, workTypeFilter, completionFilter]);

    const { totalAdvance, totalBaqaya, completedCount, pendingCount } = useMemo(() => {
        return filteredLogs.reduce(
            (acc, log) => {
                acc.totalAdvance += log.advance;
                acc.totalBaqaya += log.baqaya;
                if (log.isComplete) {
                    acc.completedCount++;
                } else {
                    acc.pendingCount++;
                }
                return acc;
            },
            { totalAdvance: 0, totalBaqaya: 0, completedCount: 0, pendingCount: 0 }
        );
    }, [filteredLogs]);
    
    const setToday = () => {
        const today = new Date().toISOString().split('T')[0];
        setDateFilter(today);
    };

    const setYesterday = () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        setDateFilter(yesterday.toISOString().split('T')[0]);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setDateFilter('');
        setWorkTypeFilter('');
        setCompletionFilter('');
    };

    const showNotification = (message: string) => {
        setNotification(message);
        setTimeout(() => setNotification(''), 3000);
    };

    const handleSaveLog = async (logData: Omit<LogEntry, 'id' | 'serialNumber' | 'createdAt' | 'isComplete'> | LogEntry) => {
        if ('id' in logData) {
            await dbService.updateLog(logData.id, logData);
            showNotification('Log updated successfully!');
        } else {
            await dbService.addLog(logData as Omit<LogEntry, 'id' | 'serialNumber' | 'createdAt' | 'isComplete'>);
            showNotification('Log added successfully!');
        }
    };
    
    const handleEdit = (log: LogEntry) => {
        setLogToEdit(log);
        setIsFormOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this log?')) {
            dbService.deleteLog(id).then(() => showNotification('Log deleted.'));
        }
    };

    const handleToggleComplete = async (log: LogEntry) => {
        await dbService.updateLog(log.id, { isComplete: !log.isComplete });
        showNotification(`Log marked as ${!log.isComplete ? 'Complete' : 'Pending'}.`);
    };
    
    const handleAddNew = () => {
        setLogToEdit(null);
        setIsFormOpen(true);
    };

    const handleCopyAll = () => {
        const textToCopy = generateTabSeparated(filteredLogs);
        copyToClipboard(textToCopy).then(() => showNotification('All visible records copied!'));
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const importedLogs: Omit<LogEntry, 'id' | 'serialNumber'>[] = results.data.map((row: any) => ({
                    numberPlate: row['Number Plate'] || '',
                    sticker: row['Sticker'] || '',
                    description: row['Description'] || '',
                    phoneNumber: row['Phone Number'] || '',
                    workType: (Object.values(WorkType).includes(row['Work Type']) ? row['Work Type'] : WorkType.Other) as WorkType,
                    createdAt: row['Date & Time'] ? new Date(row['Date & Time']).getTime() : Date.now(),
                    isComplete: row['Status']?.toLowerCase() === 'complete' || false,
                    advance: parseFloat(row['Advance']) || 0,
                    baqaya: parseFloat(row['Baqaya']) || 0,
                    imageUrl: row['Image URL'] || undefined,
                }));
                
                if (importedLogs.length > 0) {
                    await dbService.importLogs(importedLogs);
                    showNotification(`${importedLogs.length} logs imported successfully.`);
                } else {
                    showNotification('No valid logs found in CSV file.');
                }
            },
            error: (error) => {
                showNotification(`Error parsing CSV: ${error.message}`);
                console.error(error);
            }
        });
        event.target.value = ''; // Reset file input
    };

    return (
        <div className="min-h-screen">
            <Header onAddNew={handleAddNew} />
            <main className="p-4 mx-auto max-w-7xl sm:px-6 lg:p-8">
                
                {/* Connection Status Indicator */}
                <div className="flex justify-end mb-4">
                    <div className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full border ${isCloudEnabled ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800'}`}>
                        <CloudIcon className="w-3.5 h-3.5 mr-1.5" />
                        <span className="flex items-center gap-1.5">
                            {isCloudEnabled ? 'Cloud Synced' : 'Local Storage'}
                            <span className={`relative flex h-2 w-2`}>
                              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isCloudEnabled ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
                              <span className={`relative inline-flex rounded-full h-2 w-2 ${isCloudEnabled ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                            </span>
                        </span>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 gap-5 mb-8 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard icon={<MoneyIcon className="w-6 h-6"/>} title="Total Advance" value={`PKR ${totalAdvance.toLocaleString()}`} color="from-green-400 to-green-500"/>
                    <StatCard icon={<MoneyIcon className="w-6 h-6"/>} title="Total Baqaya" value={`PKR ${totalBaqaya.toLocaleString()}`} color="from-orange-400 to-orange-500"/>
                    <StatCard icon={<CheckCircleIcon className="w-6 h-6"/>} title="Completed Orders" value={completedCount.toString()} color="from-blue-400 to-blue-500"/>
                    <StatCard icon={<ClockIcon className="w-6 h-6"/>} title="Pending Orders" value={pendingCount.toString()} color="from-red-400 to-red-500"/>
                </div>

                {/* Controls Bar */}
                <div className="p-5 mb-8 bg-white/70 backdrop-blur-sm dark:bg-slate-900/70 border rounded-xl shadow-lg dark:border-slate-800">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                       <div className="relative w-full xl:col-span-2">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <SearchIcon className="w-5 h-5 text-slate-400" />
                            </div>
                            <input type="text" placeholder="Search by Plate, Phone, Description..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 input-style" />
                        </div>
                        <select value={workTypeFilter} onChange={(e) => setWorkTypeFilter(e.target.value)} className="w-full input-style">
                            <option value="">All Work Types</option>
                            {Object.values(WorkType).map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                         <select value={completionFilter} onChange={(e) => setCompletionFilter(e.target.value)} className="w-full input-style">
                            <option value="">All Statuses</option>
                            <option value="completed">Completed</option>
                            <option value="pending">Pending</option>
                        </select>
                         <button onClick={clearFilters} className="flex items-center justify-center w-full gap-2 px-4 py-2 font-semibold text-white transition-colors duration-300 rounded-full bg-slate-500 hover:bg-slate-600">
                            <ClearIcon className="w-5 h-5" />
                            Clear Filters
                        </button>
                    </div>
                     <div className="flex flex-wrap items-center gap-4 pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
                         <div className="relative flex-grow">
                            <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full input-style" />
                         </div>
                         <div className="flex gap-2">
                             <button onClick={setToday} className="px-4 py-2 font-medium transition-colors duration-200 border rounded-full text-slate-600 bg-slate-100 border-slate-300 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700">Today</button>
                             <button onClick={setYesterday} className="px-4 py-2 font-medium transition-colors duration-200 border rounded-full text-slate-600 bg-slate-100 border-slate-300 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700">Yesterday</button>
                         </div>
                    </div>
                </div>

                {/* Actions Bar & Data Table */}
                <div className="overflow-hidden bg-white/70 backdrop-blur-sm dark:bg-slate-900/70 border rounded-xl shadow-lg dark:border-slate-800">
                    <div className="flex flex-wrap items-center justify-between gap-4 p-5 border-b dark:border-slate-800">
                       <div>
                           <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Work Log</h3>
                           <p className="text-sm text-slate-500 dark:text-slate-400">Showing {filteredLogs.length} of {logs.length} entries</p>
                       </div>
                        <div className="flex flex-wrap gap-3">
                            <button onClick={handleCopyAll} className="px-4 py-2 text-sm font-semibold transition-colors duration-300 bg-white border rounded-full text-slate-700 hover:bg-slate-100 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700">Copy All</button>
                            <button onClick={() => exportToCsv(filteredLogs)} className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-full hover:bg-green-700 transition-colors duration-300">Export CSV</button>
                            <label className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 rounded-full cursor-pointer hover:bg-purple-700 transition-colors duration-300">
                                Import CSV
                                <input type="file" accept=".csv" onChange={handleImport} className="hidden" />
                            </label>
                        </div>
                    </div>
                    <LogTable 
                        logs={filteredLogs} 
                        onEdit={handleEdit} 
                        onDelete={handleDelete} 
                        onToggleComplete={handleToggleComplete} 
                        isLoading={isLoading}
                    />
                </div>
            </main>

            <LogForm 
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSave={handleSaveLog}
                logToEdit={logToEdit}
            />
            
            {/* Notification */}
            {notification && (
                <div className="fixed px-6 py-3 text-white rounded-full shadow-lg bottom-5 right-5 bg-gradient-to-r from-primary-500 to-primary-600 animate-fade-in-out">
                    {notification}
                </div>
            )}
             <style jsx global>{`
                .input-style {
                    display: block; width: 100%; padding: 0.6rem 0.9rem; font-size: 0.875rem; color: #334155; background-color: #fff; border: 1px solid #cbd5e1; border-radius: 0.75rem; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); transition: border-color 0.2s, box-shadow 0.2s;
                }
                .dark .input-style { color: #e2e8f0; background-color: #1e293b; border-color: #334155; }
                .input-style:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #6366f1; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2); }
                @keyframes fade-in-out {
                    0% { opacity: 0; transform: translateY(10px) scale(0.95); }
                    10% { opacity: 1; transform: translateY(0) scale(1); }
                    90% { opacity: 1; transform: translateY(0) scale(1); }
                    100% { opacity: 0; transform: translateY(10px) scale(0.95); }
                }
                .animate-fade-in-out {
                    animation: fade-in-out 3s ease-in-out;
                }
             `}</style>
        </div>
    );
};

export default Dashboard;