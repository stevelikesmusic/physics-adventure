import { ComponentTypes } from '../core/ecs.js';

export class RobotMouseFactory {
    constructor(ecs, physicsSystem) {
        this.ecs = ecs;
        this.physicsSystem = physicsSystem;
    }

    create(x, y) {
        const entityId = this.ecs.createEntity();

        // Transform component
        this.ecs.addComponent(entityId, ComponentTypes.TRANSFORM, {
            x: x,
            y: y,
            rotation: 0,
            scaleX: 1,
            scaleY: 1
        });

        // Physics component (small circle body)
        this.ecs.addComponent(entityId, ComponentTypes.PHYSICS, {
            body: null,
            type: 'robot_mouse',
            material: 'metal',
            isStatic: false
        });

        // Renderable component (small gray circle)
        this.ecs.addComponent(entityId, ComponentTypes.RENDERABLE, {
            type: 'circle',
            radius: 8,
            color: '#606060',
            layer: 3
        });

        // AI component for pathfinding and behavior
        this.ecs.addComponent(entityId, ComponentTypes.AI, {
            type: 'robot_mouse',
            state: 'idle',
            target: null,
            path: [],
            currentPathIndex: 0,
            speed: 10, // Much slower
            lastPathUpdate: Date.now() + 2000, // Wait 2 seconds before first action
            pathUpdateInterval: 3000, // Update path every 3 seconds (less frequent)
            searchRadius: 100, // Smaller search radius
            stuckTimer: 0,
            maxStuckTime: 5000, // Longer stuck threshold
            lastPosition: { x: x, y: y }
        });

        // Create physics body
        this.physicsSystem.createPhysicsBody(entityId, 'ball', {
            radius: 8,
            material: 'metal'
        });

        return entityId;
    }

    createAtRandomPosition(bounds) {
        const margin = 50;
        const x = margin + Math.random() * (bounds.width - 2 * margin);
        const y = margin + Math.random() * (bounds.height * 0.6 - 2 * margin); // Keep above ground
        
        return this.create(x, y);
    }

    setTarget(entityId, targetX, targetY) {
        const ai = this.ecs.getComponent(entityId, ComponentTypes.AI);
        if (ai) {
            ai.target = { x: targetX, y: targetY };
            ai.state = 'seeking';
            ai.path = [];
            ai.currentPathIndex = 0;
        }
    }

    setRandomTarget(entityId, bounds) {
        const margin = 50;
        const targetX = margin + Math.random() * (bounds.width - 2 * margin);
        const targetY = margin + Math.random() * (bounds.height * 0.6 - 2 * margin);
        
        this.setTarget(entityId, targetX, targetY);
    }

    getMouseColor(state) {
        const colors = {
            idle: '#606060',
            seeking: '#4CAF50',
            moving: '#2196F3',
            stuck: '#FF5722'
        };
        return colors[state] || colors.idle;
    }

    updateMouseState(entityId, newState) {
        const ai = this.ecs.getComponent(entityId, ComponentTypes.AI);
        const renderable = this.ecs.getComponent(entityId, ComponentTypes.RENDERABLE);
        
        if (ai && renderable) {
            ai.state = newState;
            renderable.color = this.getMouseColor(newState);
        }
    }
}