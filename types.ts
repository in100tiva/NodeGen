export interface Position {
  x: number;
  y: number;
}

export type NodeType = 
  | 'input-text' 
  | 'github-repo' 
  | 'llm-model' 
  | 'output-display'
  | 'conditional'
  | 'transform'
  | 'variable'
  | 'loop'
  | 'aggregate';

export interface NodeData {
  label: string;
  value?: string;
  model?: string;
  isProcessing?: boolean;
  
  // GitHub repo node
  githubRepo?: string; // owner/repo
  githubBranch?: string; // branch name
  githubPath?: string; // caminho do arquivo ou diretório
  githubSearchQuery?: string; // query para busca de código
  githubMode?: 'list' | 'read' | 'search'; // modo de operação
  
  // Conditional node
  condition?: 'contains' | 'equals' | 'greaterThan' | 'lessThan' | 'startsWith' | 'endsWith';
  conditionField?: string;
  conditionValue?: string;
  
  // Transform node
  transformOperation?: 'extract' | 'format' | 'parse' | 'merge' | 'split' | 'uppercase' | 'lowercase' | 'trim';
  transformConfig?: Record<string, any>;
  
  // Variable node
  variableName?: string;
  variableDefaultValue?: string;
  variableScope?: 'workflow' | 'node';
  
  // Loop node
  loopType?: 'foreach' | 'while' | 'count';
  loopCondition?: string;
  maxIterations?: number;
  
  // Aggregate node
  aggregateOperation?: 'concat' | 'sum' | 'average' | 'merge' | 'join';
  aggregateSeparator?: string;
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

export type InputType = 'text';

export interface AppSettings {
  openRouterKey: string;
  theme: 'dark' | 'light';
}