/* ==========================================================================
   Ananya Digital Studio — Unified Single-Loop WebGL 3D Module
   Exports:
     1. mountApertureStage3D  (Home Hero — Optical Camera Aperture & Frame)
     2. mountAdminSphere3D    (Admin Hub — Interactive 3D Activity Sphere)
   Guarantees <= 1 active WebGL rAF loop at a time, pixel-ratio cap,
   webglcontextlost/restored handling, off-screen IO pause, and full disposal.
   ========================================================================== */

let threePromise = null;
let activeLoopOwner = null;
const loopPausers = new Map();

function claimWebGLLoop(ownerId, pauseFn) {
  loopPausers.set(ownerId, pauseFn);
  if (activeLoopOwner && activeLoopOwner !== ownerId) {
    const prevPause = loopPausers.get(activeLoopOwner);
    if (typeof prevPause === 'function') prevPause(true);
  }
  activeLoopOwner = ownerId;
}

function releaseWebGLLoop(ownerId) {
  loopPausers.delete(ownerId);
  if (activeLoopOwner === ownerId) activeLoopOwner = null;
}

function detectTier() {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 'none';
  }
  try {
    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
    if (!gl) return 'none';
  } catch (_) {
    return 'none';
  }
  const w = window.innerWidth || 1024;
  const cores = navigator.hardwareConcurrency || 4;
  if (w < 680 || cores <= 4) return 'lite';
  if (w < 1100) return 'medium';
  return 'high';
}

function loadThree() {
  if (!threePromise) {
    threePromise = import('https://esm.sh/three@0.169.0');
  }
  return threePromise;
}

/* ==========================================================================
   1. HOME HERO — 3D Optical Camera Aperture & Archival Gallery Frame
   ========================================================================== */
