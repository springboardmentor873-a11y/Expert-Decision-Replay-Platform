import React, { useContext, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { AuthContext } from '../context/AuthContext';
import { Bell, Check } from 'lucide-react';
import { decisionService } from '../services/decisionService';

const DashboardLayout = ({ children }) => {
  const { user } = useContext(AuthContext);

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const data = await decisionService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await decisionService.markNotificationRead(id);
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await decisionService.markAllNotificationsRead();
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <div className="flex justify-end mb-4">
          {user && (
            <div className="flex items-center gap-6">
              
              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h4 className="font-bold text-slate-800 text-sm">Notifications</h4>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllAsRead} className="text-xs text-brand font-medium hover:underline">
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="p-4 text-center text-sm text-slate-500">No notifications</p>
                      ) : (
                        notifications.map(notification => (
                          <div key={notification.id} className={`p-4 border-b border-slate-100 flex gap-3 ${notification.is_read ? 'opacity-60' : 'bg-blue-50/30'}`}>
                            <div className="flex-1">
                              <p className={`text-sm ${notification.is_read ? 'text-slate-600' : 'text-slate-900 font-medium'}`}>
                                {notification.content}
                              </p>
                              <span className="text-xs text-slate-400 mt-1 block">
                                {new Date(notification.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            {!notification.is_read && (
                              <button onClick={() => handleMarkAsRead(notification.id)} className="text-brand hover:bg-brand/10 p-1 rounded-full h-fit">
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-800">{user.full_name}</p>
                  <p className="text-xs text-slate-500">{user.role === 'EMPLOYEE' ? 'Employee' : user.role}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center font-bold shadow-md shadow-brand/20">
                  {user.full_name?.charAt(0)?.toUpperCase()}
                </div>
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
