// js/screen.mjs
export class Screen {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.canvas = game.canvas;

        // Touch listener for starting or restarting the game
        this.canvas.addEventListener("touchstart", (e) => {
            if (this.game.state === "title" || this.game.state === "gameover") {
                this.game.restart();
            }
        });
    }

    draw() {
        const ctx = this.ctx;
        const { width, height } = this.canvas;

        if (this.game.state === "title") {
            this.drawTitleScreen(ctx, width, height);
        } else if (this.game.state === "gameover") {
            this.drawGameOverScreen(ctx, width, height);
        }
        // if state is "playing", the game itself draws everything
    }

    drawTitleScreen(ctx, width, height) {
        ctx.save();
        ctx.fillStyle = "#222";
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = "white";
        ctx.font = "bold 48px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Touch Game", width / 2, height / 2 - 50);

        ctx.font = "24px sans-serif";
        ctx.fillText("Touch the screen to start", width / 2, height / 2 + 20);
        ctx.restore();
    }

    drawGameOverScreen(ctx, width, height) {
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = this.game.winner ? this.game.winner.color : "white";
        ctx.font = "bold 48px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`${this.game.winner.color.toUpperCase()} Player Wins!`, width / 2, height / 2 - 20);

        ctx.font = "24px sans-serif";
        ctx.fillText("Touch the screen to restart", width / 2, height / 2 + 40);
        ctx.restore();
    }
}
