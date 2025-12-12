# Canvas de Criação de Workflows

Esta tela é o coração da aplicação. O objetivo é permitir que o usuário construa cadeias de raciocínio de IA visualmente.

## Interações Principais

1.  **Drag and Drop de Nós**:
    *   O usuário pode clicar no cabeçalho (header) de qualquer cartão (Node) e arrastá-lo livremente pelo canvas infinito.
    *   **Performance**: A movimentação é renderizada em tempo real (sem lag).

2.  **Gerenciamento de Conexões (Edges)**:
    *   **Criar**: Clique e segure em uma bolinha de "Output" e arraste até uma bolinha de "Input" de outro nó. Solte o mouse sobre a bolinha de destino para conectar.
    *   **Visualizar Conexões**: Ao clicar em um **Nó (Card)** para selecioná-lo, todas as linhas conectadas a ele (entradas e saídas) serão destacadas em Rosa.
    *   **Desconectar**: Quando um nó é selecionado, botões com ícone de **Cadeado Quebrado/Corrente** aparecem automaticamente no centro de todas as linhas conectadas a ele. Basta clicar no ícone para cortar a conexão específica.

3.  **Edição de Rótulos (Nomes)**:
    *   **Double Click**: O título é estático. Clique duas vezes no nome do nó para editar.
    *   Ao perder o foco (blur) ou apertar Enter, a alteração é salva.

4.  **Ações Rápidas (Pop-out Fluido)**:
    *   Ao clicar (selecionar) um nó, um menu de ações flutua acima do card.
    *   **Botão Lixeira**: Remove o nó e suas conexões.
    *   **Botão Duplicar**: Cria uma cópia do nó.

5.  **Simbiose Visual (Execução)**:
    *   Ao clicar em "Executar Workflow", as linhas ganham vida com uma animação tracejada, indicando fluxo de dados.

## Estética e UX

*   O fundo possui um padrão de pontos (`bg-dot-pattern`).
*   As linhas inativas possuem gradiente (Indigo -> Pink).
*   As linhas ativas (do nó selecionado) ficam Rosa vibrante.
*   Os botões de desconexão são renderizados diretamente no SVG para precisão de posicionamento sem atrasos.

## Ideias Futuras (Backend)

*   Persistir o grafo (JSON) no LocalStorage ou Banco de Dados.
*   Validar ciclos infinitos (loops) nas conexões.
*   Implementar zoom e pan no canvas.