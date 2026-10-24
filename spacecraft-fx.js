/**
 * ===================================================
 * SPACECRAFT FX — Standalone Background & Cursor Engine
 * spacecraft-fx.js (Supports Dark & Light Themes)
 *
 * Features:
 * - High-voltage electric arc plasma network background
 * - Miniature spacecraft cursor with 1:1 zero-lag tracking
 * - Real-time directional banking rotation based on movement
 * - Scroll acceleration & vertical dive dynamics
 * - Dual-thruster glowing ion exhaust trail
 * - Full Dark & Light theme adaptive rendering
 * - Liquid glass-like cards & buttons styling utilities
 * - Zero dependencies (Vanilla JS & HTML5 Canvas)
 * ===================================================
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SpacecraftFX = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var SVG_MARKUP = [
    '<svg class="spacecraft-svg" viewBox="0 0 32 42" width="32" height="42" fill="none" xmlns="http://www.w3.org/2000/svg">',
    '  <defs>',
    '    <linearGradient id="sc-hull-grad" x1="16" y1="2" x2="16" y2="30" gradientUnits="userSpaceOnUse">',
    '      <stop offset="0%" stop-color="#38bdf8" />',
    '      <stop offset="35%" stop-color="#1e293b" />',
    '      <stop offset="100%" stop-color="#090d16" />',
    '    </linearGradient>',
    '    <linearGradient id="sc-wing-grad" x1="16" y1="10" x2="16" y2="28" gradientUnits="userSpaceOnUse">',
    '      <stop offset="0%" stop-color="#1e293b" />',
    '      <stop offset="50%" stop-color="#0f172a" />',
    '      <stop offset="100%" stop-color="#020617" />',
    '    </linearGradient>',
    '    <linearGradient id="sc-canopy-grad" x1="16" y1="7" x2="16" y2="18" gradientUnits="userSpaceOnUse">',
    '      <stop offset="0%" stop-color="#ffffff" />',
    '      <stop offset="30%" stop-color="#38bdf8" />',
    '      <stop offset="80%" stop-color="#0284c7" />',
    '      <stop offset="100%" stop-color="#0c4a6e" />',
    '    </linearGradient>',
    '    <linearGradient id="sc-flame-grad" x1="16" y1="26" x2="16" y2="41" gradientUnits="userSpaceOnUse">',
    '      <stop offset="0%" stop-color="#ffffff" />',
    '      <stop offset="25%" stop-color="#38bdf8" />',
    '      <stop offset="70%" stop-color="#f97316" />',
    '      <stop offset="100%" stop-color="rgba(249, 115, 22, 0)" />',
    '    </linearGradient>',
    '    <filter id="sc-glow" x="-30%" y="-30%" width="160%" height="160%">',
    '      <feGaussianBlur stdDeviation="1.2" result="blur" />',
    '      <feComposite in="SourceGraphic" in2="blur" operator="over" />',
    '    </filter>',
    '  </defs>',
    '  <path class="sc-flame sc-flame-left" d="M 8.5 27 Q 10.5 40 12.5 27 Z" fill="url(#sc-flame-grad)" filter="url(#sc-glow)" />',
    '  <path class="sc-flame sc-flame-right" d="M 19.5 27 Q 21.5 40 23.5 27 Z" fill="url(#sc-flame-grad)" filter="url(#sc-glow)" />',
    '  <path class="sc-wings" d="M 16 11 L 30 23.5 L 30 25.5 L 24 24.5 L 22.5 27 L 19 27 L 17.5 24.5 L 14.5 24.5 L 13 27 L 9.5 27 L 8 24.5 L 2 25.5 L 2 23.5 Z" fill="url(#sc-wing-grad)" stroke="#38bdf8" stroke-width="0.85" stroke-linejoin="round" />',
    '  <line x1="16" y1="13" x2="4" y2="23.5" stroke="rgba(56, 189, 248, 0.5)" stroke-width="0.6" />',
    '  <line x1="16" y1="13" x2="28" y2="23.5" stroke="rgba(56, 189, 248, 0.5)" stroke-width="0.6" />',
    '  <path class="sc-hull" d="M 16 2 L 19.5 12 L 18 26 L 14 26 L 12.5 12 Z" fill="url(#sc-hull-grad)" stroke="#38bdf8" stroke-width="0.9" stroke-linejoin="round" />',
    '  <polygon class="sc-canopy" points="16,7.5 18,14.5 16,17 14,14.5" fill="url(#sc-canopy-grad)" stroke="rgba(255,255,255,0.7)" stroke-width="0.4" />',
    '  <rect x="8.5" y="22" width="4" height="5" rx="1" fill="#1e293b" stroke="#38bdf8" stroke-width="0.7" />',
    '  <rect x="19.5" y="22" width="4" height="5" rx="1" fill="#1e293b" stroke="#38bdf8" stroke-width="0.7" />',
    '  <line x1="2" y1="19" x2="2" y2="25.5" stroke="#38bdf8" stroke-width="1.2" stroke-linecap="round" />',
    '  <line x1="30" y1="19" x2="30" y2="25.5" stroke="#38bdf8" stroke-width="1.2" stroke-linecap="round" />',
    '  <circle class="sc-emitter" cx="2" cy="19" r="0.9" fill="#f97316" filter="url(#sc-glow)" />',
    '  <circle class="sc-emitter" cx="30" cy="19" r="0.9" fill="#f97316" filter="url(#sc-glow)" />',
    '  <circle class="sc-beacon" cx="16" cy="2" r="1.1" fill="#ffffff" filter="url(#sc-glow)" />',
    '</svg>'
  ].join('');

  function checkIsLightMode() {
    if (typeof document === 'undefined') return false;
    var html = document.documentElement;
    var body = document.body;
    return (html && html.getAttribute('data-theme') === 'light') ||
           (html && html.classList.contains('light-theme')) ||
           (body && body.classList.contains('light-theme'));
  }

  function ensureDOMElements() {
    // 1. Background container & canvas
    var bgContainer = document.querySelector('.cyber-network-bg');
    if (!bgContainer) {
      bgContainer = document.createElement('div');
      bgContainer.className = 'cyber-network-bg';
      bgContainer.setAttribute('aria-hidden', 'true');
      bgContainer.innerHTML = '<div class="cyber-nebula-clouds"><div class="nebula-cloud cloud-cyan"></div><div class="nebula-cloud cloud-violet"></div><div class="nebula-cloud cloud-amber"></div><div class="nebula-cloud cloud-drift"></div></div><canvas id="cyber-network-canvas"></canvas><div class="cyber-network-vignette"></div>';
      document.body.insertBefore(bgContainer, document.body.firstChild);
    } else if (!bgContainer.querySelector('.cyber-nebula-clouds')) {
      var cloudsDiv = document.createElement('div');
      cloudsDiv.className = 'cyber-nebula-clouds';
      cloudsDiv.innerHTML = '<div class="nebula-cloud cloud-cyan"></div><div class="nebula-cloud cloud-violet"></div><div class="nebula-cloud cloud-amber"></div><div class="nebula-cloud cloud-drift"></div>';
      bgContainer.insertBefore(cloudsDiv, bgContainer.firstChild);
    }

    // 2. Trail canvas
    var trailCanvas = document.getElementById('spacecraft-trail-canvas');
    if (!trailCanvas) {
      trailCanvas = document.createElement('canvas');
      trailCanvas.id = 'spacecraft-trail-canvas';
      trailCanvas.className = 'spacecraft-trail-canvas';
      trailCanvas.setAttribute('aria-hidden', 'true');
      document.body.appendChild(trailCanvas);
    }

    // 3. Spacecraft cursor container
    var cursorEl = document.getElementById('spacecraft-cursor');
    if (!cursorEl) {
      cursorEl = document.createElement('div');
      cursorEl.id = 'spacecraft-cursor';
      cursorEl.className = 'spacecraft-cursor';
      cursorEl.setAttribute('aria-hidden', 'true');
      cursorEl.innerHTML = SVG_MARKUP;
      document.body.appendChild(cursorEl);
    } else if (!cursorEl.querySelector('.spacecraft-svg')) {
      cursorEl.innerHTML = SVG_MARKUP;
    }
  }

  var activeInstance = null;

  function init(options) {
    options = options || {};

    ensureDOMElements();

    var canvas = document.getElementById('cyber-network-canvas');
    if (!canvas) return null;
    var ctx = canvas.getContext('2d');
    if (!ctx) return null;

    var trailCanvas = document.getElementById('spacecraft-trail-canvas');
    var trailCtx = trailCanvas ? trailCanvas.getContext('2d') : null;

    var craftEl = document.getElementById('spacecraft-cursor');
    var craftSvg = craftEl ? craftEl.querySelector('.spacecraft-svg') : null;
    var craftFlames = craftEl ? craftEl.querySelectorAll('.sc-flame') : [];

    var width = 0;
    var height = 0;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Dark Mode Palette: additive blending with white cores & vibrant neon halos
    var darkThemes = {
      amber: {
        core: 'rgba(255, 255, 255, ',
        plasma: 'rgba(255, 153, 51, ',
        glow: 'rgba(255, 120, 0, ',
        hex: '#ff9933'
      },
      cyan: {
        core: 'rgba(255, 255, 255, ',
        plasma: 'rgba(56, 189, 248, ',
        glow: 'rgba(14, 165, 233, ',
        hex: '#38bdf8'
      },
      violet: {
        core: 'rgba(255, 255, 255, ',
        plasma: 'rgba(168, 85, 247, ',
        glow: 'rgba(126, 34, 206, ',
        hex: '#a855f7'
      }
    };

    // Light Mode Palette: rich saturated pigments with high contrast on light paper
    var lightThemes = {
      amber: {
        core: 'rgba(154, 52, 18, ',     // deep amber core
        plasma: 'rgba(234, 88, 12, ',   // vibrant fiery orange
        glow: 'rgba(249, 115, 22, ',    // warm glowing orange
        hex: '#ea580c'
      },
      cyan: {
        core: 'rgba(3, 105, 161, ',     // rich cobalt
        plasma: 'rgba(2, 132, 199, ',   // electric sky blue
        glow: 'rgba(56, 189, 248, ',    // vibrant cyan glow
        hex: '#0284c7'
      },
      violet: {
        core: 'rgba(109, 40, 217, ',    // deep violet
        plasma: 'rgba(124, 58, 237, ',  // royal purple
        glow: 'rgba(168, 85, 247, ',    // violet glow
        hex: '#7c3aed'
      }
    };

    var isLight = checkIsLightMode();
    var themes = isLight ? lightThemes : darkThemes;

    var nodes = [];
    var sparks = [];
    var activeArcs = [];
    var shockwaves = [];
    var trailParticles = [];
    var maxTrailParticles = options.maxTrailParticles || 28;
    var maxNodes = options.maxNodes || 32;
    var arcDistance = 160;
    var arcDistanceSq = arcDistance * arcDistance;
    var cursorRadius = 140;
    var cursorRadiusSq = cursorRadius * cursorRadius;

    // Idle Auto-Cruise Settings (Configurable, default: 15 seconds)
    var idleTimeoutMs = typeof options.idleTimeoutSec === 'number'
      ? Math.max(1, options.idleTimeoutSec) * 1000
      : (typeof options.idleTimeoutMs === 'number' ? options.idleTimeoutMs : 15000);
    var autoCruiseEnabled = options.autoCruise !== false;
    var lastInteractionTime = Date.now();
    var isAutoCruising = false;
    var cruiseSpeed = typeof options.cruiseSpeed === 'number' ? options.cruiseSpeed : 0.95;
    var cruiseWaypoint = { x: 0, y: 0 };
    var cruiseHeading = 0;
    var cruiseCooldownTimer = 0;
    var currentCruiseEdge = -1; // 0: Top, 1: Right, 2: Bottom, 3: Left

    function pickNewCruiseEdgeTarget() {
      // 70% chance opposite edge, 30% chance adjacent edge across screen
      var nextEdge;
      if (currentCruiseEdge === -1) {
        nextEdge = Math.floor(Math.random() * 4);
      } else {
        var opposite = (currentCruiseEdge + 2) % 4;
        var adj1 = (currentCruiseEdge + 1) % 4;
        var adj2 = (currentCruiseEdge + 3) % 4;
        var r = Math.random();
        if (r < 0.70) {
          nextEdge = opposite;
        } else if (r < 0.85) {
          nextEdge = adj1;
        } else {
          nextEdge = adj2;
        }
      }
      currentCruiseEdge = nextEdge;

      var edgePad = 22; // distance from physical screen edge
      var cornerMargin = 60; // keep away from sharp corners

      if (nextEdge === 0) { // Top edge
        cruiseWaypoint.x = cornerMargin + Math.random() * Math.max(80, width - cornerMargin * 2);
        cruiseWaypoint.y = edgePad;
      } else if (nextEdge === 1) { // Right edge
        cruiseWaypoint.x = Math.max(100, width - edgePad);
        cruiseWaypoint.y = cornerMargin + Math.random() * Math.max(80, height - cornerMargin * 2);
      } else if (nextEdge === 2) { // Bottom edge
        cruiseWaypoint.x = cornerMargin + Math.random() * Math.max(80, width - cornerMargin * 2);
        cruiseWaypoint.y = Math.max(100, height - edgePad);
      } else { // Left edge
        cruiseWaypoint.x = edgePad;
        cruiseWaypoint.y = cornerMargin + Math.random() * Math.max(80, height - cornerMargin * 2);
      }

      cruiseCooldownTimer = 0;
    }

    var mouse = {
      x: -9999,
      y: -9999,
      targetX: -9999,
      targetY: -9999,
      isHovering: false
    };

    var craft = {
      x: -100,
      y: -100,
      prevX: -100,
      prevY: -100,
      scrollOffsetY: 0,
      angle: 0,
      targetAngle: 0,
      speed: 0,
      isActive: false,
      isClicking: false
    };

    var rafId = null;
    var isVisible = true;
    var lastFrameTime = 0;
    var ambientDischargeTimer = 0;
    var flashOpacity = 0;

    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // --- LOW-PERFORMANCE & MOBILE FALLBACK STATE ---
    var isLowPerf = false;
    var fpsMonitorActive = true;
    var frameDeltas = [];
    var prevTimestamp = 0;
    var totalFramesRendered = 0;
    var FPS_CHECK_WINDOW = 45;
    var WARMUP_FRAMES = 30;

    function enableLowPerfMode(reason) {
      if (isLowPerf) return;
      isLowPerf = true;
      fpsMonitorActive = false;

      if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.classList.add('low-perf');
      }

      // Hide custom spaceship cursor and ion trail canvas
      if (craftEl) {
        craftEl.style.display = 'none';
        craftEl.classList.remove('is-active', 'is-targeting', 'is-clicking');
      }
      if (trailCanvas) {
        trailCanvas.style.display = 'none';
        clearCraftTrail();
      }
      if (craft) {
        craft.isActive = false;
      }

      // Untether any particles from tractor beam
      for (var i = 0; i < nodes.length; i++) {
        nodes[i].isTethered = false;
        nodes[i].pulseStage = 0;
      }
      activeArcs = [];
      shockwaves = [];
    }

    // Only enable low-performance mode if explicitly requested by class or if on actual small-screen mobile device without fine pointer
    var isMobileInit = (typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && window.matchMedia('(hover: none) and (pointer: coarse)').matches) ||
                       (typeof document !== 'undefined' && document.documentElement && (document.documentElement.classList.contains('low-perf') || document.documentElement.classList.contains('no-gpu')));

    if (isMobileInit) {
      enableLowPerfMode('mobile_or_no_gpu_init');
    }

    // --- APPLY THEME ---
    function updateTheme(lightMode) {
      isLight = !!lightMode;
      themes = isLight ? lightThemes : darkThemes;

      // Update existing nodes theme references
      for (var i = 0; i < nodes.length; i++) {
        var key = nodes[i].themeKey || 'amber';
        nodes[i].theme = themes[key];
      }

      // Update SVG hull & wing gradient stops for light/dark titanium hull
      var hullGrad = document.getElementById('sc-hull-grad');
      if (hullGrad) {
        var stops = hullGrad.querySelectorAll('stop');
        if (stops.length >= 3) {
          if (isLight) {
            stops[0].setAttribute('stop-color', '#0284c7');
            stops[1].setAttribute('stop-color', '#64748b');
            stops[2].setAttribute('stop-color', '#cbd5e1');
          } else {
            stops[0].setAttribute('stop-color', '#38bdf8');
            stops[1].setAttribute('stop-color', '#1e293b');
            stops[2].setAttribute('stop-color', '#090d16');
          }
        }
      }

      var wingGrad = document.getElementById('sc-wing-grad');
      if (wingGrad) {
        var wStops = wingGrad.querySelectorAll('stop');
        if (wStops.length >= 3) {
          if (isLight) {
            wStops[0].setAttribute('stop-color', '#cbd5e1');
            wStops[1].setAttribute('stop-color', '#94a3b8');
            wStops[2].setAttribute('stop-color', '#64748b');
          } else {
            wStops[0].setAttribute('stop-color', '#1e293b');
            wStops[1].setAttribute('stop-color', '#0f172a');
            wStops[2].setAttribute('stop-color', '#020617');
          }
        }
      }

      var beacon = document.querySelector('.sc-beacon');
      if (beacon) {
        beacon.setAttribute('fill', isLight ? '#ea580c' : '#ffffff');
      }
    }

    // --- RESIZE ---
    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.scale(dpr, dpr);

      if (trailCanvas && trailCtx) {
        trailCanvas.width = Math.floor(width * dpr);
        trailCanvas.height = Math.floor(height * dpr);
        trailCanvas.style.width = width + 'px';
        trailCanvas.style.height = height + 'px';
        trailCtx.scale(dpr, dpr);
      }

      var isMobile = width < 768;
      var targetCount = isMobile
        ? Math.floor(Math.min(16, Math.max(10, (width * height) / 30000)))
        : Math.floor(Math.min(maxNodes, Math.max(20, (width * height) / 36000)));

      arcDistance = isMobile ? 125 : 160;
      arcDistanceSq = arcDistance * arcDistance;
      cursorRadius = isMobile ? 100 : 140;
      cursorRadiusSq = cursorRadius * cursorRadius;

      initNodes(targetCount);
    }

    // --- PLASMA NODE ---
    function Node(x, y) {
      this.x = x || Math.random() * width;
      this.y = y || Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.42;
      this.vy = (Math.random() - 0.5) * 0.42;
      this.baseRadius = 1.3 + Math.random() * 1.2;

      var rand = Math.random();
      if (rand < 0.55) {
        this.themeKey = 'amber';
      } else if (rand < 0.88) {
        this.themeKey = 'cyan';
      } else {
        this.themeKey = 'violet';
      }
      this.theme = themes[this.themeKey];

      this.isPulsar = Math.random() < 0.3;
      this.pulse = Math.random() * Math.PI * 2;
      this.pulseSpeed = 0.03 + Math.random() * 0.04;
      this.potential = Math.random();

      // Tractor-beam dragging & fast-acceleration breakaway physics
      this.isTethered = false;
      this.tetherOffsetX = 0;
      this.tetherOffsetY = 0;
      this.tetherTime = 0;
      this.breakCooldown = 0;

      // Click convergence & blast repulsion states (Stage 1: move towards ship -> Stage 2: thrown away)
      this.pulseStage = 0; // 0 = normal, 1 = move towards spaceship, 2 = thrown away
      this.pulseTimer = 0;
      this.pulseOriginX = 0;
      this.pulseOriginY = 0;
    }

    Node.prototype.update = function() {
      if (this.breakCooldown > 0) {
        this.breakCooldown--;
      }

      var shipX = (craft && craft.isActive) ? craft.x : mouse.x;
      var shipY = (craft && craft.isActive) ? craft.y : mouse.y;
      var shipSpeed = (craft && craft.isActive) ? craft.speed : 0;
      var shipActive = !isLowPerf && (mouse.isHovering || (craft && craft.isActive)) && shipX > -500 && shipY > -500;

      // --- CLICK IMPULSE (STAGE 1: MOVE TOWARDS SHIP SLIGHTLY -> STAGE 2: THROWN AWAY) ---
      if (this.pulseStage === 1) {
        this.pulseTimer--;
        var pDx = this.pulseOriginX - this.x;
        var pDy = this.pulseOriginY - this.y;
        var pDist = Math.hypot(pDx, pDy) || 1;

        // Stage 1: Move towards spaceship slightly (attracted inward by energy convergence)
        var inwardSpeed = Math.min(3.8, Math.max(1.8, pDist * 0.06));
        this.vx = (pDx / pDist) * inwardSpeed;
        this.vy = (pDy / pDist) * inwardSpeed;
        this.x += this.vx;
        this.y += this.vy;

        if (Math.random() < 0.25) {
          spawnSparks(this.x, this.y, 1, this.theme, 0.7);
        }

        if (this.pulseTimer <= 0) {
          // Transition to Stage 2: THROWN AWAY from spaceship!
          this.pulseStage = 2;
          this.breakCooldown = 55; // Prevent tractor re-capture while escaping
          this.isTethered = false;

          var blastAngle = Math.atan2(this.y - this.pulseOriginY, this.x - this.pulseOriginX);
          blastAngle += (Math.random() - 0.5) * 0.35; // Organic dispersal
          var blastSpeed = 8.5 + Math.random() * 6.5; // High explosive exit speed!
          this.vx = Math.cos(blastAngle) * blastSpeed;
          this.vy = Math.sin(blastAngle) * blastSpeed;

          spawnSparks(this.x, this.y, 4, this.theme, 1.8);
        }

        // Boundary rebound
        if (this.x < 12) { this.x = 12; this.vx = Math.abs(this.vx); }
        else if (this.x > width - 12) { this.x = width - 12; this.vx = -Math.abs(this.vx); }
        if (this.y < 12) { this.y = 12; this.vy = Math.abs(this.vy); }
        else if (this.y > height - 12) { this.y = height - 12; this.vy = -Math.abs(this.vy); }

        this.pulse += this.pulseSpeed;
        return;
      }

      if (this.pulseStage === 2) {
        // Stage 2: Flying away from ship, dampening velocity gradually
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.94;
        this.vy *= 0.94;

        if (Math.hypot(this.vx, this.vy) < 0.8) {
          this.pulseStage = 0; // Return to standard ambient state
        }

        // Boundary rebound
        if (this.x < 12) { this.x = 12; this.vx = Math.abs(this.vx); }
        else if (this.x > width - 12) { this.x = width - 12; this.vx = -Math.abs(this.vx); }
        if (this.y < 12) { this.y = 12; this.vy = Math.abs(this.vy); }
        else if (this.y > height - 12) { this.y = height - 12; this.vy = -Math.abs(this.vy); }

        this.pulse += this.pulseSpeed;
        return;
      }

      if (shipActive) {
        var dx = shipX - this.x;
        var dy = shipY - this.y;
        var dist = Math.hypot(dx, dy);

        if (this.isTethered) {
          // Breakaway condition: mouse accelerates quickly (speed >= 7.2 px/frame) or pulled too far (> 180px)
          if (shipSpeed >= 7.2 || dist > 180) {
            this.isTethered = false;
            this.breakCooldown = 35; // Cooldown frames before it can be re-captured

            // Slingshot detachment: particle breaks loose with momentum flung outward/into wake
            var escapeAngle = Math.atan2(this.y - shipY, this.x - shipX) + (Math.random() - 0.5) * 0.8;
            var escapeSpeed = 1.6 + Math.random() * 2.4;
            this.vx = Math.cos(escapeAngle) * escapeSpeed;
            this.vy = Math.sin(escapeAngle) * escapeSpeed;

            // Visual spark release when breaking loose
            if (Math.random() < 0.75) {
              spawnSparks(this.x, this.y, 4, this.theme, 1.4);
            }
          } else {
            // TETHERED DRAG MODE: dragged along with the spaceship
            this.tetherTime++;
            var orbitAngle = this.tetherTime * 0.04;
            var targetX = shipX + this.tetherOffsetX + Math.cos(orbitAngle) * 6;
            var targetY = shipY + this.tetherOffsetY + Math.sin(orbitAngle) * 6;

            // Smooth dragging spring towards the target position
            var followEase = Math.min(0.20, 0.08 + (shipSpeed * 0.025));
            this.x += (targetX - this.x) * followEase;
            this.y += (targetY - this.y) * followEase;

            // Maintain velocity matching drag
            this.vx = (targetX - this.x) * 0.06;
            this.vy = (targetY - this.y) * 0.06;
          }
        } else {
          // UNTETHERED: GRAVITATIONAL TRACTOR PULL AT SLOW SPEEDS
          var tractorRadius = cursorRadius || 140;
          if (dist < tractorRadius && this.breakCooldown <= 0) {
            if (shipSpeed < 6.8) {
              // Gentle attraction force: increases as it gets closer
              var pullForce = Math.pow(1 - dist / tractorRadius, 1.5) * 1.5;
              var dirX = dx / (dist || 1);
              var dirY = dy / (dist || 1);

              this.vx += dirX * pullForce * 0.25;
              this.vy += dirY * pullForce * 0.25;
              this.vx *= 0.93;
              this.vy *= 0.93;

              // Capture threshold: when within 75px, lock into tethered dragging!
              if (dist < 75) {
                this.isTethered = true;
                this.tetherTime = 0;
                var angle = Math.atan2(this.y - shipY, this.x - shipX);
                var radiusLock = Math.max(38, Math.min(dist, 70));
                this.tetherOffsetX = Math.cos(angle) * radiusLock;
                this.tetherOffsetY = Math.sin(angle) * radiusLock;
                spawnSparks(this.x, this.y, 2, this.theme, 0.8);
              }
            }
          }
        }
      } else if (this.isTethered) {
        this.isTethered = false;
      }

      // If not tethered, apply standard drift physics
      if (!this.isTethered) {
        this.x += this.vx;
        this.y += this.vy;

        // Friction dampening towards natural drift speed
        var curSpeed = Math.hypot(this.vx, this.vy);
        if (curSpeed > 0.5) {
          this.vx *= 0.97;
          this.vy *= 0.97;
        }
      }

      // Boundary rebound
      if (this.x < 12) { this.x = 12; this.vx = Math.abs(this.vx); this.isTethered = false; }
      else if (this.x > width - 12) { this.x = width - 12; this.vx = -Math.abs(this.vx); this.isTethered = false; }
      if (this.y < 12) { this.y = 12; this.vy = Math.abs(this.vy); this.isTethered = false; }
      else if (this.y > height - 12) { this.y = height - 12; this.vy = -Math.abs(this.vy); this.isTethered = false; }

      this.pulse += this.pulseSpeed;
      this.potential += 0.012;
      if (this.potential > 1) this.potential = 0;
    };

    Node.prototype.draw = function() {
      var pSine = Math.sin(this.pulse);
      var radius = this.baseRadius + (this.isPulsar ? pSine * 0.35 : 0);
      var outerGlowR = radius * (this.isPulsar ? 2.2 : 1.7);
      var glowAlpha = isLight
        ? (0.16 + (this.isPulsar ? (pSine + 1) * 0.08 : 0.04))
        : (0.08 + (this.isPulsar ? (pSine + 1) * 0.05 : 0.02));

      ctx.beginPath();
      ctx.arc(this.x, this.y, Math.max(1, outerGlowR), 0, Math.PI * 2);
      ctx.fillStyle = this.theme.glow + glowAlpha + ')';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(this.x, this.y, Math.max(1, radius * 1.25), 0, Math.PI * 2);
      ctx.fillStyle = this.theme.plasma + (isLight ? '0.85)' : '0.6)');
      ctx.fill();

      ctx.beginPath();
      ctx.arc(this.x, this.y, Math.max(0.6, radius * 0.55), 0, Math.PI * 2);
      ctx.fillStyle = isLight ? (this.theme.core + '1)') : '#ffffff';
      ctx.fill();
    };

    // --- ION TRAIL PARTICLES ---
    function TrailParticle(x, y, vx, vy, size, isAmber) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.size = size || (1.6 + Math.random() * 1.0);
      this.alpha = 0.95;
      this.decay = 0.048 + Math.random() * 0.02;

      if (isLight) {
        this.color = isAmber ? '234, 88, 12' : '2, 132, 199';
        this.coreColor = isAmber ? '154, 52, 18' : '3, 105, 161';
      } else {
        this.color = isAmber ? '255, 153, 51' : '56, 189, 248';
        this.coreColor = '255, 255, 255';
      }
    }

    TrailParticle.prototype.update = function() {
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= 0.92;
      this.vy *= 0.92;
      this.alpha -= this.decay;
      return this.alpha > 0;
    };

    TrailParticle.prototype.draw = function(tCtx) {
      if (this.alpha <= 0.01) return;
      var a = this.alpha;
      var r = Math.max(0.5, this.size * a);

      tCtx.beginPath();
      tCtx.arc(this.x, this.y, r * 2.2, 0, Math.PI * 2);
      tCtx.fillStyle = 'rgba(' + this.color + ', ' + (a * (isLight ? 0.38 : 0.42)) + ')';
      tCtx.fill();

      tCtx.beginPath();
      tCtx.arc(this.x, this.y, r, 0, Math.PI * 2);
      tCtx.fillStyle = 'rgba(' + this.coreColor + ', ' + (a * (isLight ? 0.92 : 0.85)) + ')';
      tCtx.fill();
    };

    function clearCraftTrail() {
      trailParticles = [];
      if (trailCtx) {
        trailCtx.clearRect(0, 0, width, height);
      }
    }

    // --- SPARK PARTICLES ---
    function Spark(x, y, vx, vy, theme) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.theme = theme;
      this.size = 1.0 + Math.random() * 1.4;
      this.alpha = 1;
      this.decay = 0.02 + Math.random() * 0.035;
    }

    Spark.prototype.update = function() {
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= 0.94;
      this.vy *= 0.94;
      this.alpha -= this.decay;
      return this.alpha > 0;
    };

    Spark.prototype.draw = function() {
      var a = Math.max(0, this.alpha);
      ctx.beginPath();
      ctx.arc(this.x, this.y, Math.max(0.4, this.size * a), 0, Math.PI * 2);
      ctx.fillStyle = this.theme.plasma + (a * (isLight ? 0.92 : 0.85)) + ')';
      ctx.fill();
    };

    function spawnSparks(x, y, count, theme, speedMultiplier) {
      if (sparks.length >= 50) return;
      var speed = speedMultiplier || 1;
      var actualCount = Math.min(count, 50 - sparks.length);
      for (var i = 0; i < actualCount; i++) {
        var angle = Math.random() * Math.PI * 2;
        var mag = (1.2 + Math.random() * 3.8) * speed;
        sparks.push(new Spark(x, y, Math.cos(angle) * mag, Math.sin(angle) * mag, theme));
      }
    }

    // --- SHOCKWAVE BURST ---
    function Shockwave(x, y, theme) {
      this.x = x;
      this.y = y;
      this.theme = theme;
      this.radius = 4;
      this.maxRadius = 150;
      this.speed = 8.5;
      this.alpha = 1;
    }

    Shockwave.prototype.update = function() {
      this.radius += this.speed;
      this.alpha = 1 - (this.radius / this.maxRadius);
      return this.alpha > 0;
    };

    Shockwave.prototype.draw = function() {
      if (this.alpha <= 0) return;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.strokeStyle = this.theme.plasma + (this.alpha * (isLight ? 0.65 : 0.55)) + ')';
      ctx.lineWidth = Math.max(1, 3.8 * this.alpha);
      ctx.stroke();
    };

    // --- FRACTAL ELECTRIC LIGHTNING ---
    function generateLightning(x1, y1, x2, y2, displacement, iterations, allowBranches) {
      var points = [{ x: x1, y: y1 }, { x: x2, y: y2 }];
      var branches = [];

      for (var iter = 0; iter < iterations; iter++) {
        var nextPoints = [];
        for (var i = 0; i < points.length - 1; i++) {
          var p1 = points[i];
          var p2 = points[i + 1];
          nextPoints.push(p1);

          var dx = p2.x - p1.x;
          var dy = p2.y - p1.y;
          var len = Math.sqrt(dx * dx + dy * dy);
          if (len < 4) continue;

          var nx = -dy / len;
          var ny = dx / len;
          var jitter = (Math.random() - 0.5) * displacement;
          var mx = (p1.x + p2.x) * 0.5 + nx * jitter;
          var my = (p1.y + p2.y) * 0.5 + ny * jitter;

          nextPoints.push({ x: mx, y: my });

          if (allowBranches && iter === 1 && Math.random() < 0.32 && branches.length < 2) {
            var branchAngle = Math.atan2(dy, dx) + (Math.random() > 0.5 ? 0.62 : -0.62);
            var branchLen = len * (0.65 + Math.random() * 0.5);
            branches.push(generateLightning(mx, my, mx + Math.cos(branchAngle) * branchLen, my + Math.sin(branchAngle) * branchLen, displacement * 0.42, iterations - 1, false));
          }
        }
        nextPoints.push(points[points.length - 1]);
        points = nextPoints;
        displacement *= 0.52;
      }
      return { points: points, branches: branches };
    }

    function renderArc(arcData, theme, alpha, coreWidth) {
      if (alpha <= 0.01) return;
      var pts = arcData.points;
      if (!pts || pts.length < 2) return;

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.strokeStyle = theme.glow + (alpha * (isLight ? 0.38 : 0.28)) + ')';
      ctx.lineWidth = coreWidth * 4.8;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (var j = 1; j < pts.length; j++) ctx.lineTo(pts[j].x, pts[j].y);
      ctx.strokeStyle = theme.plasma + (alpha * (isLight ? 0.92 : 0.86)) + ')';
      ctx.lineWidth = coreWidth * 2.0;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (var k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
      ctx.strokeStyle = theme.core + (alpha * 0.98) + ')';
      ctx.lineWidth = Math.max(0.75, coreWidth * 0.65);
      ctx.stroke();

      if (arcData.branches && arcData.branches.length > 0) {
        for (var b = 0; b < arcData.branches.length; b++) {
          renderArc(arcData.branches[b], theme, alpha * 0.6, coreWidth * 0.6);
        }
      }
    }

    function drawLiveFilament(x1, y1, x2, y2, theme, proximity) {
      if (proximity <= 0.05) return;
      var dx = x2 - x1;
      var dy = y2 - y1;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var midX = (x1 + x2) * 0.5;
      var midY = (y1 + y2) * 0.5;
      var nx = -dy / dist;
      var ny = dx / dist;

      var jitter = (Math.random() - 0.5) * 5.0 * proximity;
      var qx = midX + nx * jitter;
      var qy = midY + ny * jitter;

      var glowAlpha = isLight ? (proximity * 0.16) : (proximity * 0.07);
      var plasmaAlpha = isLight ? (proximity * 0.35) : (proximity * 0.18);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(qx, qy, x2, y2);
      ctx.strokeStyle = theme.glow + glowAlpha + ')';
      ctx.lineWidth = isLight ? 1.4 : 1.2;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(qx, qy, x2, y2);
      ctx.strokeStyle = theme.plasma + plasmaAlpha + ')';
      ctx.lineWidth = isLight ? 0.85 : 0.65;
      ctx.stroke();
    }

    function DischargeArc(n1, n2, theme, duration, widthScale, allowFork) {
      this.n1 = n1;
      this.n2 = n2;
      this.theme = theme;
      this.duration = duration || 6;
      this.life = this.duration;
      this.widthScale = widthScale || 1.4;
      this.allowFork = allowFork !== false;
      this.refreshArc();
    }

    DischargeArc.prototype.refreshArc = function() {
      var dx = this.n2.x - this.n1.x;
      var dy = this.n2.y - this.n1.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var displacement = Math.min(45, Math.max(16, dist * 0.24));
      var iterations = dist > 180 ? 4 : 3;
      this.arc = generateLightning(this.n1.x, this.n1.y, this.n2.x, this.n2.y, displacement, iterations, this.allowFork);
    };

    DischargeArc.prototype.update = function() {
      this.life--;
      if (this.life % 2 === 0) this.refreshArc();
      return this.life > 0;
    };

    DischargeArc.prototype.draw = function() {
      var alpha = (this.life / this.duration);
      renderArc(this.arc, this.theme, Math.sin(alpha * Math.PI) * 0.98, this.widthScale);
    };

    function initNodes(count) {
      nodes = [];
      sparks = [];
      activeArcs = [];
      for (var i = 0; i < count; i++) {
        nodes.push(new Node());
      }
    }

    var burstSecondaryShockwaveTimer = 0;
    var burstOrigin = { x: 0, y: 0 };
    var burstTheme = null;

    function triggerElectricBurst(x, y) {
      burstTheme = Math.random() < 0.5 ? themes.amber : themes.cyan;
      shockwaves.push(new Shockwave(x, y, burstTheme));
      spawnSparks(x, y, 16, burstTheme, 2.0);
      flashOpacity = 0.12;

      burstOrigin.x = x;
      burstOrigin.y = y;
      burstSecondaryShockwaveTimer = 8; // Secondary detonation shockwave when particles are thrown away

      var burstRadius = 320;
      var target = (craft && craft.isActive) ? craft : { x: x, y: y };

      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        var dx = node.x - x;
        var dy = node.y - y;
        var dist = Math.hypot(dx, dy);

        if (dist < burstRadius) {
          // 1. Pass lightning from nearby particle TO the spacecraft
          activeArcs.push(new DischargeArc(node, target, node.theme, 8 + Math.floor(Math.random() * 4), 2.0, true));

          // 2. Two-stage kinetic impulse: first move towards spaceship slightly, then get thrown away!
          node.isTethered = false;
          node.pulseStage = 1; // Stage 1: Move towards ship slightly
          node.pulseTimer = 7 + Math.floor(Math.random() * 3); // 7-9 frames (~120-150ms inward)
          node.pulseOriginX = x;
          node.pulseOriginY = y;
        }
      }
    }

    // --- SPACECRAFT UPDATE & RENDER ---
    function updateCraft() {
      // 1. Render ion trail particles
      if (trailCtx) {
        trailCtx.clearRect(0, 0, width, height);
        if (trailParticles.length > 0) {
          trailCtx.globalCompositeOperation = isLight ? 'source-over' : 'lighter';
          for (var tp = trailParticles.length - 1; tp >= 0; tp--) {
            var p = trailParticles[tp];
            if (p.update()) {
              p.draw(trailCtx);
            } else {
              trailParticles.splice(tp, 1);
            }
          }
        }
      }

      if (!craftEl || !craft.isActive) return;

      // 2. Smooth directional rotation
      if (!prefersReducedMotion) {
        var diff = craft.targetAngle - craft.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        craft.angle += diff * 0.35;
      }

      // 3. Body rotation & click recoil
      if (craftSvg) {
        var clickScale = craft.isClicking ? 0.86 : 1;
        craftSvg.style.transform = 'rotate(' + craft.angle + 'rad) scale(' + clickScale + ')';
      }

      // 4. Spring back scroll surge offset smoothly
      if (Math.abs(craft.scrollOffsetY) > 0.1) {
        craft.scrollOffsetY *= 0.82;
      } else {
        craft.scrollOffsetY = 0;
      }

      var renderY = craft.y + craft.scrollOffsetY;
      craftEl.style.transform = 'translate(' + (craft.x - 16) + 'px, ' + (renderY - 18) + 'px)';

      // 5. Thruster flame scale
      if (craftFlames && craftFlames.length) {
        var flameScale = prefersReducedMotion ? 1 : 1 + Math.min(craft.speed / 8, 1.4);
        var flameScaleStr = 'scaleY(' + flameScale.toFixed(2) + ')';
        for (var fl = 0; fl < craftFlames.length; fl++) {
          craftFlames[fl].style.transform = flameScaleStr;
        }
      }

      // 6. Dual-nozzle ion exhaust stream
      if (craft.speed > 0.8) {
        var dirX = Math.sin(craft.angle);
        var dirY = -Math.cos(craft.angle);

        var nozzleDist = 9.0;
        var nozzleOffset = 5.5;
        var perpX = -dirY * nozzleOffset;
        var perpY = dirX * nozzleOffset;

        var nozzleBaseX = craft.x - dirX * nozzleDist;
        var nozzleBaseY = renderY - dirY * nozzleDist;

        var ports = [-1, 1];
        for (var pIdx = 0; pIdx < ports.length; pIdx++) {
          if (trailParticles.length < maxTrailParticles) {
            var portSide = ports[pIdx];
            var nx = nozzleBaseX + perpX * portSide + (Math.random() - 0.5) * 1.0;
            var ny = nozzleBaseY + perpY * portSide + (Math.random() - 0.5) * 1.0;

            var ejectSpeed = 0.9 + Math.random() * 1.4;
            var pvx = -dirX * ejectSpeed + (Math.random() - 0.5) * 0.4;
            var pvy = -dirY * ejectSpeed + (Math.random() - 0.5) * 0.4;
            var isAmber = Math.random() < 0.35;
            var pSize = 1.6 + Math.min(craft.speed / 6, 1.4);

            trailParticles.push(new TrailParticle(nx, ny, pvx, pvy, pSize, isAmber));
          }
        }
      }

      craft.speed *= 0.82;
    }

    // --- MAIN RENDER LOOP ---
    function render(currentTime) {
      if (!isVisible) return;

      // Track sustained rolling average FPS; trigger low-perf mode if sustained FPS drops below 30
      if (fpsMonitorActive && currentTime) {
        if (prevTimestamp > 0) {
          var delta = currentTime - prevTimestamp;
          totalFramesRendered++;
          if (totalFramesRendered > WARMUP_FRAMES && !document.hidden && delta < 200) {
            frameDeltas.push(delta);
            if (frameDeltas.length >= FPS_CHECK_WINDOW) {
              var sum = 0;
              for (var f = 0; f < frameDeltas.length; f++) {
                sum += frameDeltas[f];
              }
              var avgDelta = sum / frameDeltas.length;
              var avgFps = 1000 / avgDelta;
              if (avgFps < 18) {
                enableLowPerfMode('fps_below_18 (' + avgFps.toFixed(1) + ' fps)');
              } else {
                frameDeltas.shift();
              }
            }
          }
        }
        prevTimestamp = currentTime;
      }

      var targetInterval = isLowPerf ? 33 : (mouse.isHovering ? 16 : 24);
      if (currentTime && (currentTime - lastFrameTime < targetInterval)) {
        rafId = requestAnimationFrame(render);
        return;
      }
      lastFrameTime = currentTime || 0;

      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, width, height);

      if (flashOpacity > 0.002) {
        ctx.fillStyle = isLight
          ? 'rgba(2, 132, 199, ' + (flashOpacity * 0.45) + ')'
          : 'rgba(56, 189, 248, ' + flashOpacity + ')';
        ctx.fillRect(0, 0, width, height);
        flashOpacity *= 0.82;
      }

      if (burstSecondaryShockwaveTimer > 0) {
        burstSecondaryShockwaveTimer--;
        if (burstSecondaryShockwaveTimer === 0) {
          var repTheme = burstTheme || themes.cyan;
          shockwaves.push(new Shockwave(burstOrigin.x, burstOrigin.y, repTheme));
          spawnSparks(burstOrigin.x, burstOrigin.y, 22, repTheme, 2.4);
          flashOpacity = 0.08;
        }
      }

      var nowTime = Date.now();
      var isIdle = autoCruiseEnabled && !isLowPerf && (nowTime - lastInteractionTime >= idleTimeoutMs);

      if (isIdle) {
        if (!isAutoCruising) {
          isAutoCruising = true;
          // Place inside screen if out of bounds
          if (craft.x < 30 || craft.y < 30 || craft.x > width - 30 || craft.y > height - 30) {
            craft.x = width * 0.5;
            craft.y = height * 0.5;
            craft.prevX = craft.x;
            craft.prevY = craft.y;
          }
          // Align initial heading with craft's current orientation
          cruiseHeading = (typeof craft.angle === 'number') ? (craft.angle - Math.PI / 2) : 0;
          mouse.targetX = craft.x;
          mouse.targetY = craft.y;
          mouse.x = craft.x;
          mouse.y = craft.y;
          mouse.isHovering = true;
          if (craftEl) {
            craft.isActive = true;
            craftEl.classList.add('is-active');
            craftEl.style.display = 'block';
          }
          // Target an edge across the screen
          pickNewCruiseEdgeTarget();
        }

        // Steer heading towards the target edge waypoint
        var targetAngle = Math.atan2(cruiseWaypoint.y - craft.y, cruiseWaypoint.x - craft.x);
        var angleDiff = targetAngle - cruiseHeading;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

        // Smooth banking turn rate (gentle 0.04 rad/frame)
        var maxTurnRate = 0.04;
        if (Math.abs(angleDiff) <= maxTurnRate) {
          cruiseHeading = targetAngle;
        } else {
          cruiseHeading += Math.sign(angleDiff) * maxTurnRate;
        }

        // Move craft forward along heading at relaxed, majestic cruise speed
        var moveSpeed = Math.max(0.8, cruiseSpeed);
        craft.x += Math.cos(cruiseHeading) * moveSpeed;
        craft.y += Math.sin(cruiseHeading) * moveSpeed;

        // Boundary margins: allow ship to go all the way to 18px from physical edge
        var minMargin = 18;
        var maxMarginX = width - 18;
        var maxMarginY = height - 18;

        if (craft.x < minMargin) {
          craft.x = minMargin;
          if (Math.cos(cruiseHeading) < 0) cruiseHeading = Math.PI - cruiseHeading;
        } else if (craft.x > maxMarginX) {
          craft.x = maxMarginX;
          if (Math.cos(cruiseHeading) > 0) cruiseHeading = Math.PI - cruiseHeading;
        }

        if (craft.y < minMargin) {
          craft.y = minMargin;
          if (Math.sin(cruiseHeading) < 0) cruiseHeading = -cruiseHeading;
        } else if (craft.y > maxMarginY) {
          craft.y = maxMarginY;
          if (Math.sin(cruiseHeading) > 0) cruiseHeading = -cruiseHeading;
        }

        // Detect arrival at the edge: within 36px of target OR right up against any edge boundary
        var distToTarget = Math.hypot(cruiseWaypoint.x - craft.x, cruiseWaypoint.y - craft.y);
        var reachedEdge = (craft.x <= minMargin + 8) || (craft.x >= maxMarginX - 8) ||
                          (craft.y <= minMargin + 8) || (craft.y >= maxMarginY - 8);

        cruiseCooldownTimer++;
        if ((distToTarget < 36 || reachedEdge) && cruiseCooldownTimer > 75) {
          pickNewCruiseEdgeTarget();
        }

        // Directional banking and speed for ion thrusters
        craft.targetAngle = cruiseHeading + Math.PI / 2;
        craft.speed = 1.15; // keeps thrusters and ion trails smoothly active

        mouse.x = craft.x;
        mouse.y = craft.y;
        mouse.targetX = craft.x;
        mouse.targetY = craft.y;
      } else if (isAutoCruising) {
        isAutoCruising = false;
      }

      if (mouse.isHovering && !isAutoCruising) {
        mouse.x += (mouse.targetX - mouse.x) * 0.22;
        mouse.y += (mouse.targetY - mouse.y) * 0.22;
      }

      // In dark mode: additive blending for glowing sci-fi effect
      // In light mode: source-over normal blending to avoid washing out to white on light bg
      ctx.globalCompositeOperation = isLight ? 'source-over' : 'lighter';
      var len = nodes.length;

      for (var i = 0; i < len; i++) {
        nodes[i].update();
        nodes[i].draw();
      }

      // Tractor-beam glowing filaments for tethered particles (disabled in low-perf)
      if (!isLowPerf) {
        var shipX = (craft && craft.isActive) ? craft.x : mouse.x;
        var shipY = (craft && craft.isActive) ? craft.y : mouse.y;
        for (var tn = 0; tn < len; tn++) {
          if (nodes[tn].isTethered) {
            drawLiveFilament(shipX, shipY, nodes[tn].x, nodes[tn].y, nodes[tn].theme, 0.95);
          }
        }
      }

      for (var a = 0; a < len; a++) {
        var n1 = nodes[a];
        for (var b = a + 1; b < len; b++) {
          var n2 = nodes[b];
          var dx = n1.x - n2.x;
          var dy = n1.y - n2.y;
          var distSq = dx * dx + dy * dy;

          if (distSq < arcDistanceSq) {
            var proximity = 1 - (Math.sqrt(distSq) / arcDistance);
            drawLiveFilament(n1.x, n1.y, n2.x, n2.y, n1.theme, proximity);

            if (!prefersReducedMotion && (n1.potential > 0.88 && n2.potential > 0.88)) {
              n1.potential = 0.1;
              n2.potential = 0.1;
              if (activeArcs.length < 9) {
                activeArcs.push(new DischargeArc(n1, n2, n1.theme, 6, 1.35, true));
                if (Math.random() < 0.5) spawnSparks((n1.x + n2.x) * 0.5, (n1.y + n2.y) * 0.5, 2, n1.theme, 0.85);
              }
            }
          }
        }
      }

      ambientDischargeTimer++;
      if (!prefersReducedMotion && ambientDischargeTimer > 75) {
        ambientDischargeTimer = 0;
        if (Math.random() < 0.75 && nodes.length > 2) {
          var i1 = Math.floor(Math.random() * nodes.length);
          var i2 = Math.floor(Math.random() * nodes.length);
          if (i1 !== i2) {
            var disTheme = Math.random() < 0.6 ? themes.amber : themes.cyan;
            activeArcs.push(new DischargeArc(nodes[i1], nodes[i2], disTheme, 10 + Math.floor(Math.random() * 6), 1.75, true));
            spawnSparks((nodes[i1].x + nodes[i2].x) * 0.5, (nodes[i1].y + nodes[i2].y) * 0.5, 4, disTheme, 1.2);
            flashOpacity = 0.05;
          }
        }
      }

      // Proximity lightning to spacecraft (disabled in low-perf)
      if (!isLowPerf && mouse.isHovering) {
        var closeNodes = [];
        for (var c = 0; c < len; c++) {
          var nd = nodes[c];
          var cdx = nd.x - mouse.x;
          var cdy = nd.y - mouse.y;
          var cdistSq = cdx * cdx + cdy * cdy;
          if (cdistSq < cursorRadiusSq) {
            closeNodes.push({ node: nd, distSq: cdistSq, dist: Math.sqrt(cdistSq) });
          }
        }

        closeNodes.sort(function(o1, o2) { return o1.distSq - o2.distSq; });
        var connectLimit = closeNodes.length > 0 ? (closeNodes[0].dist < 75 && closeNodes.length > 1 ? 2 : 1) : 0;
        for (var k = 0; k < connectLimit; k++) {
          var cn = closeNodes[k];
          var cAlpha = 1 - (cn.dist / cursorRadius);
          var disp = Math.min(16, Math.max(6, cn.dist * 0.15));
          var cursorArc = generateLightning(cn.node.x, cn.node.y, mouse.x, mouse.y, disp, 3, false);
          renderArc(cursorArc, cn.node.theme, cAlpha * 0.48, 0.9);
          if (Math.random() < 0.05) spawnSparks(mouse.x, mouse.y, 1, cn.node.theme, 0.6);
        }

        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = isLight ? themes.cyan.hex : '#ffffff';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = themes.amber.glow + (isLight ? '0.35)' : '0.2)');
        ctx.fill();
      }

      for (var da = activeArcs.length - 1; da >= 0; da--) {
        if (activeArcs[da].update()) activeArcs[da].draw();
        else activeArcs.splice(da, 1);
      }

      for (var sw = shockwaves.length - 1; sw >= 0; sw--) {
        if (shockwaves[sw].update()) shockwaves[sw].draw();
        else shockwaves.splice(sw, 1);
      }

      for (var sp = sparks.length - 1; sp >= 0; sp--) {
        if (sparks[sp].update()) sparks[sp].draw();
        else sparks.splice(sp, 1);
      }

      ctx.globalCompositeOperation = 'source-over';
      if (!isLowPerf) {
        updateCraft();
      }

      rafId = requestAnimationFrame(render);
    }

    // --- INTERACTION LISTENERS ---
    function registerUserActivity() {
      lastInteractionTime = Date.now();
      if (isAutoCruising) {
        isAutoCruising = false;
      }
    }

    function handlePointerMove(clientX, clientY) {
      if (isLowPerf) return;

      var wasCruising = isAutoCruising;
      registerUserActivity();

      mouse.targetX = clientX;
      mouse.targetY = clientY;
      mouse.isHovering = true;

      if (!rafId) rafId = requestAnimationFrame(render);

      if (craftEl) {
        if (!craft.isActive) {
          craft.isActive = true;
          craftEl.classList.add('is-active');
          craft.prevX = clientX;
          craft.prevY = clientY;
        }

        if (wasCruising) {
          // Immediately anchor craft position to cursor coordinates
          craft.prevX = clientX;
          craft.prevY = clientY;
        }

        var dx = clientX - craft.prevX;
        var dy = clientY - craft.prevY;
        var dist = Math.hypot(dx, dy);

        if (dist > 1.5) {
          craft.targetAngle = Math.atan2(dy, dx) + Math.PI / 2;
          craft.speed = dist;
          craft.prevX = clientX;
          craft.prevY = clientY;
        }

        craft.x = clientX;
        craft.y = clientY;
        craftEl.style.transform = 'translate(' + (clientX - 16) + 'px, ' + (clientY - 18) + 'px)';
      }
    }

    window.addEventListener('pointermove', function(e) {
      handlePointerMove(e.clientX, e.clientY);
    }, { passive: true });

    window.addEventListener('mousemove', function(e) {
      handlePointerMove(e.clientX, e.clientY);
    }, { passive: true });

    window.addEventListener('mouseover', function(e) {
      if (!craftEl || isLowPerf) return;
      var target = e.target;
      if (target && target.closest && target.closest('#top-ce, #comment-editor, .comments, .comment-form')) {
        craftEl.style.opacity = '0';
        return;
      }
      var isInteractive = target && target.closest && target.closest('a, button, input, textarea, select, [role="button"], [tabindex]:not([tabindex="-1"]), .fx-glass-card, .fx-glass-btn');
      if (isInteractive) craftEl.classList.add('is-targeting');
      else craftEl.classList.remove('is-targeting');
    }, { passive: true });

    var lastBurstTime = 0;
    function executeClickBurst(clientX, clientY) {
      if (isLowPerf) return;
      var now = Date.now();
      if (now - lastBurstTime < 80) return;
      lastBurstTime = now;

      handlePointerMove(clientX, clientY);
      triggerElectricBurst(clientX, clientY);

      if (craftEl) {
        craft.isClicking = true;
        craftEl.classList.add('is-clicking');

        var dirX = Math.sin(craft.angle);
        var dirY = -Math.cos(craft.angle);
        for (var b = 0; b < 3; b++) {
          if (trailParticles.length < maxTrailParticles) {
            trailParticles.push(new TrailParticle(
              craft.x - dirX * 9,
              craft.y - dirY * 9,
              -dirX * (1.8 + Math.random() * 1.5) + (Math.random() - 0.5) * 1.0,
              -dirY * (1.8 + Math.random() * 1.5) + (Math.random() - 0.5) * 1.0,
              1.5,
              true
            ));
          }
        }
        spawnSparks(clientX, clientY, 4, themes.amber, 1.4);
      }
    }

    window.addEventListener('pointerdown', function(e) {
      executeClickBurst(e.clientX, e.clientY);
    }, { passive: true });

    window.addEventListener('pointerup', function() {
      if (craftEl) {
        craft.isClicking = false;
        craftEl.classList.remove('is-clicking');
      }
    }, { passive: true });

    window.addEventListener('keydown', function() {
      registerUserActivity();
    }, { passive: true });

    window.addEventListener('mousedown', function(e) {
      registerUserActivity();
      executeClickBurst(e.clientX, e.clientY);
    }, { passive: true });

    document.addEventListener('mouseleave', function() {
      if (!isAutoCruising) {
        mouse.isHovering = false;
        if (craftEl) {
          craft.isActive = false;
          craftEl.classList.remove('is-active', 'is-targeting', 'is-clicking');
        }
        clearCraftTrail();
      }
    });

    window.addEventListener('blur', function() {
      if (!isAutoCruising) {
        mouse.isHovering = false;
        if (craftEl) {
          craft.isActive = false;
          craftEl.classList.remove('is-active', 'is-targeting', 'is-clicking');
        }
        clearCraftTrail();
      }
    });

    // --- SCROLL DYNAMICS ---
    var lastScrollPos = window.scrollY || window.pageYOffset || 0;

    function triggerScrollMovement(deltaY) {
      registerUserActivity();
      if (!craftEl || !craft.isActive) return;
      var absDelta = Math.abs(deltaY);
      if (absDelta < 1) return;

      if (deltaY > 0) craft.targetAngle = Math.PI;
      else craft.targetAngle = 0;

      var impulse = Math.min(absDelta * 0.22, 18);
      craft.speed = Math.max(craft.speed, impulse);

      var surge = Math.sign(deltaY) * Math.min(absDelta * 0.1, 14);
      craft.scrollOffsetY = Math.max(-16, Math.min(16, craft.scrollOffsetY + surge));

      if (!rafId) rafId = requestAnimationFrame(render);
    }

    window.addEventListener('wheel', function(e) {
      triggerScrollMovement(e.deltaY);
    }, { passive: true });

    window.addEventListener('scroll', function() {
      var cur = window.scrollY || window.pageYOffset || 0;
      var dy = cur - lastScrollPos;
      lastScrollPos = cur;
      if (Math.abs(dy) > 1) triggerScrollMovement(dy);
    }, { passive: true });

    document.addEventListener('visibilitychange', function() {
      if (document.hidden) {
        isVisible = false;
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      } else {
        isVisible = true;
        registerUserActivity();
        if (!rafId) rafId = requestAnimationFrame(render);
      }
    });

    window.addEventListener('resize', resize, { passive: true });

    // Watch DOM for data-theme or class changes (e.g. data-theme="light" or .light-theme)
    if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
      var themeObserver = new MutationObserver(function() {
        var nowLight = checkIsLightMode();
        if (nowLight !== isLight) {
          updateTheme(nowLight);
        }
      });
      themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme', 'class']
      });
      if (document.body) {
        themeObserver.observe(document.body, {
          attributes: true,
          attributeFilter: ['class']
        });
      }
    }

    // Initial setup
    updateTheme(isLight);
    resize();
    rafId = requestAnimationFrame(render);

    activeInstance = {
      destroy: function() {
        if (rafId) cancelAnimationFrame(rafId);
      },
      setTheme: function(theme) {
        var light = (theme === 'light');
        if (typeof document !== 'undefined') {
          var html = document.documentElement;
          if (html) {
            html.setAttribute('data-theme', light ? 'light' : 'dark');
            if (light) html.classList.add('light-theme');
            else html.classList.remove('light-theme');
          }
        }
        updateTheme(light);
      },
      toggleTheme: function() {
        var target = isLight ? 'dark' : 'light';
        this.setTheme(target);
        return target;
      },
      getTheme: function() {
        return isLight ? 'light' : 'dark';
      },
      enableLowPerfMode: function(reason) {
        enableLowPerfMode(reason || 'manual');
      },
      isLowPerf: function() {
        return isLowPerf;
      },
      setIdleTimeout: function(seconds) {
        if (typeof seconds === 'number' && seconds > 0) {
          idleTimeoutMs = seconds * 1000;
        }
      },
      getIdleTimeout: function() {
        return idleTimeoutMs / 1000;
      },
      isAutoCruising: function() {
        return isAutoCruising;
      },
      triggerAutoCruise: function() {
        lastInteractionTime = 0; // Trigger immediately on next frame
      }
    };

    return activeInstance;
  }

  // Auto initialize on DOMContentLoaded if script is included directly
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        init();
      });
    } else {
      init();
    }
  }

  return {
    init: init,
    setTheme: function(theme) {
      if (activeInstance) {
        return activeInstance.setTheme(theme);
      } else if (typeof document !== 'undefined' && document.documentElement) {
        var light = (theme === 'light');
        document.documentElement.setAttribute('data-theme', light ? 'light' : 'dark');
        if (light) document.documentElement.classList.add('light-theme');
        else document.documentElement.classList.remove('light-theme');
      }
    },
    toggleTheme: function() {
      if (activeInstance) {
        return activeInstance.toggleTheme();
      } else if (typeof document !== 'undefined' && document.documentElement) {
        var nowLight = checkIsLightMode();
        var nextTheme = nowLight ? 'dark' : 'light';
        this.setTheme(nextTheme);
        return nextTheme;
      }
      return 'dark';
    },
    getTheme: function() {
      if (activeInstance) return activeInstance.getTheme();
      return checkIsLightMode() ? 'light' : 'dark';
    },
    enableLowPerfMode: function(reason) {
      if (activeInstance) return activeInstance.enableLowPerfMode(reason);
      if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.classList.add('low-perf');
      }
    },
    isLowPerf: function() {
      if (activeInstance) return activeInstance.isLowPerf();
      return typeof document !== 'undefined' && document.documentElement && document.documentElement.classList.contains('low-perf');
    },
    setIdleTimeout: function(seconds) {
      if (activeInstance) activeInstance.setIdleTimeout(seconds);
    },
    getIdleTimeout: function() {
      if (activeInstance) return activeInstance.getIdleTimeout();
      return 15;
    },
    isAutoCruising: function() {
      if (activeInstance) return activeInstance.isAutoCruising();
      return false;
    },
    triggerAutoCruise: function() {
      if (activeInstance) activeInstance.triggerAutoCruise();
    }
  };
});
