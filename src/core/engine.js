import { ECS } from './ecs.js';
import { EventBus } from './events.js';

export class GameEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ecs = new ECS();
        this.eventBus = new EventBus();
        
        this.isRunning = false;
        this.lastTime = 0;
        this.targetFPS = 60;
        this.frameTime = 1000 / this.targetFPS;
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTime = performance.now();
            this.gameLoop();
        }
    }

    stop() {
        this.isRunning = false;
    }

    gameLoop() {
        if (!this.isRunning) return;

        const currentTime = performance.now();
        const deltaTime = Math.min(currentTime - this.lastTime, this.frameTime * 2);
        
        this.update(deltaTime / 1000);
        this.render();
        
        this.lastTime = currentTime;
        requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        this.ecs.update(deltaTime);
    }

    render() {
        // Rendering is now handled by the RenderSystem
        // No need to clear or draw background here
    }
}