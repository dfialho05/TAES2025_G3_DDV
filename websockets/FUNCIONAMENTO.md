index.js (O Porteiro):

    "Abre a porta" (porta 3000).

    Diz: "Quem entrar, falem com o connections.js".

connections.js (O Gerente de Sala):

    Ouve o cliente: "Quero jogar esta carta!".

    Manda no tempo: "Espera 1 segundo antes do bot responder".

    Gere o loop: "O bot ganhou? Então joga outra vez!"

    Não sabe regras, só sabe passar mensagens.

Singleplayer.js (O Árbitro/Dealer):

    Tem o baralho na mão.

    Sabe se a jogada é válida (ex: "Tens de assistir ao naipe!").

    Sabe quem ganhou a vaza e soma os pontos.

    Diz quando o jogo acabou.

Bot.js (O Jogador Artificial):

    Recebe as cartas e a situação da mesa.

    Devolve apenas um número (índice da carta).

    É "burro" no sentido de gestão (não sabe se o jogo acabou), mas "inteligente" na escolha da carta.