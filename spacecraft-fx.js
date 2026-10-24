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
    '<svg class="spacecraft-svg" viewBox="0 0 24 34" width="24" height="34" fill="none" xmlns="http://www.w3.org/2000/svg">',
    '  <defs>',
    '    <linearGradient id="sc-hull-grad" x1="12" y1="2" x2="12" y2="24" gradientUnits="userSpaceOnUse">',
    '      <stop offset="0%" stop-color="#2a384e" />',
    '      <stop offset="50%" stop-color="#121824" />',
    '      <stop offset="100%" stop-color="#070a10" />',
    '    </linearGradient>',
    '    <linearGradient id="sc-canopy-grad" x1="12" y1="7" x2="12" y2="15" gradientUnits="userSpaceOnUse">',
    '      <stop offset="0%" stop-color="#ffffff" />',
    '      <stop offset="45%" stop-color="#38bdf8" />',
    '      <stop offset="100%" stop-color="#0284c7" />',
    '    </linearGradient>',
    '    <linearGradient id="sc-flame-grad" x1="12" y1="21" x2="12" y2="34" gradientUnits="userSpaceOnUse">',
    '      <stop offset="0%" stop-color="#ffffff" />',
    '      <stop offset="30%" stop-color="#38bdf8" />',
    '      <stop offset="70%" stop-color="#ff9933" />',
    '      <stop offset="100%" stop-color="rgba(255, 153, 51, 0)" />',
    '    </linearGradient>',
    '    <filter id="sc-glow" x="-40%" y="-40%" width="180%" height="180%">',
    '      <feGaussianBlur stdDeviation="1" result="blur" />',
    '      <feComposite in="SourceGraphic" in2="blur" operator="over" />',
    '    </filter>',
    '  </defs>',
    '  <path class="sc-flame" d="M 9.5 21.5 Q 12 32 14.5 21.5 Z" fill="url(#sc-flame-grad)" filter="url(#sc-glow)" />',
    '  <path class="sc-hull" d="M 12 2 L 22.5 21 L 15 19 L 14 21.5 L 10 21.5 L 9 19 L 1.5 21 Z"',
    '        fill="url(#sc-hull-grad)" stroke="#38bdf8" stroke-width="0.85" stroke-linejoin="round" />',
    '  <line x1="12" y1="2" x2="12" y2="19" stroke="rgba(255, 255, 255, 0.3)" stroke-width="0.5" />',
    '  <line x1="12" y1="6" x2="3.5" y2="20" stroke="rgba(56, 189, 248, 0.4)" stroke-width="0.5" />',
    '  <line x1="12" y1="6" x2="20.5" y2="20" stroke="rgba(56, 189, 248, 0.4)" stroke-width="0.5" />',
    '  <polygon class="sc-canopy" points="12,6.5 13.8,13.5 12,15 10.2,13.5" fill="url(#sc-canopy-grad)" />',
    '  <circle class="sc-emitter" cx="2" cy="20.5" r="0.9" fill="#ff9933" filter="url(#sc-glow)" />',
    '  <circle class="sc-emitter" cx="22" cy="20.5" r="0.9" fill="#ff9933" filter="url(#sc-glow)" />',
    '  <circle class="sc-beacon" cx="12" cy="2" r="0.9" fill="#ffffff" filter="url(#sc-glow)" />',
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
    var craftFlame = craftEl ? craftEl.querySelector('.sc-flame') : null;

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

    // --- APPLY THEME ---
    function updateTheme(lightMode) {
      isLight = !!lightMode;
      themes = isLight ? lightThemes : darkThemes;

      // Update existing nodes theme references
      for (var i = 0; i < nodes.length; i++) {
        var key = nodes[i].themeKey || 'amber';
        nodes[i].theme = themes[key];
      }

      // Update SVG hull gradient stops for light/dark titanium hull
      var hullGrad = document.getElementById('sc-hull-grad');
      if (hullGrad) {
        var stops = hullGrad.querySelectorAll('stop');
        if (stops.length >= 3) {
          if (isLight) {
            stops[0].setAttribute('stop-color', '#0369a1'); // Cobalt blue nose tip (sharp contrast, not white!)
            stops[1].setAttribute('stop-color', '#64748b'); // Titanium slate mid-hull
            stops[2].setAttribute('stop-color', '#cbd5e1'); // Light titanium aft
          } else {
            stops[0].setAttribute('stop-color', '#2a384e');
            stops[1].setAttribute('stop-color', '#121824');
            stops[2].setAttribute('stop-color', '#070a10');
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
    }

    Node.prototype.update = function() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 12) { this.x = 12; this.vx *= -1; }
      else if (this.x > width - 12) { this.x = width - 12; this.vx *= -1; }
      if (this.y < 12) { this.y = 12; this.vy *= -1; }
      else if (this.y > height - 12) { this.y = height - 12; this.vy *= -1; }

      this.pulse += this.pulseSpeed;
      this.potential += 0.012;
      if (this.potential > 1) this.potential = 0;

      if (mouse.isHovering) {
        var dx = mouse.x - this.x;
        var dy = mouse.y - this.y;
        var distSq = dx * dx + dy * dy;
        if (distSq < cursorRadiusSq && distSq > 9) {
          var dist = Math.sqrt(distSq);
          var force = (1 - dist / cursorRadius) * 0.04;
          this.x += (dx / dist) * force;
          this.y += (dy / dist) * force;
        }
      }
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

    function triggerElectricBurst(x, y) {
      var burstTheme = Math.random() < 0.5 ? themes.amber : themes.cyan;
      shockwaves.push(new Shockwave(x, y, burstTheme));
      spawnSparks(x, y, 20, burstTheme, 2.2);
      flashOpacity = 0.09;

      var burstRadiusSq = 270 * 270;
      var arcCount = 0;
      for (var i = 0; i < nodes.length && arcCount < 8; i++) {
        var node = nodes[i];
        var dx = node.x - x;
        var dy = node.y - y;
        if (dx * dx + dy * dy < burstRadiusSq) {
          activeArcs.push(new DischargeArc({ x: x, y: y }, node, node.theme, 9 + Math.floor(Math.random() * 5), 1.85, true));
          arcCount++;
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
      craftEl.style.transform = 'translate(' + (craft.x - 12) + 'px, ' + (renderY - 14) + 'px)';

      // 5. Thruster flame scale
      if (craftFlame) {
        var flameScale = prefersReducedMotion ? 1 : 1 + Math.min(craft.speed / 8, 1.4);
        craftFlame.style.transform = 'scaleY(' + flameScale.toFixed(2) + ')';
      }

      // 6. Dual-nozzle ion exhaust stream
      if (craft.speed > 0.8) {
        var dirX = Math.sin(craft.angle);
        var dirY = -Math.cos(craft.angle);

        var nozzleDist = 9.5;
        var nozzleOffset = 3.0;
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

      var targetInterval = mouse.isHovering ? 16 : 24;
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

      if (mouse.isHovering) {
        mouse.x += (mouse.targetX - mouse.x) * 0.18;
        mouse.y += (mouse.targetY - mouse.y) * 0.18;
      }

      // In dark mode: additive blending for glowing sci-fi effect
      // In light mode: source-over normal blending to avoid washing out to white on light bg
      ctx.globalCompositeOperation = isLight ? 'source-over' : 'lighter';
      var len = nodes.length;

      for (var i = 0; i < len; i++) {
        nodes[i].update();
        nodes[i].draw();
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

      // Proximity lightning to spacecraft
      if (mouse.isHovering) {
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
      updateCraft();

      rafId = requestAnimationFrame(render);
    }

    // --- INTERACTION LISTENERS ---
    function handlePointerMove(clientX, clientY) {
      mouse.targetX = clientX;
      mouse.targetY = clientY;
      if (!mouse.isHovering) {
        mouse.isHovering = true;
        mouse.x = clientX;
        mouse.y = clientY;
        if (!rafId) rafId = requestAnimationFrame(render);
      }

      if (craftEl) {
        if (!craft.isActive) {
          craft.isActive = true;
          craftEl.classList.add('is-active');
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
        craftEl.style.transform = 'translate(' + (clientX - 12) + 'px, ' + (clientY - 14) + 'px)';
      }
    }

    window.addEventListener('pointermove', function(e) {
      handlePointerMove(e.clientX, e.clientY);
    }, { passive: true });

    window.addEventListener('mousemove', function(e) {
      handlePointerMove(e.clientX, e.clientY);
    }, { passive: true });

    window.addEventListener('mouseover', function(e) {
      if (!craftEl) return;
      var target = e.target;
      var isInteractive = target && target.closest && target.closest('a, button, input, textarea, select, [role="button"], [tabindex]:not([tabindex="-1"]), .fx-glass-card, .fx-glass-btn');
      if (isInteractive) craftEl.classList.add('is-targeting');
      else craftEl.classList.remove('is-targeting');
    }, { passive: true });

    window.addEventListener('pointerdown', function(e) {
      handlePointerMove(e.clientX, e.clientY);
      triggerElectricBurst(e.clientX, e.clientY);
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
        spawnSparks(e.clientX, e.clientY, 3, themes.amber, 1.2);
      }
    }, { passive: true });

    window.addEventListener('pointerup', function() {
      if (craftEl) {
        craft.isClicking = false;
        craftEl.classList.remove('is-clicking');
      }
    }, { passive: true });

    window.addEventListener('mousedown', function(e) {
      handlePointerMove(e.clientX, e.clientY);
      triggerElectricBurst(e.clientX, e.clientY);
    }, { passive: true });

    document.addEventListener('mouseleave', function() {
      mouse.isHovering = false;
      if (craftEl) {
        craft.isActive = false;
        craftEl.classList.remove('is-active', 'is-targeting', 'is-clicking');
      }
      clearCraftTrail();
    });

    window.addEventListener('blur', function() {
      mouse.isHovering = false;
      if (craftEl) {
        craft.isActive = false;
        craftEl.classList.remove('is-active', 'is-targeting', 'is-clicking');
      }
      clearCraftTrail();
    });

    // --- SCROLL DYNAMICS ---
    var lastScrollPos = window.scrollY || window.pageYOffset || 0;

    function triggerScrollMovement(deltaY) {
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
    }
  };
});
