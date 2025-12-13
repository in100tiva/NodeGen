import React from 'react';
import { Node } from '../../types';

interface HttpNodeProps {
  node: Node;
  onUpdateData: (nodeId: string, data: any) => void;
}

const HttpNode: React.FC<HttpNodeProps> = ({ node, onUpdateData }) => {
  return (
    <div className="p-3 pt-4 space-y-3">
      <div>
        <label className="text-xs font-semibold text-zinc-500 uppercase mb-1 block">Método</label>
        <select
          className="w-full bg-black/20 border border-border rounded p-2 text-xs text-zinc-200 focus:outline-none focus:border-primary transition-colors"
          value={node.data.method || 'GET'}
          onChange={(e) => onUpdateData(node.id, { method: e.target.value })}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="PATCH">PATCH</option>
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-zinc-500 uppercase mb-1 block">URL</label>
        <input
          type="text"
          className="w-full bg-black/20 border border-border rounded p-2 text-xs text-zinc-200 focus:outline-none focus:border-primary transition-colors"
          placeholder="https://api.exemplo.com/endpoint"
          value={node.data.url || ''}
          onChange={(e) => onUpdateData(node.id, { url: e.target.value })}
          onMouseDown={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
};

export default HttpNode;
