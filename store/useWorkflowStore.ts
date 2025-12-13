import React from 'react';
import { create } from 'zustand';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';
import { Node, Edge, AppSettings } from '../types';

interface Workflow {
  _id: Id<'workflows'>;
  userId: string;
  name: string;
  description?: string;
  nodes: Node[];
  edges: Edge[];
  settings: AppSettings;
  createdAt: number;
  updatedAt: number;
  isDefault: boolean;
}

interface WorkflowState {
  workflows: Workflow[];
  currentWorkflowId: Id<'workflows'> | null;
  currentWorkflow: Workflow | null;
  isLoading: boolean;
  skipAutoSelect: boolean; // Flag para evitar auto-seleção quando usuário quer ver lista
  setCurrentWorkflowId: (id: Id<'workflows'> | null) => void;
  setWorkflows: (workflows: Workflow[], skipAutoSelect?: boolean) => void;
  createWorkflow: (name: string, nodes: Node[], edges: Edge[], settings: AppSettings) => Promise<Id<'workflows'>>;
  updateWorkflow: (id: Id<'workflows'>, updates: Partial<Workflow>) => Promise<void>;
  deleteWorkflow: (id: Id<'workflows'>) => Promise<void>;
  setDefaultWorkflow: (id: Id<'workflows'>) => Promise<void>;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  workflows: [],
  currentWorkflowId: null,
  currentWorkflow: null,
  isLoading: false,
  skipAutoSelect: false,

  setCurrentWorkflowId: (id) => {
    // Se estamos definindo um workflow (não null), resetar a flag skipAutoSelect
    if (id !== null) {
      set({ skipAutoSelect: false });
    }
    set({ currentWorkflowId: id });
    const workflow = get().workflows.find(w => w._id === id);
    set({ currentWorkflow: workflow || null });
  },

  setWorkflows: (workflows, skipAutoSelect = false) => {
    // Usar flag do store se não foi passada explicitamente
    const shouldSkip = skipAutoSelect || get().skipAutoSelect;
    set({ workflows, skipAutoSelect: shouldSkip });
    const currentId = get().currentWorkflowId;
    if (currentId) {
      const workflow = workflows.find(w => w._id === currentId);
      set({ currentWorkflow: workflow || null });
    } else if (!shouldSkip) {
      // Se não há workflow atual E não estamos pulando auto-seleção, usar o default
      const defaultWorkflow = workflows.find(w => w.isDefault);
      if (defaultWorkflow) {
        set({ 
          currentWorkflowId: defaultWorkflow._id,
          currentWorkflow: defaultWorkflow 
        });
      }
    } else {
      // Limpar workflow atual quando skipAutoSelect é true
      set({ currentWorkflow: null });
    }
  },

  createWorkflow: async (name, nodes, edges, settings) => {
    // Esta função será implementada usando useMutation
    // Por enquanto, retorna um placeholder
    throw new Error('Use createWorkflowMutation from component');
  },

  updateWorkflow: async (id, updates) => {
    // Esta função será implementada usando useMutation
    throw new Error('Use updateWorkflowMutation from component');
  },

  deleteWorkflow: async (id) => {
    // Esta função será implementada usando useMutation
    throw new Error('Use deleteWorkflowMutation from component');
  },

  setDefaultWorkflow: async (id) => {
    // Esta função será implementada usando useMutation
    throw new Error('Use setDefaultWorkflowMutation from component');
  },
}));

// Hooks para usar com Convex
export function useWorkflows() {
  const workflows = useQuery(api.workflows.listWorkflows) || [];
  const setWorkflows = useWorkflowStore((state) => state.setWorkflows);
  const workflowsRef = React.useRef<string>('');

  React.useEffect(() => {
    // Comparar apenas os IDs para evitar atualizações desnecessárias
    const currentIds = workflows.map(w => w._id).sort().join(',');
    
    // Só atualizar se os IDs mudaram
    if (currentIds !== workflowsRef.current) {
      workflowsRef.current = currentIds;
      // Verificar se devemos pular auto-seleção (quando usuário quer ver lista)
      const shouldSkipAutoSelect = useWorkflowStore.getState().skipAutoSelect;
      setWorkflows(workflows, shouldSkipAutoSelect);
      // NÃO resetar flag aqui - ela será resetada quando um workflow for explicitamente selecionado
      // A flag deve permanecer ativa enquanto o usuário está na lista de workflows
    }
  }, [workflows, setWorkflows]);

  return workflows;
}

export function useWorkflowMutations() {
  const createWorkflowMutation = useMutation(api.workflows.createWorkflow);
  const updateWorkflowMutation = useMutation(api.workflows.updateWorkflow);
  const deleteWorkflowMutation = useMutation(api.workflows.deleteWorkflow);
  const setDefaultWorkflowMutation = useMutation(api.workflows.setDefaultWorkflow);

  return {
    createWorkflow: createWorkflowMutation,
    updateWorkflow: updateWorkflowMutation,
    deleteWorkflow: deleteWorkflowMutation,
    setDefaultWorkflow: setDefaultWorkflowMutation,
  };
}

