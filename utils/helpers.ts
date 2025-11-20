import { LogEntry } from '../types';

export const formatDate = (timestamp: number): string => {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));
};

export const copyToClipboard = (text: string): Promise<void> => {
  return navigator.clipboard.writeText(text);
};

const toCsvRow = (row: string[]): string => {
  return row.map(val => `"${val.replace(/"/g, '""')}"`).join(',');
};

export const exportToCsv = (logs: LogEntry[]) => {
  const headers = ['Serial Number', 'Date & Time', 'Number Plate', 'Sticker', 'Description', 'Phone Number', 'Work Type', 'Status', 'Advance', 'Baqaya'];
  const rows = logs.map(log => [
    log.serialNumber.toString(),
    formatDate(log.createdAt),
    log.numberPlate,
    log.sticker,
    log.description,
    log.phoneNumber,
    log.workType,
    log.isComplete ? 'Complete' : 'Pending',
    log.advance.toString(),
    log.baqaya.toString(),
  ]);

  const csvContent = [
    toCsvRow(headers),
    ...rows.map(row => toCsvRow(row))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'work_log.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const generateTabSeparated = (logs: LogEntry[]): string => {
  const headers = ['Serial Number', 'Date & Time', 'Number Plate', 'Sticker', 'Description', 'Phone Number', 'Work Type', 'Status', 'Advance', 'Baqaya'];
  const rows = logs.map(log => [
    log.serialNumber.toString(),
    formatDate(log.createdAt),
    log.numberPlate,
    log.sticker,
    log.description,
    log.phoneNumber,
    log.workType,
    log.isComplete ? 'Complete' : 'Pending',
    `PKR ${log.advance}`,
    `PKR ${log.baqaya}`,
  ].join('\t'));

  return [headers.join('\t'), ...rows].join('\n');
};

export const formatSingleRecord = (log: LogEntry): string => {
    return `*Order Details:*\n` +
           `------------------\n` +
           `*Serial No:* ${log.serialNumber}\n` +
           `*Date:* ${formatDate(log.createdAt)}\n` +
           `*Status:* ${log.isComplete ? 'Complete' : 'Pending'}\n` +
           `------------------\n` +
           `*Plate/Name:* ${log.numberPlate || 'N/A'}\n` +
           `*Sticker:* ${log.sticker || 'N/A'}\n` +
           `*Description:* ${log.description || 'N/A'}\n` +
           `*Phone:* ${log.phoneNumber || 'N/A'}\n` +
           `*Work Type:* ${log.workType}\n` +
           `------------------\n` +
           `*Advance:* PKR ${log.advance}\n` +
           `*Baqaya:* PKR ${log.baqaya}`;
};