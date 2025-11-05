// js/joystick.mjs
export class Joystick {
    constructor({ outerRadius = 60, innerRadius = 30, color = "rgba(0,0,0,0.3)" } = {}) {
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
        this.outerRadius = outerRadius;
        this.innerRadius = innerRadius;
        this.color = color;

        this.touchId = null;
        this.active = false;
        this.value = { x: 0, y: 0 }; // normalized direction vector (-1 to 1)
        this.strength = 0; // magnitude (0 to 1)
        this.ctx = null;
        this.canvas = null;
    }

    set(x, y, width, height, ctx) {
        this.x = x + width / 2;
        this.y = y + height / 2;
        this.width = width;
        this.height = height;
        this.ctx = ctx;

        if (!this.canvas && ctx && ctx.canvas) {
            this.canvas = ctx.canvas;
            this.canvas.addEventListener("touchstart", this.onStart.bind(this), { passive: false });
            this.canvas.addEventListener("touchmove", this.onMove.bind(this), { passive: false });
            this.canvas.addEventListener("touchend", this.onEnd.bind(this));
            this.canvas.addEventListener("touchcancel", this.onEnd.bind(this));
        }
    }

    draw() {
        if (!this.ctx) return;
        const ctx = this.ctx;
        const radius = Math.min(this.outerRadius, this.height / 2, this.width / 2);

        ctx.save();
        ctx.globalAlpha = 0.7;

        // Outer circle
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // Inner circle position based on input
        const innerX = this.x + this.value.x * radius * this.strength;
        const innerY = this.y + this.value.y * radius * this.strength;

        ctx.beginPath();
        ctx.arc(innerX, innerY, Math.min(this.innerRadius, radius / 2), 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fill();

        ctx.restore();
    }

    getPosFromTouch(touch) {
        const rect = this.canvas.getBoundingClientRect();
        return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }

    onStart(e) {
        for (let touch of e.changedTouches) {
            const pos = this.getPosFromTouch(touch);
            const dist = Math.hypot(pos.x - this.x, pos.y - this.y);
            if (dist < this.outerRadius * 1.2 && !this.active) {
                this.active = true;
                this.touchId = touch.identifier;
                e.preventDefault();
                break;
            }
        }
    }

    onMove(e) {
        if (!this.active) return;

        const touch = Array.from(e.touches).find(t => t.identifier === this.touchId);
        if (!touch) return;

        const pos = this.getPosFromTouch(touch);
        const dx = pos.x - this.x;
        const dy = pos.y - this.y;
        const dist = Math.hypot(dx, dy);
        const norm = Math.min(1, dist / this.outerRadius);

        this.value.x = dx / (dist || 1);
        this.value.y = dy / (dist || 1);
        this.strength = norm; // store magnitude for speed scaling

        e.preventDefault();
    }

    onEnd(e) {
        if (!this.active) return;

        for (let touch of e.changedTouches) {
            if (touch.identifier === this.touchId) {
                this.active = false;
                this.touchId = null;
                this.value = { x: 0, y: 0 };
                this.strength = 0;
                break;
            }
        }
    }
}
