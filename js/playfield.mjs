/**
 * Playfield module - generates playfield with borders and obstacles
 */
import { Obstacle } from "./obstacles.mjs";
import Responsive from "./responsive.mjs";

const OBSTACLE_MIN_SPACING = 10;
const MAX_PLACEMENT_ATTEMPTS = 60;
const BORDER_WIDTH = 4;
const BORDER_COLOR = "#8B0000";
const FALLBACK_BG_COLOR = "lightyellow";

const TILE_COUNTS = {
    small: 3,
    medium: 4,
    large: 6
};

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
        this.loadGroundSprite();
    }

    loadGroundSprite() {
        this.groundSprite = new Image();
        this.groundSprite.src = "./sprites/Ground_sprite.png";
    }

    set(x, y, w, h, ctx) {
        const horizontalBuffer = Math.max(12, w * 0.024);
        const verticalBuffer = Math.max(8, h * 0.016);
        
        this.x = x + horizontalBuffer;
        this.y = y + verticalBuffer;
        this.width = w - (horizontalBuffer * 2);
        this.height = h - (verticalBuffer * 2);
        this.ctx = ctx;

        if (!this.initialized && w > 0 && h > 0) {
            this.generateObstacles();
            this.initialized = true;
        }
    }

    generateObstacles() {
        this.obstacles = [];
        
        const baseSize = Responsive.calculateObjectSize(40);
        const sizePool = this.createSizePool(baseSize);
        const shapes = ["circle", "triangle", "rect", "star", "route"];
        const maxObstacles = Responsive.calculateObstacleCount();

        let placedCount = 0;
        while (placedCount < maxObstacles) {
            const obstacle = this.tryPlaceObstacle(sizePool, shapes);
            if (!obstacle) break;
            
            this.obstacles.push(obstacle);
            this.physics.add(obstacle);
            placedCount++;
        }
    }

    createSizePool(baseSize) {
        return [
            { r: baseSize },
            { r: baseSize * 1.5 },
            { r: baseSize * 0.75 },
            { r: baseSize * 1.25 },
            { r: baseSize * 1.1 }
        ];
    }

    tryPlaceObstacle(sizePool, shapes) {
        for (let attempt = 0; attempt < MAX_PLACEMENT_ATTEMPTS; attempt++) {
            const size = sizePool[Math.floor(Math.random() * sizePool.length)];
            const position = this.getRandomPosition(size.r);
            const shape = shapes[Math.floor(Math.random() * shapes.length)];

            if (this.isValidPosition(position, size.r)) {
                return this.createObstacle(position, size.r, shape);
            }
        }
        return null;
    }

    getRandomPosition(radius) {
        return {
            x: this.x + Math.random() * (this.width - 2 * radius) + radius,
            y: this.y + Math.random() * (this.height - 2 * radius) + radius
        };
    }

    isValidPosition(position, radius) {
        return this.isFarFromPlayers(position, radius) && 
               this.isFarFromObstacles(position, radius);
    }

    isFarFromPlayers(position, radius) {
        const players = this.game?.players || [];
        
        return players.every(player => {
            const distance = Math.hypot(player.x - position.x, player.y - position.y);
            return distance >= player.radius + radius + OBSTACLE_MIN_SPACING;
        });
    }

    isFarFromObstacles(position, radius) {
        return this.obstacles.every(obstacle => {
            const distance = Math.hypot(obstacle.x - position.x, obstacle.y - position.y);
            return distance >= obstacle.radius + radius + OBSTACLE_MIN_SPACING;
        });
    }

    createObstacle(position, radius, shape) {
        const config = {
            x: position.x,
            y: position.y,
            radius,
            shape
        };

        if (shape === "rect") {
            config.width = radius * 2.2;
            config.height = radius * 1.2;
        } else if (shape === "route") {
            config.points = this.createRoutePoints(position, radius);
        }

        return new Obstacle(config);
    }

    createRoutePoints(position, radius) {
        return [
            { x: position.x - radius, y: position.y },
            { x: position.x - radius / 2, y: position.y - radius * 0.6 },
            { x: position.x + radius / 2, y: position.y + radius * 0.4 },
            { x: position.x + radius, y: position.y }
        ];
    }

    update(players) {
        this.checkBorders(players);
    }

    checkBorders(players) {
        for (const player of players) {
            if (this.isPlayerOutOfBounds(player)) {
                this.handlePlayerOutOfBounds(player, players);
            }
        }
    }

    isPlayerOutOfBounds(player) {
        return player.x - player.radius < this.x ||
               player.x + player.radius > this.x + this.width ||
               player.y - player.radius < this.y ||
               player.y + player.radius > this.y + this.height;
    }

    handlePlayerOutOfBounds(player, players) {
        this.game.state = "gameover";
        this.game.winner = players.find(p => p !== player);
    }

    draw() {
        if (!this.ctx) return;

        this.ctx.save();
        this.drawBackground();
        this.drawBorder();
        this.ctx.restore();

        this.drawObstacles();
    }

    drawBackground() {
        if (this.isGroundSpriteLoaded()) {
            this.drawTiledBackground();
        } else {
            this.drawFallbackBackground();
        }
    }

    isGroundSpriteLoaded() {
        return this.groundSprite && this.groundSprite.complete;
    }

    drawTiledBackground() {
        const { tilesX, tilesY } = this.calculateTileLayout();
        const tileWidth = this.width / tilesX;
        const tileHeight = this.height / tilesY;

        for (let iy = 0; iy < tilesY; iy++) {
            for (let ix = 0; ix < tilesX; ix++) {
                const dx = this.x + ix * tileWidth;
                const dy = this.y + iy * tileHeight;
                this.ctx.drawImage(this.groundSprite, dx, dy, tileWidth, tileHeight);
            }
        }
    }

    calculateTileLayout() {
        const screenSize = Math.min(window.innerWidth, window.innerHeight);
        const totalTiles = this.getTotalTileCount(screenSize);
        const aspectRatio = this.width / this.height;

        return this.getTileGrid(totalTiles, aspectRatio);
    }

    getTotalTileCount(screenSize) {
        if (screenSize < 800) return TILE_COUNTS.small;
        if (screenSize < 1200) return TILE_COUNTS.medium;
        return TILE_COUNTS.large;
    }

    getTileGrid(totalTiles, aspectRatio) {
        const gridLayouts = {
            [TILE_COUNTS.small]: this.getSmallGrid(aspectRatio),
            [TILE_COUNTS.medium]: this.getMediumGrid(aspectRatio),
            [TILE_COUNTS.large]: this.getLargeGrid(aspectRatio)
        };

        return gridLayouts[totalTiles] || { tilesX: 3, tilesY: 1 };
    }

    getSmallGrid(aspectRatio) {
        return aspectRatio >= 1 
            ? { tilesX: 3, tilesY: 1 }
            : { tilesX: 1, tilesY: 3 };
    }

    getMediumGrid(aspectRatio) {
        if (aspectRatio > 1.4) return { tilesX: 4, tilesY: 1 };
        if (aspectRatio < 0.7) return { tilesX: 1, tilesY: 4 };
        return { tilesX: 2, tilesY: 2 };
    }

    getLargeGrid(aspectRatio) {
        return aspectRatio >= 1
            ? { tilesX: 3, tilesY: 2 }
            : { tilesX: 2, tilesY: 3 };
    }

    drawFallbackBackground() {
        this.ctx.fillStyle = FALLBACK_BG_COLOR;
        this.ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    drawBorder() {
        this.ctx.strokeStyle = BORDER_COLOR;
        this.ctx.lineWidth = BORDER_WIDTH;
        this.ctx.strokeRect(this.x, this.y, this.width, this.height);
    }

    drawObstacles() {
        for (const obstacle of this.obstacles) {
            obstacle.draw(this.ctx);
        }
    }
}
