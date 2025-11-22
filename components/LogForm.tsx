import React, { useState, useEffect } from 'react';
import { LogEntry, WorkType } from '../types';
import { WhatsappIcon } from './icons/WhatsappIcon';
import { ImageIcon } from './icons/ImageIcon';

interface LogFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (log: Omit<LogEntry, 'id' | 'serialNumber' | 'createdAt' | 'isComplete'> | LogEntry) => void;
  logToEdit: LogEntry | null;
}

const LogForm: React.FC<LogFormProps> = ({ isOpen, onClose, onSave, logToEdit }) => {
  const [numberPlate, setNumberPlate] = useState('');
  const [sticker, setSticker] = useState('');
  const [description, setDescription] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [workType, setWorkType] = useState<WorkType>(WorkType.NumberPlate);
  const [advance, setAdvance] = useState('');
  const [baqaya, setBaqaya] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    if (logToEdit) {
      setNumberPlate(logToEdit.numberPlate);
      setSticker(logToEdit.sticker);
      setDescription(logToEdit.description);
      setPhoneNumber(logToEdit.phoneNumber);
      setWorkType(logToEdit.workType);
      setAdvance(logToEdit.advance.toString());
      setBaqaya(logToEdit.baqaya.toString());
      setImageUrl(logToEdit.imageUrl);
    } else {
      resetForm();
    }
  }, [logToEdit]);

  const resetForm = () => {
    setNumberPlate('');
    setSticker('');
    setDescription('');
    setPhoneNumber('');
    setWorkType(WorkType.NumberPlate);
    setAdvance('');
    setBaqaya('');
    setImageUrl(undefined);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numberPlate && !description) {
        alert("Please enter a Number Plate/Name or a Description.");
        return;
    }
    const logData = { 
        numberPlate, 
        sticker, 
        description, 
        phoneNumber, 
        workType, 
        advance: parseFloat(advance) || 0,
        baqaya: parseFloat(baqaya) || 0,
        imageUrl: imageUrl,
    };

    if (logToEdit) {
      onSave({ ...logToEdit, ...logData });
    } else {
      onSave(logData as Omit<LogEntry, 'id' | 'serialNumber' | 'createdAt' | 'isComplete'>);
    }
    resetForm();
    onClose();
  };

  const handleSendWhatsApp = () => {
    if (!phoneNumber) {
      alert("Please enter a phone number.");
      return;
    }

    const cleanedPhoneNumber = phoneNumber.replace(/[^0-9+]/g, '');

    const message = `*Order Details:*\n` +
                    `------------------\n` +
                    `*Plate/Name:* ${numberPlate || 'N/A'}\n` +
                    `*Sticker:* ${sticker || 'N/A'}\n` +
                    `*Description:* ${description || 'N/A'}\n` +
                    `*Image Attached:* ${imageUrl ? 'Yes' : 'No'}\n` +
                    `------------------\n` +
                    `*Advance Paid:* PKR ${advance || 0}\n` +
                    `*Balance Due:* PKR ${baqaya || 0}\n\n` +
                    `Thank you!`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanedPhoneNumber}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm transition-opacity duration-300">
      <div className="w-full max-w-lg p-6 bg-slate-50 border rounded-xl shadow-2xl dark:bg-slate-900 m-4 border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto transition-transform duration-300 scale-95 animate-scale-in">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">{logToEdit ? 'Edit Log' : 'Add New Log'}</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Number Plate / Name</label>
            <input type="text" value={numberPlate} onChange={(e) => setNumberPlate(e.target.value)} className="input-style" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Sticker / Additional Identifier</label>
            <input type="text" value={sticker} onChange={(e) => setSticker(e.target.value)} className="input-style" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Full Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-style" rows={3}></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Phone Number</label>
            <div className="relative">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full pr-10 input-style"
                placeholder="e.g., 923001234567"
              />
              {logToEdit && phoneNumber && (
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="absolute inset-y-0 right-0 flex items-center justify-center w-10 h-full text-green-500 transition-colors duration-200 rounded-r-lg hover:bg-green-500/10 focus:outline-none"
                  title="Send details via WhatsApp"
                  aria-label="Send details via WhatsApp"
                >
                  <WhatsappIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
           <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Advance (PKR)</label>
              <input type="number" value={advance} onChange={(e) => setAdvance(e.target.value)} placeholder="0" className="input-style" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Baqaya / Balance (PKR)</label>
              <input type="number" value={baqaya} onChange={(e) => setBaqaya(e.target.value)} placeholder="0" className="input-style" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Work Type</label>
            <select value={workType} onChange={(e) => setWorkType(e.target.value as WorkType)} className="input-style">
              {Object.values(WorkType).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Image</label>
            <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-colors duration-300 bg-white border rounded-full cursor-pointer text-slate-700 hover:bg-slate-100 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700">
                  <ImageIcon className="w-4 h-4" />
                  <span>{imageUrl ? 'Change Image' : 'Upload Image'}</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              {imageUrl && (
                <div className="relative group">
                  <img src={imageUrl} alt="Preview" className="object-cover w-16 h-16 rounded-lg" />
                  <button 
                    type="button" 
                    onClick={() => setImageUrl(undefined)}
                    className="absolute top-0 right-0 flex items-center justify-center w-6 h-6 transition-opacity bg-red-500 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label="Remove image"
                  >
                    <span className="text-lg font-bold text-white">&times;</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4 space-x-4">
            <button type="button" onClick={onClose} className="px-5 py-2.5 font-semibold transition-colors duration-300 bg-white border rounded-full text-slate-700 hover:bg-slate-100 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-300 dark:focus:ring-slate-600">Cancel</button>
            <button type="submit" className="px-6 py-2.5 font-semibold text-white transition-all duration-300 rounded-full shadow-lg bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-800">Save</button>
          </div>
        </form>
      </div>
       <style jsx global>{`
          .input-style {
            display: block;
            width: 100%;
            padding: 0.6rem 0.9rem;
            font-size: 0.875rem;
            line-height: 1.25rem;
            color: #334155;
            background-color: #fff;
            border: 1px solid #cbd5e1;
            border-radius: 0.75rem;
            box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
            transition: border-color 0.2s, box-shadow 0.2s;
          }
          .dark .input-style {
            color: #e2e8f0;
            background-color: #374151; /* A bit lighter than form bg */
            border-color: #4b5563;
          }
          .input-style:focus {
            outline: 2px solid transparent;
            outline-offset: 2px;
            border-color: #6366f1; /* primary-500 */
            box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2);
          }
          @keyframes scale-in {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          .animate-scale-in {
              animation: scale-in 0.2s ease-out forwards;
          }
        `}</style>
    </div>
  );
};

export default LogForm;