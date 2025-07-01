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
        this.isDragging = false;
        this.dragTarget = null;
        this.dragOffset = { x: 0, y: 0 };
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        
        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
        
        // Add error handling and logging for debugging
        try {
            const blockTool = document.getElementById('block-tool');
            const projectileTool = document.getElementById('projectile-tool');
            const vehicleTool = document.getElementById('vehicle-tool');
            const mazeTool = document.getElementById('maze-tool');
            const robotTool = document.getElementById('robot-tool');
            
            if (!blockTool) console.error('block-tool element not found');
            if (!projectileTool) console.error('projectile-tool element not found');
            if (!vehicleTool) console.error('vehicle-tool element not found');
            if (!mazeTool) console.error('maze-tool element not found');
            if (!robotTool) console.error('robot-tool element not found');
            
            blockTool?.addEventListener('click', () => {
                console.log('Block tool clicked');
                this.setTool('block');
            });
            projectileTool?.addEventListener('click', () => {
                console.log('Projectile tool clicked');
                this.setTool('projectile');
            });
            vehicleTool?.addEventListener('click', () => {
                console.log('Vehicle tool clicked');
                this.setTool('vehicle');
            });
            mazeTool?.addEventListener('click', () => {
                console.log('Maze tool clicked');
                this.setTool('maze');
            });
            robotTool?.addEventListener('click', () => {
                console.log('Robot tool clicked');
                this.setTool('robot');
            });
        } catch (error) {
            console.error('Error setting up tool event listeners:', error);
        }
        // Material selector
        try {
            const materialSelect = document.getElementById('material-select');
            if (materialSelect) {
                materialSelect.addEventListener('change', (e) => {
                    this.currentMaterial = e.target.value;
                });
            } else {
                console.error('material-select element not found');
            }
        } catch (error) {
            console.error('Error setting up material selector:', error);
        }
        
        // Maze preset controls
        try {
            const presetSimple = document.getElementById('preset-simple-maze');
            const presetL = document.getElementById('preset-l-maze');
            const clearMaze = document.getElementById('clear-maze');
            
            presetSimple?.addEventListener('click', () => {
                console.log('Simple maze preset clicked');
                this.eventBus.emit('create_preset_maze', { type: 'simple' });
            });
            presetL?.addEventListener('click', () => {
                console.log('L-maze preset clicked');
                this.eventBus.emit('create_preset_maze', { type: 'l-shape' });
            });
            clearMaze?.addEventListener('click', () => {
                console.log('Clear maze clicked');
                this.eventBus.emit('clear_maze', {});
            });
        } catch (error) {
            console.error('Error setting up maze controls:', error);
        }
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

        // Check if we're clicking on an existing object for dragging
        this.eventBus.emit(EventTypes.INPUT_CLICK, {
            x: pos.x,
            y: pos.y,
            tool: this.currentTool,
            material: this.currentMaterial,
            button: e.button
        });
        
        // Check for drag target
        this.eventBus.emit(EventTypes.DRAG_START, {
            x: pos.x,
            y: pos.y
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
            
            // Handle object dragging
            if (this.isDragging && this.dragTarget) {
                this.eventBus.emit(EventTypes.DRAG_MOVE, {
                    entityId: this.dragTarget,
                    x: pos.x - this.dragOffset.x,
                    y: pos.y - this.dragOffset.y
                });
            }
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

        // End dragging
        if (this.isDragging && this.dragTarget) {
            this.eventBus.emit(EventTypes.DRAG_END, {
                entityId: this.dragTarget
            });
            this.isDragging = false;
            this.dragTarget = null;
        }
        
        this.mouse.isDown = false;
        this.mouse.dragStart = null;
    }
    
    startDragging(entityId, offsetX, offsetY) {
        this.isDragging = true;
        this.dragTarget = entityId;
        this.dragOffset = { x: offsetX, y: offsetY };
    }
    
    stopDragging() {
        this.isDragging = false;
        this.dragTarget = null;
        this.dragOffset = { x: 0, y: 0 };
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

        // End dragging
        if (this.isDragging && this.dragTarget) {
            this.eventBus.emit(EventTypes.DRAG_END, {
                entityId: this.dragTarget
            });
            this.isDragging = false;
            this.dragTarget = null;
        }
        
        this.mouse.isDown = false;
        this.mouse.dragStart = null;
    }
    
    startDragging(entityId, offsetX, offsetY) {
        this.isDragging = true;
        this.dragTarget = entityId;
        this.dragOffset = { x: offsetX, y: offsetY };
    }
    
    stopDragging() {
        this.isDragging = false;
        this.dragTarget = null;
        this.dragOffset = { x: 0, y: 0 };
    }

    setTool(tool) {
        console.log(`Setting tool to: ${tool}`);
        this.currentTool = tool;
        
        try {
            // Remove active class from all tool buttons
            document.querySelectorAll('.tool-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to selected tool
            const selectedTool = document.getElementById(`${tool}-tool`);
            if (selectedTool) {
                selectedTool.classList.add('active');
                console.log(`Tool ${tool} activated successfully`);
            } else {
                console.error(`Tool element ${tool}-tool not found`);
            }
            
            // Show/hide maze controls
            const mazeControls = document.getElementById('maze-controls');
            if (mazeControls) {
                if (tool === 'maze') {
                    mazeControls.style.display = 'block';
                    console.log('Maze controls shown');
                } else {
                    mazeControls.style.display = 'none';
                }
            } else {
                console.error('maze-controls element not found');
            }
            
            this.eventBus.emit(EventTypes.TOOL_CHANGED, { tool });
        } catch (error) {
            console.error('Error in setTool:', error);
        }
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