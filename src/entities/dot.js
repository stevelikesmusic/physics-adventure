import { ComponentTypes } from '../core/ecs.js';

/**
 * Simple yellow dot that acts as a navigation waypoint
 * for robots.
 */
export class DotFactory {
    constructor(ecs) {
        this.ecs = ecs;
    }

    create(x, y) {
        const entityId = this.ecs.createEntity();

        this.ecs.addComponent(entityId, ComponentTypes.TRANSFORM, {
            x,
            y,
            rotation: 0,
            scaleX: 1,
            scaleY: 1
        });

        this.ecs.addComponent(entityId, ComponentTypes.DOT, {});

        this.ecs.addComponent(entityId, ComponentTypes.RENDERABLE, {
            type: 'dot',
            radius: 5,
            color: '#FFD800'
        });

        return entityId;
    }
}
