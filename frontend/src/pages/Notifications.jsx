import React, { useEffect, useState } from 'react';
import { decisionService } from '../services/decisionService';
import { Bell, CheckCircle2 } from 'lucide-react';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const data = await decisionService.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await decisionService.markNotificationRead(id);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await decisionService.markAllNotificationsRead();
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8">Loading notifications...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-slate-500 mt-1">Stay updated on your decisions and approvals</p>
        </div>
        <button onClick={handleMarkAllRead} className="btn-secondary text-sm">
          Mark all as read
        </button>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">You're all caught up!</p>
          </div>
        ) : (
          notifications.map(n => (
            <div key={n.id} className={`p-4 rounded-xl border flex items-start gap-4 ${n.is_read ? 'bg-white border-slate-100' : 'bg-brand/5 border-brand/20'}`}>
              <div className={`mt-1 ${n.is_read ? 'text-slate-400' : 'text-brand'}`}>
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className={`text-sm ${n.is_read ? 'text-slate-600' : 'text-slate-900 font-semibold'}`}>{n.content}</p>
                <p className="text-xs text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
              </div>
              {!n.is_read && (
                <button onClick={() => handleMarkRead(n.id)} className="text-brand hover:bg-brand/10 p-1.5 rounded-lg transition-colors" title="Mark as read">
                  <CheckCircle2 className="w-5 h-5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
