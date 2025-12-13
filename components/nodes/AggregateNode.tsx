import React from 'react';
import { Node } from '../../types';

interface AggregateNodeProps {
  node: Node;
  onUpdateData: (nodeId: string, data: any) => void;
}

const AggregateNode: React.FC<AggregateNodeProps> = ({ node, onUpdateData }) => {
  return (
    <div className="p-3 pt-4 space-y-3">
      <div>
        <label className="text-xs font-semibold text-zinc-500 uppercase mb-1 block">Operação</label>
        <select
          className="w-full bg-black/20 border border-border rounded p-2 text-xs text-zinc-200 focus:outline-none focus:border-primary transition-colors"
          value={node.data.operation || 'sum'}
          onChange={(e) => onUpdateData(node.id, { operation: e.target.value })}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <option value="sum">Soma</option>
          <option value="avg">Média</option>
          <option value="max">Máximo</option>
          <option value="min">Mínimo</option>
          <option value="count">Contagem</option>
        </select>
      </div>
    </div>
  );
};

export default AggregateNode;
