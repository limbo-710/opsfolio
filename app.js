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
  let ctx = null;
  let dots = [];
  let fieldW = 1;
  let fieldH = 1;
  let dotSprite = null;
  let pixelRatio = 1;
  let frame = 0;

  if (canvas) {
    ctx = canvas.getContext('2d', { alpha: true });
  }

  const DOT_RGB = [122, 20, 15];

  const resize = () => {
    if (!canvas || !ctx) return;
    const width = Math.max(1, window.innerWidth);
    const height = Math.max(1, window.innerHeight);
    pixelRatio = Math.min(window.devicePixelRatio || 1, 1.6);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    fieldW = width;
    fieldH = height;
    // 屏幕空间采样 + 反投影：先按“离画面中心越远越稀”的概率撒点，
    // 再把每个屏幕点反算成平面坐标，于是密度中心正好落在视口正中。
    const planAspect = width / Math.max(height, 1);
    const cellsX = Math.max(30, Math.round(width / 14));
    const cellsY = Math.max(22, Math.round(height / 14));
    const TILT = 0.35;
    const COS_T = Math.cos(TILT);
    const SIN_T = Math.sin(TILT);
    const FOCAL = 10;
    const A_FOCAL = SIN_T * FOCAL;
    const C_TILT = 8.2 / COS_T;
    dots = new Array(cellsX * cellsY);
    let index = 0;
    for (let row = 0; row < cellsY; row += 1) {
      for (let column = 0; column < cellsX; column += 1) {
        const seedA = ((column * 37 + row * 91 + 11) % 97) / 97;
        const seedB = ((column * 53 + row * 29 + 7) % 89) / 89;
        const seedC = ((column * 19 + row * 43 + 23) % 103) / 103;
        const su = (column + 0.5 + (seedA - 0.5) * 0.86) / cellsX;
        const sv = (row + 0.5 + (seedB - 0.5) * 0.86) / cellsY;
        const ndcX = su * 2 - 1;
        const ndcY = 1 - sv * 2;
        const radial = Math.sqrt(ndcX * ndcX * 0.92 + ndcY * ndcY * 0.92);
        if (seedC > 0.95 - 0.74 * Math.pow(Math.min(radial, 1.42), 1.25)) continue;
        const denom = (ndcY - 0.10) - A_FOCAL;
        const z = Math.max(-3.02, Math.min(2.06, (ndcY - 0.10) * C_TILT / denom));
        const depth0 = Math.max(1, 8.2 - COS_T * z);
        dots[index] = {
          wx: ndcX * depth0 * planAspect / FOCAL,
          wz: z,
          scale: 0.72 + seedA * 0.5,
        };
        index += 1;
      }
    }
    dots.length = index;
    // 圆点贴图：用一张离屏圆点做 drawImage，比逐点画圆快很多
    dotSprite = document.createElement('canvas');
    const spriteSize = Math.max(8, Math.round(8 * pixelRatio));
    dotSprite.width = spriteSize;
    dotSprite.height = spriteSize;
    const spriteCtx = dotSprite.getContext('2d');
    spriteCtx.fillStyle = `rgb(${DOT_RGB[0]},${DOT_RGB[1]},${DOT_RGB[2]})`;
    spriteCtx.beginPath();
    spriteCtx.arc(spriteSize / 2, spriteSize / 2, spriteSize / 2 - 1, 0, Math.PI * 2);
    spriteCtx.fill();
    requestRender();
  };

  const layoutOrbitWords = () => {
    const field = document.querySelector('.hero-orbit-words');
    if (!field || !orbitWords.length) return;
    // 词层铺满整个视口（含左右留白），而不是只占内容栏
    const heroRect = hero.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    field.style.setProperty('width', `${viewportWidth}px`, 'important');
    field.style.setProperty('left', `${-Math.round(heroRect.left)}px`, 'important');
    field.style.setProperty('right', 'auto', 'important');
    const width = field.clientWidth;
    const height = field.clientHeight;
    if (width < 1 || height < 1) return;
    const seedText = `${width}x${height}`;
    let seed = 2166136261;
    for (const char of seedText) { seed ^= char.charCodeAt(0); seed = Math.imul(seed, 16777619); }
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    const placed = [];
    const scrambled = [...orbitWords].sort(() => random() - 0.5);
    // 徽章先占位，避免被后放的普通词挤到别扭的位置
    const order = [...scrambled.filter((w) => w.element.classList.contains('is-chip')), ...scrambled.filter((w) => !w.element.classList.contains('is-chip'))];
    const fieldRect = field.getBoundingClientRect();
    // 等分格网：每个词只在自己的格子里抖动，保证四散、任何视口宽度都不会堆叠
    const cols = width < 760 ? 3 : width < 1100 ? 4 : width < 1500 ? 5 : 6;
    const rows = Math.ceil(order.length / cols);
    const cellW = width / cols;
    const cellH = height / rows;
    const headline = hero.querySelector('#hero-title');
    const headlineZone = headline ? (() => {
      const rect = headline.getBoundingClientRect();
      return {
        x: rect.left - fieldRect.left - 10,
        y: rect.top - fieldRect.top - 10,
        right: rect.right - fieldRect.left + 10,
        bottom: rect.bottom - fieldRect.top + 10,
      };
    })() : null;
    // 徽章压在大姓名上会糊成一团，仅这一处保留避让；其余正文随它叠（词层在文字之下）
    const hitsHeadline = (box) => headlineZone
      && !(box.right <= headlineZone.x || box.x >= headlineZone.right || box.bottom <= headlineZone.y || box.y >= headlineZone.bottom);
    order.forEach((word, slot) => {
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
      const padX = isChip ? 26 : Math.max(10, cellW * 0.05);
      const padY = isChip ? 22 : Math.max(8, cellH * 0.04);
      const cells = [];
      for (let i = slot; i < slot + cols * rows; i += 1) {
        const cellIndex = i % (cols * rows);
        cells.push([cellIndex % cols, Math.floor(cellIndex / cols)]);
      }
      let chosen = null;
      for (const [col, row] of cells) {
        const cellX = col * cellW;
        const cellY = row * cellH;
        const spanX = Math.max(0, cellW - rw - padX * 2);
        const spanY = Math.max(0, cellH - rh - padY * 2);
        for (let attempt = 0; attempt < 8; attempt += 1) {
          const x = Math.round(cellX + padX + random() * spanX);
          const y = Math.round(cellY + padY + random() * spanY);
          const box = { x, y, right: x + rw, bottom: y + rh };
          if (isChip && hitsHeadline(box)) continue;
          const clear = placed.every((other) => box.right <= other.x - 6 || box.x >= other.right + 6 || box.bottom <= other.y - 6 || box.y >= other.bottom + 6);
          if (clear) { chosen = { x: x + (rw - w) / 2, y: y + (rh - h) / 2, box, rw, rh }; break; }
        }
        if (chosen) break;
      }
      if (!chosen) {
        const col = slot % cols;
        const row = Math.floor(slot / cols) % rows;
        const x = Math.min(Math.max(0, col * cellW + padX), Math.max(0, width - rw));
        const y = Math.min(Math.max(0, row * cellH + padY), Math.max(0, height - rh));
        chosen = { x: x + (rw - w) / 2, y: y + (rh - h) / 2, box: { x, y, right: x + rw, bottom: y + rh }, rw, rh };
      }
      element.style.setProperty('--scatter-x', `${chosen.x}px`);
      element.style.setProperty('--scatter-y', `${chosen.y}px`);
      placed.push(chosen.box);
      word.x = word.y = word.vx = word.vy = 0;
    });
  };

  const renderWords = () => {
    if (!hero || !orbitWords.length) return;
    const fieldBounds = document.querySelector('.hero-orbit-words').getBoundingClientRect();
    const now = performance.now() * 0.001;
    const repelRadius = 280;
    for (const word of orbitWords) {
      const anchorX = fieldBounds.left + word.element.offsetLeft + word.element.offsetWidth / 2;
      const anchorY = fieldBounds.top + word.element.offsetTop + word.element.offsetHeight / 2;
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
      if (pointer.active) {
        const dx = anchorX - pointer.x * window.innerWidth;
        const dy = anchorY - pointer.y * window.innerHeight;
        const distance = Math.hypot(dx, dy);
        if (distance < repelRadius) {
          const angle = distance > 0.001 ? Math.atan2(dy, dx) : word.index * 2.399;
          const intensity = ((repelRadius - distance) / repelRadius) ** 2;
          const force = 88 * intensity;
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
    if (ctx && dots.length) {
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.clearRect(0, 0, fieldW, fieldH);
      const t = time * 0.00055;
      const aspect = fieldW / Math.max(fieldH, 1);
      const active = pointer.active ? 1 : 0;
      const mx = (pointer.x * 2 - 1) * aspect * 1.65;
      const my = (pointer.y - 0.5) * 6.0;
      // 整张点阵平面随鼠标轻微转动：左右偏航 + 上下俯仰
      const yaw = (pointer.x - 0.5) * 0.30 * (0.3 + 0.7 * active);
      const pitch = (pointer.y - 0.5) * 0.15 * (0.3 + 0.7 * active);
      const cy = Math.cos(yaw);
      const sy2 = Math.sin(yaw);
      const tilt = 0.35 + pitch;
      const cosT = Math.cos(tilt);
      const sinT = Math.sin(tilt);
      const focal = 10.0;
      let currentAlpha = -1;
      for (let i = 0; i < dots.length; i += 1) {
        const dot = dots[i];
        // 绕平面中心做偏航，让整面看起来是立体的
        const cz = dot.wz - 0.25;
        const rx = dot.wx * cy + cz * sy2;
        const rz = -dot.wx * sy2 + cz * cy + 0.25;
        const dx = rx - mx;
        const dz = rz - my;
        const distance = Math.sqrt(dx * dx + dz * dz);
        // 鼠标按下般的凹陷 + 向外推开；涟漪只在小范围内
        const press = Math.exp(-distance * distance * 1.5) * active;
        const ring = Math.sin(distance * 13.0 - t * 4.2) * Math.exp(-distance * 2.4) * active;
        const push = press * 0.34;
        const pushX = (distance > 0.001 ? dx / distance : 1) * push;
        const pushZ = (distance > 0.001 ? dz / distance : 0) * push;
        const height = Math.sin(rx * 1.55 + t * 0.42) * 0.1
                     + Math.cos(rz * 1.38 - t * 0.34) * 0.085
                     + ring * 0.13
                     - press * 0.2;
        const px = rx + pushX;
        const pz = rz + pushZ;
        const depth = 8.2 - cosT * pz - sinT * height;
        if (depth < 0.6) continue;
        const viewY = cosT * height - sinT * pz;
        const screenX = (px / depth * focal / aspect * 0.5 + 0.5) * fieldW;
        const screenY = (0.5 - (viewY / depth * focal + 0.10) * 0.5) * fieldH;
        if (screenX < -12 || screenX > fieldW + 12 || screenY < -12 || screenY > fieldH + 12) continue;
        const depthFade = 1 - Math.min(1, Math.max(0, (depth - 5) / 8));
        const alpha = 0.30 + depthFade * 0.18 + Math.min(1, Math.abs(ring) * 0.5 + press * 0.55) * 0.30;
        const bucket = Math.round(alpha * 20) / 20;
        if (bucket !== currentAlpha) {
          currentAlpha = bucket;
          ctx.globalAlpha = bucket;
        }
        const size = Math.max(1.5, (1.25 + 12 / Math.max(depth, 1) * 1.15 + press * 2.4 + Math.abs(ring) * 0.2) * dot.scale);
        if (dotSprite) ctx.drawImage(dotSprite, screenX - size / 2, screenY - size / 2, size, size);
        else ctx.fillRect(screenX - size / 2, screenY - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
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
    if (event.pointerType === 'touch') return;
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
