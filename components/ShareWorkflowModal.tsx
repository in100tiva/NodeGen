import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';
import { IconX } from './Icons';

interface ShareWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: Id<'workflows'>;
}

const ShareWorkflowModal: React.FC<ShareWorkflowModalProps> = ({ isOpen, onClose, workflowId }) => {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  // const shareWorkflow = useMutation(api.sharing.shareWorkflow); // TODO: Implementar quando sharing.ts estiver disponível

  if (!isOpen) return null;

  const handleShare = async () => {
    // TODO: Implementar quando sharing.ts estiver disponível
    alert('Funcionalidade de compartilhamento em desenvolvimento');
    setEmail('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Compartilhar Workflow</h2>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Email do usuário
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-accent"
              placeholder="usuario@exemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Permissão
            </label>
            <select
              value={permission}
              onChange={(e) => setPermission(e.target.value as 'view' | 'edit')}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-accent"
            >
              <option value="view">Visualizar</option>
              <option value="edit">Editar</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleShare}
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
            >
              Compartilhar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareWorkflowModal;
