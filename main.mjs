import { Game } from "./js/game.mjs";

window.onload = () => {
    const cnv = document.getElementById("cnv");
    const ctx = cnv.getContext("2d");

    const game = new Game(ctx, cnv);

    function resize() {
        cnv.width = window.innerWidth;
        cnv.height = window.innerHeight;
        game.resize(cnv.width, cnv.height); // ✅ works now
    }

    window.addEventListener("resize", resize);
    resize();

    game.start();
};