export async function mountApertureStage3D(hostEl, initialPhotoUrl, callbacks = {}) {
  const tier = detectTier();
  if (tier === 'none' || !hostEl) {
    return { supported: false, setPhoto() {}, setPaused() {}, resetCamera() {}, dispose() {} };
  }

  let THREE;
  try {
    THREE = await loadThree();
  } catch (_) {
    return { supported: false, setPhoto() {}, setPaused() {}, resetCamera() {}, dispose() {} };
  }

  const ownerId = 'hero-aperture-' + Math.random().toString(36).slice(2, 8);
  const disposables = [];
  const track = (obj) => {
    if (obj) disposables.push(obj);
    return obj;
  };

  let width = Math.max(hostEl.clientWidth, 300);
  let height = Math.max(hostEl.clientHeight, 240);

  const renderer = new THREE.WebGLRenderer({
    antialias: tier !== 'lite',
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, tier === 'high' ? 2 : 1.5));
  renderer.setSize(width, height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  hostEl.innerHTML = '';
  hostEl.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 40);
  camera.position.set(0, 0.08, 6.2);

  scene.add(new THREE.AmbientLight(0xf7f5f2, 0.65));
  const keyLight = new THREE.DirectionalLight(0xffe8c2, 1.85);
  keyLight.position.set(4.5, 4.2, 5.5);
  scene.add(keyLight);

  const rimLight = new THREE.PointLight(0x8c1d35, 3.2, 14);
  rimLight.position.set(-4.2, -2.0, 3.0);
  scene.add(rimLight);

  const brassAccentLight = new THREE.PointLight(0xd2af70, 2.4, 12);
  brassAccentLight.position.set(3.4, -2.2, 3.8);
  scene.add(brassAccentLight);

  const rig = new THREE.Group();
  scene.add(rig);

  const darkMetalMat = track(new THREE.MeshStandardMaterial({ color: 0x1b1d21, metalness: 0.82, roughness: 0.32 }));
  const brassMat = track(new THREE.MeshStandardMaterial({ color: 0xd2af70, metalness: 0.88, roughness: 0.24 }));

  rig.add(new THREE.Mesh(track(new THREE.TorusGeometry(2.15, 0.085, 20, 72)), darkMetalMat));

  const brassRing = new THREE.Mesh(track(new THREE.TorusGeometry(2.02, 0.024, 14, 72)), brassMat);
  brassRing.position.z = 0.08;
  rig.add(brassRing);

  const innerRing = new THREE.Mesh(track(new THREE.TorusGeometry(1.66, 0.018, 12, 64)), brassMat);
  innerRing.position.z = -0.14;
  rig.add(innerRing);

  // 8-Blade Optical Iris
  const irisGroup = new THREE.Group();
  irisGroup.position.z = -0.05;
  rig.add(irisGroup);

  const bladeGeo = track(new THREE.BoxGeometry(0.92, 0.16, 0.028));
  const bladeMat = track(new THREE.MeshStandardMaterial({ color: 0x22252b, metalness: 0.78, roughness: 0.36 }));
  const blades = [];
  for (let i = 0; i < 8; i++) {
    const pivot = new THREE.Group();
    const angle = (i / 8) * Math.PI * 2;
    pivot.position.set(Math.cos(angle) * 1.88, Math.sin(angle) * 1.88, 0);
    pivot.rotation.z = angle + 0.56;
    const mesh = new THREE.Mesh(bladeGeo, bladeMat);
    mesh.position.x = -0.34;
    pivot.add(mesh);
    irisGroup.add(pivot);
    blades.push({ pivot, baseRot: angle + 0.56 });
  }

  // Floating Archival Photo Plate
  const frameGroup = new THREE.Group();
  frameGroup.position.z = 0.22;
  rig.add(frameGroup);

  const plateW = 2.68;
  const plateH = 1.72;
  const backingMesh = new THREE.Mesh(track(new THREE.BoxGeometry(plateW + 0.12, plateH + 0.12, 0.08)), darkMetalMat);
  backingMesh.position.z = -0.05;
  frameGroup.add(backingMesh);

  const bevelMesh = new THREE.Mesh(track(new THREE.BoxGeometry(plateW + 0.16, plateH + 0.16, 0.03)), brassMat);
  bevelMesh.position.z = -0.07;
  frameGroup.add(bevelMesh);

  const photoMat = track(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.42, metalness: 0.06 }));
  const photoMesh = new THREE.Mesh(track(new THREE.PlaneGeometry(plateW, plateH)), photoMat);
  photoMesh.position.z = 0.005;
  frameGroup.add(photoMesh);

  // Fresnel Rim Shader
  const fresnelMat = track(new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uColor: { value: new THREE.Color(0xd2af70) },
      uTime: { value: 0 }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPos;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewPos = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uTime;
      varying vec3 vNormal;
      varying vec3 vViewPos;
      void main() {
        float fresnel = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewPos))), 2.6);
        float pulse = 0.72 + 0.28 * sin(uTime * 1.15);
        gl_FragColor = vec4(uColor, fresnel * 0.34 * pulse);
      }
    `
  }));
  rig.add(new THREE.Mesh(track(new THREE.TorusGeometry(2.22, 0.12, 16, 64)), fresnelMat));

  // Instanced Brass Studio Motes (1 draw call)
  const moteCount = tier === 'lite' ? 24 : 42;
  const motes = new THREE.InstancedMesh(
    track(new THREE.SphereGeometry(0.022, 8, 8)),
    track(new THREE.MeshBasicMaterial({ color: 0xd2af70, transparent: true, opacity: 0.55 })),
    moteCount
  );
  const moteSeeds = [];
  const dummy = new THREE.Object3D();
  for (let i = 0; i < moteCount; i++) {
    moteSeeds.push({
      radius: 2.35 + Math.random() * 1.35,
      angle: (i / moteCount) * Math.PI * 2 + Math.random() * 0.5,
      y: (Math.random() - 0.5) * 2.5,
      speed: 0.12 + Math.random() * 0.18,
      scale: 0.6 + Math.random() * 1.1
    });
  }
  scene.add(motes);

  const texLoader = new THREE.TextureLoader();
  let currentTexture = null;

  function setPhoto(url) {
    if (!url) return;
    texLoader.load(url, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      if (currentTexture) currentTexture.dispose();
      currentTexture = tex;
      photoMat.map = tex;
      photoMat.needsUpdate = true;
    });
  }
  setPhoto(initialPhotoUrl);

  let targetRotY = -0.16;
  let targetRotX = 0.08;
  let curRotY = -0.16;
  let curRotX = 0.08;
  let isDragging = false;
  let lastX = 0;
  let lastY = 0;
  let isPaused = false;
  let isVisible = true;
  let isDocVisible = !document.hidden;
  let isContextLost = false;
  let isDisposed = false;
  let rafId = 0;
  let lastRenderTime = 0;
  const minFrameMs = tier === 'lite' ? 32 : 16;

  function onPointerDown(e) { isDragging = true; lastX = e.clientX; lastY = e.clientY; }
  function onPointerMove(e) {
    if (!isDragging) {
      const rect = hostEl.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && e.pointerType === 'mouse') {
        const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        targetRotY = Math.max(-0.46, Math.min(0.46, nx * 0.34));
        targetRotX = Math.max(-0.26, Math.min(0.26, ny * 0.2));
      }
      return;
    }
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    targetRotY = Math.max(-0.82, Math.min(0.82, targetRotY + dx * 0.0075));
    targetRotX = Math.max(-0.44, Math.min(0.44, targetRotX + dy * 0.0055));
  }
  function onPointerUp() { isDragging = false; }
  function onDoubleClick() { targetRotY = -0.14; targetRotX = 0.07; }
  function onResize() {
    if (isDisposed || !hostEl) return;
    width = Math.max(hostEl.clientWidth, 300);
    height = Math.max(hostEl.clientHeight, 240);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  function onVisibility() { isDocVisible = !document.hidden; schedule(); }
  function onContextLost(e) { e.preventDefault(); isContextLost = true; }
  function onContextRestored() { isContextLost = false; schedule(); }

  hostEl.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerup', onPointerUp, { passive: true });
  hostEl.addEventListener('dblclick', onDoubleClick);
  window.addEventListener('resize', onResize, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  renderer.domElement.addEventListener('webglcontextlost', onContextLost);
  renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

  const observer = new IntersectionObserver((entries) => {
    isVisible = !!(entries[0] && entries[0].isIntersecting);
    schedule();
  }, { threshold: 0.04 });
  observer.observe(hostEl);

  const clock = new THREE.Clock();

  function tick(now) {
    rafId = 0;
    if (isDisposed || isPaused || !isVisible || !isDocVisible || isContextLost) return;
    rafId = requestAnimationFrame(tick);
    if (now - lastRenderTime < minFrameMs) return;
    lastRenderTime = now;

    const t = clock.getElapsedTime();
    fresnelMat.uniforms.uTime.value = t;

    curRotY += (targetRotY + Math.sin(t * 0.45) * 0.08 - curRotY) * 0.07;
    curRotX += (targetRotX + Math.cos(t * 0.35) * 0.035 - curRotX) * 0.07;
    rig.rotation.y = curRotY;
    rig.rotation.x = curRotX;
    frameGroup.position.y = Math.sin(t * 0.85) * 0.05;

    const irisBreath = Math.sin(t * 0.65) * 0.09;
    irisGroup.rotation.z = t * 0.055;
    for (let i = 0; i < blades.length; i++) blades[i].pivot.rotation.z = blades[i].baseRot + irisBreath;

    for (let i = 0; i < moteCount; i++) {
      const m = moteSeeds[i];
      const a = m.angle + t * m.speed;
      dummy.position.set(Math.cos(a) * m.radius, m.y + Math.sin(t * 0.6 + i) * 0.14, Math.sin(a) * 0.9 - 0.5);
      dummy.scale.setScalar(m.scale);
      dummy.updateMatrix();
      motes.setMatrixAt(i, dummy.matrix);
    }
    motes.instanceMatrix.needsUpdate = true;
    renderer.render(scene, camera);
  }

  function schedule() {
    if (!rafId && !isDisposed && !isPaused && isVisible && isDocVisible && !isContextLost) {
      claimWebGLLoop(ownerId, (p) => { isPaused = p; });
      rafId = requestAnimationFrame(tick);
    }
  }

  renderer.render(scene, camera);
  schedule();
  if (typeof callbacks.onReady === 'function') callbacks.onReady();

  return {
    supported: true,
    setPhoto,
    setPaused(flag) { isPaused = !!flag; if (!isPaused) schedule(); },
    resetCamera() { onDoubleClick(); },
    dispose() {
      isDisposed = true;
      releaseWebGLLoop(ownerId);
      if (rafId) cancelAnimationFrame(rafId);
      observer.disconnect();
      hostEl.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      hostEl.removeEventListener('dblclick', onDoubleClick);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      if (currentTexture) currentTexture.dispose();
      for (const item of disposables) {
        if (item && typeof item.dispose === 'function') item.dispose();
      }
      renderer.dispose();
      if (renderer.domElement.parentNode === hostEl) hostEl.removeChild(renderer.domElement);
    }
  };
}

/* ==========================================================================
   2. ADMIN COMMAND CENTER — Interactive 3D Geodesic Studio Activity Sphere
   ========================================================================== */
export async function mountAdminSphere3D(hostEl, activityScore = 1) {
  const tier = detectTier();
  if (tier === 'none' || !hostEl) {
    return { supported: false, setActivity() {}, dispose() {} };
  }

  let THREE;
  try {
    THREE = await loadThree();
  } catch (_) {
    return { supported: false, setActivity() {}, dispose() {} };
  }

  const ownerId = 'admin-sphere-' + Math.random().toString(36).slice(2, 8);
  const disposables = [];
  const track = (obj) => {
    if (obj) disposables.push(obj);
    return obj;
  };

  let width = Math.max(hostEl.clientWidth, 180);
  let height = Math.max(hostEl.clientHeight, 180);

  const renderer = new THREE.WebGLRenderer({
    antialias: tier !== 'lite',
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, tier === 'high' ? 2 : 1.5));
  renderer.setSize(width, height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  hostEl.innerHTML = '';
  hostEl.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 30);
  camera.position.set(0, 0, 5.2);

  scene.add(new THREE.AmbientLight(0xf7f5f2, 0.7));
  const key = new THREE.DirectionalLight(0xd2af70, 2.0);
  key.position.set(3, 4, 4);
  scene.add(key);
  const rim = new THREE.PointLight(0x8c1d35, 3.4, 12);
  rim.position.set(-3.5, -2.5, 2.5);
  scene.add(rim);

  const rootGroup = new THREE.Group();
  scene.add(rootGroup);

  // Faceted obsidian core
  const coreMesh = new THREE.Mesh(
    track(new THREE.IcosahedronGeometry(1.08, 1)),
    track(new THREE.MeshStandardMaterial({
      color: 0x1b1d22,
      metalness: 0.75,
      roughness: 0.28,
      flatShading: true
    }))
  );
  rootGroup.add(coreMesh);

  // Outer brass geodesic wireframe + constellation points reusing geometry
  const wireGeo = track(new THREE.IcosahedronGeometry(1.42, 1));
  const wireMesh = new THREE.Mesh(
    wireGeo,
    track(new THREE.MeshBasicMaterial({ color: 0xd2af70, wireframe: true, transparent: true, opacity: 0.34 }))
  );
  rootGroup.add(wireMesh);

  const pointsMesh = new THREE.Points(
    wireGeo,
    track(new THREE.PointsMaterial({ color: 0xf7f5f2, size: 0.075, transparent: true, opacity: 0.9 }))
  );
  rootGroup.add(pointsMesh);

  // Two counter-rotating gyroscope rings
  const ring1 = new THREE.Mesh(
    track(new THREE.TorusGeometry(1.78, 0.022, 12, 64)),
    track(new THREE.MeshStandardMaterial({ color: 0xd2af70, metalness: 0.9, roughness: 0.22 }))
  );
  ring1.rotation.x = 1.15;
  rootGroup.add(ring1);

  const ring2 = new THREE.Mesh(
    track(new THREE.TorusGeometry(1.96, 0.018, 12, 64)),
    track(new THREE.MeshStandardMaterial({ color: 0x8c1d35, metalness: 0.6, roughness: 0.35 }))
  );
  ring2.rotation.y = 0.95;
  ring2.rotation.x = -0.55;
  rootGroup.add(ring2);

  // Instanced orbiting satellites (1 draw call)
  const satCount = 14;
  const sats = new THREE.InstancedMesh(
    track(new THREE.SphereGeometry(0.045, 10, 10)),
    track(new THREE.MeshBasicMaterial({ color: 0xd2af70 })),
    satCount
  );
  const satSeeds = [];
  const dummy = new THREE.Object3D();
  for (let i = 0; i < satCount; i++) {
    satSeeds.push({
      radius: 1.62 + (i % 3) * 0.24,
      angle: (i / satCount) * Math.PI * 2,
      tilt: ((i % 5) - 2) * 0.38,
      speed: 0.45 + (i % 4) * 0.14
    });
  }
  rootGroup.add(sats);

  let velY = 0.004;
  let velX = 0.0015;
  let speedFactor = Math.max(0.8, Math.min(2.2, 0.8 + activityScore * 0.05));
  let isDragging = false;
  let lastX = 0;
  let lastY = 0;
  let isPaused = false;
  let isVisible = true;
  let isDocVisible = !document.hidden;
  let isContextLost = false;
  let isDisposed = false;
  let rafId = 0;
  let lastRenderTime = 0;
  const minFrameMs = tier === 'lite' ? 32 : 16;

  function onDown(e) { isDragging = true; lastX = e.clientX; lastY = e.clientY; }
  function onMove(e) {
    if (!isDragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    velY = dx * 0.008;
    velX = dy * 0.006;
    rootGroup.rotation.y += velY;
    rootGroup.rotation.x += velX;
  }
  function onUp() { isDragging = false; }
  function onDbl() { velY = 0.065; velX = -0.02; }
  function onResize() {
    if (isDisposed || !hostEl) return;
    width = Math.max(hostEl.clientWidth, 180);
    height = Math.max(hostEl.clientHeight, 180);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  function onVisibility() { isDocVisible = !document.hidden; schedule(); }
  function onContextLost(e) { e.preventDefault(); isContextLost = true; }
  function onContextRestored() { isContextLost = false; schedule(); }

  hostEl.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerup', onUp, { passive: true });
  hostEl.addEventListener('dblclick', onDbl);
  window.addEventListener('resize', onResize, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  renderer.domElement.addEventListener('webglcontextlost', onContextLost);
  renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

  const observer = new IntersectionObserver((entries) => {
    isVisible = !!(entries[0] && entries[0].isIntersecting);
    schedule();
  }, { threshold: 0.05 });
  observer.observe(hostEl);

  const clock = new THREE.Clock();

  function tick(now) {
    rafId = 0;
    if (isDisposed || isPaused || !isVisible || !isDocVisible || isContextLost) return;
    rafId = requestAnimationFrame(tick);
    if (now - lastRenderTime < minFrameMs) return;
    lastRenderTime = now;

    const t = clock.getElapsedTime();
    if (!isDragging) {
      velY = velY * 0.96 + 0.0045 * speedFactor * 0.04;
      velX = velX * 0.95 + 0.0012 * 0.05;
      rootGroup.rotation.y += velY;
      rootGroup.rotation.x += velX;
    }

    const pulse = 1 + Math.sin(t * 1.4) * 0.04;
    coreMesh.scale.setScalar(pulse);
    ring1.rotation.z = t * 0.28 * speedFactor;
    ring2.rotation.z = -t * 0.22 * speedFactor;

    for (let i = 0; i < satCount; i++) {
      const s = satSeeds[i];
      const a = s.angle + t * s.speed * speedFactor;
      dummy.position.set(
        Math.cos(a) * s.radius,
        Math.sin(a) * Math.sin(s.tilt) * s.radius,
        Math.sin(a) * Math.cos(s.tilt) * s.radius
      );
      dummy.scale.setScalar(0.85 + Math.sin(t * 2 + i) * 0.25);
      dummy.updateMatrix();
      sats.setMatrixAt(i, dummy.matrix);
    }
    sats.instanceMatrix.needsUpdate = true;
    renderer.render(scene, camera);
  }

  function schedule() {
    if (!rafId && !isDisposed && !isPaused && isVisible && isDocVisible && !isContextLost) {
      claimWebGLLoop(ownerId, (p) => { isPaused = p; });
      rafId = requestAnimationFrame(tick);
    }
  }

  renderer.render(scene, camera);
  schedule();

  return {
    supported: true,
    setActivity(score) {
      speedFactor = Math.max(0.8, Math.min(2.4, 0.8 + Number(score || 0) * 0.05));
    },
    dispose() {
      isDisposed = true;
      releaseWebGLLoop(ownerId);
      if (rafId) cancelAnimationFrame(rafId);
      observer.disconnect();
      hostEl.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      hostEl.removeEventListener('dblclick', onDbl);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      for (const item of disposables) {
        if (item && typeof item.dispose === 'function') item.dispose();
      }
      renderer.dispose();
      if (renderer.domElement.parentNode === hostEl) hostEl.removeChild(renderer.domElement);
    }
  };
}
