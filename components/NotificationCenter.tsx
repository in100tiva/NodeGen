import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { IconX } from './Icons';

interface NotificationCenterProps {
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ onClose }) => {
  // Verificar se a função existe antes de usar
  const hasNotificationsFn = typeof (api as any)?.notifications?.listNotifications !== 'undefined';
  
  const notifications = useQuery(
    hasNotificationsFn ? (api as any).notifications.listNotifications : 'skip',
    { limit: 50 }
  ) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <h2 className="text-lg font-semibold text-white">Notificações</h2>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {!hasNotificationsFn ? (
            <p className="text-zinc-400 text-sm text-center py-8">
              Sistema de notificações em desenvolvimento...
            </p>
          ) : notifications.length === 0 ? (
            <p className="text-zinc-400 text-sm text-center py-8">
              Nenhuma notificação
            </p>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification: any) => (
                <div
                  key={notification._id}
                  className="p-3 bg-zinc-800 border border-zinc-700 rounded hover:bg-zinc-750 transition-colors"
                >
                  <p className="text-sm text-white">{notification.message}</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    {new Date(notification.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
