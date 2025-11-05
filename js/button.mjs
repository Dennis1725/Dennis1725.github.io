/*
 * module: button
 * -->creates the button for the boost
 */
export class Button {
    constructor({ label = "Boost", boostMultiplier = 2, boostDuration = 1000, cooldown = 15000, flipped = false } = {}) {
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
        this.x = x + width / 2 - Math.min(width, height) / 4; 
        this.y = y + height / 2 - Math.min(width, height) / 8;
        this.width = Math.min(width, height) / 2;
        this.height = Math.min(width, height) / 4;
        this.ctx = ctx;

        if (!this.canvas && ctx && ctx.canvas) {
            this.canvas = ctx.canvas;
          
            this.canvas.addEventListener("touchstart", this._onTouchStart.bind(this), { passive: false });
            this.canvas.addEventListener("pointerdown", this._onPointerDown.bind(this));
        }
    }

    draw() {
        if (!this.ctx) return;
        const ctx = this.ctx;

        ctx.save();

        if (this.flipped) {
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(Math.PI);
            ctx.translate(-(this.x + this.width / 2), -(this.y + this.height / 2));
        }

        ctx.fillStyle = this._bgColor();
        this._roundRect(ctx, this.x, this.y, this.width, this.height, Math.min(this.height, 12));
        ctx.fill();

        const now = Date.now();
        if (now < this.availableAt) {
            const pct = 1 - (this.availableAt - now) / this.cooldown;
            ctx.fillStyle = "rgba(0,0,0,0.35)";
            ctx.beginPath();
            ctx.rect(this.x, this.y + this.height * (1 - pct), this.width, this.height * pct);
            ctx.fill();
        }

        
        ctx.fillStyle = "white";
        ctx.font = `${Math.round(this.height * 0.4)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.label, this.x + this.width / 2, this.y + this.height / 2);

        
        if (this.active) {
            ctx.strokeStyle = "yellow";
            ctx.lineWidth = 3;
            ctx.strokeRect(this.x - 4, this.y - 4, this.width + 8, this.height + 8);
        }

        ctx.restore();
    }

    connectPlayer(player) {
        this.player = player;
    }

    
    tryActivate() {
        const now = Date.now();
        if (now < this.availableAt) return false; 
        if (!this.player) return false;

        
        if (this.active) return false;

        this._originalSpeed = this.player.baseSpeed != null ? this.player.baseSpeed : this.player.speed;
        this.player.speed = (this.player.baseSpeed != null ? this.player.baseSpeed : this.player.speed) * this.boostMultiplier;
        this.active = true;

        setTimeout(() => this._endBoost(), this.boostDuration);
        this.availableAt = now + this.cooldown;
        return true;
    }

    _endBoost() {
        if (!this.player) return;
        if (this.player.baseSpeed != null) this.player.speed = this.player.baseSpeed;
        else if (this._originalSpeed != null) this.player.speed = this._originalSpeed;
        this._originalSpeed = null;
        this.active = false;
    }

    _bgColor() {
        const now = Date.now();
        if (this.active) return "#28a745"; 
        if (now < this.availableAt) return "#6c757d"; 
        return "#007bff"; 
    }

    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    _inside(px, py) {
        return px >= this.x && px <= this.x + this.width && py >= this.y && py <= this.y + this.height;
    }

    _getPosFromTouch(touch) {
        const rect = this.canvas.getBoundingClientRect();
        return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }

    _onTouchStart(e) {
        for (let touch of e.changedTouches) {
            const pos = this._getPosFromTouch(touch);
            if (this._inside(pos.x, pos.y)) {
                const now = Date.now();
                if (now - this.lastTap < 300) {
                    e.preventDefault();
                    this.tryActivate();
                    this.lastTap = 0;
                } else {
                    this.lastTap = now;
                }
                break;
            }
        }
    }

    _onPointerDown(e) {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        if (this._inside(x, y)) {
            const now = Date.now();
            if (now - this.lastTap < 300) {
                this.tryActivate();
                this.lastTap = 0;
            } else {
                this.lastTap = now;
            }
        }
    }
}

export default Button;
