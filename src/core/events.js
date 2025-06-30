export class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    on(eventType, callback) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }
        this.listeners.get(eventType).push(callback);
    }

    off(eventType, callback) {
        if (this.listeners.has(eventType)) {
            const callbacks = this.listeners.get(eventType);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(eventType, data = null) {
        if (this.listeners.has(eventType)) {
            this.listeners.get(eventType).forEach(callback => {
                callback(data);
            });
        }
    }

    clear() {
        this.listeners.clear();
    }
}

export const EventTypes = {
    ENTITY_CREATED: 'entity_created',
    ENTITY_DESTROYED: 'entity_destroyed',
    COLLISION: 'collision',
    INPUT_CLICK: 'input_click',
    INPUT_DRAG: 'input_drag',
    TOOL_CHANGED: 'tool_changed'
};