import { System, ComponentTypes } from '../core/ecs.js';

export class RenderSystem extends System {
    constructor(renderer) {
        super();
        this.renderer = renderer;
    }

    update(deltaTime) {
        this.renderer.clear();
        this.renderer.drawBackground();
        this.renderEntities();
    }

    renderEntities() {
        const entities = this.ecs.getEntitiesWithComponents(
            ComponentTypes.TRANSFORM, 
            ComponentTypes.RENDERABLE
        );

        entities.forEach(entityId => {
            const transform = this.ecs.getComponent(entityId, ComponentTypes.TRANSFORM);
            const renderable = this.ecs.getComponent(entityId, ComponentTypes.RENDERABLE);

            this.renderEntity(transform, renderable);
        });
    }

    renderEntity(transform, renderable) {
        switch (renderable.type) {
            case 'rect':
                this.renderer.drawRect(
                    transform.x,
                    transform.y,
                    renderable.width,
                    renderable.height,
                    renderable.color,
                    transform.rotation
                );
                break;
            case 'circle':
                this.renderer.drawCircle(
                    transform.x,
                    transform.y,
                    renderable.radius,
                    renderable.color
                );
                break;
            case 'dot':
                this.renderer.drawDot(
                    transform.x,
                    transform.y,
                    renderable.radius,
                    renderable.color
                );
                break;
            case 'robot':
                this.renderer.drawRobot(
                    transform.x,
                    transform.y,
                    renderable
                );
                break;
            case 'sprite':
                break;
            default:
                console.warn(`Unknown renderable type: ${renderable.type}`);
        }
    }
}