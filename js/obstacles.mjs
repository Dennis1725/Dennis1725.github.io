/*
 *module obstacles creates the obstacles  
 */
const ALLOWED_SHAPES = new Set(["circle", "triangle", "rect"]);
export class Obstacle {
   
    constructor(a = 0, b = 0, c = 40, d = "circle") {
        const opts = typeof a === "object" ? a : null;
        if (opts) {
            this.x = opts.x || 0;
            this.y = opts.y || 0;
            this.radius = opts.radius || 40;
            this.shape = opts.shape || "circle";
            this._normalizeShape();
            this.width = opts.width || this.radius * 2;
            this.height = opts.height || this.radius * 2;
            this.points = opts.points || null; 
        } else {
            this.x = a;
            this.y = b;
            this.radius = c;
            this.shape = d || "circle";
            this._normalizeShape();
            this.width = this.radius * 2;
            this.height = this.radius * 2;
            this.points = null;
        }

        this.ctx = null;
        this.color = "red";
        this.type = "obstacle";

        this.sprite = null;
        this.spriteLoaded = false;
        if (this.shape === "circle") {
            this.sprite = new window.Image();
            this.sprite.src = "./sprites/Circle_obstacle_sprite.png";
        } else if (this.shape === "rect") {
            this.sprite = new window.Image();
            this.sprite.src = "./sprites/Rectangle_obstacle_sprite.png";
        } else if (this.shape === "triangle") {
            this.sprite = new window.Image();
            this.sprite.src = "./sprites/Triangle_obstacle_sprite.png";
        }
        if (this.sprite) {
            this.sprite.onload = () => { this.spriteLoaded = true; };
        }
    }

    set(x, y, width, height, ctx) {
        this.ctx = ctx;
    }

    draw(passedCtx = null) {
        const ctx = passedCtx || this.ctx;
        if (!ctx) return;

        ctx.save();
        if (this.sprite && this.spriteLoaded && this.sprite.complete) {
            let drawW = this.width;
            let drawH = this.height;
            let dx = this.x - drawW / 2;
            let dy = this.y - drawH / 2;
            ctx.drawImage(this.sprite, dx, dy, drawW, drawH);
        } else {
            ctx.fillStyle = this.color;
            ctx.strokeStyle = this.color;
            switch (this.shape) {
                case "triangle":
                    this._drawTriangle(ctx);
                    break;
                case "rect":
                    this._drawRect(ctx);
                    break;
                case "circle":
                default:
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                    ctx.fill();
                    break;
            }
        }
        ctx.restore();
    }

    _drawTriangle(ctx) {
        const r = this.radius;
        const h = r * Math.sqrt(3);
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - (2 / 3) * r);
        ctx.lineTo(this.x - r, this.y + (1 / 3) * r);
        ctx.lineTo(this.x + r, this.y + (1 / 3) * r);
        ctx.closePath();
        ctx.fill();
    }

    _drawRect(ctx) {
        const w = this.width;
        const h = this.height;
        ctx.beginPath();
        ctx.rect(this.x - w / 2, this.y - h / 2, w, h);
        ctx.fill();
    }


    _normalizeShape() {
        if (this.shape === "rectangle") this.shape = "rect";
        if (!ALLOWED_SHAPES.has(this.shape)) this.shape = "circle";
        if (this.shape === "rect") {
            this.width = this.width || this.radius * 2;
            this.height = this.height || this.radius * 1.2;
        }
    }

    collidesWithCircle(px, py, pr) {
        switch (this.shape) {
            case "rect":
                return this._circleIntersectsRect(px, py, pr);
            case "triangle":
                return this._circleIntersectsTriangle(px, py, pr);
            case "circle":
            default:
                return this._circleIntersectsCircle(px, py, pr);
        }
    }

    _circleIntersectsCircle(px, py, pr) {
        const dx = px - this.x;
        const dy = py - this.y;
        const sum = pr + this.radius;
        return dx * dx + dy * dy <= sum * sum;
    }

    _circleIntersectsRect(px, py, pr) {
        const hw = (this.width ?? this.radius * 2) / 2;
        const hh = (this.height ?? this.radius * 2) / 2;
        const nearestX = Math.max(this.x - hw, Math.min(px, this.x + hw));
        const nearestY = Math.max(this.y - hh, Math.min(py, this.y + hh));
        const dx = px - nearestX;
        const dy = py - nearestY;
        return dx * dx + dy * dy <= pr * pr;
    }

    _circleIntersectsTriangle(px, py, pr) {
        const tri = this._getTrianglePoints();
        if (this._pointInTriangle(px, py, tri)) return true;
        const rSq = pr * pr;
        for (let i = 0; i < tri.length; i++) {
            const a = tri[i];
            const b = tri[(i + 1) % tri.length];
            if (this._distanceSqPointToSegment(px, py, a.x, a.y, b.x, b.y) <= rSq) return true;
        }
        return false;
    }

    _getTrianglePoints() {
        const r = this.radius;
        return [
            { x: this.x, y: this.y - (2 / 3) * r },
            { x: this.x - r, y: this.y + (1 / 3) * r },
            { x: this.x + r, y: this.y + (1 / 3) * r }
        ];
    }

    _pointInTriangle(px, py, tri) {
        const [a, b, c] = tri;
        const s1 = this._sign(px, py, a, b);
        const s2 = this._sign(px, py, b, c);
        const s3 = this._sign(px, py, c, a);
        const hasNeg = (s1 < 0) || (s2 < 0) || (s3 < 0);
        const hasPos = (s1 > 0) || (s2 > 0) || (s3 > 0);
        return !(hasNeg && hasPos);
    }

    _sign(px, py, p2, p3) {
        return (px - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (py - p3.y);
    }

    _distanceSqPointToSegment(px, py, x1, y1, x2, y2) {
        const vx = x2 - x1;
        const vy = y2 - y1;
        const wx = px - x1;
        const wy = py - y1;
        const c1 = wx * vx + wy * vy;
        if (c1 <= 0) return (px - x1) ** 2 + (py - y1) ** 2;
        const c2 = vx * vx + vy * vy;
        if (c2 <= c1) return (px - x2) ** 2 + (py - y2) ** 2;
        const b = c1 / c2;
        const projX = x1 + b * vx;
        const projY = y1 + b * vy;
        return (px - projX) ** 2 + (py - projY) ** 2;
    }
}
