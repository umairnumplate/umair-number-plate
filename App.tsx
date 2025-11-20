import React from 'react';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300">
      <Dashboard />
    </div>
  );
};

export default App;