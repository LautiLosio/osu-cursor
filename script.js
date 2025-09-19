document.addEventListener('DOMContentLoaded', () => {
  const cursorSvg = document.getElementById('cursor-svg');
  const debugPanel = document.getElementById('debug-panel');
  const clickMarker = document.getElementById('click-marker');

  // Controls
  const dragThresholdInput = document.getElementById('drag-threshold');
  const dragThresholdValue = document.getElementById('drag-threshold-value');
  const unwindDurationInput = document.getElementById('unwind-duration');
  const unwindDurationValue = document.getElementById('unwind-duration-value');

  let isMouseDown = false;
  let isDragging = false; // This will now be true only after moving past the threshold
  let mouseDownX = 0;
  let mouseDownY = 0;
  let totalRotation = 0;
  let lastAngle = 0;
  let distance = 0;
  let unwindSpeed = 0; // deg/s
  let crossedThreshold = false;

  // Minimum distance in pixels to move before the spin animation starts.
  let DRAG_START_THRESHOLD = parseInt(dragThresholdInput.value, 10);
  let unwindDuration = parseFloat(unwindDurationInput.value);

  function saveSettings() {
    sessionStorage.setItem('dragThreshold', DRAG_START_THRESHOLD);
    sessionStorage.setItem('unwindDuration', unwindDuration);
  }

  function loadSettings() {
    const savedThreshold = sessionStorage.getItem('dragThreshold');
    const savedUnwindDuration = sessionStorage.getItem('unwindDuration');

    if (savedThreshold) {
      DRAG_START_THRESHOLD = parseInt(savedThreshold, 10);
      dragThresholdInput.value = savedThreshold;
      dragThresholdValue.textContent = savedThreshold;
    }
    if (savedUnwindDuration) {
      unwindDuration = parseFloat(savedUnwindDuration);
      unwindDurationInput.value = savedUnwindDuration;
      unwindDurationValue.textContent = parseFloat(savedUnwindDuration).toFixed(2);
    }
  }

  dragThresholdInput.addEventListener('input', e => {
    DRAG_START_THRESHOLD = parseInt(e.target.value, 10);
    dragThresholdValue.textContent = e.target.value;
    saveSettings();
  });

  unwindDurationInput.addEventListener('input', e => {
    unwindDuration = parseFloat(e.target.value);
    unwindDurationValue.textContent = parseFloat(e.target.value).toFixed(2);
    saveSettings();
  });

  document.querySelectorAll("input[type='range']").forEach(slider => {
    slider.addEventListener('mouseenter', () => {
      if (!isMouseDown) {
        cursorSvg.querySelector('path').style.fill = '#ff69b4';
      }
    });
    slider.addEventListener('mouseleave', () => {
      if (!isMouseDown) {
        cursorSvg.querySelector('path').style.fill = 'black';
      }
    });
  });

  function updateDebugInfo() {
    debugPanel.innerHTML = `
      <div class="debug-grid">
        <div class="debug-label">totalRotation</div>
        <div class="debug-value">${totalRotation.toFixed(2)}deg</div>

        <div class="debug-label">spinCount</div>
        <div class="debug-value">${(totalRotation / 360).toFixed(2)}</div>

        <div class="debug-label">unwindSpeed</div>
        <div class="debug-value">${unwindSpeed.toFixed(2)} deg/s</div>

        <div class="debug-separator"></div>

        <div class="debug-label">isMouseDown</div>
        <div class="debug-value bool-${isMouseDown}">${isMouseDown}</div>

        <div class="debug-label">isDragging</div>
        <div class="debug-value bool-${isDragging}">${isDragging}</div>

        <div class="debug-label">lastAngle</div>
        <div class="debug-value">${lastAngle.toFixed(2)}deg</div>

        <div class="debug-label">distance</div>
        <div class="debug-value">${distance.toFixed(2)}px</div>

        <div class="debug-label">dragThreshold</div>
        <div class="debug-value">${DRAG_START_THRESHOLD}px</div>

        <div class="debug-label">crossedThreshold</div>
        <div class="debug-value bool-${crossedThreshold}">${crossedThreshold}</div>
      </div>
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
      crossedThreshold = distance > DRAG_START_THRESHOLD;

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

        unwindSpeed = Math.abs(totalRotation) / unwindDuration;

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

    unwindSpeed = 0;
    crossedThreshold = false;

    // drag threshold marker is radius of the circle
    clickMarker.style.left = `${e.clientX - DRAG_START_THRESHOLD}px`;
    clickMarker.style.top = `${e.clientY - DRAG_START_THRESHOLD}px`;
    clickMarker.style.width = `${DRAG_START_THRESHOLD * 2}px`;
    clickMarker.style.height = `${DRAG_START_THRESHOLD * 2}px`;
    clickMarker.style.display = 'block';
    // Apply the initial click animation
    cursorSvg.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
    cursorSvg.style.transform = 'scale(0.9)';

    cursorSvg.querySelector('path').style.fill = '#ff69b4';
    cursorSvg.querySelector('circle').style.fill = '#ff69b4';

    updateDebugInfo();
  });

  document.addEventListener('mouseup', () => {
    requestAnimationFrame(() => {
      clickMarker.style.display = 'none';

      const returnDuration = unwindDuration;

      const targetRotation = 0;

      cursorSvg.style.transition = `transform ${returnDuration}s cubic-bezier(0.3,1.2,.5,1)`;
      cursorSvg.style.transform = `rotate(${targetRotation}deg) scale(1)`;

      totalRotation = 0;
      unwindSpeed = 0;

      cursorSvg.querySelector('path').style.fill = 'black';
      cursorSvg.querySelector('circle').style.fill = 'black';

      // Reset all states
      isMouseDown = false;
      isDragging = false;
      distance = 0;
      crossedThreshold = false;
      updateDebugInfo();
    });
  });

  loadSettings();
  updateDebugInfo();
});
