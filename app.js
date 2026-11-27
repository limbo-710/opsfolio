const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#primary-nav');

if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? '关闭导航' : '打开导航');
    nav.classList.toggle('is-open', isOpen);
  });

  nav.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', '打开导航');
    });
  });
}

const tagTuner = document.querySelector('.tag-tuner');
const tagField = document.querySelector('.hero-orbit-words');
if (tagTuner && tagField) {
  const inputs = {
    x: tagTuner.querySelector('#tag-shift-x'),
    y: tagTuner.querySelector('#tag-shift-y'),
    scale: tagTuner.querySelector('#tag-scale'),
  };
  const storageKey = 'opsfolio-tag-layout-v1';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch { saved = {}; }
  const applyTagSettings = () => {
    const x = Number(inputs.x.value) || 0;
    const y = Number(inputs.y.value) || 0;
    const scale = (Number(inputs.scale.value) || 100) / 100;
    tagField.style.setProperty('--tag-shift-x', `${x}px`);
    tagField.style.setProperty('--tag-shift-y', `${y}px`);
    tagField.style.setProperty('--tag-scale', scale);
    inputs.x.previousElementSibling.value = `${x} px`;
    inputs.y.previousElementSibling.value = `${y} px`;
    inputs.scale.previousElementSibling.value = `${Math.round(scale * 100)}%`;
    try { localStorage.setItem(storageKey, JSON.stringify({ x, y, scale: Number(scale.toFixed(2)) })); } catch { /* private mode may disable storage */ }
  };
  inputs.x.value = String(Math.max(-80, Math.min(80, Number(saved.x) || 0)));
  inputs.y.value = String(Math.max(-60, Math.min(60, Number(saved.y) || 0)));
  inputs.scale.value = String(Math.max(75, Math.min(150, Math.round((Number(saved.scale) || 1) * 100 / 5) * 5)));
  Object.values(inputs).forEach((input) => input.addEventListener('input', applyTagSettings));
  tagTuner.querySelector('.tag-tuner-reset')?.addEventListener('click', () => {
    inputs.x.value = '0'; inputs.y.value = '0'; inputs.scale.value = '100'; applyTagSettings();
  });
  applyTagSettings();
}

const sectionIds = ['susi', 'decathlon', 'more', 'creator', 'experience', 'contact'];
const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);
const sectionLinks = [...document.querySelectorAll('.primary-nav a[href^="#"]')];

