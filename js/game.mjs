/**
 * game module - manages the game 
 */
import { Player } from "./player.mjs";
import { Joystick } from "./joystick.mjs";
import Button from "./button.mjs";
import { Playfield } from "./playfield.mjs";
import { Physics } from "./physics.mjs";
import { KnockbackSystem } from "./knockback.mjs";
import { HorizontalLayout, VerticalLayout } from "./layout.mjs";
import { Screen } from "./screen.mjs";
import Responsive from "./responsive.mjs";

const RECOIL_DISPLAY_OFFSET = {
    top: 40,
    bottom: 50
};

const LAYOUT_WEIGHTS = {
    menuTop: 3,
    playfield: 8,
    menuBottom: 4,
    playfieldContent: 4,
    button: 1.2,
    joystick: 2
};

export class Game {
    constructor(ctx, canvas) {
        this.ctx = ctx;
        this.canvas = canvas;

        this.physics = new Physics();
        this.knockback = new KnockbackSystem();
        this.lastRecoil = [0, 0];

        this.players = [];
        this.joysticks = [];
        this.buttons = [];
        this.playfield = new Playfield(ctx, this.physics, this);

        this.createLayouts();

        this.state = "title";
        this.winner = null;
        this.over = false;
        this.screen = new Screen(this);

        this.initialize();
    }

    createLayouts() {
        this.mainLayout = VerticalLayout(this.ctx);
        this.menuLayoutPlayerOne = HorizontalLayout(this.ctx);
        this.menuLayoutPlayerTwo = HorizontalLayout(this.ctx);
        this.playfieldLayout = VerticalLayout(this.ctx);
    }

    initialize() {
        this.initializePlayers();
        this.initializeLayouts();
        this.initializePhysics();
    }

    initializePlayers() {
        const playerSpeed = Responsive.calculatePlayerSpeed();
        
        const player1 = this.createPlayer("blue", playerSpeed);
        const player2 = this.createPlayer("green", playerSpeed);

        this.setupPlayerControls();
    }

    createPlayer(color, speed) {
        const joystick = new Joystick();
        const player = new Player({ color, speed });
        player.connectJoystick(joystick);

        const button = new Button({ 
            label: "Boost", 
            flipped: color === "blue" 
        });
        button.connectPlayer(player);

        this.players.push(player);
        this.joysticks.push(joystick);
        this.buttons.push(button);

        return player;
    }

    setupPlayerControls() {
        this.menuLayoutPlayerOne.addChild(this.buttons[0], LAYOUT_WEIGHTS.button);
        this.menuLayoutPlayerOne.addChild(this.joysticks[0], LAYOUT_WEIGHTS.joystick);

        this.menuLayoutPlayerTwo.addChild(this.joysticks[1], LAYOUT_WEIGHTS.joystick);
        this.menuLayoutPlayerTwo.addChild(this.buttons[1], LAYOUT_WEIGHTS.button);
    }

    initializeLayouts() {
        this.playfieldLayout.addChild(this.playfield, LAYOUT_WEIGHTS.playfieldContent);
        
        this.mainLayout.addChild(this.menuLayoutPlayerOne, LAYOUT_WEIGHTS.menuTop);
        this.mainLayout.addChild(this.playfieldLayout, LAYOUT_WEIGHTS.playfield);
        this.mainLayout.addChild(this.menuLayoutPlayerTwo, LAYOUT_WEIGHTS.menuBottom);
    }

    initializePhysics() {
        this.players.forEach(player => this.physics.add(player));
        this.physics.onCollide = (a, b) => this.knockback.apply(a, b);
        this.knockback.onRecoil = this.handleRecoil.bind(this);
    }

    handleRecoil({ aPush, bPush, a, b }) {
        this.updateRecoilForObject(a, aPush);
        this.updateRecoilForObject(b, bPush);
    }

    updateRecoilForObject(obj, push) {
        if (obj?.type !== "player") return;
        
        const index = this.players.indexOf(obj);
        if (index >= 0) {
            this.lastRecoil[index] += Number(push.toFixed(2));
        }
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;

        if (this.mainLayout.set) {
            this.mainLayout.set(0, 0, width, height, this.ctx);
        }
    }

