/**
 * Knockback system - handles collision physics and recoil
 */
import Responsive from "./responsive.mjs";

const DEFAULT_CONFIG = {
    baseStrength: 30,
    friction: 0.95,
    growth: 0.1,
    decay: 0.50,
    speedInfluence: 5,
    frontThreshold: 0.5,
    frontReduction: 0.5,
    fasterBias: 0.5,
    slowerBias: 0.8,
    recoilScale: 0.165,
    separationScale: 0.165,
    impulseScale: 0.165,
    debugScale: 10,
    shieldCollisionMultiplier: 1.5
};

export class KnockbackSystem {
    constructor(config = {}) {
        Object.assign(this, { ...DEFAULT_CONFIG, ...config });
        this.onRecoil = null;
    }

    apply(a, b) {
        const collision = this.calculateCollision(a, b);
        if (!collision) return;

        const { dx, dy, dist, overlap, nx, ny } = collision;
        const speeds = this.calculateSpeeds(a, b);
        const knockback = this.calculateKnockback(a, b, speeds, overlap, nx, ny);
        
        this.applyKnockback(a, b, nx, ny, knockback);
        this.notifyRecoil(a, b, knockback);
    }

    calculateCollision(a, b) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist === 0) return null;

        const overlap = (a.radius + b.radius) - dist;
        if (overlap <= 0) return null;

        return {
            dx, dy, dist, overlap,
            nx: dx / dist,
            ny: dy / dist
        };
    }

    calculateSpeeds(a, b) {
        const speedA = Math.hypot(a.vx || 0, a.vy || 0);
        const speedB = Math.hypot(b.vx || 0, b.vy || 0);
        const speedDiff = Math.abs(speedA - speedB);
        const aIsFaster = speedA > speedB;

        return { speedA, speedB, speedDiff, aIsFaster };
    }

    calculateKnockback(a, b, speeds, overlap, nx, ny) {
        const { speedA, speedB, speedDiff, aIsFaster } = speeds;
        
        const knockA = this.baseStrength * (1 + (a.collisions || 0) * this.growth);
        const knockB = this.baseStrength * (1 + (b.collisions || 0) * this.growth);
        
        const speedScale = 1 + speedDiff * this.speedInfluence;
    
        const desktopModifier = Responsive.getKnockbackModifier();
        
        let pushA = a.type === "player" 
            ? (aIsFaster ? this.fasterBias : this.slowerBias) * overlap * knockA * speedScale * this.recoilScale * desktopModifier
            : 0;
            
        let pushB = b.type === "player"
            ? (aIsFaster ? this.slowerBias : this.fasterBias) * overlap * knockB * speedScale * this.recoilScale * desktopModifier
            : 0;

        const shieldMultiplier = this.detectShieldCollision(a, b, nx, ny);
        pushA *= shieldMultiplier;
        pushB *= shieldMultiplier;

        pushA = this.applyRecoilBonus(a, pushA);
        pushB = this.applyRecoilBonus(b, pushB);

        return { pushA, pushB };
    }

    detectShieldCollision(a, b, nx, ny) {
        if (a.type !== "player" || b.type !== "player") return 1.0;
        if (!a.facing || !b.facing) return 1.0;

        const aShieldFacing = this.isShieldFacingDirection(a, nx, ny);
        const bShieldFacing = this.isShieldFacingDirection(b, -nx, -ny);

        if (aShieldFacing && bShieldFacing) {
            return this.shieldCollisionMultiplier;
        }

        return 1.0;
    }

    isShieldFacingDirection(player, dirX, dirY) {
        const dotProduct = player.facing.x * dirX + player.facing.y * dirY;
        return dotProduct > this.frontThreshold;
    }

    applyRecoilBonus(player, basePush) {
        if (!player.accumulatedRecoil) return basePush;
        
        const recoilMultiplier = 1 + (player.accumulatedRecoil / 100);
        
        return basePush * recoilMultiplier;
    }

    applyKnockback(a, b, nx, ny, knockback) {
        let { pushA, pushB } = knockback;

        pushA = this.applyFrontReduction(a, -nx, -ny, pushA);
        pushB = this.applyFrontReduction(b, nx, ny, pushB);

        this.applyForces(a, -nx, -ny, pushA);
        this.applyForces(b, nx, ny, pushB);
    }

    applyFrontReduction(obj, incomingX, incomingY, push) {
        if (obj.type !== "player" || !obj.facing) return push;

        const magnitude = Math.hypot(incomingX, incomingY) || 1;
        const dotProduct = (incomingX / magnitude) * obj.facing.x + 
                          (incomingY / magnitude) * obj.facing.y;

        return dotProduct > this.frontThreshold ? push * this.frontReduction : push;
    }

    applyForces(obj, nx, ny, push) {
        if (obj.type !== "player") return;

        obj.x += nx * push * this.separationScale;
        obj.y += ny * push * this.separationScale;
        obj.vx = (obj.vx || 0) + nx * push * this.impulseScale;
        obj.vy = (obj.vy || 0) + ny * push * this.impulseScale;
    }

    notifyRecoil(a, b, knockback) {
        if (typeof this.onRecoil !== "function") return;

        try {
            this.onRecoil({
                aPush: (knockback.pushA * this.debugScale) / 1000,
                bPush: (knockback.pushB * this.debugScale) / 1000,
                a,
                b
            });
        } catch (e) {
            console.warn("onRecoil callback error:", e);
        }
    }

    update(objects) {
        for (const obj of objects) {
            this.updateObject(obj);
        }
    }

    updateObject(obj) {
        if (obj.type === "player" && "vx" in obj && "vy" in obj) {
            obj.x += obj.vx;
            obj.y += obj.vy;
            obj.vx *= this.friction;
            obj.vy *= this.friction;
        }

        if ("collisions" in obj) {
            obj.collisions *= this.decay;
        }
    }
}
