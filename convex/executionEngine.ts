import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Contexto de execução em memória (simplificado para esta implementação)
const executionContexts = new Map<string, {
  workflowId: string;
  globalVariables: Record<string, any>;
  nodeVariables: Record<string, Record<string, any>>;
  createdAt: number;
  updatedAt: number;
}>();

function createContext(workflowId: string): string {
  const contextId = `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  executionContexts.set(contextId, {
    workflowId,
    globalVariables: {},
    nodeVariables: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  return contextId;
}

function getContext(contextId: string) {
  return executionContexts.get(contextId) || null;
}

function setGlobalVariable(contextId: string, name: string, value: any): boolean {
  const context = executionContexts.get(contextId);
  if (!context) return false;
  context.globalVariables[name] = value;
  context.updatedAt = Date.now();
  return true;
}

function getGlobalVariable(contextId: string, name: string): any {
  const context = executionContexts.get(contextId);
  if (!context) return undefined;
  return context.globalVariables[name];
}

function setNodeVariable(contextId: string, nodeId: string, name: string, value: any): boolean {
  const context = executionContexts.get(contextId);
  if (!context) return false;
  if (!context.nodeVariables[nodeId]) {
    context.nodeVariables[nodeId] = {};
  }
  context.nodeVariables[nodeId][name] = value;
  context.updatedAt = Date.now();
  return true;
}

function getNodeVariable(contextId: string, nodeId: string, name: string): any {
  const context = executionContexts.get(contextId);
  if (!context) return undefined;
  return context.nodeVariables[nodeId]?.[name];
}

function getAvailableVariables(contextId: string, nodeId: string | null): Record<string, any> {
  const context = executionContexts.get(contextId);
  if (!context) return {};
  const result: Record<string, any> = { ...context.globalVariables };
  if (nodeId && context.nodeVariables[nodeId]) {
    Object.assign(result, context.nodeVariables[nodeId]);
  }
  return result;
}

function resolveVariables(text: string, context: Record<string, any>): string {
  if (!text || typeof text !== 'string') {
    return text;
  }
  return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    const value = context[varName];
    if (value === undefined || value === null) {
      return match;
    }
    return String(value);
  });
}

interface Node {
  id: string;
  type: string;
  data: any;
  inputs: string[];
  outputs: string[];
}

interface Edge {
  id: string;
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
}

interface ExecutionStep {
  nodeId: string;
  input: any;
  output: any;
  timestamp: number;
  duration: number;
}

/**
 * Motor de execução avançado para workflows
 */
export const executeWorkflowAdvanced = action({
  args: {
    workflowId: v.id("workflows"),
    nodes: v.array(v.any()),
    edges: v.array(v.any()),
    apiKey: v.string(),
    contextId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = "dev-user-123"; // TODO: Reativar autenticação

    // Verificar ownership do workflow
    const workflow = await ctx.runQuery(api.workflows.getWorkflow, {
      id: args.workflowId,
    });

    if (!workflow || workflow.userId !== userId) {
      throw new Error("Not authorized");
    }

    // Criar ou usar contexto existente
    const contextId = args.contextId || createContext(args.workflowId);
    const steps: ExecutionStep[] = [];

    // Construir grafo de dependências
    const nodeMap = new Map<string, Node>(args.nodes.map((n: any) => [n.id, n]));
    const edgesByTarget = new Map<string, Edge[]>();
    const edgesBySource = new Map<string, Edge[]>();

    for (const edge of args.edges) {
      if (!edgesByTarget.has(edge.target)) {
        edgesByTarget.set(edge.target, []);
      }
      edgesByTarget.get(edge.target)!.push(edge);

      if (!edgesBySource.has(edge.source)) {
        edgesBySource.set(edge.source, []);
      }
      edgesBySource.get(edge.source)!.push(edge);
    }

    // Encontrar nós de entrada (sem inputs)
    const inputNodes = args.nodes.filter((n: any) => n.inputs.length === 0);
    const processedNodes = new Set<string>();
    const nodeResults = new Map<string, any>();

    // Função para processar um nó
    const processNode = async (node: Node): Promise<any> => {
      if (processedNodes.has(node.id)) {
        return nodeResults.get(node.id);
      }

      const startTime = Date.now();

      // Coletar inputs das conexões
      const inputEdges = edgesByTarget.get(node.id) || [];
      const inputs: Record<string, any> = {};

      for (const edge of inputEdges) {
        const sourceNode = nodeMap.get(edge.source);
        if (!sourceNode) continue;

        // Processar nó de origem se ainda não processado
        if (!processedNodes.has(edge.source)) {
          await processNode(sourceNode);
        }

        const sourceOutput = nodeResults.get(edge.source);
        inputs[edge.targetHandle] = sourceOutput;
      }

      // Resolver variáveis no input
      const availableVars = getAvailableVariables(contextId, node.id);
      const resolvedInputs: Record<string, any> = {};
      for (const [key, value] of Object.entries(inputs)) {
        if (typeof value === 'string') {
          resolvedInputs[key] = resolveVariables(value, availableVars);
        } else {
          resolvedInputs[key] = value;
        }
      }

      // Processar nó baseado no tipo
      let output: any;

      try {
        switch (node.type) {
          case 'input-text':
            output = node.data.value || '';
            break;

          case 'github-repo':
            {
              const repo = node.data?.githubRepo || "";
              const branch = node.data?.githubBranch || "main";
              const path = node.data?.githubPath || "";
              const searchQuery = node.data?.githubSearchQuery || "";
              const mode = node.data?.githubMode || "list";

              if (!repo) {
                output = "[GitHub: Repositório não configurado]";
                break;
              }

              const repoParts = repo.split("/");
              if (repoParts.length !== 2) {
                output = `[GitHub: Formato de repositório inválido: ${repo}]`;
                break;
              }

              const owner = repoParts[0].trim();
              const repoName = repoParts[1].trim();

              try {
                if (mode === "list") {
                  const files = await ctx.runAction(api.github.listRepositoryFiles, {
                    userId: "dev-user-123", // TODO: Usar userId real
                    owner,
                    repo: repoName,
                    path,
                    branch,
                  });

                  const fileList = files.map((f: any) => `- ${f.type === "dir" ? "📁" : "📄"} ${f.name}`).join("\n");
                  output = `# Arquivos do repositório ${repo} (${branch})\n${path ? `Caminho: ${path}\n` : ""}\n${fileList}`;
                } else if (mode === "read") {
                  if (!path) {
                    output = "[GitHub: Caminho do arquivo não especificado]";
                    break;
                  }

                  const file = await ctx.runAction(api.github.readFileContent, {
                    userId: "dev-user-123", // TODO: Usar userId real
                    owner,
                    repo: repoName,
                    path,
                    branch,
                  });

                  output = `# Conteúdo do arquivo: ${file.path}\n\`\`\`\n${file.content}\n\`\`\``;
                } else if (mode === "search") {
                  if (!searchQuery) {
                    output = "[GitHub: Query de busca não especificada]";
                    break;
                  }

                  const results = await ctx.runAction(api.github.searchCode, {
                    userId: "dev-user-123", // TODO: Usar userId real
                    owner,
                    repo: repoName,
                    query: searchQuery,
              });

                  const resultsList = results.items.map((item: any) => `- ${item.path}`).join("\n");
                  output = `# Resultados da busca: "${searchQuery}"\nEncontrados ${results.totalCount} resultado(s):\n\n${resultsList}`;
            } else {
                  output = `[GitHub: Modo inválido: ${mode}]`;
                }
              } catch (error: any) {
                output = `[GitHub Error: ${error.message || String(error)}]`;
              }
            }
            break;

          case 'llm-model':
            output = await processLLMNode(ctx, node, resolvedInputs, args.apiKey, args.nodes, args.edges);
            break;

          case 'conditional':
            output = processConditionalNode(node, resolvedInputs, availableVars);
            break;

          case 'transform':
            output = processTransformNode(node, resolvedInputs);
            break;

          case 'variable':
            output = processVariableNode(node, resolvedInputs, contextId);
            break;

          case 'loop':
            output = await processLoopNode(
              ctx,
              node,
              resolvedInputs,
              args.apiKey,
              contextId,
              nodeMap,
              edgesByTarget,
              edgesBySource
            );
            break;

          case 'aggregate':
            output = processAggregateNode(node, resolvedInputs);
            break;

          case 'output-display':
            output = Object.values(resolvedInputs)[0] || '';
            break;

          default:
            output = Object.values(resolvedInputs)[0] || null;
        }

        // Armazenar resultado
        nodeResults.set(node.id, output);
        processedNodes.add(node.id);

        const duration = Date.now() - startTime;
        steps.push({
          nodeId: node.id,
          input: resolvedInputs,
          output,
          timestamp: startTime,
          duration,
        });

        return output;
      } catch (error) {
        const duration = Date.now() - startTime;
        steps.push({
          nodeId: node.id,
          input: resolvedInputs,
          output: null,
          timestamp: startTime,
          duration,
        });
        throw error;
      }
    };

    // Processar todos os nós de entrada
    for (const inputNode of inputNodes) {
      await processNode(inputNode);
    }

    // Encontrar nó de saída
    const outputNode = args.nodes.find((n: any) => n.type === 'output-display');
    const finalResult = outputNode
      ? nodeResults.get(outputNode.id) || null
      : null;

    return {
      success: true,
      result: finalResult,
      steps,
      contextId,
    };
  },
});

