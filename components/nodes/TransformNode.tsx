import React from 'react';
import { Node } from '../../types';

interface TransformNodeProps {
  node: Node;
  onUpdateData: (nodeId: string, data: any) => void;
}

const TransformNode: React.FC<TransformNodeProps> = ({ node, onUpdateData }) => {
  return (
    <div className="p-3 pt-4 space-y-3">
      <div>
        <label className="text-xs font-semibold text-zinc-500 uppercase mb-1 block">Transformação</label>
        <textarea
          className="w-full bg-black/20 border border-border rounded p-2 text-xs text-zinc-200 resize-none focus:outline-none focus:border-primary h-20 transition-colors"
          placeholder="Digite a transformação..."
          value={node.data.transform || ''}
          onChange={(e) => onUpdateData(node.id, { transform: e.target.value })}
          onMouseDown={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};

export default TransformNode;
