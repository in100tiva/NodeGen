import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { IconBell } from './Icons';
import NotificationCenter from './NotificationCenter';

const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Verificar se a função existe antes de usar
  const hasCountFn = typeof (api as any)?.notifications?.countUnreadNotifications !== 'undefined';
  
  
  // Usar 'skip' se a função não existir para evitar erro
  // useQuery retorna undefined se a função não existir ou se houver erro
  const unreadCountResult = useQuery(
    hasCountFn ? (api as any).notifications.countUnreadNotifications : 'skip',
    {}
  );
  
  
  const unreadCount = (typeof unreadCountResult === 'number' ? unreadCountResult : 0) || 0;

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
        title="Notificações"
      >
        <IconBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-accent text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <NotificationCenter onClose={() => setIsOpen(false)} />
      )}
    </>
  );
};

export default NotificationBell;