/**
 * Processa nó LLM
 */
async function processLLMNode(
  ctx: any,
  node: Node,
  inputs: Record<string, any>,
  apiKey: string,
  nodes: Node[],
  edges: Edge[]
): Promise<string> {
  const inputValue = Object.values(inputs)[0] || '';
  const model = node.data.model || 'z-ai/glm-4.5-air:free';

  // Construir prompt
  const prompt = typeof inputValue === 'string' ? inputValue : JSON.stringify(inputValue);

  const messages = [
    {
      role: 'user' as const,
      content: prompt,
    },
  ];

  // Preparar body da requisição
  const requestBody: any = {
    model,
    messages,
    max_tokens: 2000,
    temperature: 0.7,
  };

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.CONVEX_SITE_URL || '',
      'X-Title': 'NodeGen Studio',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'No response';
}

/**
 * Processa nó condicional
 */
function processConditionalNode(
  node: Node,
  inputs: Record<string, any>,
  availableVars: Record<string, any>
): boolean {
  const inputValue = Object.values(inputs)[0];
  const condition = node.data.condition || 'equals';
  const field = resolveVariables(node.data.conditionField || '', availableVars);
  const value = resolveVariables(node.data.conditionValue || '', availableVars);

  const fieldValue = field ? (inputValue?.[field] || inputValue) : inputValue;
  const compareValue = value;

  switch (condition) {
    case 'contains':
      return String(fieldValue).includes(String(compareValue));
    case 'equals':
      return String(fieldValue) === String(compareValue);
    case 'greaterThan':
      return Number(fieldValue) > Number(compareValue);
    case 'lessThan':
      return Number(fieldValue) < Number(compareValue);
    case 'startsWith':
      return String(fieldValue).startsWith(String(compareValue));
    case 'endsWith':
      return String(fieldValue).endsWith(String(compareValue));
    default:
      return false;
  }
}

