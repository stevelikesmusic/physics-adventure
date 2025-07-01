import { System, ComponentTypes } from '../core/ecs.js';

export class PhysicsSystem extends System {
    constructor(physicsEngine) {
        super();
        this.physicsEngine = physicsEngine;
        this.bodyToEntity = new Map();
        this.entityToBody = new Map();
    }

    update(deltaTime) {
        this.physicsEngine.update(deltaTime);
        this.syncPhysicsBodies();
    }

    syncPhysicsBodies() {
        const entities = this.ecs.getEntitiesWithComponents(
            ComponentTypes.TRANSFORM, 
            ComponentTypes.PHYSICS
        );

        entities.forEach(entityId => {
            const transform = this.ecs.getComponent(entityId, ComponentTypes.TRANSFORM);
            const physics = this.ecs.getComponent(entityId, ComponentTypes.PHYSICS);

            if (physics.body) {
                transform.x = physics.body.position.x;
                transform.y = physics.body.position.y;
                transform.rotation = physics.body.angle;
            }
        });
    }

    createPhysicsBody(entityId, type, options) {
        const transform = this.ecs.getComponent(entityId, ComponentTypes.TRANSFORM);
        let body;

        switch (type) {
            case 'block':
                body = this.physicsEngine.createBlock(
                    transform.x, 
                    transform.y, 
                    options.width, 
                    options.height, 
                    options.material
                );
                break;
            case 'ball':
                body = this.physicsEngine.createBall(
                    transform.x, 
                    transform.y, 
                    options.radius, 
                    options.material
                );
                break;
            default:
                console.warn(`Unknown physics body type: ${type}`);
                return;
        }

        const physics = this.ecs.getComponent(entityId, ComponentTypes.PHYSICS);
        physics.body = body;
        physics.bodyType = type;  // Store body type separately, keep original type

        this.bodyToEntity.set(body.id, entityId);
        this.entityToBody.set(entityId, body);

        return body;
    }

    removePhysicsBody(entityId) {
        const body = this.entityToBody.get(entityId);
        if (body) {
            this.physicsEngine.removeBody(body);
            this.bodyToEntity.delete(body.id);
            this.entityToBody.delete(entityId);
        }
    }

    applyForce(entityId, force) {
        const body = this.entityToBody.get(entityId);
        if (body) {
            this.physicsEngine.applyForce(body, force);
        }
    }

    getEntityFromBody(body) {
        return this.bodyToEntity.get(body.id);
    }
}