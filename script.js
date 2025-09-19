document.addEventListener('DOMContentLoaded', () => {
  const cursorSvg = document.getElementById('cursor-svg');
  const debugPanel = document.getElementById('debug-panel');

  let isMouseDown = false;
  let isDragging = false; // This will now be true only after moving past the threshold
  let mouseDownX = 0;
  let mouseDownY = 0;
  let totalRotation = 0;
  let lastAngle = 0;
  let distance = 0;

  // Minimum distance in pixels to move before the spin animation starts.
  const DRAG_START_THRESHOLD = 5;

  function updateDebugInfo() {
    debugPanel.innerHTML = `
            totalRotation: ${totalRotation.toFixed(2)}deg<br>
            isMouseDown: ${isMouseDown}<br>
            isDragging: ${isDragging}<br>
            lastAngle: ${lastAngle.toFixed(2)}deg<br>
            distance: ${distance.toFixed(2)}px
        `;
  }

  document.addEventListener('mousemove', e => {
    // Always update the cursor's position
    cursorSvg.style.left = `${e.clientX}px`;
    cursorSvg.style.top = `${e.clientY}px`;

    if (isMouseDown) {
      const deltaX = e.clientX - mouseDownX;
      const deltaY = e.clientY - mouseDownY;
      distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Activate dragging state only after the threshold is passed.
      if (!isDragging && distance > DRAG_START_THRESHOLD) {
        isDragging = true;
        const initialAngle =
          Math.atan2(mouseDownY - e.clientY, mouseDownX - e.clientX) * (180 / Math.PI) + 135;
        lastAngle = initialAngle;
        if (initialAngle > 180) {
          totalRotation = initialAngle - 360;
        } else {
          totalRotation = initialAngle;
        }
      }

      if (isDragging) {
        cursorSvg.style.transition = 'transform 0.12s cubic-bezier(0.25, 1, 0.5, 1)'; // Easing.OutQuint

        // Calculate the rotation angle to "point" the cursor
        const angle =
          Math.atan2(mouseDownY - e.clientY, mouseDownX - e.clientX) * (180 / Math.PI) + 135;

        let deltaAngle = angle - lastAngle;
        if (deltaAngle > 180) {
          deltaAngle -= 360;
        } else if (deltaAngle < -180) {
          deltaAngle += 360;
        }

        totalRotation += deltaAngle;
        lastAngle = angle;

        // Apply the rotation while keeping the clicked scale
        cursorSvg.style.transform = `rotate(${totalRotation}deg) scale(0.9)`;
      }
    }
    updateDebugInfo();
  });

  document.addEventListener('mousedown', e => {
    isMouseDown = true;
    mouseDownX = e.clientX;
    mouseDownY = e.clientY;

    // Apply the initial click animation
    cursorSvg.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
    cursorSvg.style.transform = 'scale(0.9)';

    cursorSvg.querySelector('path').style.fill = '#ff69b4';
    cursorSvg.querySelector('circle').style.fill = '#ff69b4';

    updateDebugInfo();
  });

  document.addEventListener('mouseup', () => {
    requestAnimationFrame(() => {
      const finalRotation = totalRotation;

      // The return animation should be proportional to the amount of rotation.
      const rotationSpeed = 360 * 2;
      const returnDuration = 0.4 * (0.5 + Math.abs(finalRotation / rotationSpeed));

      const targetRotation = 0;

      cursorSvg.style.transition = `transform ${returnDuration}s cubic-bezier(0.3,1.2,1,1)`;
      cursorSvg.style.transform = `rotate(${targetRotation}deg) scale(1)`;

      totalRotation = 0;

      cursorSvg.querySelector('path').style.fill = 'black';
      cursorSvg.querySelector('circle').style.fill = 'black';

      // Reset all states
      isMouseDown = false;
      isDragging = false;
      distance = 0;
      updateDebugInfo();
    });
  });
});
