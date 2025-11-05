/**
 * module: physics
 * -->checks collsions
 */
export class Physics {
    constructor() {
        this.objects = [];
        this.onCollide = null; 
    }

    add(obj) {
        if (
            obj &&
            typeof obj.x === "number" &&
            typeof obj.y === "number" &&
            typeof obj.radius === "number"
        ) {
            obj.collisions = 0;
            obj.vx = obj.vx || 0;
            obj.vy = obj.vy || 0;
            this.objects.push(obj);
        } else {
            console.warn("Physics: Tried to add invalid object", obj);
        }
    }

    remove(obj) {
        this.objects = this.objects.filter(o => o !== obj);
    }

    update(game) {
        for (let i = 0; i < this.objects.length; i++) {
            const a = this.objects[i];
            for (let j = i + 1; j < this.objects.length; j++) {
                const b = this.objects[j];
                if (this.checkCollision(a, b)) {
                    if (game && !game.over) {
                        if (a.type === "player" && b.type === "obstacle") {
                            const other = this.objects.find(o => o.type === "player" && o !== a);
                            game.playerHitObstacle(a, b, other);
                        } else if (b.type === "player" && a.type === "obstacle") {
                            const other = this.objects.find(o => o.type === "player" && o !== b);
                            game.playerHitObstacle(b, a, other);
                        }
                    }

                    a.collisions++;
                    b.collisions++;

                    if (typeof this.onCollide === "function") this.onCollide(a, b);
                    if (typeof a.onCollide === "function") a.onCollide(b);
                    if (typeof b.onCollide === "function") b.onCollide(a);
                }
            }
        }
    }

    checkCollision(a, b) {
        if (a?.type === "player" && b?.type === "obstacle" && typeof b.collidesWithCircle === "function") {
            return b.collidesWithCircle(a.x, a.y, a.radius);
        }
        if (b?.type === "player" && a?.type === "obstacle" && typeof a.collidesWithCircle === "function") {
            return a.collidesWithCircle(b.x, b.y, b.radius);
        }
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        const minDist = a.radius + b.radius;
        return dist < minDist && dist > 0;
    }

    debugDraw(ctx) {
        if (!ctx) return;
        ctx.save();
        ctx.strokeStyle = "rgba(255,0,0,0.4)";
        for (const obj of this.objects) {
            ctx.beginPath();
            ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    }
}
