import React, { useContext } from 'react';
import Sidebar from './Sidebar';
import { AuthContext } from '../context/AuthContext';

const DashboardLayout = ({ children }) => {
  const { user } = useContext(AuthContext);

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        {/* We can place the top right profile widget here if it's universal, or let individual pages handle it. 
            The screenshot shows it above the main content headers. */}
        <div className="flex justify-end mb-4">
          {user && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800">{user.full_name}</p>
                <p className="text-xs text-slate-500">{user.role === 'EMPLOYEE' ? 'Employee' : user.role}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center font-bold shadow-md shadow-brand/20">
                {user.full_name?.charAt(0)?.toUpperCase()}
              </div>
            </div>
          )}
        </div>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
