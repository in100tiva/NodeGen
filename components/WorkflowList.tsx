import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';
import { IconPlus } from './Icons';

interface WorkflowListProps {
  onSelectWorkflow: (workflowId: Id<'workflows'>) => void;
  onCreateWorkflow?: () => void;
}

const WorkflowList: React.FC<WorkflowListProps> = ({ onSelectWorkflow, onCreateWorkflow }) => {
  const workflowsQuery = useQuery(api.workflows.listWorkflows, {});
  const workflows = workflowsQuery || [];

  // Debug: verificar se workflows estão sendo carregados
  React.useEffect(() => {
    if (workflowsQuery === undefined) {
      console.log('⏳ Carregando workflows...');
    } else if (workflowsQuery === null) {
      console.warn('⚠️ Query retornou null');
    } else {
      console.log('✅ Workflows carregados:', workflows);
      console.log('📊 Número de workflows:', workflows.length);
    }
  }, [workflowsQuery, workflows]);

  return (
    <div className="flex flex-col h-screen w-full bg-background text-zinc-100 p-8">
      <div className="max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Meus Workflows</h1>
          <button 
            onClick={() => {
              if (onCreateWorkflow) {
                onCreateWorkflow();
              } else {
                console.error('onCreateWorkflow não está definido');
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
          >
            <IconPlus className="w-5 h-5" />
            Novo Workflow
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflows.map((workflow: any) => (
            <div
              key={workflow._id}
              onClick={() => onSelectWorkflow(workflow._id)}
              className="p-6 bg-surface border border-border rounded-lg cursor-pointer hover:border-accent transition-colors"
            >
              <h3 className="text-lg font-semibold mb-2">{workflow.name}</h3>
              {workflow.description && (
                <p className="text-sm text-zinc-400 mb-4">{workflow.description}</p>
              )}
              <div className="text-xs text-zinc-500">
                {workflow.nodes?.length || 0} nós • {workflow.edges?.length || 0} conexões
              </div>
            </div>
          ))}
          {workflows.length === 0 && (
            <div className="col-span-full text-center py-12 text-zinc-400">
              Nenhum workflow encontrado. Crie um novo para começar.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowList;
