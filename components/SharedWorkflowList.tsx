import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';

interface SharedWorkflowListProps {
  onSelectWorkflow: (workflowId: Id<'workflows'>) => void;
  onClose: () => void;
}

const SharedWorkflowList: React.FC<SharedWorkflowListProps> = ({ onSelectWorkflow, onClose }) => {
  const sharedWorkflows: any[] = []; // TODO: Implementar quando sharing.ts estiver disponível

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-white">Workflows Compartilhados</h2>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {sharedWorkflows.length === 0 ? (
            <p className="text-zinc-400 text-sm text-center py-8">
              Nenhum workflow compartilhado encontrado.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sharedWorkflows.map((workflow: any) => (
                <div
                  key={workflow._id}
                  onClick={() => {
                    onSelectWorkflow(workflow._id);
                    onClose();
                  }}
                  className="p-4 bg-zinc-800 border border-zinc-700 rounded-lg cursor-pointer hover:border-accent transition-colors"
                >
                  <h3 className="text-lg font-semibold mb-2">{workflow.name}</h3>
                  {workflow.description && (
                    <p className="text-sm text-zinc-400 mb-2">{workflow.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SharedWorkflowList;
