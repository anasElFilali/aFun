function handleKeyDown(event, camera, cameraSpeed, engineInstance) {
    switch (event.key) {
        case 'w':
            camera.z -= cameraSpeed;
            break;
        case 's':
            camera.z += cameraSpeed;
            break;
        case 'a':
            camera.x += cameraSpeed;
            break;
        case 'd':
            camera.x -= cameraSpeed;
            break;
        case ' ':
            camera.y += cameraSpeed;
            break;
        case 'Shift':
            camera.y -= cameraSpeed;
            break;
    }

    engine.tick();
}

function handleArrowKeyDown(event, camera, rotationSpeed, engineInstance) {
    switch (event.key) {
        case 'ArrowLeft':
            camera.ry += rotationSpeed;
            break;
        case 'ArrowRight':
            camera.ry -= rotationSpeed;
            break;
        case 'ArrowUp':
            camera.rx -= rotationSpeed;
            break;
        case 'ArrowDown':
            camera.rx += rotationSpeed;
            break;
    }

    engine.tick();
}

cameraSpeed = 1;
rotationSpeed = 0.05;

document.addEventListener('keydown', (event) => {
    handleKeyDown(event, engine.camera, cameraSpeed, engine);
});

document.addEventListener('keydown', (event) => {
    handleArrowKeyDown(event, engine.camera, rotationSpeed, engine);
});