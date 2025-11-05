/*
 * module: playfield
 * -->gnerates the playfield with the border and obstacles
 */
import { Obstacle } from "./obstacles.mjs";
import Responsive from "./responsive.mjs";

export class Playfield {
    constructor(ctx, physics, game) {
        this.ctx = ctx;
        this.physics = physics;
        this.game = game;
        this.x = 0;
        this.y = 0;
        const dimensions = Responsive.calculatePlayfieldDimensions();
        this.width = dimensions.width;
        this.height = dimensions.height;
        this.obstacles = [];
        this.initialized = false;
        
        this.groundSprite = new Image();
        this.groundSpriteLoaded = false;
        this.groundSprite.src = "./sprites/Ground_sprite.png";
        this.groundSprite.onload = () => {
            this.groundSpriteLoaded = true;
        };
    }

    
    set(x, y, w, h, ctx) {
        
        const horizontalBuffer = Math.max(12, w * 0.024); 
        const verticalBuffer = Math.max(8, h * 0.016); 
        
        this.x = x + horizontalBuffer;
        this.y = y + verticalBuffer;
        this.width = w - (horizontalBuffer * 2);
        this.height = h - (verticalBuffer * 2);
        this.ctx = ctx;

       // console.log("Playfield set:", this.x, this.y, this.width, this.height);

        
        if (!this.initialized && w > 0 && h > 0) {
            this.generateObstacles();
            this.initialized = true;
        }
    }
    
    generateObstacles() {
        this.obstacles.length = 0;
        const baseSize = Responsive.calculateObjectSize(40);
        const pool = [
            { r: baseSize },
            { r: baseSize * 1.5 },
            { r: baseSize * 0.75 },
            { r: baseSize * 1.25 },
            { r: baseSize * 1.1 }
        ];

        const shapes = ["circle", "triangle", "rect", "star", "route"];
        const maxObstacles = Responsive.calculateObstacleCount();
        let placed = 0;
        const maxAttemptsPerObstacle = 60;

        const players = (this.game && this.game.players) ? this.game.players : [];

        while (placed < maxObstacles) {
            let attempts = 0;
            let placedThis = false;

            //while loop for generating obstacles not in the player or other obstacles
            while (attempts < maxAttemptsPerObstacle && !placedThis) {
                attempts++;
                const pick = pool[Math.floor(Math.random() * pool.length)];
                const ox = this.x + Math.random() * (this.width - 2 * pick.r) + pick.r;
                const oy = this.y + Math.random() * (this.height - 2 * pick.r) + pick.r;
                const shape = shapes[Math.floor(Math.random() * shapes.length)];

                
                let ok = true;
                for (const p of players) {
                    const dx = p.x - ox;
                    const dy = p.y - oy;
                    const dist = Math.hypot(dx, dy);
                    if (dist < (p.radius + pick.r + 10)) { 
                        ok = false;
                        break;
                    }
                }
                if (!ok) continue;

                
                for (const other of this.obstacles) {
                    const dx = other.x - ox;
                    const dy = other.y - oy;
                    const dist = Math.hypot(dx, dy);
                    if (dist < (other.radius + pick.r + 10)) { 
                        ok = false;
                        break;
                    }
                }
                if (!ok) continue;

                let obstacle;
                if (shape === "rect") {
                    obstacle = new Obstacle({ x: ox, y: oy, radius: pick.r, shape: "rect", width: pick.r * 2.2, height: pick.r * 1.2 });
                } else if (shape === "route") {
                    const pts = [
                        { x: ox - pick.r, y: oy },
                        { x: ox - pick.r / 2, y: oy - pick.r * 0.6 },
                        { x: ox + pick.r / 2, y: oy + pick.r * 0.4 },
                        { x: ox + pick.r, y: oy }
                    ];
                    obstacle = new Obstacle({ x: ox, y: oy, radius: pick.r, shape: "route", points: pts });
                } else {
                    obstacle = new Obstacle({ x: ox, y: oy, radius: pick.r, shape: shape });
                }

                this.obstacles.push(obstacle);
                this.physics.add(obstacle);
                placed++;
                placedThis = true;
            }

            if (!placedThis) break;
        }

        //console.log("Obstacles generated:", this.obstacles.length);
    }
    
    update(players) {
        this.checkBorders(players);
    }

    checkBorders(players) {
        for (const p of players) {
            if (
                p.x - p.radius < this.x ||
                p.x + p.radius > this.x + this.width ||
                p.y - p.radius < this.y ||
                p.y + p.radius > this.y + this.height
            ) {
                this.game.state = "gameover";
                this.game.winner = players.find(pl => pl !== p);
                //console.log(`${this.game.winner.color.toUpperCase()} Player Wins (Border)`);
            }
        }
    }

    draw() {
        const ctx = this.ctx;
        if (!ctx) return;

        ctx.save();
        
        
        if (this.groundSpriteLoaded && this.groundSprite.complete) {
            const sw = window.innerWidth;
            const sh = window.innerHeight;
            const smallDim = Math.min(sw, sh);
            let totalTiles;
            if (smallDim < 800) totalTiles = 3;            
            else if (smallDim < 1200) totalTiles = 4;    
            else totalTiles = 6;                          

            //sprite calculation for background of the playfield
            const ar = this.width / this.height;
            let tilesX = 3, tilesY = 1; 
            if (totalTiles === 3) {
                if (ar >= 1) { tilesX = 3; tilesY = 1; } else { tilesX = 1; tilesY = 3; }
            } else if (totalTiles === 4) {
                if (ar > 1.4) { tilesX = 4; tilesY = 1; }
                else if (ar < 0.7) { tilesX = 1; tilesY = 4; }
                else { tilesX = 2; tilesY = 2; }
            } else { 
                if (ar >= 1) { tilesX = 3; tilesY = 2; } else { tilesX = 2; tilesY = 3; }
            }

            const tileW = this.width / tilesX;
            const tileH = this.height / tilesY;

            for (let iy = 0; iy < tilesY; iy++) {
                for (let ix = 0; ix < tilesX; ix++) {
                    const dx = this.x + ix * tileW;
                    const dy = this.y + iy * tileH;
                    ctx.drawImage(this.groundSprite, dx, dy, tileW, tileH);
                }
            }
        } else {
            ctx.fillStyle = "lightyellow";
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        //draw border and obstacles
        ctx.strokeStyle = "red";
        ctx.lineWidth = 4;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        ctx.restore();

       
        for (const obs of this.obstacles) {
            obs.draw(ctx);
        }
    }
}
