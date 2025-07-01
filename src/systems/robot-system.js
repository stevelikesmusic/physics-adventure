import { System, ComponentTypes } from '../core/ecs.js';

/**
 * System that moves robots towards the nearest yellow dot.
 */
export class RobotSystem extends System {
    constructor() {
        super();
    }

    update(deltaTime) {
        const robots = this.ecs.getEntitiesWithComponents(ComponentTypes.ROBOT, ComponentTypes.TRANSFORM);
        const dots = this.ecs.getEntitiesWithComponents(ComponentTypes.DOT, ComponentTypes.TRANSFORM);

        robots.forEach(robotId => {
            const robotComp = this.ecs.getComponent(robotId, ComponentTypes.ROBOT);
            const transform = this.ecs.getComponent(robotId, ComponentTypes.TRANSFORM);

            // select next target if needed
            if (!robotComp.targetId || !this.ecs.entities.has(robotComp.targetId)) {
                let closest = null;
                let closestDist = Infinity;
                dots.forEach(dotId => {
                    const dotTransform = this.ecs.getComponent(dotId, ComponentTypes.TRANSFORM);
                    const dx = dotTransform.x - transform.x;
                    const dy = dotTransform.y - transform.y;
                    const dist = Math.hypot(dx, dy);
                    if (dist < closestDist) {
                        closestDist = dist;
                        closest = dotId;
                    }
                });
                robotComp.targetId = closest;
            }

            // move towards target
            if (robotComp.targetId) {
                const targetTransform = this.ecs.getComponent(robotComp.targetId, ComponentTypes.TRANSFORM);
                if (targetTransform) {
                    const dx = targetTransform.x - transform.x;
                    const dy = targetTransform.y - transform.y;
                    const dist = Math.hypot(dx, dy);
                    if (dist > 1) {
                        const dirX = dx / dist;
                        const dirY = dy / dist;
                        const step = robotComp.speed * deltaTime;
                        transform.x += dirX * step;
                        transform.y += dirY * step;
                    } else {
                        // reached dot
                        this.ecs.removeEntity(robotComp.targetId);
                        robotComp.targetId = null;
                    }
                } else {
                    robotComp.targetId = null;
                }
            }
        });
    }
}
