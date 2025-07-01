import { ComponentTypes } from '../core/ecs.js';

/**
 * Factory for creating a simple wheeled robot composed of
 * a rectangular body with a spherical head and two wheels.
 * Physics is not currently used; the robot is moved
 * manually by the RobotSystem.
 */
export class RobotFactory {
    constructor(ecs) {
        this.ecs = ecs;
    }

    /**
     * Create a robot entity.
     * @param {number} x Initial x position
     * @param {number} y Initial y position
     * @returns {number} entity id
     */
    create(x, y) {
        const entityId = this.ecs.createEntity();

        this.ecs.addComponent(entityId, ComponentTypes.TRANSFORM, {
            x: x,
            y: y,
            rotation: 0,
            scaleX: 1,
            scaleY: 1
        });

        // stores robot specific state
        this.ecs.addComponent(entityId, ComponentTypes.ROBOT, {
            speed: 60,      // pixels per second
            targetId: null  // current dot entity being followed
        });

        this.ecs.addComponent(entityId, ComponentTypes.RENDERABLE, {
            type: 'robot',
            bodyWidth: 30,
            bodyHeight: 60,
            wheelRadius: 10,
            headRadius: 15
        });

        return entityId;
    }
}
