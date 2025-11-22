🧠 Arquitetura do Servidor de Bisca (WebSockets)

    Este documento explica o funcionamento do backend do jogo Singleplayer. O sistema utiliza uma arquitetura Server-Authoritative (Autoridade no Servidor), o que significa que o Frontend (Vue/Pinia) não decide nada, apenas desenha o que o Servidor manda.

📂 Estrutura de Ficheiros

index.js (A Porta de Entrada)

    Inicializa o servidor Socket.io na porta 3000.

    Encaminha as conexões para o gestor de eventos (connections.js).

    Handlers/connections.js (O Controlador de Tráfego)

    Gere quem entra e sai (socket.on).

    Recebe os eventos do cliente (play_card).

    Gere o Loop do Bot (faz o bot jogar sozinho se ganhar vazas consecutivas).

    RegrasJogo/Singleplayer.js (O Motor do Jogo)

    Contém a classe BiscaGame.

    Gere o baralho, pontuação, validação de jogadas e pesca de cartas.

    É agnóstico à rede (não sabe o que é um socket, apenas gere lógica pura).

RegrasJogo/Bot.js (O Cérebro da IA)

    Decide qual carta jogar com base na mesa e no trunfo.

    Implementa estratégias de corte, assistência e descarte.




🔄 Fluxo de Jogo Passo-a-Passo

1. Conexão e Inicialização (join_game)

    Quando o cliente entra na página:

    Frontend: Emite o evento join_game.

    Backend (connections.js):

    Cria uma nova instância de new BiscaGame().

    Guarda essa instância num Map associada ao ID do socket do jogador.

    Envia o game_state inicial (mão do jogador, trunfo, pontuação a 0).

2. A Jogada do Utilizador (play_card)

    Quando o utilizador clica numa carta:

    Frontend: Envia play_card com o índice da carta.

    Backend (connections.js):

    Chama game.playUserCard(index) na lógica do jogo.

    Validação: Se não for a vez do user ou o jogo acabou, ignora.

    Ação: Move a carta da mão para a mesa e atualiza o estado.

    Trigger: Inicia um setTimeout de 1 segundo para chamar o Loop do Bot.

3. O Loop do Bot (handleBotLoop)

    Esta é a parte mais complexa e inteligente do servidor. Como o Bot pode jogar várias vezes seguidas (se ganhar a vaza), usamos uma função recursiva.

    O Ciclo de Decisão:

    Verificação: A mesa tem menos de 2 cartas?

    Sim: O Bot "pensa" (chama Bot.js) e joga uma carta (playBotCard). Envia estado atualizado.

    Resolução: A mesa ficou cheia (2 cartas)?

    Sim: O servidor chama resolveRound().

    Calcula quem ganhou a vaza.

    Atribui pontos.

    Pesca Cartas (drawCards): Ambos os jogadores recebem uma nova carta do baralho.

    Limpeza e Próximo Turno:

    O servidor espera 1.5 segundos (para o jogador ver o resultado).

    Limpa a mesa (cleanupRound).

    Define o novo turno (this.turn = winner).

    Recursividade (O "Loop"):

    Se o vencedor foi o Bot, ele tem de jogar novamente.

    A função handleBotLoop chama-se a si mesma automaticamente.

    Se o vencedor foi o User, o ciclo para e o servidor fica à espera do evento play_card.