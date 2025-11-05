import { Player } from "./player.mjs";
import { Joystick } from "./joystick.mjs";
import Button from "./button.mjs";
import { Playfield } from "./playfield.mjs";
import { Physics } from "./physics.mjs";
import { KnockbackSystem } from "./knockback.mjs";
import { HorizontalLayout, VerticalLayout } from "./layout.mjs";
import { Screen } from "./screen.mjs";
import Responsive from "./responsive.mjs";

export class Game {
    constructor(ctx, canvas) {
        this.ctx = ctx;
        this.canvas = canvas;

        // Core systems
        this.physics = new Physics();
        this.knockback = new KnockbackSystem();

    // recoil display (last recoil magnitude per player)
    this.lastRecoil = [0, 0];

        // Game entities
        this.players = [];
        this.joysticks = [];
    this.buttons = [];
        this.playfield = new Playfield(ctx, this.physics, this);

        // Layouts
        this.mainLayout = VerticalLayout(ctx);
        this.menuLayoutPlayerOne = HorizontalLayout(ctx);
        this.menuLayoutPlayerTwo = HorizontalLayout(ctx);
        this.playfieldLayout = VerticalLayout(ctx);

        // UI + State
        this.state = "title";
        this.winner = null;
    this.over = false;
        this.screen = new Screen(this);

        // Initialize everything
        this.initializeLayouts();
        this.initializePlayers();
        this.initializePhysics();
    }

    initializePlayers() {
        // Create and setup players with their joysticks
        const joystick1 = new Joystick();
        const playerSpeed = Responsive.calculatePlayerSpeed();
        const player1 = new Player({ color: "blue", speed: playerSpeed });
        player1.connectJoystick(joystick1);

    const button1 = new Button({ label: "Boost", flipped: true });
        button1.connectPlayer(player1);

        const joystick2 = new Joystick();
        const player2 = new Player({ color: "green", speed: playerSpeed });
        player2.connectJoystick(joystick2);

        const button2 = new Button({ label: "Boost" });
        button2.connectPlayer(player2);

        this.players.push(player1, player2);
        this.joysticks.push(joystick1, joystick2);
        this.buttons.push(button1, button2);

    // Add buttons and joysticks to their respective layouts
    // Player 1 (upper): [ button | joystick ] - swapped order
    this.menuLayoutPlayerOne.addChild(button1, 1.2);
    this.menuLayoutPlayerOne.addChild(joystick1, 2);

    // Player 2 (lower): [ joystick | button ] - normal order
        this.menuLayoutPlayerTwo.addChild(joystick2, 2); // reduced from 3
        this.menuLayoutPlayerTwo.addChild(button2, 1.2); // increased from 1
    }

    initializeLayouts() {
        // Setup the layout hierarchy
        this.playfieldLayout.addChild(this.playfield, 4);
        // Add more space for controls and add buffer
        this.mainLayout.addChild(this.menuLayoutPlayerOne, 3);
        this.mainLayout.addChild(this.playfieldLayout, 8);
        this.mainLayout.addChild(this.menuLayoutPlayerTwo, 4); // increased for buffer
    }

    initializePhysics() {
        // Add all players to physics system
        for (const player of this.players) {
            this.physics.add(player);
        }
        this.physics.onCollide = (a, b) => this.knockback.apply(a, b);

        // receive recoil reports from knockback system
        this.knockback.onRecoil = ({ aPush, bPush, a, b }) => {
            // Accumulate pushes into lastRecoil so values only increase until restart
            const players = this.players;
            if (a && a.type === "player") {
                const idx = players.indexOf(a);
                if (idx >= 0) this.lastRecoil[idx] += Number(aPush.toFixed(2));
            }
            if (b && b.type === "player") {
                const idx = players.indexOf(b);
                if (idx >= 0) this.lastRecoil[idx] += Number(bPush.toFixed(2));
            }
        };
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;

        if (this.mainLayout.set)
            this.mainLayout.set(0, 0, width, height, this.ctx);
    }

    update() {
        if (this.state !== "playing") return;

        // Update player positions based on input
        for (const player of this.players) {
            player.update();
        }

    // Update physics system (pass game so physics can notify game-level events)
    this.physics.update(this);
        this.knockback.update(this.physics.objects);

        // Update playfield state and check win conditions
        this.playfield.update(this.players);
    }

    // Called by Physics when a player collides with an obstacle
    playerHitObstacle(player, obstacle, otherPlayer) {
        if (this.over) return;
        this.over = true;
        this.state = "gameover";
        this.winner = otherPlayer || null;
        console.log(`💥 Player ${player.color?.toUpperCase() || ''} hit an obstacle. ${this.winner ? this.winner.color.toUpperCase() + ' wins.' : 'Game over.'}`);
    }
    
    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.state === "playing") {
            // Draw layout first
            this.mainLayout.draw();
            
            // Draw playfield independently
            this.playfield.draw();
            
            // Draw players independently
            for (const player of this.players) {
                player.draw(ctx);
            }
            // Draw recoils between controls and playfield
            this._drawRecoilInControls(ctx);
        }

        this.screen.draw();
    }

    _drawRecoilInControls(ctx) {
        // Get playfield bounds
        const playfieldBottom = this.playfield.y + this.playfield.height;
        const playfieldTop = this.playfield.y;
        
        // Player 1 recoil (between upper controls and playfield top)
        const recoil1Percent = (this.lastRecoil[0]).toFixed(2);
        const p1Y = playfieldTop - 15; // 15px above playfield
        
        // Player 2 recoil (between playfield bottom and lower controls)
        const recoil2Percent = (this.lastRecoil[1]).toFixed(2);
        const p2Y = playfieldBottom + 25; // 25px below playfield

        ctx.save();
        ctx.fillStyle = "black";
        ctx.font = "bold 16px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const centerX = this.canvas.width / 2;

        // Draw P1 recoil upside down for the top player
        ctx.save();
        ctx.translate(centerX, p1Y);
        ctx.rotate(Math.PI);
        ctx.fillText(`${recoil1Percent}%`, 0, 0);
        ctx.restore();

        // Draw P2 recoil normally for the bottom player
        ctx.fillText(`${recoil2Percent}%`, centerX, p2Y);

        ctx.restore();
    }

    /*draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.state === "playing") {
        this.mainLayout.draw();
        this.playfield.draw(); // ✅ Explizit zeichnen!
        
        // Player zeichnen
        for (const player of this.players) {
            player.draw();
        }
    }

    this.screen.draw();
}*/

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
        this.players.forEach((p, i) => {
            p.x = (this.canvas.width / 3) * (i + 1);
            p.y = this.canvas.height / 2;
            p.vx = 0;
            p.vy = 0;
            p.collisions = 0;
            // restore normal speed
            if (p.baseSpeed != null) p.speed = p.baseSpeed;
        });

        // Remove old obstacles from physics so we don't accumulate duplicates
        this.physics.objects = this.physics.objects.filter(o => o.type === 'player');

        this.playfield.initialized = false;
        this.playfield.generateObstacles();

        // reset buttons state
        for (const b of this.buttons) {
            b.availableAt = 0;
            b.active = false;
            b._originalSpeed = null;
            b.lastTap = 0;
        }

        // reset recoil tracking
        this.lastRecoil = [0, 0];

        this.over = false;
        this.state = "playing";
        this.winner = null;
    }
}