    update() {
        if (this.state !== "playing") return;

        // Sync accumulated recoil to players before physics calculations
        this.syncRecoilToPlayers();

        this.players.forEach(player => player.update());
        this.physics.update(this);
        this.knockback.update(this.physics.objects);
        this.playfield.update(this.players);
    }

    syncRecoilToPlayers() {
        this.players.forEach((player, index) => {
            player.accumulatedRecoil = this.lastRecoil[index];
        });
    }

    playerHitObstacle(player, obstacle, otherPlayer) {
        if (this.over) return;
        
        this.over = true;
        this.state = "gameover";
        this.winner = otherPlayer || null;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.state === "playing") {
            this.drawGameplay();
        }

        this.screen.draw();
    }

    drawGameplay() {
        this.mainLayout.draw();
        this.playfield.draw();
        
        this.players.forEach(player => player.draw(this.ctx));
        this.drawRecoilDisplay();
        this.drawPlayerLabels();
    }

    drawPlayerLabels() {
        const ctx = this.ctx;
        const playfieldTop = this.playfield.y;
        const playfieldBottom = this.playfield.y + this.playfield.height;
        const playfieldLeft = this.playfield.x;
        
        // Position towards the boost button side (left side of screen)
        const xPosition = playfieldLeft + this.canvas.width * 0.15;
        
        ctx.save();
        ctx.font = "bold 20px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        // Player 1 label (top, blue) - closer to playfield, shifted towards boost button
        const player1Y = playfieldTop - 15;
        ctx.fillStyle = this.players[0].color;
        ctx.translate(xPosition, player1Y);
        ctx.rotate(Math.PI);
        ctx.fillText(`${this.players[0].color.toUpperCase()} PLAYER`, 0, 0);
        ctx.rotate(-Math.PI);
        ctx.translate(-xPosition, -player1Y);
        
        // Player 2 label (bottom, green) - closer to playfield, shifted towards boost button
        const player2Y = playfieldBottom + 15;
        ctx.fillStyle = this.players[1].color;
        ctx.fillText(`${this.players[1].color.toUpperCase()} PLAYER`, xPosition, player2Y);
        
        ctx.restore();
    }

    drawRecoilDisplay() {
        const playfieldTop = this.playfield.y;
        const playfieldBottom = this.playfield.y + this.playfield.height;
        const playfieldLeft = this.playfield.x;
        
        // Position towards the boost button side (left side of screen)
        const xPosition = playfieldLeft + this.canvas.width * 0.15;
        
        this.drawRecoilText(
            this.lastRecoil[0], 
            playfieldTop - 35,
            xPosition,
            true
        );
        
        this.drawRecoilText(
            this.lastRecoil[1], 
            playfieldBottom + 35,
            xPosition,
            false
        );
    }

    drawRecoilText(recoil, y, x, flipped) {
        const ctx = this.ctx;
        const text = `recoil: ${recoil.toFixed(2)}%`;

        ctx.save();
        ctx.fillStyle = "black";
        ctx.font = "bold 16px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        if (flipped) {
            ctx.translate(x, y);
            ctx.rotate(Math.PI);
            ctx.fillText(text, 0, 0);
        } else {
            ctx.fillText(text, x, y);
        }

        ctx.restore();
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }

    start() {
        this.state = "title";
        this.loop();
    }

    restart() {
        this.resetPlayers();
        this.resetObstacles();
        this.resetButtons();
        this.resetGameState();
    }

    resetPlayers() {
        this.players.forEach((player, index) => {
            player.x = (this.canvas.width / 3) * (index + 1);
            player.y = this.canvas.height / 2;
            player.vx = 0;
            player.vy = 0;
            player.collisions = 0;
            
            if (player.baseSpeed != null) {
                player.speed = player.baseSpeed;
            }
        });
    }

    resetObstacles() {
        this.physics.objects = this.physics.objects.filter(o => o.type === 'player');
        this.playfield.initialized = false;
        this.playfield.generateObstacles();
    }

    resetButtons() {
        this.buttons.forEach(button => {
            button.availableAt = 0;
            button.active = false;
            button._originalSpeed = null;
            button.lastTap = 0;
        });
    }

    resetGameState() {
        this.lastRecoil = [0, 0];
        this.over = false;
        this.state = "playing";
        this.winner = null;
    }
}
