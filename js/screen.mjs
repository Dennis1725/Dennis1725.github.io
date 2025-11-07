/**
 * screen module - creates the screens for Gamestart and End
 */
export class Screen {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.canvas = game.canvas;

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
    }

    drawTitleScreen(ctx, width, height) {
        ctx.save();
        ctx.fillStyle = "#222";
        ctx.fillRect(0, 0, width, height);

        const titleSize = Math.min(48, width * 0.12);
        const subtitleSize = Math.min(24, width * 0.06);
        const instructionSize = Math.min(18, width * 0.045);

        ctx.fillStyle = "white";
        ctx.font = `bold ${titleSize}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Shield Push", width / 2, height / 2 - titleSize * 2.5);

        ctx.font = `${instructionSize}px sans-serif`;
        ctx.fillStyle = "#ffff00";
        const instructionY = height / 2 - titleSize * 0.5;
        ctx.fillText("Use the joystick to move your player", width / 2, instructionY);
        ctx.fillText("Avoid obstacles and the border", width / 2, instructionY + instructionSize * 1.5);
        ctx.fillText("Tap boost button for speed", width / 2, instructionY + instructionSize * 3);
        ctx.fillText("Push your opponent into danger!", width / 2, instructionY + instructionSize * 4.5);

        ctx.fillStyle = "white";
        ctx.font = `${subtitleSize}px sans-serif`;
        ctx.fillText("Touch the screen to start", width / 2, height / 2 + titleSize * 2.5);
        ctx.restore();
    }

    drawGameOverScreen(ctx, width, height) {
        ctx.save();
        
        ctx.fillStyle = "rgba(211, 211, 211, 0.95)";
        ctx.fillRect(0, 0, width, height);

        const titleSize = Math.min(48, width * 0.1);
        const subtitleSize = Math.min(24, width * 0.055);
        const padding = Math.min(40, height * 0.08);

        const winnerColor = this.game.winner ? this.game.winner.color : "#333";
        
        ctx.strokeStyle = "white";
        ctx.lineWidth = 4;
        ctx.font = `bold ${titleSize}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeText(`${this.game.winner.color.toUpperCase()} WINS!`, width / 2, height / 2 - padding);
        
        ctx.fillStyle = winnerColor;
        ctx.fillText(`${this.game.winner.color.toUpperCase()} WINS!`, width / 2, height / 2 - padding);

        ctx.fillStyle = "#333";
        ctx.font = `${subtitleSize}px sans-serif`;
        ctx.fillText("Touch the screen to restart", width / 2, height / 2 + padding);
        
        ctx.restore();
    }
}
