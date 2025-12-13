import React from 'react';
import { IconX } from './Icons';

interface OutputPanelProps {
  result: any;
  nodeLabel?: string;
  onClose: () => void;
}

const OutputPanel: React.FC<OutputPanelProps> = ({ result, nodeLabel, onClose }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-64 bg-surface border-t border-border z-40 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-lg font-semibold text-white">
          Resultado {nodeLabel && `- ${nodeLabel}`}
        </h3>
        <button
          onClick={onClose}
          className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
        >
          <IconX className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-mono">
          {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default OutputPanel;
