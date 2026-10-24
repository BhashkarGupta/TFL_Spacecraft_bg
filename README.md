# TFL Spacecraft-bg

A lightweight, zero-dependency visual effect engine featuring an interactive electric plasma network background, cosmic nebula clouds, and a spacecraft flight cursor with dual ion exhaust trails.

---

## Features

- **Electric Plasma Network**: Interactive canvas nodes, branched electric arc discharges, and shockwaves on click.
- **Spacecraft Flight Cursor**: 1:1 hardware mouse tracking with 360-degree directional banking and glowing dual ion thruster trails.
- **Scroll Acceleration**: Responsive vertical dive dynamics and thruster expansion on page scroll.
- **Light and Dark Theme Support**: Adapts automatically via `data-theme="light"` or `data-theme="dark"`.
- **Responsive and Accessible**: Automatically disables custom cursor on touch devices and respects `prefers-reduced-motion`.
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

## Configuration (Optional)

```javascript
window.SpacecraftFX.init({
  maxNodes: 32,          // Max plasma nodes (default: 32)
  maxTrailParticles: 28  // Thruster exhaust trail length (default: 28)
});
```
