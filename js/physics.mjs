/**
 * Physics module - handles collision detection
 */
export class Physics {
    constructor() {
        this.objects = [];
        this.onCollide = null;
    }

    add(obj) {
        if (!this.isValidPhysicsObject(obj)) return;
        
        obj.collisions = 0;
        obj.vx = obj.vx || 0;
        obj.vy = obj.vy || 0;
        this.objects.push(obj);
    }

    isValidPhysicsObject(obj) {
        return obj && 
               typeof obj.x === "number" && 
               typeof obj.y === "number" && 
               typeof obj.radius === "number";
    }

    remove(obj) {
        this.objects = this.objects.filter(o => o !== obj);
    }

    update(game) {
        for (let i = 0; i < this.objects.length; i++) {
            for (let j = i + 1; j < this.objects.length; j++) {
                this.handleCollision(this.objects[i], this.objects[j], game);
            }
        }
    }

    handleCollision(a, b, game) {
        if (!this.checkCollision(a, b)) return;

        this.handlePlayerObstacleCollision(a, b, game);
        
        a.collisions++;
        b.collisions++;

        this.triggerCollisionCallbacks(a, b);
    }

    handlePlayerObstacleCollision(a, b, game) {
        if (!game || game.over) return;

        const player = this.getPlayer(a, b);
        const obstacle = this.getObstacle(a, b);
        
        if (player && obstacle) {
            const otherPlayer = this.objects.find(o => o.type === "player" && o !== player);
            game.playerHitObstacle(player, obstacle, otherPlayer);
        }
    }

    getPlayer(a, b) {
        return a.type === "player" ? a : (b.type === "player" ? b : null);
    }

    getObstacle(a, b) {
        return a.type === "obstacle" ? a : (b.type === "obstacle" ? b : null);
    }

    triggerCollisionCallbacks(a, b) {
        if (this.onCollide) this.onCollide(a, b);
        if (a.onCollide) a.onCollide(b);
        if (b.onCollide) b.onCollide(a);
    }

    checkCollision(a, b) {
        const obstacle = this.getObstacle(a, b);
        const player = this.getPlayer(a, b);

        if (obstacle?.collidesWithCircle && player) {
            return obstacle.collidesWithCircle(player.x, player.y, player.radius);
        }

        return this.checkCircleCollision(a, b);
    }

    checkCircleCollision(a, b) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        return dist > 0 && dist < a.radius + b.radius;
    }
}
