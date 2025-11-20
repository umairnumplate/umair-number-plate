import React from 'react';
import { LogoIcon } from './icons/LogoIcon';
import { PlusIcon } from './icons/PlusIcon';

interface HeaderProps {
  onAddNew: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAddNew }) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur flex-none transition-colors duration-500 lg:z-50 lg:border-b lg:border-slate-900/10 dark:border-slate-50/[0.06] bg-white/80 dark:bg-slate-900/80">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
                 <LogoIcon className="w-10 h-10 text-primary-500" />
                <h1 className="text-xl font-bold tracking-tight text-slate-800 md:text-2xl dark:text-white">
                    Umair Number Plate
                </h1>
            </div>
          
            <button 
              onClick={onAddNew} 
              className="flex items-center justify-center gap-2 px-5 py-2.5 font-semibold text-white transition-all duration-300 rounded-full shadow-lg bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-800"
            >
                <PlusIcon className="w-5 h-5" /> 
                <span className="hidden sm:inline">Add New Log</span>
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;