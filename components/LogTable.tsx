import React, { useState } from 'react';
import { LogEntry } from '../types';
import { formatDate, copyToClipboard, formatSingleRecord } from '../utils/helpers';
import { CopyIcon } from './icons/CopyIcon';
import { EditIcon } from './icons/EditIcon';
import { DeleteIcon } from './icons/DeleteIcon';
import { WhatsappIcon } from './icons/WhatsappIcon';

interface LogTableProps {
  logs: LogEntry[];
  onEdit: (log: LogEntry) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (log: LogEntry) => void;
}

type SortKey = keyof LogEntry;
type SortOrder = 'asc' | 'desc';

const LogTable: React.FC<LogTableProps> = ({ logs, onEdit, onDelete, onToggleComplete }) => {
    const [sortKey, setSortKey] = useState<SortKey>('createdAt');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopy = (log: LogEntry) => {
        const textToCopy = formatSingleRecord(log);
        copyToClipboard(textToCopy).then(() => {
            setCopiedId(log.id);
            setTimeout(() => setCopiedId(null), 2000);
        });
    };
    
    const handleWhatsAppLink = (phoneNumber: string) => {
        if (!phoneNumber) return;
        const cleanedPhoneNumber = phoneNumber.replace(/[^0-9+]/g, '');
        const whatsappUrl = `https://wa.me/${cleanedPhoneNumber}`;
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    };

    const sortedLogs = React.useMemo(() => {
        return [...logs].sort((a, b) => {
            const valA = a[sortKey];
            const valB = b[sortKey];

            if (valA < valB) {
                return sortOrder === 'asc' ? -1 : 1;
            }
            if (valA > valB) {
                return sortOrder === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [logs, sortKey, sortOrder]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('asc');
        }
    };
    
    const SortIndicator: React.FC<{ columnKey: SortKey }> = ({ columnKey }) => {
      if (sortKey !== columnKey) return null;
      return <span className="ml-1 text-primary-500">{sortOrder === 'asc' ? '▲' : '▼'}</span>;
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-slate-500 dark:text-slate-400">
                <thead className="sticky top-0 text-xs uppercase text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-400">
                    <tr>
                        { (
                            [
                                {key: 'serialNumber', label: 'Sr. No.'},
                                {key: 'isComplete', label: 'Status'},
                                {key: 'createdAt', label: 'Date & Time'},
                                {key: 'numberPlate', label: 'Number Plate'},
                                {key: 'sticker', label: 'Sticker'},
                                {key: 'description', label: 'Description'},
                                {key: 'phoneNumber', label: 'Phone'},
                                {key: 'workType', label: 'Type'},
                                {key: 'advance', label: 'Advance'},
                                {key: 'baqaya', label: 'Baqaya'},
                            ] as {key: SortKey; label: string}[]
                        ).map(({key, label}) => (
                           <th key={key} scope="col" className="px-6 py-4 font-bold tracking-wider cursor-pointer" onClick={() => handleSort(key)}>
                               {label} <SortIndicator columnKey={key} />
                           </th>
                        ))}
                        <th scope="col" className="px-6 py-3 text-right">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {sortedLogs.map((log) => (
                        <tr key={log.id} className={`border-b dark:border-slate-700 odd:bg-white even:bg-slate-50 dark:odd:bg-slate-900 dark:even:bg-slate-800/50 hover:bg-primary-50 dark:hover:bg-slate-800 transition-colors duration-200 ${log.isComplete ? 'opacity-60 line-through' : ''}`}>
                            <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap dark:text-white">{log.serialNumber}</td>
                            <td className="px-6 py-4">
                                <input 
                                    type="checkbox" 
                                    checked={log.isComplete} 
                                    onChange={() => onToggleComplete(log)}
                                    className="w-5 h-5 rounded cursor-pointer text-primary-600 form-checkbox bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:ring-primary-500 dark:focus:ring-offset-slate-900"
                                    title={log.isComplete ? 'Mark as Pending' : 'Mark as Complete'}
                                />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                            <td className="px-6 py-4 whitespace-nowrap font-medium">{log.numberPlate}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{log.sticker}</td>
                            <td className="px-6 py-4 max-w-xs truncate" title={log.description}>{log.description}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {log.phoneNumber ? (
                                    <a onClick={() => handleWhatsAppLink(log.phoneNumber)} className="inline-flex items-center gap-1.5 cursor-pointer text-green-600 dark:text-green-500 hover:underline">
                                        <WhatsappIcon className="w-4 h-4" />
                                        {log.phoneNumber}
                                    </a>
                                ) : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300">{log.workType}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-green-600 dark:text-green-400">PKR {log.advance.toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-red-600 dark:text-red-400">PKR {log.baqaya.toLocaleString()}</td>
                            <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                                <div className="flex items-center justify-end space-x-2">
                                    <button onClick={() => handleCopy(log)} className="p-2 text-slate-500 rounded-full hover:bg-primary-100 hover:text-primary-500 dark:hover:bg-primary-900/50" title="Copy">
                                        {copiedId === log.id ? <span className="text-xs text-green-500">Copied!</span> : <CopyIcon className="w-5 h-5" />}
                                    </button>
                                    <button onClick={() => onEdit(log)} className="p-2 text-slate-500 rounded-full hover:bg-yellow-100 hover:text-yellow-600 dark:hover:bg-yellow-500/10 dark:hover:text-yellow-400" title="Edit">
                                        <EditIcon className="w-5 h-5"/>
                                    </button>
                                    <button onClick={() => onDelete(log.id)} className="p-2 text-slate-500 rounded-full hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400" title="Delete">
                                        <DeleteIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
             {logs.length === 0 && (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                    No log entries found.
                </div>
            )}
        </div>
    );
};

export default LogTable;