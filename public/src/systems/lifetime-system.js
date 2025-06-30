import { System, ComponentTypes } from '../core/ecs.js';

export class LifetimeSystem extends System {
    constructor(physicsSystem) {
        super();
        this.physicsSystem = physicsSystem;
    }

    update(deltaTime) {
        const entities = this.ecs.getEntitiesWithComponents(ComponentTypes.LIFETIME);

        entities.forEach(entityId => {
            const lifetime = this.ecs.getComponent(entityId, ComponentTypes.LIFETIME);
            lifetime.age += deltaTime;

            if (lifetime.age >= lifetime.maxAge) {
                this.physicsSystem.removePhysicsBody(entityId);
                this.ecs.removeEntity(entityId);
            }
        });
    }
}