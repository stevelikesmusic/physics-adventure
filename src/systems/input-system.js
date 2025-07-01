import { System, ComponentTypes } from '../core/ecs.js';
import { EventTypes } from '../core/events.js';

export class InputSystem extends System {
    constructor(canvas, eventBus) {
        super();
        this.canvas = canvas;
        this.eventBus = eventBus;
        this.mouse = {
            x: 0,
            y: 0,
            isDown: false,
            dragStart: null
        };
        this.currentTool = 'block';
        this.currentMaterial = 'wood';
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        
        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
        
        document.getElementById('block-tool').addEventListener('click', () => this.setTool('block'));
        document.getElementById('projectile-tool').addEventListener('click', () => this.setTool('projectile'));
        const dotBtn = document.getElementById('dot-tool');
        if (dotBtn) dotBtn.addEventListener('click', () => this.setTool('dot'));
        const robotBtn = document.getElementById('robot-tool');
        if (robotBtn) robotBtn.addEventListener('click', () => this.setTool('robot'));
        document.getElementById('material-select').addEventListener('change', (e) => {
            this.currentMaterial = e.target.value;
        });
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    getTouchPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0] || e.changedTouches[0];
        return {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };
    }

    onMouseDown(e) {
        e.preventDefault();
        const pos = this.getMousePos(e);
        this.mouse.x = pos.x;
        this.mouse.y = pos.y;
        this.mouse.isDown = true;
        this.mouse.dragStart = { x: pos.x, y: pos.y };

        this.eventBus.emit(EventTypes.INPUT_CLICK, {
            x: pos.x,
            y: pos.y,
            tool: this.currentTool,
            material: this.currentMaterial,
            button: e.button
        });
    }

    onMouseMove(e) {
        e.preventDefault();
        const pos = this.getMousePos(e);
        this.mouse.x = pos.x;
        this.mouse.y = pos.y;

        if (this.mouse.isDown && this.mouse.dragStart) {
            this.eventBus.emit(EventTypes.INPUT_DRAG, {
                start: this.mouse.dragStart,
                current: { x: pos.x, y: pos.y },
                tool: this.currentTool,
                material: this.currentMaterial
            });
        }
    }

    onMouseUp(e) {
        e.preventDefault();
        const pos = this.getMousePos(e);
        
        if (this.mouse.dragStart) {
            const dragDistance = Math.sqrt(
                Math.pow(pos.x - this.mouse.dragStart.x, 2) + 
                Math.pow(pos.y - this.mouse.dragStart.y, 2)
            );

            this.eventBus.emit('input_release', {
                start: this.mouse.dragStart,
                end: { x: pos.x, y: pos.y },
                distance: dragDistance,
                tool: this.currentTool,
                material: this.currentMaterial
            });
        }

        this.mouse.isDown = false;
        this.mouse.dragStart = null;
    }

    onTouchStart(e) {
        e.preventDefault();
        const pos = this.getTouchPos(e);
        this.mouse.x = pos.x;
        this.mouse.y = pos.y;
        this.mouse.isDown = true;
        this.mouse.dragStart = { x: pos.x, y: pos.y };

        this.eventBus.emit(EventTypes.INPUT_CLICK, {
            x: pos.x,
            y: pos.y,
            tool: this.currentTool,
            material: this.currentMaterial
        });
    }

    onTouchMove(e) {
        e.preventDefault();
        const pos = this.getTouchPos(e);
        this.mouse.x = pos.x;
        this.mouse.y = pos.y;

        if (this.mouse.isDown && this.mouse.dragStart) {
            this.eventBus.emit(EventTypes.INPUT_DRAG, {
                start: this.mouse.dragStart,
                current: { x: pos.x, y: pos.y },
                tool: this.currentTool,
                material: this.currentMaterial
            });
        }
    }

    onTouchEnd(e) {
        e.preventDefault();
        const pos = this.getTouchPos(e);
        
        if (this.mouse.dragStart) {
            const dragDistance = Math.sqrt(
                Math.pow(pos.x - this.mouse.dragStart.x, 2) + 
                Math.pow(pos.y - this.mouse.dragStart.y, 2)
            );

            this.eventBus.emit('input_release', {
                start: this.mouse.dragStart,
                end: { x: pos.x, y: pos.y },
                distance: dragDistance,
                tool: this.currentTool,
                material: this.currentMaterial
            });
        }

        this.mouse.isDown = false;
        this.mouse.dragStart = null;
    }

    setTool(tool) {
        this.currentTool = tool;
        
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`${tool}-tool`).classList.add('active');
        
        this.eventBus.emit(EventTypes.TOOL_CHANGED, { tool });
    }

    getCurrentTool() {
        return this.currentTool;
    }

    getCurrentMaterial() {
        return this.currentMaterial;
    }

    getMousePosition() {
        return { x: this.mouse.x, y: this.mouse.y };
    }
}