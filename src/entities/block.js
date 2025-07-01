import { ComponentTypes } from '../core/ecs.js';

export class BlockFactory {
    constructor(ecs, physicsSystem) {
        this.ecs = ecs;
        this.physicsSystem = physicsSystem;
    }

    create(x, y, width = 40, height = 40, material = 'wood') {
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
            type: 'block',
            material: material,
            isStatic: false
        });

        const color = this.getMaterialColor(material);
        this.ecs.addComponent(entityId, ComponentTypes.RENDERABLE, {
            type: 'rect',
            width: width,
            height: height,
            color: color,
            layer: 1
        });

        this.physicsSystem.createPhysicsBody(entityId, 'block', {
            width: width,
            height: height,
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
}