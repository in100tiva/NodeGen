# Configurações de API e Preferências

Este modal é crucial para a funcionalidade "Open Source/BYOK" (Bring Your Own Key).

## Funcionalidade

1.  **Segurança da Chave**:
    *   A chave de API do OpenRouter (`sk-or-...`) deve ser inserida aqui.
    *   **Importante**: Na implementação real, esta chave NUNCA deve ser enviada para o nosso servidor backend. Ela deve ser salva apenas no `localStorage` do navegador do usuário ou em memória de sessão, e enviada diretamente do frontend para a API do OpenRouter (client-side request).

2.  **Validação**:
    *   Futuramente, adicionar um botão "Testar Conexão" que faz uma chamada leve (`models/list`) para verificar se a chave é válida e possui créditos.

3.  **Persistência**:
    *   Ao clicar em "Salvar", a chave é propagada para o contexto global da aplicação (`App.tsx`), permitindo que o botão "Executar Workflow" funcione.

## Design

*   Uso de um modal centralizado com `backdrop-blur` para focar a atenção.
*   Animações de entrada (`zoom-in`) para sensação de polidez.
*   Campos de senha ocultos por padrão para privacidade.