import { System, ComponentTypes } from '../core/ecs.js';
import { EventTypes } from '../core/events.js';
import { Pathfinder } from '../utils/pathfinding.js';

export class AISystem extends System {
    constructor(eventBus, physicsSystem) {
        super();
        this.eventBus = eventBus;
        this.physicsSystem = physicsSystem;
        this.pathfinder = new Pathfinder();
        this.obstacles = new Set();
        this.lastObstacleUpdate = 0;
        this.obstacleUpdateInterval = 1000; // Update obstacle map every 1000ms (less frequent)
        this.maxRobots = 5; // Limit number of robots
    }

    update(deltaTime) {
        const currentTime = Date.now();
        
        // Update obstacle map periodically
        if (currentTime - this.lastObstacleUpdate > this.obstacleUpdateInterval) {
            this.updateObstacleMap();
            this.lastObstacleUpdate = currentTime;
        }

        // Update all AI entities
        const aiEntities = this.ecs.getEntitiesWithComponents(
            ComponentTypes.AI,
            ComponentTypes.TRANSFORM,
            ComponentTypes.PHYSICS
        );

        aiEntities.forEach(entityId => {
            this.updateAIEntity(entityId, deltaTime, currentTime);
        });
    }

    updateObstacleMap() {
        this.obstacles.clear();
        
        // Add maze walls as obstacles
        const mazeEntities = this.ecs.getEntitiesWithComponents(ComponentTypes.MAZE_ELEMENT);
        mazeEntities.forEach(entityId => {
            const mazeElement = this.ecs.getComponent(entityId, ComponentTypes.MAZE_ELEMENT);
            if (mazeElement && mazeElement.type === 'wall') {
                const key = `${mazeElement.gridX},${mazeElement.gridY}`;
                this.obstacles.add(key);
            }
        });

        // Add static blocks as obstacles
        const blockEntities = this.ecs.getEntitiesWithComponents(
            ComponentTypes.PHYSICS,
            ComponentTypes.TRANSFORM
        );
        
        blockEntities.forEach(entityId => {
            const physics = this.ecs.getComponent(entityId, ComponentTypes.PHYSICS);
            const transform = this.ecs.getComponent(entityId, ComponentTypes.TRANSFORM);
            
            if (physics.body && physics.body.isStatic && physics.type === 'block') {
                const gridPos = this.pathfinder.worldToGrid(transform.x, transform.y);
                const key = `${gridPos.x},${gridPos.y}`;
                this.obstacles.add(key);
            }
        });
    }

    updateAIEntity(entityId, deltaTime, currentTime) {
        const ai = this.ecs.getComponent(entityId, ComponentTypes.AI);
        const transform = this.ecs.getComponent(entityId, ComponentTypes.TRANSFORM);
        const physics = this.ecs.getComponent(entityId, ComponentTypes.PHYSICS);

        if (!ai || !transform || !physics || !physics.body) return;

        switch (ai.type) {
            case 'robot_mouse':
                this.updateRobotMouse(entityId, ai, transform, physics, deltaTime, currentTime);
                break;
        }
    }

    updateRobotMouse(entityId, ai, transform, physics, deltaTime, currentTime) {
        // Check if stuck
        const distance = Math.sqrt(
            Math.pow(transform.x - ai.lastPosition.x, 2) + 
            Math.pow(transform.y - ai.lastPosition.y, 2)
        );
        
        if (distance < 5 && ai.state === 'moving') {
            ai.stuckTimer += deltaTime * 1000;
            if (ai.stuckTimer > ai.maxStuckTime) {
                this.handleStuckMouse(entityId, ai);
            }
        } else {
            ai.stuckTimer = 0;
            ai.lastPosition = { x: transform.x, y: transform.y };
        }

        switch (ai.state) {
            case 'idle':
                this.handleIdleMouse(entityId, ai, currentTime);
                break;
            case 'seeking':
                this.handleSeekingMouse(entityId, ai, transform, currentTime);
                break;
            case 'moving':
                this.handleMovingMouse(entityId, ai, transform, physics, deltaTime);
                break;
            case 'stuck':
                this.handleStuckMouse(entityId, ai);
                break;
        }
    }

    handleIdleMouse(entityId, ai, currentTime) {
        // Set random target every 3-5 seconds
        if (currentTime - ai.lastPathUpdate > 3000 + Math.random() * 2000) {
            const canvas = document.getElementById('game-canvas');
            if (canvas) {
                const bounds = { width: canvas.width, height: canvas.height };
                this.setRandomTarget(entityId, bounds);
            }
        }
    }

