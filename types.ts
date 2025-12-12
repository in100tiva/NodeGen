export interface Position {
  x: number;
  y: number;
}

export type NodeType = 'input-text' | 'input-file' | 'llm-model' | 'output-display';

export interface NodeData {
  label: string;
  value?: string;
  model?: string;
  isProcessing?: boolean;
  fileName?: string; // Para o card de arquivo
}

export interface Node {
  id: string;
  type: NodeType;
  position: Position;
  data: NodeData;
  inputs: string[];
  outputs: string[];
}

export interface Edge {
  id: string;
  source: string; // ID do Node de origem
  sourceHandle: string; // ID do output handle
  target: string; // ID do Node de destino
  targetHandle: string; // ID do input handle
}

export interface AppSettings {
  openRouterKey: string;
  theme: 'dark' | 'light';
}