/**
 * Processa nó de transformação
 */
function processTransformNode(
  node: Node,
  inputs: Record<string, any>
): any {
  const inputValue = Object.values(inputs)[0];
  const operation = node.data.transformOperation || 'extract';
  const config = node.data.transformConfig || {};

  switch (operation) {
    case 'uppercase':
      return String(inputValue).toUpperCase();
    case 'lowercase':
      return String(inputValue).toLowerCase();
    case 'trim':
      return String(inputValue).trim();
    case 'split':
      const separator = config.pattern || ',';
      return String(inputValue).split(separator);
    case 'extract':
      const pattern = config.pattern || '';
      if (pattern) {
        const regex = new RegExp(pattern, 'g');
        const matches = String(inputValue).match(regex);
        return matches ? matches.join('') : '';
      }
      return inputValue;
    case 'format':
      // Formatação básica - pode ser expandida
      return String(inputValue);
    case 'parse':
      try {
        return JSON.parse(String(inputValue));
      } catch {
        return inputValue;
      }
    case 'merge':
      return Object.values(inputs);
    default:
      return inputValue;
  }
}

/**
 * Processa nó de variável
 */
function processVariableNode(
  node: Node,
  inputs: Record<string, any>,
  contextId: string
): any {
  const varName = node.data.variableName || 'var';
  const defaultValue = node.data.variableDefaultValue || '';
  const scope = node.data.variableScope || 'workflow';

  const inputValue = Object.values(inputs)[0] || defaultValue;

  if (scope === 'workflow') {
    setGlobalVariable(contextId, varName, inputValue);
  } else {
    setNodeVariable(contextId, node.id, varName, inputValue);
  }

  return inputValue;
}

/**
 * Processa nó de loop
 */
async function processLoopNode(
  ctx: any,
  node: Node,
  inputs: Record<string, any>,
  apiKey: string,
  contextId: string,
  nodeMap: Map<string, Node>,
  edgesByTarget: Map<string, Edge[]>,
  edgesBySource: Map<string, Edge[]>
): Promise<any[]> {
  const loopType = node.data.loopType || 'foreach';
  const maxIterations = node.data.maxIterations || 10;
  const items = inputs.items || (Array.isArray(inputs.input) ? inputs.input : [inputs.input]);

  const results: any[] = [];

  if (loopType === 'foreach') {
    for (let i = 0; i < Math.min(items.length, maxIterations); i++) {
      const item = items[i];
      // Processar item - simplificado por enquanto
      results.push(item);
    }
  } else if (loopType === 'count') {
    for (let i = 0; i < maxIterations; i++) {
      results.push(i);
    }
  }

  return results;
}

/**
 * Processa nó de agregação
 */
function processAggregateNode(
  node: Node,
  inputs: Record<string, any>
): any {
  const operation = node.data.aggregateOperation || 'concat';
  const separator = node.data.aggregateSeparator || '';

  const values = Object.values(inputs).filter(v => v !== undefined && v !== null);

  switch (operation) {
    case 'concat':
    case 'join':
      return values.join(separator || ' ');
    case 'sum':
      return values.reduce((sum, v) => sum + Number(v || 0), 0);
    case 'average':
      const sum = values.reduce((s, v) => s + Number(v || 0), 0);
      return values.length > 0 ? sum / values.length : 0;
    case 'merge':
      return Object.assign({}, ...values);
    default:
      return values;
  }
}

