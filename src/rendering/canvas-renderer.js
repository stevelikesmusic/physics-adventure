export class CanvasRenderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1
        };
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#87CEEB');
        gradient.addColorStop(0.7, '#8B4513');
        gradient.addColorStop(1, '#8B4513');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawRect(x, y, width, height, color = '#333', rotation = 0) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(rotation);
        this.ctx.fillStyle = color;
        this.ctx.fillRect(-width / 2, -height / 2, width, height);
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(-width / 2, -height / 2, width, height);
        this.ctx.restore();
    }

    drawCircle(x, y, radius, color = '#333') {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.fill();
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        this.ctx.restore();
    }

    drawLine(x1, y1, x2, y2, color = '#fff', width = 2) {
        this.ctx.save();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        this.ctx.restore();
    }

    /** Draw a simple yellow waypoint dot */
    drawDot(x, y, radius, color = '#FFD800') {
        this.drawCircle(x, y, radius, color);
    }

    /**
     * Render a robot composed of a body, wheels and a head with eyes.
     * @param {number} x center x
     * @param {number} y center y (at bottom of torso)
     * @param {object} options rendering sizes
     */
    drawRobot(x, y, options) {
        const { bodyWidth, bodyHeight, wheelRadius, headRadius } = options;

        // draw wheels
        const halfBody = bodyWidth / 2;
        const wheelY = y + wheelRadius;
        this.drawCircle(x - halfBody + wheelRadius, wheelY, wheelRadius, '#555');
        this.drawCircle(x + halfBody - wheelRadius, wheelY, wheelRadius, '#555');

        // draw body
        this.drawRect(x, y - bodyHeight / 2, bodyWidth, bodyHeight, '#AAA');

        // draw head
        const headY = y - bodyHeight - headRadius;
        this.drawCircle(x, headY, headRadius, '#CCC');

        // eyes
        const eyeOffsetX = headRadius * 0.4;
        const eyeOffsetY = headRadius * -0.2;
        const eyeRadius = headRadius * 0.2;
        this.drawCircle(x - eyeOffsetX, headY + eyeOffsetY, eyeRadius, '#00AEEF');
        this.drawCircle(x + eyeOffsetX, headY + eyeOffsetY, eyeRadius, '#00AEEF');
    }

    drawText(text, x, y, options = {}) {
        this.ctx.save();
        this.ctx.fillStyle = options.color || '#fff';
        this.ctx.font = options.font || '16px Arial';
        this.ctx.textAlign = options.align || 'left';
        this.ctx.fillText(text, x, y);
        this.ctx.restore();
    }

    drawTrajectory(startX, startY, velocityX, velocityY, steps = 20, color = 'rgba(255, 255, 255, 0.5)') {
        const gravity = 0.8;
        const stepTime = 0.1;
        
        this.ctx.save();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        
        let x = startX;
        let y = startY;
        let vx = velocityX;
        let vy = velocityY;
        
        for (let i = 0; i < steps; i++) {
            x += vx * stepTime * 60;
            y += vy * stepTime * 60;
            vy += gravity * stepTime * 60;
            
            if (y > this.canvas.height * 0.7) break;
            
            this.ctx.lineTo(x, y);
        }
        
        this.ctx.stroke();
        this.ctx.restore();
    }

    worldToScreen(worldX, worldY) {
        return {
            x: (worldX - this.camera.x) * this.camera.zoom,
            y: (worldY - this.camera.y) * this.camera.zoom
        };
    }

    screenToWorld(screenX, screenY) {
        return {
            x: screenX / this.camera.zoom + this.camera.x,
            y: screenY / this.camera.zoom + this.camera.y
        };
    }

    setCamera(x, y, zoom = 1) {
        this.camera.x = x;
        this.camera.y = y;
        this.camera.zoom = zoom;
    }
}