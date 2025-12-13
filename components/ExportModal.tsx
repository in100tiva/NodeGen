import React, { useState } from 'react';
import { IconX, IconDownload } from './Icons';
import { Id } from '../convex/_generated/dataModel';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflow: {
    _id: Id<'workflows'>;
    name: string;
    description?: string;
    nodes: any[];
    edges: any[];
    settings: any;
  };
  canvasElement?: HTMLElement;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, workflow, canvasElement }) => {
  const [format, setFormat] = useState<'json' | 'png'>('json');

  if (!isOpen) return null;

  const handleExport = () => {
    if (format === 'json') {
      const dataStr = JSON.stringify(workflow, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${workflow.name}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } else if (format === 'png' && canvasElement) {
      // Implementar exportação PNG se necessário
      alert('Exportação PNG em desenvolvimento');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Exportar Workflow</h2>
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
              Formato
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as 'json' | 'png')}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-accent"
            >
              <option value="json">JSON</option>
              <option value="png">PNG (em desenvolvimento)</option>
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
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
            >
              <IconDownload className="w-4 h-4" />
              Exportar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
