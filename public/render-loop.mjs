// Only schedule frames while something actually changes on screen.
export function createFrameLoop(draw, {
  requestFrame = requestAnimationFrame,
  cancelFrame = cancelAnimationFrame,
} = {}) {
  let frame = null;
  let visible = true;
  let disposed = false;
  function invalidate() {
    if (!disposed && visible && frame === null) frame = requestFrame(tick);
  }
  function tick(time) {
    frame = null;
    if (disposed || !visible) return;
    if (draw(time)) invalidate();
  }
  return {
    invalidate,
    setVisible(value) {
      visible = value;
      if (!visible && frame !== null) { cancelFrame(frame); frame = null; }
      if (visible) invalidate();
    },
    dispose() {
      disposed = true;
      if (frame !== null) cancelFrame(frame);
      frame = null;
    },
  };
}

// Match the original 0.045 easing at 60 Hz, independently of monitor refresh rate.
export function advanceMotion(value, target, seconds) {
  const next = value + (target - value) * (1 - Math.pow(0.955, seconds * 60));
  return Math.abs(target - next) < 0.0001 ? target : next;
}
