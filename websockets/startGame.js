import { Game } from "./GameClass";

const startGame=()=>{
    const game = new Game({
        players : ["Alice","Bot1"],
        turnTime:15,
    });

    return game.start();
};

export {startGame};




 