/**
 * Configuração dos modelos disponíveis (focados em interpretação de código)
 */
const MODEL_CONFIG: Array<{ label: string; value: string }> = [
    { label: 'GLM-4.5 Air (Free)', value: 'z-ai/glm-4.5-air:free' },
  { label: 'Google Gemini 2.5 Flash Preview (Free)', value: 'google/gemini-2.5-flash-preview-09-2025' },
  { label: 'Qwen 3 4B (Free)', value: 'qwen/qwen3-4b:free' },
];

/**
 * Retorna a lista de modelos disponíveis (apenas texto)
 * @returns Array de modelos disponíveis com label e value
 */
export function getAvailableModels(): Array<{ label: string; value: string }> {
  return MODEL_CONFIG;
}

/**
 * Verifica se um modelo é compatível
 * @param modelId ID do modelo (ex: 'amazon/nova-2-lite-v1:free')
 * @returns true se o modelo está disponível
 */
export function isModelCompatible(modelId: string): boolean {
  return MODEL_CONFIG.some(model => model.value === modelId);
}
