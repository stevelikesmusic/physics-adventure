import { System, ComponentTypes } from '../core/ecs.js';
import { EventTypes } from '../core/events.js';
import { BlockFactory } from '../entities/block.js';
import { ProjectileFactory } from '../entities/projectile.js';
import { VehicleFactory } from '../entities/vehicle.js';
import { RobotMouseFactory } from '../entities/robot-mouse.js';

export class GameSystem extends System {
    constructor(physicsSystem, renderer, eventBus) {
        super();
        this.physicsSystem = physicsSystem;
        this.renderer = renderer;
        this.eventBus = eventBus;
        
        this.blockFactory = new BlockFactory(null, physicsSystem);
        this.projectileFactory = new ProjectileFactory(null, physicsSystem);
        this.vehicleFactory = new VehicleFactory(null, physicsSystem);
        this.robotMouseFactory = new RobotMouseFactory(null, physicsSystem);
        
        this.dragPreview = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.eventBus.on(EventTypes.INPUT_CLICK, (data) => this.handleClick(data));
        this.eventBus.on(EventTypes.INPUT_DRAG, (data) => this.handleDrag(data));
        this.eventBus.on('input_release', (data) => this.handleRelease(data));
    }

    update(deltaTime) {
        this.blockFactory.ecs = this.ecs;
        this.projectileFactory.ecs = this.ecs;
        this.vehicleFactory.ecs = this.ecs;
        this.robotMouseFactory.ecs = this.ecs;
        
        if (this.dragPreview && this.dragPreview.tool === 'projectile') {
            this.renderTrajectoryPreview();
        }
    }

    handleClick(data) {
        if (data.tool === 'block') {
            this.createBlock(data.x, data.y, data.material);
        } else if (data.tool === 'vehicle') {
            this.createVehicle(data.x, data.y, data.material);
        } else if (data.tool === 'robot') {
            this.createRobotMouse(data.x, data.y);
        } else if (data.tool === 'projectile') {
            this.dragPreview = {
                tool: 'projectile',
                start: { x: data.x, y: data.y },
                current: { x: data.x, y: data.y },
                material: data.material
            };
        }
    }

    handleDrag(data) {
        if (this.dragPreview) {
            this.dragPreview.current = data.current;
        }
    }

    handleRelease(data) {
        if (data.tool === 'projectile' && data.distance > 10) {
            this.launchProjectile(data.start, data.end, data.material);
        }
        this.dragPreview = null;
    }

    createBlock(x, y, material) {
        const blockSize = 40;
        
        if (y > window.innerHeight * 0.7 - blockSize) {
            y = window.innerHeight * 0.7 - blockSize;
        }
        
        this.blockFactory.create(x, y, blockSize, blockSize, material);
    }

    createVehicle(x, y, material) {
        // Ensure vehicle is placed on ground
        if (y > window.innerHeight * 0.7 - 60) {
            y = window.innerHeight * 0.7 - 60;
        }
        
        this.vehicleFactory.createSimpleCar(x, y, material);
    }

    createRobotMouse(x, y) {
        // Check if we already have too many robots
        const existingRobots = this.ecs.getEntitiesWithComponents(ComponentTypes.AI);
        if (existingRobots.length >= 5) {
            console.log('Maximum number of robots (5) reached');
            return;
        }
        
        // Ensure robot is placed above ground
        if (y > window.innerHeight * 0.7 - 20) {
            y = window.innerHeight * 0.7 - 20;
        }
        
        this.robotMouseFactory.create(x, y);
    }

    launchProjectile(start, end, material) {
        const velocityX = (end.x - start.x) * 0.3;
        const velocityY = (end.y - start.y) * 0.3;
        
        const entityId = this.projectileFactory.create(start.x, start.y, 15, material);
        this.projectileFactory.launch(entityId, velocityX, velocityY);
    }

    renderTrajectoryPreview() {
        if (!this.dragPreview) return;
        
        const velocityX = (this.dragPreview.current.x - this.dragPreview.start.x) * 0.3;
        const velocityY = (this.dragPreview.current.y - this.dragPreview.start.y) * 0.3;
        
        this.renderer.drawTrajectory(
            this.dragPreview.start.x,
            this.dragPreview.start.y,
            velocityX,
            velocityY
        );
        
        this.renderer.drawLine(
            this.dragPreview.start.x,
            this.dragPreview.start.y,
            this.dragPreview.current.x,
            this.dragPreview.current.y,
            'rgba(255, 255, 255, 0.8)',
            3
        );
        
        this.renderer.drawCircle(
            this.dragPreview.start.x,
            this.dragPreview.start.y,
            15,
            this.projectileFactory.getMaterialColor(this.dragPreview.material)
        );
    }
}