import { ComponentTypes } from '../core/ecs.js';

export class ProjectileFactory {
    constructor(ecs, physicsSystem) {
        this.ecs = ecs;
        this.physicsSystem = physicsSystem;
    }

    create(x, y, radius = 15, material = 'wood') {
        const entityId = this.ecs.createEntity();

        this.ecs.addComponent(entityId, ComponentTypes.TRANSFORM, {
            x: x,
            y: y,
            rotation: 0,
            scaleX: 1,
            scaleY: 1
        });

        this.ecs.addComponent(entityId, ComponentTypes.PHYSICS, {
            body: null,
            type: 'ball',
            material: material,
            isStatic: false
        });

        const color = this.getMaterialColor(material);
        this.ecs.addComponent(entityId, ComponentTypes.RENDERABLE, {
            type: 'circle',
            radius: radius,
            color: color,
            layer: 1
        });

        this.ecs.addComponent(entityId, ComponentTypes.LIFETIME, {
            maxAge: 30,
            age: 0
        });

        this.physicsSystem.createPhysicsBody(entityId, 'ball', {
            radius: radius,
            material: material
        });

        return entityId;
    }

    getMaterialColor(material) {
        const colors = {
            wood: '#8B4513',
            stone: '#696969',
            metal: '#C0C0C0'
        };
        return colors[material] || colors.wood;
    }

    launch(entityId, velocityX, velocityY) {
        const force = {
            x: velocityX * 0.01,
            y: velocityY * 0.01
        };
        this.physicsSystem.applyForce(entityId, force);
    }
}