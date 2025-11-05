/*
 * module: player
 * -->creates the player 
 */ 
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
        
        this.sprite = new Image();
        this.shieldSprite = new Image();
        this.spriteLoaded = false;
        this.shieldLoaded = false;
        
        if (color === "blue") {
            this.sprite.src = "./sprites/Blue_player_sprite.png";
        } else if (color === "green") {
            this.sprite.src = "./sprites/Green_player_sprite.png";
        }
        
        this.sprite.onload = () => {
            this.spriteLoaded = true;
        };
        
        this.shieldSprite.src = "./sprites/Shield.png";
        this.shieldSprite.onload = () => {
            this.shieldLoaded = true;
        };
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

    // Update position based on joystick input
    update() {
        if (!this.joystick) return;
        this.x += this.joystick.value.x * this.speed;
        this.y += this.joystick.value.y * this.speed;

        const vx = this.joystick.value.x;
        const vy = this.joystick.value.y;
        const mag = Math.hypot(vx, vy);
        if (mag > 0.1) {
            this.facing.x = vx / (mag || 1);
            this.facing.y = vy / (mag || 1);
        }

        if (this.ctx && this.ctx.canvas) {
            const cw = this.ctx.canvas.width;
            const ch = this.ctx.canvas.height;
            this.x = Math.max(this.radius, Math.min(cw - this.radius, this.x));
            this.y = Math.max(this.radius, Math.min(ch - this.radius, this.y));
        }
    }

draw(ctx = null) {
    const drawCtx = ctx || this.ctx;
    if (!drawCtx) return;

    this.update();

    drawCtx.save();
    
    if (this.spriteLoaded && this.sprite.complete) {
        const spriteSize = this.radius * 2;
        drawCtx.drawImage(
            this.sprite,
            this.x - this.radius,
            this.y - this.radius,
            spriteSize,
            spriteSize
        );
    } else {
        
        drawCtx.fillStyle = this.color;
        drawCtx.beginPath();
        drawCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        drawCtx.fill();
    }
    
    drawCtx.restore();

    if (drawCtx) {
        drawCtx.save();
        const angle = Math.atan2(this.facing.y, this.facing.x);
        drawCtx.translate(this.x, this.y);
        drawCtx.rotate(angle);

        const shieldLength = this.radius * 1.2;
        const shieldWidth = Math.max(6, this.radius * 1.6);
        const shieldX = this.radius * 0.2;

        if (this.shieldLoaded && this.shieldSprite.complete) {
            drawCtx.drawImage(
                this.shieldSprite,
                shieldX,
                -shieldWidth / 2,
                shieldLength,
                shieldWidth
            );
        } else {
            drawCtx.fillStyle = "rgba(211,211,211,0.9)";
            drawCtx.beginPath();
            drawCtx.rect(shieldX, -shieldWidth / 2, shieldLength, shieldWidth);
            drawCtx.fill();
        }
        
        drawCtx.restore();
    }
}

}

