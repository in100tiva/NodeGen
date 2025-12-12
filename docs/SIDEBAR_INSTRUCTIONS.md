# Barra de Ferramentas (Sidebar)

A barra lateral esquerda fornece acesso rápido aos blocos de construção fundamentais do workflow.

## Ferramentas Disponíveis

1.  **Prompt de Texto (Ícone: Balão de Mensagem / Cor: Verde)**
    *   **Função**: Cria um nó de entrada de texto (`input-text`).
    *   **Uso**: O usuário digita instruções, perguntas ou contexto para a IA.
    *   **UI**: Caixa de texto redimensionável.

2.  **Upload de Arquivo (Ícone: Arquivo + Imagem / Cor: Azul)**
    *   **Função**: Cria um nó de entrada de arquivo (`input-file`).
    *   **Uso**: Permite carregar imagens ou vídeos para modelos multimodais (ex: GPT-4 Vision, Claude 3).
    *   **UI**: Zona de drop fictícia com borda tracejada.

3.  **Modelo IA (Ícone: Chip CPU / Cor: Indigo)**
    *   **Função**: Cria o cérebro da operação (`llm-model`).
    *   **Uso**: Seleciona qual modelo (OpenRouter) processará os dados de entrada.
    *   **UI**: Dropdown de seleção de modelo e indicador de status.

4.  **Resultado (Ícone: Monitor / Cor: Rosa)**
    *   **Função**: Cria um nó de visualização (`output-display`).
    *   **Uso**: Exibe a resposta final, seja ela texto gerado, código, ou descrição de imagens.
    *   **UI**: Área de exibição com scroll e fonte monoespaçada.

## UX da Sidebar

*   **Tooltips**: Ao passar o mouse sobre cada ícone, um tooltip escuro aparece à direita explicando a função.
*   **Feedback Visual**: Hover effects coloridos correspondentes à cor do header do card que será criado, facilitando a associação visual.