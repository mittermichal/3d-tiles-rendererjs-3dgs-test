import { Vector3, Quaternion, Matrix4 } from 'three';

export class CameraController {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;

        this.moveSpeed = 10;
        this.lookSpeed = 0.1;

        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            up: false,
            down: false
        };

        this.isMouseDown = false;
        this.mouseX = 0;
        this.mouseY = 0;

        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);

        this.addEventListeners();
    }

    addEventListeners() {
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
        this.domElement.addEventListener('mousedown', this.onMouseDown);
        window.addEventListener('mouseup', this.onMouseUp);
        window.addEventListener('mousemove', this.onMouseMove);
    }

    onKeyDown(event) {
        switch (event.code) {
            case 'KeyW': this.keys.forward = true; break;
            case 'KeyS': this.keys.backward = true; break;
            case 'KeyA': this.keys.left = true; break;
            case 'KeyD': this.keys.right = true; break;
            case 'KeyQ': this.keys.up = true; break;
            case 'KeyE': this.keys.down = true; break;
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW': this.keys.forward = false; break;
            case 'KeyS': this.keys.backward = false; break;
            case 'KeyA': this.keys.left = false; break;
            case 'KeyD': this.keys.right = false; break;
            case 'KeyQ': this.keys.up = false; break;
            case 'KeyE': this.keys.down = false; break;
        }
    }

    onMouseDown(event) {
        if (event.button === 0) { // Left mouse button
            this.isMouseDown = true;
        }
    }

    onMouseUp(event) {
        if (event.button === 0) {
            this.isMouseDown = false;
        }
    }

    onMouseMove(event) {
        if (this.isMouseDown) {
            const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
            const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

            this.rotateCamera(-movementX * this.lookSpeed, -movementY * this.lookSpeed);
        }
    }

    rotateCamera(deltaX, deltaY) {
        // Rotate around local up (for horizontal look)
        // We use camera.up because it's updated to be localUp in ECEF
        const quaternionX = new Quaternion().setFromAxisAngle(this.camera.up, deltaX);
        this.camera.quaternion.premultiply(quaternionX);

        // Rotate around local right (for vertical look)
        const right = new Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
        const quaternionY = new Quaternion().setFromAxisAngle(right, deltaY);
        this.camera.quaternion.premultiply(quaternionY);

        this.camera.updateMatrixWorld();
    }

    update(deltaTime) {
        const moveStep = this.moveSpeed * (deltaTime / 16.67); // Normalized to 60fps

        const forward = new Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        const right = new Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
        const up = this.camera.up.clone();

        if (this.keys.forward) this.camera.position.addScaledVector(forward, moveStep);
        if (this.keys.backward) this.camera.position.addScaledVector(forward, -moveStep);
        if (this.keys.left) this.camera.position.addScaledVector(right, -moveStep);
        if (this.keys.right) this.camera.position.addScaledVector(right, moveStep);
        if (this.keys.up) this.camera.position.addScaledVector(up, moveStep);
        if (this.keys.down) this.camera.position.addScaledVector(up, -moveStep);

        // Update camera.up based on new position in ECEF
        const localUp = this.camera.position.clone().normalize();
        this.camera.up.copy(localUp);

        // To keep the camera "level" with the horizon while moving, 
        // we might want to adjust the orientation, but standard WASD controllers 
        // usually don't do this automatically unless they are orbit controls.
        // However, since we are using camera.up for horizontal rotation, 
        // it should feel relatively natural.

        this.camera.updateMatrixWorld();
    }
}
