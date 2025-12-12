import React, { useState } from 'react';
import { IconX } from './Icons';
import { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [key, setKey] = useState(settings.openRouterKey);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[500px] bg-surface border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border bg-zinc-900/50">
          <h2 className="text-lg font-semibold text-white">Configurações de API</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <IconX className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">
              OpenRouter API Key
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="sk-or-..."
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm font-mono text-zinc-100"
            />
            <p className="text-xs text-zinc-500">
              Sua chave é armazenada apenas localmente no navegador e usada para requisitar modelos.
            </p>
          </div>

          <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <h3 className="text-sm font-semibold text-primary mb-1">Nota de Desenvolvimento</h3>
            <p className="text-xs text-zinc-300">
              Esta aplicação usa o OpenRouter para acessar modelos como GPT-4, Claude 3, Llama 3, etc. Certifique-se de que sua chave tem créditos.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-border bg-zinc-900/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={() => {
              onSave({ ...settings, openRouterKey: key });
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-indigo-600 rounded-lg shadow-lg shadow-primary/20 transition-all"
          >
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;