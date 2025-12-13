import { v } from "convex/values";
import { query } from "./_generated/server";

interface Node {
  id: string;
  type: string;
  inputs: string[];
  outputs: string[];
}

interface Edge {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Helper: Construir grafo direcionado a partir de edges
function buildGraph(nodes: Node[], edges: Edge[]): Map<string, string[]> {
  const graph = new Map<string, string[]>();
  
  // Inicializar todos os nós
  nodes.forEach(node => {
    graph.set(node.id, []);
  });
  
  // Adicionar arestas
  edges.forEach(edge => {
    const neighbors = graph.get(edge.source) || [];
    neighbors.push(edge.target);
    graph.set(edge.source, neighbors);
  });
  
  return graph;
}

// Helper: Detectar ciclos usando DFS
function detectCycles(graph: Map<string, string[]>, nodes: Node[]): string[] {
  const visited = new Set<string>();
  const recStack = new Set<string>();
  const cycles: string[] = [];
  
  function dfs(nodeId: string, path: string[]): boolean {
    if (recStack.has(nodeId)) {
      // Ciclo detectado
      const cycleStart = path.indexOf(nodeId);
      const cycle = path.slice(cycleStart).concat(nodeId);
      cycles.push(`Ciclo detectado: ${cycle.join(' → ')}`);
      return true;
    }
    
    if (visited.has(nodeId)) {
      return false;
    }
    
    visited.add(nodeId);
    recStack.add(nodeId);
    path.push(nodeId);
    
    const neighbors = graph.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (dfs(neighbor, [...path])) {
        return true;
      }
    }
    
    recStack.delete(nodeId);
    return false;
  }
  
  // Verificar todos os nós
  for (const node of nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id, []);
    }
  }
  
  return cycles;
}

// Validar estrutura do workflow
function validateStructure(nodes: Node[], edges: Edge[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Verificar se há pelo menos um nó de entrada
  const inputNodes = nodes.filter(n => n.type === 'input-text' || n.type === 'github-repo');
  if (inputNodes.length === 0) {
    errors.push('Workflow deve ter pelo menos um nó de entrada (input-text ou github-repo)');
  }
  
  // Verificar se há pelo menos um nó LLM
  const llmNodes = nodes.filter(n => n.type === 'llm-model');
  if (llmNodes.length === 0) {
    errors.push('Workflow deve ter pelo menos um nó de processamento LLM');
  }
  
  // Verificar se há pelo menos um nó de saída
  const outputNodes = nodes.filter(n => n.type === 'output-display');
  if (outputNodes.length === 0) {
    errors.push('Workflow deve ter pelo menos um nó de saída (output-display)');
  }
  
  // Verificar se todas as conexões são válidas
  for (const edge of edges) {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    if (!sourceNode) {
      errors.push(`Conexão ${edge.id}: nó de origem '${edge.source}' não existe`);
      continue;
    }
    
    if (!targetNode) {
      errors.push(`Conexão ${edge.id}: nó de destino '${edge.target}' não existe`);
      continue;
    }
    
    // Verificar se o sourceHandle existe no nó de origem
    if (!sourceNode.outputs.includes(edge.sourceHandle)) {
      errors.push(`Conexão ${edge.id}: handle de saída '${edge.sourceHandle}' não existe no nó '${sourceNode.id}'`);
    }
    
    // Verificar se o targetHandle existe no nó de destino
    if (!targetNode.inputs.includes(edge.targetHandle)) {
      errors.push(`Conexão ${edge.id}: handle de entrada '${edge.targetHandle}' não existe no nó '${targetNode.id}'`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Validar ciclos no grafo
function validateCycles(nodes: Node[], edges: Edge[]): { valid: boolean; errors: string[] } {
  const graph = buildGraph(nodes, edges);
  const cycles = detectCycles(graph, nodes);
  
  return {
    valid: cycles.length === 0,
    errors: cycles
  };
}

// Validar caminho completo (se há caminho de entrada até saída)
function validatePath(nodes: Node[], edges: Edge[]): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const inputNodes = nodes.filter(n => n.type === 'input-text' || n.type === 'github-repo');
  const outputNodes = nodes.filter(n => n.type === 'output-display');
  const graph = buildGraph(nodes, edges);
  
  // Verificar se há caminho de pelo menos um nó de entrada até um nó de saída
  function hasPath(start: string, visited: Set<string>): boolean {
    if (visited.has(start)) return false;
    visited.add(start);
    
    const node = nodes.find(n => n.id === start);
    if (node && node.type === 'output-display') {
      return true;
    }
    
    const neighbors = graph.get(start) || [];
    for (const neighbor of neighbors) {
      if (hasPath(neighbor, new Set(visited))) {
        return true;
      }
    }
    
    return false;
  }
  
  let hasValidPath = false;
  for (const inputNode of inputNodes) {
    if (hasPath(inputNode.id, new Set())) {
      hasValidPath = true;
      break;
    }
  }
  
  if (!hasValidPath && inputNodes.length > 0 && outputNodes.length > 0) {
    warnings.push('Não há caminho conectando nós de entrada aos nós de saída');
  }
  
  return {
    valid: hasValidPath || inputNodes.length === 0 || outputNodes.length === 0,
    errors,
    warnings
  };
}

// Função principal de validação
export const validateWorkflow = query({
  args: {
    nodes: v.array(v.any()),
    edges: v.array(v.any()),
  },
  handler: async (ctx, args): Promise<ValidationResult> => {
    const nodes = args.nodes as Node[];
    const edges = args.edges as Edge[];
    
    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    
    // Validar estrutura
    const structureValidation = validateStructure(nodes, edges);
    allErrors.push(...structureValidation.errors);
    
    // Validar ciclos
    const cyclesValidation = validateCycles(nodes, edges);
    allErrors.push(...cyclesValidation.errors);
    
    // Validar caminhos
    const pathValidation = validatePath(nodes, edges);
    allWarnings.push(...pathValidation.warnings);
    
    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
  },
});

