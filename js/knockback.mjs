// js/knockback.mjs
export class KnockbackSystem {
    constructor({
        // tuned for milder recoil
        baseStrength = 30,
        friction = 0.95,
        growth = 0.1,
        decay = 0.50,
        speedInfluence = 5 // how much speed difference affects knockback
    } = {}) {
        this.baseStrength = baseStrength;
        this.friction = friction;
        this.growth = growth;
        this.decay = decay;
        this.speedInfluence = speedInfluence;
        // optional callback to report recoil values: function({aPush, bPush, a, b})
        this.onRecoil = null;
    }

    apply(a, b) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        if (dist === 0) return;

        const overlap = (a.radius + b.radius) - dist;
        if (overlap <= 0) return;

        const nx = dx / dist;
        const ny = dy / dist;

        // Compute each object's current speed
        const speedA = Math.hypot(a.vx || 0, a.vy || 0);
        const speedB = Math.hypot(b.vx || 0, b.vy || 0);

        // Base knockback grows with number of collisions
        const knockA = this.baseStrength * (1 + (a.collisions || 0) * this.growth);
        const knockB = this.baseStrength * (1 + (b.collisions || 0) * this.growth);

        // Add scaling based on relative speed difference
        const speedDiff = Math.abs(speedA - speedB);
        const knockScale = 1 + speedDiff * this.speedInfluence;

        // Determine who is faster — they knock back the slower one more
        const aIsFaster = speedA > speedB;

            // Only move objects that are not obstacles
            // Increase push magnitude and bias so faster object pushes the slower one more
            const biasFast = 0.5; // factor applied to the faster object (they push less)
            const biasSlow = 0.8; // factor applied to the slower object (they get pushed more)
            // scaleDown overall to reach ~70% reduction of recoil
            const scaleDown = 0.3;
            let pushA = a.type === "player" ? (aIsFaster ? biasFast : biasSlow) * overlap * knockA * knockScale * scaleDown : 0;
            let pushB = b.type === "player" ? (aIsFaster ? biasSlow : biasFast) * overlap * knockB * knockScale * scaleDown : 0;

        // If the object has a facing vector, detect whether it was hit from the front.
        // If hit from front, reduce the push (player blocks a bit with the frontal rectangle).
        const FRONT_THRESHOLD = 0.5; // dot product threshold to consider "front"
        const FRONT_REDUCTION = 0.5; // reduce push to 50% when hit on front rectangle

        // For a: incoming vector toward a is (-nx, -ny)
        if (a.type === "player" && a.facing) {
            const inAx = -nx;
            const inAy = -ny;
            const magA = Math.hypot(inAx, inAy) || 1;
            const dotA = (inAx / magA) * a.facing.x + (inAy / magA) * a.facing.y;
            if (dotA > FRONT_THRESHOLD) {
                pushA *= FRONT_REDUCTION;
            }
        }

        // For b: incoming vector toward b is (nx, ny)
        if (b.type === "player" && b.facing) {
            const inBx = nx;
            const inBy = ny;
            const magB = Math.hypot(inBx, inBy) || 1;
            const dotB = (inBx / magB) * b.facing.x + (inBy / magB) * b.facing.y;
            if (dotB > FRONT_THRESHOLD) {
                pushB *= FRONT_REDUCTION;
            }
        }

        // 🧠 Debug Info
        console.log(
            `%c[Collision]`,
            "color: orange; font-weight: bold;",
            `SpeedA: ${speedA.toFixed(2)}, SpeedB: ${speedB.toFixed(2)}, Δspeed: ${speedDiff.toFixed(2)}`
        );
        console.log(
            `%cObject A (${a.type})`,
            "color: cyan;",
            `Collisions: ${a.collisions}, Knockback: ${(pushA * 10).toFixed(2)}`
        );
        console.log(
            `%cObject B (${b.type})`,
            "color: magenta;",
            `Collisions: ${b.collisions}, Knockback: ${(pushB * 10).toFixed(2)}`
        );

        // Separate and apply impulse only to players
        if (a.type === "player") {
            // positional separation (reduced)
            a.x -= nx * pushA * 0.3;
            a.y -= ny * pushA * 0.3;
            // reduced impulse to velocity so recoil is about 70% less
            a.vx = (a.vx || 0) - nx * pushA * 0.3;
            a.vy = (a.vy || 0) - ny * pushA * 0.3;
        }
        if (b.type === "player") {
            b.x += nx * pushB * 0.3;
            b.y += ny * pushB * 0.3;
            b.vx = (b.vx || 0) + nx * pushB * 0.3;
            b.vy = (b.vy || 0) + ny * pushB * 0.3;
        }

        // Notify listeners about recoil magnitudes (use the same scale as debug logs: *10)
        try {
            if (typeof this.onRecoil === "function") {
                this.onRecoil({ aPush: pushA * 10, bPush: pushB * 10, a, b });
            }
        } catch (e) {
            console.warn("onRecoil callback threw:", e);
        }
    }

    update(objects) {
        for (const obj of objects) {
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
}
