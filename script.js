/**
 * BMW M4 GT4 - Animated Wallpaper
 * Smog, Light Effects & Particles
 * Optimized for Lively Wallpaper (looping)
 */

(function () {
    'use strict';

    // ===== CONFIGURATION =====
    const CONFIG = {
        smog: {
            particleCount: 80,
            speedMin: 0.15,
            speedMax: 0.6,
            sizeMin: 80,
            sizeMax: 300,
            opacityMin: 0.02,
            opacityMax: 0.08,
            colors: [
                { r: 30, g: 60, b: 120 },   // deep blue
                { r: 50, g: 50, b: 80 },     // dark purple-blue
                { r: 20, g: 40, b: 80 },     // navy
                { r: 60, g: 60, b: 90 },     // steel blue
                { r: 40, g: 30, b: 60 },     // dark violet
                { r: 80, g: 30, b: 30 },     // dark red (taillight smoke)
            ]
        },
        lights: {
            rayCount: 6,
            volumetricOpacity: 0.04,
            flickerSpeed: 0.005,
            colors: [
                { r: 60, g: 120, b: 255 },   // blue
                { r: 100, g: 150, b: 255 },   // light blue
                { r: 255, g: 60, b: 30 },     // red/orange (taillight)
                { r: 200, g: 80, b: 50 },     // warm orange
            ]
        },
        particles: {
            count: 120,
            speedMin: 0.1,
            speedMax: 0.5,
            sizeMin: 0.5,
            sizeMax: 2.5,
            glowSize: 6,
        }
    };

    // ===== CANVAS SETUP =====
    const smogCanvas = document.getElementById('smog-canvas');
    const lightCanvas = document.getElementById('light-canvas');
    const particleCanvas = document.getElementById('particle-canvas');

    const smogCtx = smogCanvas.getContext('2d');
    const lightCtx = lightCanvas.getContext('2d');
    const particleCtx = particleCanvas.getContext('2d');

    let W, H;

    function resize() {
        W = window.innerWidth || 1920;
        H = window.innerHeight || 1080;
        
        // Prevent 0 size issues
        if (W < 10) W = 1920;
        if (H < 10) H = 1080;

        smogCanvas.width = W;
        smogCanvas.height = H;
        lightCanvas.width = W;
        lightCanvas.height = H;
        particleCanvas.width = W;
        particleCanvas.height = H;
    }

    window.addEventListener('resize', resize);
    resize();

    // ===== UTILITY =====
    function rand(min, max) {
        return Math.random() * (max - min) + min;
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    // ===== PRE-RENDER SPRITES (PERFORMANCE FIX) =====
    const smogSprites = CONFIG.smog.colors.map(color => {
        const cvs = document.createElement('canvas');
        cvs.width = 600; cvs.height = 600;
        const c = cvs.getContext('2d');
        const grad = c.createRadialGradient(300, 300, 0, 300, 300, 300);
        grad.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 1)`);
        grad.addColorStop(0.4, `rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`);
        grad.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
        c.fillStyle = grad;
        c.fillRect(0, 0, 600, 600);
        return cvs;
    });

    const dustSprites = [];
    for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        const r = Math.floor(lerp(100, 200, t));
        const g = Math.floor(lerp(140, 220, t));
        const b = Math.floor(lerp(200, 255, t));
        
        const cvs = document.createElement('canvas');
        cvs.width = 64; cvs.height = 64;
        const c = cvs.getContext('2d');
        const grad = c.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.3)`);
        grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        c.fillStyle = grad;
        c.fillRect(0, 0, 64, 64);
        dustSprites.push({ cvs, r, g, b });
    }

    // ===== SMOG / FOG SYSTEM =====
    class SmogParticle {
        constructor() {
            this.reset(true);
        }

        reset(initial) {
            this.spriteIndex = Math.floor(Math.random() * smogSprites.length);
            this.size = rand(CONFIG.smog.sizeMin, CONFIG.smog.sizeMax);
            this.opacity = rand(CONFIG.smog.opacityMin, CONFIG.smog.opacityMax);
            this.maxOpacity = this.opacity;

            if (initial) {
                this.x = rand(-this.size, W + this.size);
            } else {
                this.x = -this.size - rand(0, 100);
            }
            this.y = rand(-this.size * 0.5, H + this.size * 0.3);

            this.vx = rand(CONFIG.smog.speedMin, CONFIG.smog.speedMax);
            this.vy = rand(-0.1, 0.1);
            this.phase = rand(0, Math.PI * 2);
            this.phaseSpeed = rand(0.003, 0.01);

            // Fade lifecycle
            this.life = 0;
            this.maxLife = rand(800, 2000);
            this.fadeInDuration = this.maxLife * 0.15;
            this.fadeOutStart = this.maxLife * 0.75;
        }

        update() {
            this.x += this.vx;
            this.phase += this.phaseSpeed;
            this.y += Math.sin(this.phase) * 0.3 + this.vy;
            this.life++;

            // Fade in/out
            if (this.life < this.fadeInDuration) {
                this.opacity = this.maxOpacity * (this.life / this.fadeInDuration);
            } else if (this.life > this.fadeOutStart) {
                const fadeProgress = (this.life - this.fadeOutStart) / (this.maxLife - this.fadeOutStart);
                this.opacity = this.maxOpacity * (1 - fadeProgress);
            } else {
                this.opacity = this.maxOpacity;
            }

            if (this.x > W + this.size + 50 || this.life >= this.maxLife) {
                this.reset(false);
            }
        }

        draw(ctx) {
            if (this.opacity <= 0.001) return;
            ctx.globalAlpha = Math.max(0, Math.min(1, this.opacity));
            ctx.drawImage(smogSprites[this.spriteIndex], this.x - this.size, this.y - this.size, this.size * 2, this.size * 2);
            ctx.globalAlpha = 1.0;
        }
    }

    // ===== VOLUMETRIC LIGHT RAYS =====
    class LightRay {
        constructor(index) {
            this.index = index;
            this.reset();
        }

        reset() {
            const c = CONFIG.lights.colors[Math.floor(Math.random() * CONFIG.lights.colors.length)];
            this.color = c;
            this.baseOpacity = rand(0.02, CONFIG.lights.volumetricOpacity);
            this.opacity = this.baseOpacity;

            // Light source positions (top area, matching the image lighting)
            this.originX = rand(W * 0.1, W * 0.5);
            this.originY = rand(-H * 0.1, H * 0.1);

            this.angle = rand(0.3, 1.2);
            this.spread = rand(0.08, 0.25);
            this.length = rand(H * 0.6, H * 1.4);

            this.phase = rand(0, Math.PI * 2);
            this.flickerSpeed = rand(0.002, CONFIG.lights.flickerSpeed);
            this.swaySpeed = rand(0.001, 0.004);
            this.swayAmp = rand(0.01, 0.04);
        }

        update(time) {
            this.phase += this.flickerSpeed;
            const flicker = Math.sin(this.phase) * 0.3 + Math.sin(this.phase * 2.7) * 0.15;
            this.opacity = this.baseOpacity * (0.7 + flicker * 0.3);
            this.currentAngle = this.angle + Math.sin(time * this.swaySpeed) * this.swayAmp;
        }

        draw(ctx) {
            if (this.opacity <= 0.001) return;

            ctx.save();
            ctx.translate(this.originX, this.originY);
            ctx.rotate(this.currentAngle);

            const grad = ctx.createLinearGradient(0, 0, 0, this.length);
            grad.addColorStop(0, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.opacity})`);
            grad.addColorStop(0.3, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.opacity * 0.6})`);
            grad.addColorStop(1, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0)`);

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-this.spread * this.length, this.length);
            ctx.lineTo(this.spread * this.length, this.length);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }
    }

    // ===== TAILLIGHT VOLUMETRIC GLOW =====
    class TaillightGlow {
        constructor() {
            this.phase = 0;
            this.x = W * 0.30;
            this.y = H * 0.40;
        }

        update(time) {
            this.phase = time * 0.002;
            this.x = W * 0.30;
            this.y = H * 0.40;
        }

        draw(ctx) {
            // Main red glow
            const intensity = 0.06 + Math.sin(this.phase) * 0.02 + Math.sin(this.phase * 3.1) * 0.01;

            const grad = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, 250
            );
            grad.addColorStop(0, `rgba(255, 50, 20, ${intensity * 1.5})`);
            grad.addColorStop(0.2, `rgba(255, 30, 10, ${intensity})`);
            grad.addColorStop(0.5, `rgba(200, 20, 5, ${intensity * 0.4})`);
            grad.addColorStop(1, 'rgba(150, 10, 0, 0)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 250, 0, Math.PI * 2);
            ctx.fill();

            // Secondary warm spread
            const grad2 = ctx.createRadialGradient(
                this.x - 50, this.y + 30, 0,
                this.x - 50, this.y + 30, 400
            );
            const int2 = intensity * 0.3;
            grad2.addColorStop(0, `rgba(255, 80, 30, ${int2})`);
            grad2.addColorStop(0.3, `rgba(200, 50, 20, ${int2 * 0.5})`);
            grad2.addColorStop(1, 'rgba(150, 30, 10, 0)');

            ctx.fillStyle = grad2;
            ctx.beginPath();
            ctx.arc(this.x - 50, this.y + 30, 400, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ===== DUST / FLOATING PARTICLES =====
    class DustParticle {
        constructor() {
            this.reset(true);
        }

        reset(initial) {
            this.x = initial ? rand(0, W) : rand(-20, W + 20);
            this.y = initial ? rand(0, H) : rand(0, H);
            this.size = rand(CONFIG.particles.sizeMin, CONFIG.particles.sizeMax);
            this.opacity = rand(0.1, 0.6);
            this.maxOpacity = this.opacity;
            this.vx = rand(-CONFIG.particles.speedMax, CONFIG.particles.speedMax);
            this.vy = rand(-CONFIG.particles.speedMin, -CONFIG.particles.speedMax);
            this.phase = rand(0, Math.PI * 2);
            this.phaseSpeed = rand(0.005, 0.02);
            this.twinkleSpeed = rand(0.01, 0.04);
            this.twinklePhase = rand(0, Math.PI * 2);

            this.spriteIndex = Math.floor(Math.random() * dustSprites.length);
            const sp = dustSprites[this.spriteIndex];
            this.r = sp.r;
            this.g = sp.g;
            this.b = sp.b;

            this.life = 0;
            this.maxLife = rand(400, 1200);
        }

        update() {
            this.phase += this.phaseSpeed;
            this.twinklePhase += this.twinkleSpeed;
            this.x += this.vx + Math.sin(this.phase) * 0.15;
            this.y += this.vy + Math.cos(this.phase * 0.7) * 0.1;
            this.life++;

            // Twinkle
            const twinkle = (Math.sin(this.twinklePhase) + 1) * 0.5;
            this.opacity = this.maxOpacity * (0.3 + twinkle * 0.7);

            // Lifecycle fade
            const fadeIn = Math.min(1, this.life / 60);
            const fadeOut = this.life > this.maxLife * 0.8
                ? 1 - (this.life - this.maxLife * 0.8) / (this.maxLife * 0.2)
                : 1;
            this.opacity *= fadeIn * Math.max(0, fadeOut);

            if (this.life >= this.maxLife || this.x < -30 || this.x > W + 30 || this.y < -30 || this.y > H + 30) {
                this.reset(false);
            }
        }

        draw(ctx) {
            if (this.opacity <= 0.01) return;

            const drawOp = Math.max(0, Math.min(1, this.opacity));
            const sprite = dustSprites[this.spriteIndex];
            const size = this.size * CONFIG.particles.glowSize;
            
            ctx.globalAlpha = drawOp;
            ctx.drawImage(sprite.cvs, this.x - size, this.y - size, size * 2, size * 2);
            
            // Core
            ctx.globalAlpha = drawOp;
            ctx.fillStyle = `rgb(${this.r}, ${this.g}, ${this.b})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.globalAlpha = 1.0;
        }
    }

    // ===== GROUND FOG =====
    class GroundFog {
        constructor() {
            this.phase = 0;
        }

        update(time) {
            this.phase = time * 0.0005;
        }

        draw(ctx) {
            const fogY = H * 0.7;
            const fogHeight = H * 0.35;

            for (let i = 0; i < 5; i++) {
                const offset = Math.sin(this.phase + i * 1.3) * 30;
                const alpha = 0.03 + Math.sin(this.phase * 0.7 + i) * 0.01;

                const grad = ctx.createLinearGradient(0, fogY + offset, 0, fogY + fogHeight + offset);
                grad.addColorStop(0, `rgba(20, 40, 80, 0)`);
                grad.addColorStop(0.3, `rgba(20, 40, 80, ${alpha})`);
                grad.addColorStop(0.6, `rgba(15, 30, 60, ${alpha * 1.2})`);
                grad.addColorStop(1, `rgba(10, 20, 40, ${alpha * 0.5})`);

                ctx.fillStyle = grad;
                ctx.fillRect(0, fogY + offset - 20, W, fogHeight + 40);
            }
        }
    }

    // ===== INIT SYSTEMS =====
    const smogParticles = [];
    const lightRays = [];
    const dustParticles = [];
    const taillightGlow = new TaillightGlow();
    const groundFog = new GroundFog();

    for (let i = 0; i < CONFIG.smog.particleCount; i++) {
        smogParticles.push(new SmogParticle());
    }

    for (let i = 0; i < CONFIG.lights.rayCount; i++) {
        lightRays.push(new LightRay(i));
    }

    for (let i = 0; i < CONFIG.particles.count; i++) {
        dustParticles.push(new DustParticle());
    }

    // ===== ANIMATION LOOP =====
    let lastTime = performance.now();
    let startTime = lastTime;

    function animate(timestamp) {
        // Use performance.now() as fallback to ensure consistency across environments
        const now = timestamp || performance.now();
        const dt = now - lastTime;
        const time = now - startTime;
        lastTime = now;

        try {
            // Clear canvases
            smogCtx.clearRect(0, 0, W, H);
            lightCtx.clearRect(0, 0, W, H);
            particleCtx.clearRect(0, 0, W, H);

            // Draw ground fog
            try {
                groundFog.update(time);
                groundFog.draw(smogCtx);
            } catch (err) {}

            // Draw smog
            for (const p of smogParticles) {
                try {
                    p.update();
                    p.draw(smogCtx);
                } catch (err) {}
            }

            // Draw light rays
            for (const ray of lightRays) {
                try {
                    ray.update(now * 0.001); // Pass absolute time in seconds for sway
                    ray.draw(lightCtx);
                } catch (err) {}
            }

            // Draw taillight glow
            try {
                taillightGlow.update(time);
                taillightGlow.draw(lightCtx);
            } catch (err) {}

            // Draw dust particles
            for (const d of dustParticles) {
                try {
                    d.update();
                    d.draw(particleCtx);
                } catch (err) {}
            }
        } catch (e) {
            console.error("Animation Frame Error:", e);
        }

        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);

    window.livelyPropertyListener = function (name, val) {
        const numVal = Number(val);
        if (isNaN(numVal)) return;

        switch (name) {
            case 'smogIntensity':
                CONFIG.smog.opacityMax = Math.min(1.0, numVal * 0.1);
                break;
            case 'lightIntensity':
                CONFIG.lights.volumetricOpacity = Math.min(1.0, numVal * 0.05);
                break;
            case 'particleCount':
                break;
        }
    };

    let isPaused = false;
    let pauseTime = performance.now();
    
    // Handle Lively wallpaper pause/resume
    window.livelyWallpaperPlayback = function (state) {
        // state: 0 = play, 1 = pause
        if (state === 0) {
            if (isPaused) {
                startTime += performance.now() - pauseTime;
                lastTime = performance.now();
                isPaused = false;
            }
        } else {
            isPaused = true;
            pauseTime = performance.now();
        }
    };

})();
