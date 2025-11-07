/**
 * Player module - creates and manages player
 */
const SPRITE_PATHS = {
    blue: "./sprites/Blue_player_sprite.png",
    green: "./sprites/Green_player_sprite.png"
};

export class Player {
    constructor({ radius = 20, color = "red", speed = 0.63 } = {}) {
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
        this.radius = radius;
        this.color = color;
        this.speed = speed;
        this.baseSpeed = speed;
        this.type = "player";
        this.ctx = null;
        this.joystick = null;
        this.facing = { x: 1, y: 0 };
        
        this.loadSprites();
    }

    loadSprites() {
        this.sprite = this.loadImage(SPRITE_PATHS[this.color]);
        this.shieldSprite = this.loadImage("./sprites/Shield.png");
    }

    loadImage(src) {
        if (!src) return null;
        
        const img = new Image();
        img.src = src;
        return img;
    }

    set(x, y, width, height, ctx) {
        this.x = x + width / 2;
        this.y = y + height / 2;
        this.width = width;
        this.height = height;
        this.ctx = ctx;
    }

    connectJoystick(joystick) {
        this.joystick = joystick;
    }

    update() {
        if (!this.joystick) return;
        
        this.updatePosition();
        this.updateFacing();
        this.constrainToCanvas();
    }

    updatePosition() {
        this.x += this.joystick.value.x * this.speed;
        this.y += this.joystick.value.y * this.speed;
    }

    updateFacing() {
        const { x: vx, y: vy } = this.joystick.value;
        const magnitude = Math.hypot(vx, vy);
        
        if (magnitude > 0.1) {
            this.facing.x = vx / magnitude;
            this.facing.y = vy / magnitude;
        }
    }

    constrainToCanvas() {
        if (!this.ctx?.canvas) return;
        
        const { width, height } = this.ctx.canvas;
        this.x = Math.max(this.radius, Math.min(width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(height - this.radius, this.y));
    }

    draw(ctx = this.ctx) {
        if (!ctx) return;

        this.update();
        this.drawPlayer(ctx);
        this.drawShield(ctx);
    }

    drawPlayer(ctx) {
        ctx.save();
        
        if (this.isImageLoaded(this.sprite)) {
            const size = this.radius * 2;
            ctx.drawImage(this.sprite, this.x - this.radius, this.y - this.radius, size, size);
        } else {
            this.drawCircle(ctx);
        }
        
        ctx.restore();
    }

    drawCircle(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    drawShield(ctx) {
        ctx.save();
        
        const angle = Math.atan2(this.facing.y, this.facing.x);
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);

        const length = this.radius * 1.2;
        const width = Math.max(6, this.radius * 1.6);
        const offsetX = this.radius * 0.2;

        if (this.isImageLoaded(this.shieldSprite)) {
            ctx.drawImage(this.shieldSprite, offsetX, -width / 2, length, width);
        } else {
            this.drawShieldRect(ctx, offsetX, width, length);
        }
        
        ctx.restore();
    }

    drawShieldRect(ctx, offsetX, width, length) {
        ctx.fillStyle = "rgba(211,211,211,0.9)";
        ctx.beginPath();
        ctx.rect(offsetX, -width / 2, length, width);
        ctx.fill();
    }

    isImageLoaded(img) {
        return img && img.complete;
    }
}
