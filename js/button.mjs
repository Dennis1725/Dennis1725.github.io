/**
 * Button module - creates boost button
 */
const BUTTON_COLORS = {
    active: "#28a745",
    cooldown: "#6c757d",
    ready: "#007bff"
};

const DOUBLE_TAP_THRESHOLD = 300;

export class Button {
    constructor({ 
        label = "Boost", 
        boostMultiplier = 2, 
        boostDuration = 1000, 
        cooldown = 15000, 
        flipped = false 
    } = {}) {
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
        this.ctx = null;

        this.label = label;
        this.flipped = flipped;

        this.boostMultiplier = boostMultiplier;
        this.boostDuration = boostDuration;
        this.cooldown = cooldown;

        this.player = null;
        this.lastTap = 0;
        this.availableAt = 0;
        this.active = false;
        this._originalSpeed = null;
        this.canvas = null;
    }

    set(x, y, width, height, ctx) {
        const size = Math.min(width, height);
        this.x = x + width / 2 - size / 4;
        this.y = y + height / 2 - size / 8;
        this.width = size / 2;
        this.height = size / 4;
        this.ctx = ctx;

        if (!this.canvas && ctx?.canvas) {
            this.canvas = ctx.canvas;
            this.attachEventListeners();
        }
    }

    attachEventListeners() {
        this.canvas.addEventListener("touchstart", this.onTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener("pointerdown", this.onPointerDown.bind(this));
    }

    draw() {
        if (!this.ctx) return;

        this.ctx.save();
        this.applyTransform();
        this.drawButton();
        this.drawCooldownOverlay();
        this.drawLabel();
        this.drawActiveIndicator();
        this.ctx.restore();
    }

    applyTransform() {
        if (!this.flipped) return;

        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate(Math.PI);
        this.ctx.translate(-centerX, -centerY);
    }

    drawButton() {
        this.ctx.fillStyle = this.getButtonColor();
        this.roundRect(this.x, this.y, this.width, this.height, Math.min(this.height, 12));
        this.ctx.fill();
    }

    getButtonColor() {
        if (this.active) return BUTTON_COLORS.active;
        if (Date.now() < this.availableAt) return BUTTON_COLORS.cooldown;
        return BUTTON_COLORS.ready;
    }

    drawCooldownOverlay() {
        const now = Date.now();
        if (now >= this.availableAt) return;

        const progress = 1 - (this.availableAt - now) / this.cooldown;
        
        this.ctx.fillStyle = "rgba(0,0,0,0.35)";
        this.ctx.beginPath();
        this.ctx.rect(this.x, this.y + this.height * (1 - progress), this.width, this.height * progress);
        this.ctx.fill();
    }

    drawLabel() {
        this.ctx.fillStyle = "white";
        this.ctx.font = `${Math.round(this.height * 0.4)}px sans-serif`;
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText(this.label, this.x + this.width / 2, this.y + this.height / 2);
    }

    drawActiveIndicator() {
        if (!this.active) return;

        this.ctx.strokeStyle = "yellow";
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(this.x - 4, this.y - 4, this.width + 8, this.height + 8);
    }

    connectPlayer(player) {
        this.player = player;
    }

    tryActivate() {
        if (!this.canActivate()) return false;

        this.activateBoost();
        this.scheduleBoostEnd();
        this.startCooldown();
        
        return true;
    }

    canActivate() {
        return Date.now() >= this.availableAt && 
               this.player && 
               !this.active;
    }

    activateBoost() {
        this._originalSpeed = this.player.baseSpeed ?? this.player.speed;
        this.player.speed = this._originalSpeed * this.boostMultiplier;
        this.active = true;
    }

    scheduleBoostEnd() {
        setTimeout(() => this.endBoost(), this.boostDuration);
    }

    startCooldown() {
        this.availableAt = Date.now() + this.cooldown;
    }

    endBoost() {
        if (!this.player) return;

        this.player.speed = this.player.baseSpeed ?? this._originalSpeed ?? this.player.speed;
        this._originalSpeed = null;
        this.active = false;
    }

    roundRect(x, y, w, h, r) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + r, y);
        this.ctx.arcTo(x + w, y, x + w, y + h, r);
        this.ctx.arcTo(x + w, y + h, x, y + h, r);
        this.ctx.arcTo(x, y + h, x, y, r);
        this.ctx.arcTo(x, y, x + w, y, r);
        this.ctx.closePath();
    }

    isInside(px, py) {
        return px >= this.x && 
               px <= this.x + this.width && 
               py >= this.y && 
               py <= this.y + this.height;
    }

    getPositionFromTouch(touch) {
        const rect = this.canvas.getBoundingClientRect();
        return { 
            x: touch.clientX - rect.left, 
            y: touch.clientY - rect.top 
        };
    }

    handleTap(x, y) {
        if (!this.isInside(x, y)) return;

        const now = Date.now();
        
        if (now - this.lastTap < DOUBLE_TAP_THRESHOLD) {
            this.tryActivate();
            this.lastTap = 0;
        } else {
            this.lastTap = now;
        }
    }

    onTouchStart(e) {
        for (let touch of e.changedTouches) {
            const pos = this.getPositionFromTouch(touch);
            
            if (this.isInside(pos.x, pos.y)) {
                e.preventDefault();
                this.handleTap(pos.x, pos.y);
                break;
            }
        }
    }

    onPointerDown(e) {
        if (!this.canvas) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.handleTap(x, y);
    }
}

export default Button;
