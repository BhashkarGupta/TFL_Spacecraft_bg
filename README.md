# TFL Spacecraft-bg

A lightweight, zero-dependency visual effect engine featuring an interactive electric plasma network background, cosmic nebula clouds, and a spacecraft flight cursor with dual ion exhaust trails.

---

## Features

- **Electric Plasma Network**: Interactive canvas nodes, branched electric arc discharges, and shockwaves on click.
- **Tractor Beam and Kinetic Impulse**: Nearby nodes are drawn towards the spacecraft at low speeds and slingshotted away during rapid movement or clicks.
- **Spacecraft Flight Cursor**: 1:1 hardware mouse tracking with 360-degree directional banking, dual flame exhausts, and glowing ion trails.
- **Scroll Acceleration**: Dynamic vertical dive and climb offset coupled to mouse wheel or page scrolling.
- **Adaptive Performance Mode**: Automatic FPS monitor that switches to zero-blur, lightweight translucent rendering if sustained frame rate drops below 30 FPS.
- **Light and Dark Theme Support**: Adapts automatically via `data-theme="light"` or `data-theme="dark"`.
- **Responsive and Accessible**: Automatically switches to native cursors and disables heavy GPU filters on mobile and touch devices, and respects `prefers-reduced-motion`.
- **Zero Dependencies**: Pure HTML5 Canvas, SVG, and CSS.

---

## Quick Start

Include `spacecraft-fx.css` and `spacecraft-fx.js` in your HTML:

```html
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <link rel="stylesheet" href="spacecraft-fx.css">
</head>
<body>
  <!-- Your content here -->

  <script src="spacecraft-fx.js" defer></script>
</body>
</html>
```

The script automatically mounts all required background canvases and cursor elements into `<body>` on load.

---

## Theme Toggle

Toggle themes by updating `data-theme` on `<html>` or via the JavaScript API:

```javascript
// Toggle between light and dark
SpacecraftFX.toggleTheme();

// Or set explicitly ('light' | 'dark')
SpacecraftFX.setTheme('light');
```

---

## Performance Controls

The engine includes automatic frame-rate monitoring and a manual low-performance toggle:

```javascript
// Manually activate low-performance fallback mode (< 30 FPS / mobile mode)
SpacecraftFX.enableLowPerfMode();

// Check if low-performance mode is currently active
console.log(SpacecraftFX.isLowPerf());
```

---

## Configuration (Optional)

```javascript
window.SpacecraftFX.init({
  maxNodes: 32,          // Max plasma nodes (default: 32)
  maxTrailParticles: 28  // Thruster exhaust trail length (default: 28)
});
```
