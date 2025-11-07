/**
 * Obstacles module - creates and manages obstacles
 */
const ALLOWED_SHAPES = new Set(["circle", "triangle", "rect"]);
const SPRITE_PATHS = {
    circle: "./sprites/Circle_obstacle_sprite.png",
    rect: "./sprites/Rectangle_obstacle_sprite.png",
    triangle: "./sprites/Triangle_obstacle_sprite.png"
};

export class Obstacle {
    constructor(options) {
        this.initializePosition(options);
        this.ctx = null;
        this.color = "red";
        this.type = "obstacle";
        this.loadSprite();
    }

    initializePosition(options) {
        const opts = typeof options === "object" && options !== null ? options : {};
        
        this.x = opts.x || 0;
        this.y = opts.y || 0;
        this.radius = opts.radius || 40;
        this.shape = this.normalizeShape(opts.shape || "circle");
        this.width = opts.width || this.radius * 2;
        this.height = opts.height || this.radius * 2;
        this.points = opts.points || null;

        if (this.shape === "rect") {
            this.width = opts.width || this.radius * 2;
            this.height = opts.height || this.radius * 1.2;
        }
    }

    normalizeShape(shape) {
        if (shape === "rectangle") return "rect";
        return ALLOWED_SHAPES.has(shape) ? shape : "circle";
    }

    loadSprite() {
        const path = SPRITE_PATHS[this.shape];
        if (!path) return;

        this.sprite = new Image();
        this.sprite.src = path;
    }

    set(x, y, width, height, ctx) {
        this.ctx = ctx;
    }

    draw(ctx = this.ctx) {
        if (!ctx) return;

        ctx.save();
        
        if (this.isImageLoaded()) {
            this.drawSprite(ctx);
        } else {
            this.drawShape(ctx);
        }
        
        ctx.restore();
    }

    isImageLoaded() {
        return this.sprite && this.sprite.complete;
    }

    drawSprite(ctx) {
        const dx = this.x - this.width / 2;
        const dy = this.y - this.height / 2;
        ctx.drawImage(this.sprite, dx, dy, this.width, this.height);
    }

    drawShape(ctx) {
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;

        const shapeDrawers = {
            triangle: () => this.drawTriangle(ctx),
            rect: () => this.drawRect(ctx),
            circle: () => this.drawCircle(ctx)
        };

        const drawer = shapeDrawers[this.shape] || shapeDrawers.circle;
        drawer();
    }

    drawCircle(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    drawTriangle(ctx) {
        const r = this.radius;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - (2 / 3) * r);
        ctx.lineTo(this.x - r, this.y + (1 / 3) * r);
        ctx.lineTo(this.x + r, this.y + (1 / 3) * r);
        ctx.closePath();
        ctx.fill();
    }

    drawRect(ctx) {
        ctx.beginPath();
        ctx.rect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        ctx.fill();
    }

    collidesWithCircle(px, py, pr) {
        const collisionCheckers = {
            rect: () => this.circleIntersectsRect(px, py, pr),
            triangle: () => this.circleIntersectsTriangle(px, py, pr),
            circle: () => this.circleIntersectsCircle(px, py, pr)
        };

        const checker = collisionCheckers[this.shape] || collisionCheckers.circle;
        return checker();
    }

    circleIntersectsCircle(px, py, pr) {
        const dx = px - this.x;
        const dy = py - this.y;
        const sum = pr + this.radius;
        return dx * dx + dy * dy <= sum * sum;
    }

    circleIntersectsRect(px, py, pr) {
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        
        const nearestX = Math.max(this.x - halfWidth, Math.min(px, this.x + halfWidth));
        const nearestY = Math.max(this.y - halfHeight, Math.min(py, this.y + halfHeight));
        
        const dx = px - nearestX;
        const dy = py - nearestY;
        
        return dx * dx + dy * dy <= pr * pr;
    }

    circleIntersectsTriangle(px, py, pr) {
        const trianglePoints = this.getTrianglePoints();
        
        if (this.pointInTriangle(px, py, trianglePoints)) return true;

        const radiusSquared = pr * pr;
        for (let i = 0; i < trianglePoints.length; i++) {
            const a = trianglePoints[i];
            const b = trianglePoints[(i + 1) % trianglePoints.length];
            
            if (this.distanceSquaredToSegment(px, py, a, b) <= radiusSquared) {
                return true;
            }
        }
        
        return false;
    }

    getTrianglePoints() {
        const r = this.radius;
        return [
            { x: this.x, y: this.y - (2 / 3) * r },
            { x: this.x - r, y: this.y + (1 / 3) * r },
            { x: this.x + r, y: this.y + (1 / 3) * r }
        ];
    }

    pointInTriangle(px, py, triangle) {
        const [a, b, c] = triangle;
        const sign1 = this.sign(px, py, a, b);
        const sign2 = this.sign(px, py, b, c);
        const sign3 = this.sign(px, py, c, a);
        
        const hasNegative = sign1 < 0 || sign2 < 0 || sign3 < 0;
        const hasPositive = sign1 > 0 || sign2 > 0 || sign3 > 0;
        
        return !(hasNegative && hasPositive);
    }

    sign(px, py, p2, p3) {
        return (px - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (py - p3.y);
    }

    distanceSquaredToSegment(px, py, p1, p2) {
        const vx = p2.x - p1.x;
        const vy = p2.y - p1.y;
        const wx = px - p1.x;
        const wy = py - p1.y;
        
        const dotProduct = wx * vx + wy * vy;
        
        if (dotProduct <= 0) {
            return (px - p1.x) ** 2 + (py - p1.y) ** 2;
        }
        
        const segmentLengthSquared = vx * vx + vy * vy;
        
        if (segmentLengthSquared <= dotProduct) {
            return (px - p2.x) ** 2 + (py - p2.y) ** 2;
        }
        
        const t = dotProduct / segmentLengthSquared;
        const projX = p1.x + t * vx;
        const projY = p1.y + t * vy;
        
        return (px - projX) ** 2 + (py - projY) ** 2;
    }
}
