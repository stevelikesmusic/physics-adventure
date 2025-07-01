import { GameEngine } from './core/engine.js';
import { PhysicsEngine } from './physics/matter-bridge.js';
import { CanvasRenderer } from './rendering/canvas-renderer.js';
import { PhysicsSystem } from './systems/physics-system.js';
import { RenderSystem } from './systems/render-system.js';
import { InputSystem } from './systems/input-system.js';
import { GameSystem } from './systems/game-system.js';
import { LifetimeSystem } from './systems/lifetime-system.js';
import { RobotSystem } from './systems/robot-system.js';

class PhysicsAdventure {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        if (!this.canvas) {
            throw new Error('Canvas element not found');
        }

        this.initGame();
    }

    initGame() {
        this.gameEngine = new GameEngine(this.canvas);
        
        this.physicsEngine = new PhysicsEngine(this.canvas, this.gameEngine.eventBus);
        this.renderer = new CanvasRenderer(this.canvas, this.gameEngine.ctx);
        
        this.physicsSystem = new PhysicsSystem(this.physicsEngine);
        this.renderSystem = new RenderSystem(this.renderer);
        this.inputSystem = new InputSystem(this.canvas, this.gameEngine.eventBus);
        this.gameSystem = new GameSystem(this.physicsSystem, this.renderer, this.gameEngine.eventBus);
        this.lifetimeSystem = new LifetimeSystem(this.physicsSystem);
        this.robotSystem = new RobotSystem();
        
        this.gameEngine.ecs.addSystem(this.physicsSystem);
        this.gameEngine.ecs.addSystem(this.renderSystem);
        this.gameEngine.ecs.addSystem(this.gameSystem);
        this.gameEngine.ecs.addSystem(this.robotSystem);
        this.gameEngine.ecs.addSystem(this.lifetimeSystem);
        
        this.setupEventListeners();
        this.gameEngine.start();
        
        console.log('Physics Adventure initialized!');
        console.log('Controls:');
        console.log('- Block Tool: Click to place blocks');
        console.log('- Ball Tool: Click and drag to launch projectiles');
        console.log('- Use material selector to change block/ball material');
    }

    setupEventListeners() {
        this.gameEngine.eventBus.on('collision', (data) => {
            console.log('Collision detected between:', data.bodyA.label, 'and', data.bodyB.label);
        });

        window.addEventListener('beforeunload', () => {
            this.gameEngine.stop();
        });

        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case '1':
                    this.inputSystem.setTool('block');
                    break;
                case '2':
                    this.inputSystem.setTool('projectile');
                    break;
                case '3':
                    this.inputSystem.setTool('dot');
                    break;
                case '4':
                    this.inputSystem.setTool('robot');
                    break;
                case 'r':
                    this.resetGame();
                    break;
            }
        });
    }

    resetGame() {
        this.gameEngine.ecs.entities.forEach((_, entityId) => {
            if (entityId !== 'ground') {
                this.physicsSystem.removePhysicsBody(entityId);
                this.gameEngine.ecs.removeEntity(entityId);
            }
        });
        console.log('Game reset! Press R to reset again.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    try {
        window.game = new PhysicsAdventure();
    } catch (error) {
        console.error('Failed to initialize game:', error);
        document.body.innerHTML = `
            <div style="color: red; text-align: center; margin-top: 50px;">
                <h2>Game Failed to Load</h2>
                <p>Error: ${error.message}</p>
                <p>Please check the console for more details.</p>
            </div>
        `;
    }
});