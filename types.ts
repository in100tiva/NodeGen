export interface Position {
  x: number;
  y: number;
}

export type NodeType = 'input-text' | 'github-repo' | 'llm-model' | 'output-display';

export interface NodeData {
  label: string;
  value?: string;
  model?: string;
  isProcessing?: boolean;
  // GitHub Repo fields
  githubRepo?: string;
  githubBranch?: string;
  githubPath?: string;
  githubMode?: 'list' | 'read' | 'search';
  githubSearchQuery?: string;
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