if ('IntersectionObserver' in window && sections.length) {
  const observer = new IntersectionObserver((entries) => {
    const current = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!current) return;
    sectionLinks.forEach((link) => {
      if (link.getAttribute('href') === `#${current.target.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-18% 0px -65% 0px', threshold: [0, 0.2, 0.5, 0.8] });
  sections.forEach((section) => observer.observe(section));
}

const progress = document.querySelector('.reading-progress > span');
if (progress) {
  let progressPending = false;
  const updateProgress = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
    progress.style.transform = `scaleX(${ratio})`;
    progressPending = false;
  };
  const requestProgressUpdate = () => {
    if (progressPending) return;
    progressPending = true;
    window.requestAnimationFrame(updateProgress);
  };
  window.addEventListener('scroll', requestProgressUpdate, { passive: true });
  window.addEventListener('resize', requestProgressUpdate);
  updateProgress();
}

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const waterfall = document.querySelector('.waterfall');
const waterfallTiles = waterfall
  ? [...waterfall.querySelectorAll('.waterfall-set:not([aria-hidden="true"]) .waterfall-tile')].map((tile) => tile.cloneNode(true))
  : [];

const waterfallColumnCount = () => {
  if (window.matchMedia('(min-width: 1440px)').matches) return 5;
  if (window.matchMedia('(min-width: 1100px)').matches) return 4;
  if (window.matchMedia('(min-width: 800px)').matches) return 3;
  return 2;
};

const renderWaterfall = () => {
  if (!waterfall || !waterfallTiles.length) return;
  const count = waterfallColumnCount();
  const buckets = Array.from({ length: count }, () => []);
  waterfallTiles.forEach((tile, index) => buckets[index % count].push(tile.cloneNode(true)));

  const fragment = document.createDocumentFragment();
  const durations = [132, 148, 138, 156, 144];
  buckets.forEach((tiles, index) => {
    const column = document.createElement('div');
    column.className = 'waterfall-column';
    column.style.setProperty('--flow-duration', `${durations[index]}s`);

    const track = document.createElement('div');
    track.className = 'waterfall-track';
    const originalSet = document.createElement('div');
    originalSet.className = 'waterfall-set';
    tiles.forEach((tile) => {
      tile.tabIndex = 0;
      originalSet.append(tile);
    });

    const duplicateSet = originalSet.cloneNode(true);
    duplicateSet.setAttribute('aria-hidden', 'true');
    duplicateSet.querySelectorAll('a').forEach((link) => { link.tabIndex = -1; });
    track.append(originalSet, duplicateSet);
    column.append(track);
    fragment.append(column);
  });

  waterfall.replaceChildren(fragment);
  waterfall.dataset.columns = String(count);
};

if (waterfall && waterfallTiles.length) {
  renderWaterfall();
  if (reduceMotion) {
    waterfall.setAttribute('tabindex', '0');
    waterfall.setAttribute('role', 'region');
    waterfall.setAttribute('aria-label', '溯思品牌与课程内容作品，可纵向滚动浏览');
  }

  let waterfallResizeTimer;
  window.addEventListener('resize', () => {
    window.clearTimeout(waterfallResizeTimer);
    waterfallResizeTimer = window.setTimeout(() => {
      if (waterfall.dataset.columns !== String(waterfallColumnCount())) renderWaterfall();
    }, 140);
  }, { passive: true });
}
const revealTargets = document.querySelectorAll(
  '.hero-copy, .hero-aside, .number-card, .section-intro, .case-block, .block-heading, .need-grid article, .ratio-panel, .diagram-card, .action-list li, .campaign-card, .sop-feature, .optimize-grid article, .waterfall-column, .category-card, .category-image, .result-statement, .egypt-case, .egypt-header, .egypt-prototype-block, .egypt-art-tile, .egypt-gallery-block, .palette-gallery, .palette-tile, .creator-project-header, .creator-case, .timeline article, .about-section'
);
if (!reduceMotion && 'IntersectionObserver' in window && revealTargets.length) {
  document.documentElement.classList.add('motion-ready');
  revealTargets.forEach((element, index) => {
    element.classList.add('reveal');
    element.style.setProperty('--reveal-delay', `${(index % 4) * 60}ms`);
  });
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });
  revealTargets.forEach((element) => revealObserver.observe(element));
}

// Images remain local for the preview; this fallback also covers older Project Storage links.
document.addEventListener('error', (event) => {
  const image = event.target;
  if (!(image instanceof HTMLImageElement) || !image.src.includes('/manus-storage/')) return;
  if (image.dataset.localFallback) return;

  const storedName = decodeURIComponent(image.src.split('/').pop() || '');
  const localName = storedName.replace(/_[a-f0-9]{8}(?=\.[^.]+$)/i, '');
  let localPath = null;
  if (localName.endsWith('.svg')) localPath = `assets/diagrams/${localName}`;
  else if (/^(brand-|course-)/.test(localName)) localPath = `assets/portfolio/susi/${localName}`;
  else if (/^(water|running|cycling)\./.test(localName)) localPath = `assets/portfolio/decathlon/${localName}`;
  else if (/^(background|mockup|prototype-|palette-|ui-)/.test(localName)) localPath = `assets/portfolio/egypt/${localName}`;
  if (!localPath) return;

  image.dataset.localFallback = 'true';
  image.src = localPath;
}, true);

const imageViewer = document.querySelector('#image-viewer');
const viewerImage = document.querySelector('#image-viewer-image');
const viewerScroll = document.querySelector('.image-viewer-scroll');
const viewerCaption = document.querySelector('#image-viewer-caption');
const viewerClose = document.querySelector('.image-viewer-close');

if (imageViewer && viewerImage && viewerScroll && viewerCaption) {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[data-viewer]');
    if (!link) return;
    event.preventDefault();

    const thumbnail = link.querySelector('img');
    viewerImage.src = link.href;
    viewerImage.alt = thumbnail?.alt || link.dataset.caption || '';
    viewerCaption.textContent = link.dataset.caption || thumbnail?.alt || '';
    viewerScroll.scrollTop = 0;
    if (typeof imageViewer.showModal === 'function') imageViewer.showModal();
    else imageViewer.setAttribute('open', '');
  });

  viewerClose?.addEventListener('click', () => imageViewer.close());
  imageViewer.addEventListener('click', (event) => {
    if (event.target === imageViewer) imageViewer.close();
  });
  imageViewer.addEventListener('close', () => {
    viewerImage.removeAttribute('src');
    viewerImage.alt = '';
    viewerCaption.textContent = '';
    viewerScroll.scrollTop = 0;
  });
}


// 全站固定的 WebGL 点阵场：透视投影形成有高度的起伏面，鼠标在面上激起三维波纹。
// 首页上半部运营词组跟随同一指针受力，以弹簧阻尼回到各自锚点。
(() => {
  const canvas = document.querySelector('.global-dot-field');
  const hero = document.querySelector('.hero');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const orbitWords = [...document.querySelectorAll('.hero-orbit-word')].map((element, index) => ({
    element, index, x: 0, y: 0, vx: 0, vy: 0, angle: element.dataset.angle || '0deg',
  }));
  const pointer = { x: 0.5, y: 0.5, active: false };
  let gl = null;
  let program = null;
  let vertexBuffer = null;
  let vertexCount = 0;
  let pixelRatio = 1;
  let frame = 0;
  let uniform = {};

  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Point field shader error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };

  if (canvas) {
    gl = canvas.getContext('webgl', { alpha: true, antialias: true, powerPreference: 'low-power' });
  }

  if (gl) {
    const vertexSource = `
      precision mediump float;
      attribute vec3 a_vertex;
      uniform vec2 u_resolution;
      uniform vec2 u_pointer;
      uniform float u_pointer_active;
      uniform float u_time;
      uniform float u_pixel_ratio;
      varying float v_ripple;
      varying float v_depth;
      void main() {
        float aspect = u_resolution.x / max(u_resolution.y, 1.0);
        float worldX = a_vertex.x * aspect * 1.65;
        float worldZ = a_vertex.y * 3.0;
        vec2 mouse = vec2((u_pointer.x * 2.0 - 1.0) * aspect * 1.65, (u_pointer.y - 0.5) * 6.0);
        float distanceToPointer = length(vec2(worldX, worldZ) - mouse);
        float ring = sin(distanceToPointer * 7.4 - u_time * 3.8) * exp(-distanceToPointer * 1.12) * u_pointer_active;
        float mound = exp(-distanceToPointer * 2.0) * u_pointer_active;
        float swell = sin(worldX * 1.55 + u_time * 0.42) * 0.105
                    + cos(worldZ * 1.38 - u_time * 0.34) * 0.09;
        float height = swell + ring * 0.28 + mound * 0.1066667;
        float tilt = 0.35;
        float depth = 8.2 - cos(tilt) * worldZ - sin(tilt) * height;
        float viewY = cos(tilt) * height - sin(tilt) * worldZ;
        float focal = 10.0;
        vec2 projected = vec2(worldX / depth * focal / aspect, viewY / depth * focal + 0.10);
        gl_Position = vec4(projected, 0.0, 1.0);
        float centerSize = 4.2 * exp(-distanceToPointer * 0.72) * u_pointer_active;
        float perspectiveSize = 11.0 / max(depth, 1.0);
        gl_PointSize = (0.62 + perspectiveSize * 1.15 + centerSize + abs(ring) * 0.26) * u_pixel_ratio * 0.66;
        v_ripple = clamp(abs(ring) * 0.7 + mound * 0.75, 0.0, 1.0);
        v_depth = depth;
      }
    `;
    const fragmentSource = `
      precision mediump float;
      varying float v_ripple;
      varying float v_depth;
      void main() {
        float edge = length(gl_PointCoord - vec2(0.5));
        if (edge > 0.5) discard;
        float fade = 1.0 - smoothstep(5.0, 12.0, v_depth);
        float alpha = (0.24 + fade * 0.16 + v_ripple * 0.36) * (1.0 - smoothstep(0.28, 0.5, edge));
        vec3 color = vec3(122.0, 20.0, 15.0) / 255.0;
        gl_FragColor = vec4(color, alpha);
      }
    `;
    const vertexShader = compile(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compile(gl.FRAGMENT_SHADER, fragmentSource);
    if (vertexShader && fragmentShader) {
      program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Point field program error:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        program = null;
      }
    }
    if (program) {
      uniform = {
        resolution: gl.getUniformLocation(program, 'u_resolution'),
        pointer: gl.getUniformLocation(program, 'u_pointer'),
        active: gl.getUniformLocation(program, 'u_pointer_active'),
        time: gl.getUniformLocation(program, 'u_time'),
        pixelRatio: gl.getUniformLocation(program, 'u_pixel_ratio'),
      };
      vertexBuffer = gl.createBuffer();
      gl.useProgram(program);
      const attribute = gl.getAttribLocation(program, 'a_vertex');
      gl.enableVertexAttribArray(attribute);
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.vertexAttribPointer(attribute, 3, gl.FLOAT, false, 0, 0);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
    }
  }

  const resize = () => {
    if (!canvas || !gl || !program) return;
    const width = Math.max(1, window.innerWidth);
    const height = Math.max(1, window.innerHeight);
    pixelRatio = Math.min(window.devicePixelRatio || 1, 1.6);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    gl.viewport(0, 0, canvas.width, canvas.height);
    const columns = Math.max(40, Math.min(264, Math.ceil(width / 7.5)));
    const rows = Math.max(40, Math.min(168, Math.ceil(height / 7)));
    const vertices = new Float32Array(columns * rows * 3);
    let offset = 0;
    for (let row = 0; row < rows; row += 1) {
      const y = (row / (rows - 1)) * 2 - 1;
      for (let column = 0; column < columns; column += 1) {
        const x = (column / (columns - 1)) * 2 - 1;
        const tint = ((column * 37 + row * 91) % 101) / 100;
        vertices[offset++] = x;
        vertices[offset++] = y;
        vertices[offset++] = tint;
      }
    }
    vertexCount = columns * rows;
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    requestRender();
  };

  const layoutOrbitWords = () => {
    const field = document.querySelector('.hero-orbit-words');
    if (!field || !orbitWords.length) return;
    const width = field.clientWidth;
    const height = field.clientHeight;
    if (width < 1 || height < 1) return;
    const seedText = `${width}x${height}`;
    let seed = 2166136261;
    for (const char of seedText) { seed ^= char.charCodeAt(0); seed = Math.imul(seed, 16777619); }
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    const placed = [];
    const scrambled = [...orbitWords].sort(() => random() - 0.5);
    const shuffled = [...scrambled.filter((w) => w.element.classList.contains('is-chip')), ...scrambled.filter((w) => !w.element.classList.contains('is-chip'))];
    const floatClearance = window.matchMedia('(max-width:720px)').matches ? 10 : 26;
    // 带框徽章需要干净的落点：把首屏文案与右侧卡片当作禁区
    const fieldRect = field.getBoundingClientRect();
    const obstacles = ['.site-header', '.hero-copy', '.hero-aside'].reduce((list, selector) => {
      const node = hero.querySelector(selector);
      if (!node) return list;
      const rect = node.getBoundingClientRect();
      if (!rect.width || !rect.height) return list;
      list.push({
        x: rect.left - fieldRect.left - 18,
        y: rect.top - fieldRect.top - 18,
        right: rect.right - fieldRect.left + 18,
        bottom: rect.bottom - fieldRect.top + 18,
      });
      return list;
    }, []);
    for (const word of shuffled) {
      const element = word.element;
      element.style.transform = 'none';
      element.style.setProperty('--scatter-x', '0px');
      element.style.setProperty('--scatter-y', '0px');
      const w = element.offsetWidth;
      const h = element.offsetHeight;
      const angle = (parseFloat(word.angle) || 0) * Math.PI / 180;
      const rw = Math.abs(w * Math.cos(angle)) + Math.abs(h * Math.sin(angle));
      const rh = Math.abs(w * Math.sin(angle)) + Math.abs(h * Math.cos(angle));
      const isChip = element.classList.contains('is-chip');
      const clearance = isChip ? 42 : floatClearance;
      const fits = (box) => placed.every((other) => box.right <= other.x || box.x >= other.right || box.bottom <= other.y || box.y >= other.bottom)
        && (!isChip || obstacles.every((zone) => box.right <= zone.x || box.x >= zone.right || box.bottom <= zone.y || box.y >= zone.bottom));
      let chosen = null;
      for (let attempt = 0; attempt < 360; attempt += 1) {
        const x = Math.round(random() * Math.max(0, width - rw));
        const y = Math.round(random() * Math.max(0, height - rh));
        const box = { x: x - clearance, y: y - clearance, right: x + rw + clearance, bottom: y + rh + clearance };
        if (fits(box)) {
          chosen = { x: x + (rw - w) / 2, y: y + (rh - h) / 2, box, rw, rh };
          break;
        }
      }
      if (!chosen && isChip) {
        // 徽章退到首屏顶部空带：留出顶栏高度与整体漂浮位移，避免被导航遮住
        const driftPad = 42;
        const copyNode = hero.querySelector('.hero-copy');
        const copyTop = copyNode ? copyNode.getBoundingClientRect().top - fieldRect.top : height;
        const header = document.querySelector('.site-header');
        const headerBottom = header ? header.getBoundingClientRect().bottom - fieldRect.top : 0;
        const bandTop = Math.max(46, Math.round(headerBottom) + 14);
        const bandBottom = Math.max(bandTop, Math.min(height - rh - driftPad, copyTop - rh - driftPad));
        for (let attempt = 0; attempt < 240; attempt += 1) {
          const x = Math.round(random() * Math.max(0, width - rw));
          const y = Math.round(bandTop + random() * Math.max(0, bandBottom - bandTop));
          const box = { x: x - clearance, y: y - clearance, right: x + rw + clearance, bottom: y + rh + clearance };
          if (fits(box)) { chosen = { x: x + (rw - w) / 2, y: y + (rh - h) / 2, box, rw, rh }; break; }
        }
      }
      if (!chosen) {
        const cols = Math.max(2, Math.ceil(Math.sqrt(orbitWords.length * width / Math.max(height, 1))));
        const row = placed.length % Math.ceil(orbitWords.length / cols);
        const col = placed.length % cols;
        const x = Math.max(0, Math.min(width - rw, (col + random() * 0.12) * width / cols));
        const y = Math.max(0, Math.min(height - rh, (row + random() * 0.12) * height / Math.ceil(orbitWords.length / cols)));
        chosen = { x: x + (rw - w) / 2, y: y + (rh - h) / 2, rw, rh, box: { x: x - floatClearance, y: y - floatClearance, right: x + rw + floatClearance, bottom: y + rh + floatClearance } };
      }
      element.style.setProperty('--scatter-x', `${chosen.x}px`);
      element.style.setProperty('--scatter-y', `${chosen.y}px`);
      placed.push(chosen.box);
      word.x = word.y = word.vx = word.vy = 0;
    }
  };
  const renderWords = () => {
    if (!hero || !orbitWords.length) return;
    const heroBounds = hero.getBoundingClientRect();
    const now = performance.now() * 0.001;
    const repelRadius = 196;
    for (const word of orbitWords) {
      const anchorX = heroBounds.left + word.element.offsetLeft + word.element.offsetWidth / 2;
      const anchorY = heroBounds.top + word.element.offsetTop + word.element.offsetHeight / 2;
      let targetX = Math.cos(now * 0.78 + word.index * 1.7) * 10;
      let targetY = Math.sin(now * 0.61 + word.index * 2.3) * 12;
      if (motionPreference.matches) {
        word.x = 0;
        word.y = 0;
        word.vx = 0;
        word.vy = 0;
        word.element.style.transform = `rotate(${word.angle})`;
        continue;
      }
      if (pointer.active && finePointer.matches) {
        const dx = anchorX - pointer.x * window.innerWidth;
        const dy = anchorY - pointer.y * window.innerHeight;
        const distance = Math.hypot(dx, dy);
        if (distance < repelRadius) {
          const angle = distance > 0.001 ? Math.atan2(dy, dx) : word.index * 2.399;
          const intensity = ((repelRadius - distance) / repelRadius) ** 2;
          const force = 30 * intensity;
          targetX = Math.cos(angle) * force;
          targetY = Math.sin(angle) * force;
        }
      }
      word.vx = (word.vx + (targetX - word.x) * 0.17) * 0.73;
      word.vy = (word.vy + (targetY - word.y) * 0.17) * 0.73;
      const nextX = word.x + word.vx;
      const nextY = word.y + word.vy;
      const left = word.element.offsetLeft + nextX;
      const top = word.element.offsetTop + nextY;
      const collides = orbitWords.some((other) => {
        if (other === word) return false;
        const otherLeft = other.element.offsetLeft + other.x;
        const otherTop = other.element.offsetTop + other.y;
        return left < otherLeft + other.element.offsetWidth + 5
          && left + word.element.offsetWidth + 5 > otherLeft
          && top < otherTop + other.element.offsetHeight + 5
          && top + word.element.offsetHeight + 5 > otherTop;
      });
      if (!collides) { word.x = nextX; word.y = nextY; }
      else { word.vx *= -0.25; word.vy *= -0.25; }
      const wobble = Math.sin(now * 0.85 + word.index * 2.6) * 2.4;
      word.element.style.transform = `translate3d(${word.x.toFixed(2)}px, ${word.y.toFixed(2)}px, 0) rotate(${(parseFloat(word.angle) || 0) + wobble}deg)`;
    }
  };

  const draw = (time = 0) => {
    if (gl && program) {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniform2f(uniform.resolution, canvas.width / pixelRatio, canvas.height / pixelRatio);
      gl.uniform2f(uniform.pointer, pointer.x, pointer.y);
      gl.uniform1f(uniform.active, pointer.active ? 1 : 0);
      gl.uniform1f(uniform.time, time * 0.00055);
      gl.uniform1f(uniform.pixelRatio, pixelRatio);
      gl.drawArrays(gl.POINTS, 0, vertexCount);
    }
    renderWords();
  };

  const animate = (time) => {
    frame = 0;
    draw(time);
    if (!motionPreference.matches && !document.hidden) frame = window.requestAnimationFrame(animate);
  };
  function requestRender() {
    if (!frame && !document.hidden) frame = window.requestAnimationFrame(animate);
  }

  window.addEventListener('resize', resize, { passive: true });
  let wordLayoutTimer = 0;
  window.addEventListener('resize', () => {
    window.clearTimeout(wordLayoutTimer);
    wordLayoutTimer = window.setTimeout(() => { layoutOrbitWords(); requestRender(); }, 140);
  }, { passive: true });
  layoutOrbitWords();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { layoutOrbitWords(); requestRender(); });
  window.addEventListener('scroll', requestRender, { passive: true });
  window.addEventListener('pointermove', (event) => {
    if (!finePointer.matches || event.pointerType === 'touch') return;
    pointer.x = event.clientX / Math.max(1, window.innerWidth);
    pointer.y = event.clientY / Math.max(1, window.innerHeight);
    pointer.active = true;
    requestRender();
  }, { passive: true });
  window.addEventListener('pointerout', (event) => {
    if (!event.relatedTarget) {
      pointer.active = false;
      requestRender();
    }
  }, { passive: true });
  window.addEventListener('blur', () => { pointer.active = false; requestRender(); }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      window.cancelAnimationFrame(frame);
      frame = 0;
    } else requestRender();
  });
  motionPreference.addEventListener?.('change', () => {
    window.cancelAnimationFrame(frame);
    frame = 0;
    if (motionPreference.matches) draw(performance.now());
    else requestRender();
  });
  resize();
  requestRender();
})();

const returnToTopControls = document.querySelectorAll('.footer-line a[href="#top"], #back-to-top-button');
returnToTopControls.forEach((control) => {
  control.addEventListener('click', (event) => {
    if (control.matches('a[href="#top"]')) {
      event.preventDefault();
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#top`);
    }
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
});

const backToTopButton = document.querySelector('#back-to-top-button');
if (backToTopButton) {
  const updateBackToTopButton = () => {
    const visible = window.scrollY > 320;
    backToTopButton.classList.toggle('is-visible', visible);
    backToTopButton.disabled = !visible;
    backToTopButton.setAttribute('aria-hidden', String(!visible));
  };
  window.addEventListener('scroll', updateBackToTopButton, { passive: true });
  updateBackToTopButton();
}

// 运营标签的底色光斑跟随指针，轻弹性强调悬停状态。
document.querySelectorAll('.hero-topics span, .tag-row span').forEach((tag) => {
  tag.addEventListener('pointermove', (event) => {
    const rect = tag.getBoundingClientRect();
    tag.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    tag.style.setProperty('--my', `${event.clientY - rect.top}px`);
  }, { passive: true });
});


// 页面文案编辑器：修改仅写入当前浏览器 localStorage，不会发送到服务器。
(() => {
  const toggle = document.getElementById('copy-editor-toggle');
  const panel = document.getElementById('copy-editor-panel');
  const status = document.getElementById('copy-editor-status');
  const done = document.getElementById('copy-editor-done');
  const exportButton = document.getElementById('copy-editor-export');
  const resetButton = document.getElementById('copy-editor-reset');
  const page = document.querySelector('main');
  if (!toggle || !panel || !status || !page) return;

  const storageKey = 'opsfolio-copy-edits-v1';
  const selector = [
    'header .brand > span:last-child', 'header #primary-nav a',
    'main h1', 'main h2', 'main h3', 'main h4', 'main h5', 'main h6',
    'main p', 'main li', 'main a', 'main figcaption', 'main time',
    'main small', 'main dt', 'main dd', 'main th', 'main td', 'main label',
    'main summary', 'main blockquote', 'main span:not(.dot):not(.eyebrow-line)',
    'main .section-index', 'main .case-meta', 'main .block-no',
    'main .case-number', 'main .category-num', 'main .hero-index',
    'main .hero-aside-bottom', 'main .number'
  ].join(',');
  const allowedTags = new Set(['BR', 'B', 'STRONG', 'EM', 'I', 'U', 'S', 'SMALL', 'SUB', 'SUP']);

  function escapeHtml(value) {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function sanitizeHtml(html, safeClasses = new Set()) {
    const root = document.createElement('div');
    root.innerHTML = String(html || '');
    const cleanNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) return escapeHtml(node.nodeValue || '');
      if (node.nodeType !== Node.ELEMENT_NODE) return '';
      const tag = node.tagName;
      if (tag === 'BR') return '<br />';
      const children = Array.from(node.childNodes).map(cleanNode).join('');
      if (tag === 'A') {
        const href = node.getAttribute('href') || '';
        const safeHref = /^(?:#|\/(?!\/)|https?:\/\/|mailto:|tel:)/i.test(href);
        return safeHref ? `<a href="${escapeHtml(href).replace(/\"/g, '&quot;')}">${children}</a>` : children;
      }
      if (tag === 'SPAN') {
        const classes = Array.from(node.classList).filter((name) => safeClasses.has(name));
        const classAttribute = classes.length ? ` class=\"${classes.join(' ')}\"` : '';
        return `<span${classAttribute}>${children}</span>`;
      }
      if (allowedTags.has(tag)) return `<${tag.toLowerCase()}>${children}</${tag.toLowerCase()}>`;
      if (tag === 'DIV' || tag === 'P') return children + (node.nextSibling ? '<br />' : '');
      return children;
    };
    return Array.from(root.childNodes).map(cleanNode).join('');
  }
  function plainText(html) {
    const node = document.createElement('div');
    node.innerHTML = sanitizeHtml(html);
    return (node.innerText || node.textContent || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function hashText(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  const occurrences = new Map();
  const candidates = Array.from(document.querySelectorAll(selector));
  const blockedInlineCopy = (element) => {
    const insideCopyBlock = element.closest('main p, main h1, main h2, main h3, main h4, main h5, main h6, main figcaption, main blockquote');
    if (element.matches('main span, main small')) return Boolean(insideCopyBlock || element.closest('main a'));
    return element.matches('main a') && Boolean(insideCopyBlock);
  };
  const eligibleCandidates = new Set(candidates.filter((element) => element.textContent.trim()
    && !element.closest('[aria-hidden="true"], button, input, select, textarea, .copy-editor')
    && !blockedInlineCopy(element)));
  const entries = Array.from(eligibleCandidates)
    .filter((element) => !Array.from(element.querySelectorAll(selector)).some((child) => eligibleCandidates.has(child)))
    .map((element) => {
      const safeClasses = new Set(Array.from(element.querySelectorAll('[class]')).flatMap((node) => Array.from(node.classList)));
      const originalHtml = sanitizeHtml(element.innerHTML, safeClasses);
      const originalText = plainText(originalHtml);
      const base = `${element.tagName.toLowerCase()}-${hashText(originalText)}`;
      const occurrence = occurrences.get(base) || 0;
      occurrences.set(base, occurrence + 1);
      const key = `${base}-${occurrence + 1}`;
      element.dataset.copyTarget = '';
      element.dataset.copyKey = key;
      return { element, key, originalHtml, originalText, safeClasses };
    });

  let stored = {};
  let storageAvailable = true;
  let editingMode = false;
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || '{}');
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) stored = parsed;
  } catch (error) {
    storageAvailable = false;
  }
  entries.forEach(({ element, key, safeClasses }) => {
    const saved = stored[key];
    if (saved && typeof saved.html === 'string') element.innerHTML = sanitizeHtml(saved.html, safeClasses);
  });

  const currentChanges = () => {
    const changes = [];
    entries.forEach(({ element, key, originalHtml, originalText, safeClasses }) => {
      const html = sanitizeHtml(element.innerHTML, safeClasses);
      if (html !== originalHtml) {
        changes.push({ key, original: originalText, updated: plainText(html), html });
      }
    });
    return changes;
  };
  const setStatus = (message) => { status.textContent = message; };
  function saveChanges() {
    const changes = currentChanges();
    const next = {};
    changes.forEach((change) => { next[change.key] = { html: change.html }; });
    try {
      if (Object.keys(next).length) localStorage.setItem(storageKey, JSON.stringify(next));
      else localStorage.removeItem(storageKey);
      stored = next;
      storageAvailable = true;
      setStatus(changes.length ? `已在当前浏览器保存 ${changes.length} 处修改` : '尚未修改');
    } catch (error) {
      storageAvailable = false;
      setStatus('修改暂未写入浏览器存储；请立即导出修改记录');
    }
  }
  function setEditMode(enabled) {
    editingMode = enabled;
    document.body.classList.toggle('copy-edit-mode', enabled);
    entries.forEach(({ element }) => {
      if (!enabled) element.removeAttribute('contenteditable');
    });
    if (!enabled && document.activeElement instanceof HTMLElement && document.activeElement.isContentEditable) {
      document.activeElement.blur();
    }
  }
  function openPanel(open) {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? '收起工具' : '编辑文案';
    setEditMode(open);
    if (open && !currentChanges().length) setStatus('点击页面中的标题或段落即可修改');
  }

  entries.forEach(({ element }) => {
    element.addEventListener('click', (event) => {
      if (!editingMode) return;
      event.preventDefault();
      event.stopPropagation();
      if (element.getAttribute('contenteditable') !== 'true') {
        entries.forEach(({ element: other }) => {
          if (other !== element) other.removeAttribute('contenteditable');
        });
        element.setAttribute('contenteditable', 'true');
        element.setAttribute('spellcheck', 'false');
        element.focus();
        const range = document.createRange();
        range.selectNodeContents(element);
        range.collapse(false);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }
    });
    element.addEventListener('input', saveChanges);
    element.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        element.blur();
        element.removeAttribute('contenteditable');
      }
    });
  });

  toggle.addEventListener('click', () => openPanel(panel.hidden));
  done?.addEventListener('click', () => {
    setEditMode(false);
    setStatus(currentChanges().length ? '修改已保存在当前浏览器；可导出后发回对话' : '尚未修改');
  });
  document.querySelector('#copy-editor-copy')?.addEventListener('click', async () => {
    const changes = currentChanges();
    if (!changes.length) {
      setStatus('当前没有修改记录可复制');
      return;
    }
    const payload = {
      format: 'opsfolio-copy-edits',
      version: 1,
      exportedAt: new Date().toISOString(),
      note: '本记录需由用户粘贴回对话，再同步到网页源码。',
      changes: changes.map(({ key, original, updated }) => ({ key, original, updated }))
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setStatus(`已复制 ${changes.length} 处修改记录；请粘贴到对话`);
    } catch (error) {
      setStatus('复制权限不可用；请改用“导出修改记录”并把 JSON 发回对话');
    }
  });
  exportButton?.addEventListener('click', () => {
    const changes = currentChanges();
    if (!changes.length) {
      setStatus('当前没有修改记录可导出');
      return;
    }
    const payload = {
      format: 'opsfolio-copy-edits',
      version: 1,
      exportedAt: new Date().toISOString(),
      note: '本文件由页面文案编辑器导出；需由用户发送回对话，再同步到网页源码。',
      changes: changes.map(({ key, original, updated }) => ({ key, original, updated }))
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.href = url;
    link.download = `opsfolio-copy-edits-${stamp}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus(`已导出 ${changes.length} 处修改；请把 JSON 文件发回对话`);
  });
  resetButton?.addEventListener('click', () => {
    if (!currentChanges().length) {
      setStatus('当前没有需要恢复的修改');
      return;
    }
    if (!window.confirm('恢复原稿会清除此浏览器保存的全部文案修改，是否继续？')) return;
    entries.forEach(({ element, originalHtml }) => {
      element.innerHTML = originalHtml;
      element.removeAttribute('contenteditable');
    });
    try { localStorage.removeItem(storageKey); } catch (error) { storageAvailable = false; }
    stored = {};
    setEditMode(false);
    setStatus('已恢复原稿');
  });

  if (currentChanges().length) setStatus(`已从当前浏览器恢复 ${currentChanges().length} 处修改`);
  else if (!storageAvailable) setStatus('此浏览器限制了本地存储；可编辑后直接导出修改记录');
})();

(() => {
  const viewport = document.querySelector('.egypt-gallery-viewport');
  const track = viewport?.querySelector('.image-grid-egypt');
  if (!viewport || !track || track.dataset.loopReady) return;
  track.dataset.loopReady = 'true';
  const originals = [...track.children];
  originals.forEach((tile) => {
    const clone = tile.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.querySelectorAll('a').forEach((link) => {
      link.removeAttribute('data-viewer');
      link.removeAttribute('href');
      link.setAttribute('tabindex', '-1');
    });
    clone.querySelectorAll('img').forEach((img) => img.setAttribute('alt', ''));
    track.appendChild(clone);
  });
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let half = 0;
  let lastTime = 0;
  let paused = false;
  let dragging = false;
  let startX = 0;
  let startScroll = 0;
  let dragged = false;
  const updateHalf = () => { half = track.scrollWidth / 2; };
  updateHalf();
  if ('ResizeObserver' in window) new ResizeObserver(updateHalf).observe(track);
  window.addEventListener('resize', updateHalf, { passive: true });
  const step = (time) => {
    if (lastTime && !paused && !dragging && !reduceMotion.matches && !document.hidden && half > 0) {
      viewport.scrollLeft += Math.min(40, time - lastTime) * 0.014;
      if (viewport.scrollLeft >= half) viewport.scrollLeft -= half;
    }
    lastTime = time;
    window.requestAnimationFrame(step);
  };
  window.requestAnimationFrame(step);
  viewport.addEventListener('mouseenter', () => { paused = true; });
  viewport.addEventListener('mouseleave', () => { paused = false; });
  viewport.addEventListener('focusin', () => { paused = true; });
  viewport.addEventListener('focusout', () => { paused = false; });
  viewport.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'touch') { paused = true; return; }
    if (event.button !== 0) return;
    dragging = true;
    dragged = false;
    startX = event.clientX;
    startScroll = viewport.scrollLeft;
    viewport.classList.add('is-dragging');
    viewport.setPointerCapture(event.pointerId);
  });
  viewport.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const delta = event.clientX - startX;
    if (Math.abs(delta) > 4) dragged = true;
    viewport.scrollLeft = startScroll - delta;
  });
  const finishDrag = () => {
    if (!dragging) return;
    dragging = false;
    viewport.classList.remove('is-dragging');
  };
  viewport.addEventListener('pointerup', finishDrag);
  viewport.addEventListener('pointercancel', finishDrag);
  viewport.addEventListener('pointerup', (event) => { if (event.pointerType === 'touch') paused = false; });
  viewport.addEventListener('pointercancel', (event) => { if (event.pointerType === 'touch') paused = false; });
  viewport.addEventListener('click', (event) => {
    if (!dragged) return;
    event.preventDefault();
    event.stopPropagation();
    dragged = false;
  }, true);
})();

(() => {
  const copy = document.querySelector('.egypt-grid .egypt-copy');
  const mockup = document.querySelector('.egypt-grid .egypt-mockup');
  if (!copy || !mockup) return;
  const syncHeight = () => {
    mockup.style.height = window.innerWidth <= 720 ? '340px' : `${Math.round(copy.getBoundingClientRect().height)}px`;
  };
  syncHeight();
  if ('ResizeObserver' in window) new ResizeObserver(syncHeight).observe(copy);
  window.addEventListener('resize', syncHeight, { passive: true });
})();