    handleSeekingMouse(entityId, ai, transform, currentTime) {
        if (!ai.target) {
            ai.state = 'idle';
            return;
        }

        // Update path periodically or if we don't have one
        if (ai.path.length === 0 || 
            currentTime - ai.lastPathUpdate > ai.pathUpdateInterval) {
            
            try {
                const path = this.pathfinder.findPath(
                    { x: transform.x, y: transform.y },
                    ai.target,
                    this.obstacles
                );

                if (path.length > 0 && path.length < 100) { // Limit path length
                    ai.path = this.pathfinder.smoothPath(path);
                    ai.currentPathIndex = 0;
                    ai.state = 'moving';
                    ai.lastPathUpdate = currentTime;
                    
                    // Update visual state
                    this.updateMouseAppearance(entityId, 'moving');
                } else {
                    // No path found or path too long, wait a bit then try a new target
                    ai.state = 'idle';
                    ai.target = null;
                    ai.lastPathUpdate = currentTime + 3000; // Wait 3 seconds
                }
            } catch (error) {
                console.error('Pathfinding error:', error);
                ai.state = 'idle';
                ai.target = null;
                ai.lastPathUpdate = currentTime + 5000; // Wait 5 seconds after error
            }
        }
    }

    handleMovingMouse(entityId, ai, transform, physics, deltaTime) {
        if (ai.path.length === 0 || ai.currentPathIndex >= ai.path.length) {
            ai.state = 'idle';
            ai.target = null;
            this.updateMouseAppearance(entityId, 'idle');
            return;
        }

        const targetPoint = ai.path[ai.currentPathIndex];
        const dx = targetPoint.x - transform.x;
        const dy = targetPoint.y - transform.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 15) {
            // Reached current waypoint, move to next
            ai.currentPathIndex++;
            if (ai.currentPathIndex >= ai.path.length) {
                ai.state = 'idle';
                ai.target = null;
                this.updateMouseAppearance(entityId, 'idle');
            }
            return;
        }

        // Limit force magnitude to prevent runaway behavior
        const maxForce = 0.001; // Much smaller force
        const forceMultiplier = Math.min(maxForce, ai.speed * deltaTime * 0.001);
        
        const force = {
            x: (dx / distance) * forceMultiplier,
            y: (dy / distance) * forceMultiplier
        };

        // Add bounds checking to prevent robots from going off-screen
        const canvas = document.getElementById('game-canvas');
        if (canvas && (transform.x < 0 || transform.x > canvas.width || 
                      transform.y < 0 || transform.y > canvas.height * 0.7)) {
            // Robot is out of bounds, reset to center
            ai.state = 'idle';
            ai.target = null;
            ai.path = [];
            physics.body.position.x = canvas.width / 2;
            physics.body.position.y = canvas.height / 4;
            return;
        }

        this.physicsSystem.applyForce(entityId, force);
    }

    handleStuckMouse(entityId, ai) {
        // Clear current path and try a new random target
        ai.path = [];
        ai.currentPathIndex = 0;
        ai.target = null;
        ai.state = 'idle';
        ai.stuckTimer = 0;
        
        this.updateMouseAppearance(entityId, 'stuck');
        
        // Apply very small random impulse to get unstuck
        const randomForce = {
            x: (Math.random() - 0.5) * 0.0001,
            y: (Math.random() - 0.5) * 0.0001
        };
        this.physicsSystem.applyForce(entityId, randomForce);
        
        // Set state to idle immediately instead of using setTimeout
        ai.state = 'idle';
        ai.lastPathUpdate = Date.now() + 2000; // Wait 2 seconds before trying again
        this.updateMouseAppearance(entityId, 'idle');
    }

    setRandomTarget(entityId, bounds) {
        const ai = this.ecs.getComponent(entityId, ComponentTypes.AI);
        if (!ai) return;

        const margin = 50;
        const targetX = margin + Math.random() * (bounds.width - 2 * margin);
        const targetY = margin + Math.random() * (bounds.height * 0.6 - 2 * margin);
        
        ai.target = { x: targetX, y: targetY };
        ai.state = 'seeking';
        ai.path = [];
        ai.currentPathIndex = 0;
        
        this.updateMouseAppearance(entityId, 'seeking');
    }

    updateMouseAppearance(entityId, state) {
        const renderable = this.ecs.getComponent(entityId, ComponentTypes.RENDERABLE);
        if (!renderable) return;

        const colors = {
            idle: '#606060',
            seeking: '#4CAF50',
            moving: '#2196F3',
            stuck: '#FF5722'
        };

        renderable.color = colors[state] || colors.idle;
    }

    // Public method to add a robot mouse at a specific location
    addRobotMouse(x, y) {
        const RobotMouseFactory = require('../entities/robot-mouse.js').RobotMouseFactory;
        const factory = new RobotMouseFactory(this.ecs, this.physicsSystem);
        return factory.create(x, y);
    }
}