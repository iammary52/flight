import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";

const canvas = document.querySelector("#scene");
const scoreLabel = document.querySelector("#scoreLabel");
const speedLabel = document.querySelector("#speedLabel");
const altitudeLabel = document.querySelector("#altitudeLabel");
const shieldLabel = document.querySelector("#shieldLabel");
const musicLabel = document.querySelector("#musicLabel");
const startOverlay = document.querySelector("#startOverlay");
const startButton = document.querySelector("#startButton");

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xa9e8ff, 0.00028);

const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 6000);
const clock = new THREE.Clock();

scene.add(new THREE.HemisphereLight(0xeafaff, 0x438d74, 1.9));

const sunLight = new THREE.DirectionalLight(0xfff1c8, 2.55);
sunLight.position.set(-180, 260, 130);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.near = 10;
sunLight.shadow.camera.far = 700;
sunLight.shadow.camera.left = -260;
sunLight.shadow.camera.right = 260;
sunLight.shadow.camera.top = 260;
sunLight.shadow.camera.bottom = -260;
scene.add(sunLight);

const skyMaterial = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  uniforms: {
    topColor: { value: new THREE.Color(0x5fc8ff) },
    horizonColor: { value: new THREE.Color(0xc5f5ff) },
    bottomColor: { value: new THREE.Color(0xffffff) },
  },
  vertexShader: `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 topColor;
    uniform vec3 horizonColor;
    uniform vec3 bottomColor;
    varying vec3 vWorldPosition;
    void main() {
      float h = normalize(vWorldPosition).y * 0.5 + 0.5;
      vec3 color = mix(bottomColor, horizonColor, smoothstep(0.0, 0.46, h));
      color = mix(color, topColor, smoothstep(0.42, 1.0, h));
      gl_FragColor = vec4(color, 1.0);
    }
  `,
});
const skyDome = new THREE.Mesh(new THREE.SphereGeometry(2600, 48, 48), skyMaterial);
scene.add(skyDome);

const sun = new THREE.Mesh(
  new THREE.SphereGeometry(34, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0xfff0a6, transparent: true, opacity: 0.9 })
);
scene.add(sun);

const ocean = new THREE.Mesh(
  new THREE.CircleGeometry(2600, 160),
  new THREE.MeshStandardMaterial({
    color: 0x4eaee4,
    roughness: 0.18,
    metalness: 0.12,
    transparent: true,
    opacity: 0.96,
  })
);
ocean.rotation.x = -Math.PI / 2;
ocean.position.y = -10;
ocean.receiveShadow = true;
scene.add(ocean);

const world = new THREE.Group();
const cloudGroup = new THREE.Group();
const ringsGroup = new THREE.Group();
const enemyGroup = new THREE.Group();
const projectileGroup = new THREE.Group();
const fxGroup = new THREE.Group();
scene.add(world, cloudGroup, ringsGroup, enemyGroup, projectileGroup, fxGroup);

const islandMaterial = new THREE.MeshStandardMaterial({ color: 0x72c678, roughness: 0.92 });
const rockMaterial = new THREE.MeshStandardMaterial({ color: 0xc9b27d, roughness: 1 });

function randomAround(minRadius, maxRadius) {
  const radius = minRadius + Math.random() * (maxRadius - minRadius);
  const angle = Math.random() * Math.PI * 2;
  return new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
}

for (let i = 0; i < 54; i += 1) {
  const island = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(10 + Math.random() * 22, 26 + Math.random() * 32, 18 + Math.random() * 34, 9),
    rockMaterial
  );
  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(14 + Math.random() * 28, 16 + Math.random() * 30, 7 + Math.random() * 10, 12),
    islandMaterial
  );
  base.castShadow = true;
  base.receiveShadow = true;
  top.position.y = 11;
  top.castShadow = true;
  top.receiveShadow = true;
  island.add(base, top);

  for (let t = 0; t < 5 + Math.floor(Math.random() * 8); t += 1) {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.75, 4.8, 6),
      new THREE.MeshStandardMaterial({ color: 0x725333, roughness: 1 })
    );
    const leaves = new THREE.Mesh(
      new THREE.ConeGeometry(2.4, 5.8, 8),
      new THREE.MeshStandardMaterial({ color: 0x479f67, roughness: 0.96 })
    );
    trunk.position.y = 4;
    leaves.position.y = 8;
    tree.add(trunk, leaves);
    tree.position.set((Math.random() - 0.5) * 18, 8, (Math.random() - 0.5) * 18);
    island.add(tree);
  }

  const pos = randomAround(100, 1550);
  island.position.set(pos.x, -8 + Math.random() * 4, pos.z);
  island.rotation.y = Math.random() * Math.PI;
  world.add(island);
}

function makeCloud() {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xe8fbff,
    emissiveIntensity: 0.16,
    roughness: 1,
    transparent: true,
    opacity: 0.88,
  });

  const count = 4 + Math.floor(Math.random() * 6);
  for (let i = 0; i < count; i += 1) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(7 + Math.random() * 12, 18, 18), material);
    puff.position.set((Math.random() - 0.5) * 28, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 16);
    puff.scale.y = 0.55 + Math.random() * 0.45;
    group.add(puff);
  }
  return group;
}

for (let i = 0; i < 95; i += 1) {
  const cloud = makeCloud();
  cloud.position.set((Math.random() - 0.5) * 3100, 70 + Math.random() * 190, (Math.random() - 0.5) * 3100);
  cloud.userData.drift = 1.8 + Math.random() * 6;
  cloudGroup.add(cloud);
}

const aircraft = new THREE.Group();
const aircraftMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f7f1, roughness: 0.46, metalness: 0.28 });
const wingMaterial = new THREE.MeshStandardMaterial({ color: 0xffb13d, roughness: 0.48, metalness: 0.18 });
const glassMaterial = new THREE.MeshStandardMaterial({
  color: 0x58c9ff,
  roughness: 0.14,
  metalness: 0.25,
  transparent: true,
  opacity: 0.88,
});

const fuselage = new THREE.Mesh(new THREE.CapsuleGeometry(1.35, 8.8, 6, 14), aircraftMaterial);
fuselage.rotation.z = Math.PI / 2;
fuselage.castShadow = true;
const cockpit = new THREE.Mesh(new THREE.SphereGeometry(1.45, 18, 18), glassMaterial);
cockpit.position.set(2, 0.78, 0);
cockpit.scale.set(1.18, 0.74, 0.8);
const mainWing = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.25, 14.8), wingMaterial);
const tailWing = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.18, 5.2), wingMaterial);
tailWing.position.set(-4.25, 1.16, 0);
const tailFin = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.8, 0.18), wingMaterial);
tailFin.position.set(-4.42, 2, 0);
const propeller = new THREE.Mesh(
  new THREE.BoxGeometry(0.16, 5.8, 0.2),
  new THREE.MeshStandardMaterial({ color: 0x202020, roughness: 0.3, metalness: 0.35, transparent: true, opacity: 0.82 })
);
propeller.position.set(5.52, 0, 0);
aircraft.add(fuselage, cockpit, mainWing, tailWing, tailFin, propeller);
aircraft.position.set(0, 52, 0);
scene.add(aircraft);

const trailMaterial = new THREE.MeshBasicMaterial({ color: 0xfff2a8, transparent: true, opacity: 0.38 });
const trailLeft = new THREE.Mesh(new THREE.ConeGeometry(0.22, 4.5, 10), trailMaterial);
const trailRight = trailLeft.clone();
trailLeft.position.set(-4.8, -0.1, -2.6);
trailRight.position.set(-4.8, -0.1, 2.6);
trailLeft.rotation.z = Math.PI / 2;
trailRight.rotation.z = Math.PI / 2;
aircraft.add(trailLeft, trailRight);

const controls = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
  Space: false,
  KeyZ: false,
  KeyX: false,
};

const flight = {
  speed: 34,
  targetSpeed: 34,
  heading: 0,
  pitch: 0.03,
  roll: 0,
  altitudeFloor: 10,
  altitudeCeiling: 420,
};

const game = {
  started: false,
  score: 0,
  shield: 100,
  shots: [],
  enemies: [],
  rings: [],
  particles: [],
  fireCooldown: 0,
  spawnTimer: 0,
  hitFlash: 0,
};

let musicSystem = null;
let musicEnabled = false;
let starting = false;

function lerp(current, target, alpha) {
  return current + (target - current) * Math.min(alpha, 1);
}

function forwardVector() {
  return new THREE.Vector3(Math.cos(flight.heading), Math.sin(flight.pitch) * 0.42, Math.sin(flight.heading)).normalize();
}

function rightVector() {
  return new THREE.Vector3(Math.sin(flight.heading), 0, -Math.cos(flight.heading)).normalize();
}

function createEnemy(position) {
  const group = new THREE.Group();

  const skin = new THREE.MeshStandardMaterial({ color: 0xffd46b, roughness: 0.75 });
  const red = new THREE.MeshStandardMaterial({ color: 0xe6463d, roughness: 0.62 });
  const shoe = new THREE.MeshStandardMaterial({ color: 0x603828, roughness: 0.72 });
  const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45 });
  const black = new THREE.MeshBasicMaterial({ color: 0x1f1f24 });
  const blue = new THREE.MeshStandardMaterial({ color: 0x2777d7, roughness: 0.58 });

  const head = new THREE.Mesh(new THREE.SphereGeometry(3.2, 24, 20), skin);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(3.35, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.52), red);
  const brim = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.45, 1.35), red);
  const body = new THREE.Mesh(new THREE.SphereGeometry(2.7, 18, 16), blue);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.68, 14, 12), skin);
  const eyeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), black);
  const eyeRight = eyeLeft.clone();
  const gloveLeft = new THREE.Mesh(new THREE.SphereGeometry(0.95, 14, 10), white);
  const gloveRight = gloveLeft.clone();
  const shoeLeft = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.75, 2.1), shoe);
  const shoeRight = shoeLeft.clone();

  cap.position.y = 2.25;
  brim.position.set(2.25, 2.2, 0);
  body.position.y = -3.35;
  body.scale.set(0.92, 1.05, 0.92);
  nose.position.set(2.9, 0.1, 0);
  eyeLeft.position.set(2.55, 0.8, -0.82);
  eyeRight.position.set(2.55, 0.8, 0.82);
  gloveLeft.position.set(0.2, -3.1, -3.0);
  gloveRight.position.set(0.2, -3.1, 3.0);
  shoeLeft.position.set(-0.45, -5.95, -1.2);
  shoeRight.position.set(-0.45, -5.95, 1.2);

  group.add(head, cap, brim, body, nose, eyeLeft, eyeRight, gloveLeft, gloveRight, shoeLeft, shoeRight);
  group.scale.setScalar(0.72);
  group.position.copy(position);
  group.userData = {
    velocity: new THREE.Vector3(),
    wobble: Math.random() * 10,
    health: 2,
    bobBase: Math.random() * Math.PI * 2,
  };
  enemyGroup.add(group);
  game.enemies.push(group);
}

function createRing(position) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(12, 0.55, 12, 48),
    new THREE.MeshBasicMaterial({ color: 0x64f2b9, transparent: true, opacity: 0.72 })
  );
  ring.position.copy(position);
  ring.rotation.x = Math.PI / 2;
  ring.userData = { spin: 0.8 + Math.random() * 1.5 };
  ringsGroup.add(ring);
  game.rings.push(ring);
}

function seedActionObjects() {
  for (let i = 0; i < 8; i += 1) {
    const ahead = forwardVector().multiplyScalar(180 + i * 95);
    const side = rightVector().multiplyScalar((Math.random() - 0.5) * 210);
    createEnemy(aircraft.position.clone().add(ahead).add(side).add(new THREE.Vector3(0, Math.random() * 80 - 20, 0)));
  }

  for (let i = 0; i < 16; i += 1) {
    const pos = randomAround(140, 1400);
    createRing(new THREE.Vector3(pos.x, 36 + Math.random() * 190, pos.z));
  }
}

function shoot() {
  const forward = forwardVector();
  const right = rightVector();
  [-1, 1].forEach((side) => {
    const shot = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.24, 7.5, 4, 8),
      new THREE.MeshBasicMaterial({ color: 0x8ff8ff })
    );
    shot.position.copy(aircraft.position).add(forward.clone().multiplyScalar(8)).add(right.clone().multiplyScalar(side * 2.8));
    shot.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), forward);
    shot.userData = {
      velocity: forward.clone().multiplyScalar(230),
      life: 1.35,
    };
    projectileGroup.add(shot);
    game.shots.push(shot);
  });
}

function burst(position, color = 0xffd15a) {
  for (let i = 0; i < 16; i += 1) {
    const particle = new THREE.Mesh(
      new THREE.SphereGeometry(0.55 + Math.random() * 0.8, 8, 8),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 })
    );
    particle.position.copy(position);
    particle.userData = {
      velocity: new THREE.Vector3((Math.random() - 0.5) * 60, (Math.random() - 0.2) * 45, (Math.random() - 0.5) * 60),
      life: 0.55 + Math.random() * 0.45,
    };
    fxGroup.add(particle);
    game.particles.push(particle);
  }
}

function createMusicSystem() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error("Web Audio is not supported in this browser.");
  }

  const audioContext = new AudioContextClass();
  const master = audioContext.createGain();
  master.gain.value = 0.0001;
  master.connect(audioContext.destination);

  const melodyGain = audioContext.createGain();
  const bassGain = audioContext.createGain();
  const drumGain = audioContext.createGain();
  melodyGain.gain.value = 0.16;
  bassGain.gain.value = 0.12;
  drumGain.gain.value = 0.08;
  melodyGain.connect(master);
  bassGain.connect(master);
  drumGain.connect(master);

  const melody = [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880.0, 783.99];
  const bass = [130.81, 130.81, 174.61, 196.0];
  const startAt = audioContext.currentTime + 0.04;
  const step = 0.18;
  let tick = 0;

  function tone(type, freq, time, length, gain, destination) {
    const osc = audioContext.createOscillator();
    const env = audioContext.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    env.gain.setValueAtTime(0.0001, time);
    env.gain.linearRampToValueAtTime(gain, time + 0.018);
    env.gain.exponentialRampToValueAtTime(0.0001, time + length);
    osc.connect(env);
    env.connect(destination);
    osc.start(time);
    osc.stop(time + length + 0.03);
  }

  function blip(time, gain) {
    const osc = audioContext.createOscillator();
    const env = audioContext.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(90, time);
    osc.frequency.exponentialRampToValueAtTime(46, time + 0.08);
    env.gain.setValueAtTime(gain, time);
    env.gain.exponentialRampToValueAtTime(0.0001, time + 0.09);
    osc.connect(env);
    env.connect(drumGain);
    osc.start(time);
    osc.stop(time + 0.1);
  }

  function scheduleUntil(horizon) {
    while (startAt + tick * step < horizon) {
      const time = startAt + tick * step;
      if (tick % 2 === 0) tone("square", melody[(tick / 2) % melody.length], time, 0.11, 0.05, melodyGain);
      if (tick % 4 === 0) tone("triangle", bass[(tick / 4) % bass.length], time, 0.18, 0.08, bassGain);
      if (tick % 4 === 0 || tick % 4 === 2) blip(time, tick % 8 === 0 ? 0.12 : 0.055);
      tick += 1;
    }
  }

  scheduleUntil(audioContext.currentTime + 1.8);
  const scheduler = window.setInterval(() => {
    scheduleUntil(audioContext.currentTime + 1.8);
  }, 450);

  return {
    audioContext,
    scheduler,
    setEnabled(enabled) {
      musicEnabled = enabled;
      master.gain.cancelScheduledValues(audioContext.currentTime);
      master.gain.setValueAtTime(master.gain.value, audioContext.currentTime);
      master.gain.linearRampToValueAtTime(enabled ? 0.32 : 0.0001, audioContext.currentTime + 0.18);
      musicLabel.textContent = enabled ? "Music on" : "Music muted";
    },
  };
}

async function startExperience() {
  if (starting) return;
  starting = true;
  startOverlay.classList.add("hidden");

  try {
    if (!musicSystem) musicSystem = createMusicSystem();
    if (musicSystem.audioContext.state === "suspended") await musicSystem.audioContext.resume();
    musicSystem.setEnabled(true);
  } catch (error) {
    musicLabel.textContent = "Music unavailable";
    console.warn("Audio start failed; continuing without music.", error);
  }

  if (!game.started) {
    seedActionObjects();
    game.started = true;
  }

  starting = false;
}

startButton.addEventListener("click", (event) => {
  event.preventDefault();
  startExperience();
});

startButton.addEventListener("pointerup", (event) => {
  event.preventDefault();
  startExperience();
});

window.addEventListener("keydown", (event) => {
  if (event.code in controls) {
    controls[event.code] = true;
    event.preventDefault();
  }
  if (event.code === "KeyM" && musicSystem) musicSystem.setEnabled(!musicEnabled);
});

window.addEventListener("keyup", (event) => {
  if (event.code in controls) {
    controls[event.code] = false;
    event.preventDefault();
  }
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function updateFlight(delta, elapsed) {
  const climbIntent = (controls.ArrowUp ? 1 : 0) - (controls.ArrowDown ? 1 : 0);
  const turnIntent = (controls.ArrowRight ? 1 : 0) - (controls.ArrowLeft ? 1 : 0);
  const boost = controls.Space ? 1 : 0;

  flight.targetSpeed = boost ? 62 : 38;
  flight.speed = lerp(flight.speed, flight.targetSpeed, delta * 1.8);
  flight.pitch = lerp(flight.pitch, climbIntent * 0.36, delta * 2.8);
  flight.roll = lerp(flight.roll, -turnIntent * 0.64, delta * 4.2);
  flight.heading += turnIntent * delta * (0.92 + flight.speed * 0.007);

  const forward = forwardVector();
  aircraft.position.addScaledVector(forward, flight.speed * delta);
  aircraft.position.y = THREE.MathUtils.clamp(aircraft.position.y, flight.altitudeFloor, flight.altitudeCeiling);

  const wave = Math.sin(elapsed * 2.1) * 0.018;
  aircraft.rotation.set(flight.pitch * 0.74 + wave, -flight.heading, flight.roll + wave * 0.65);
  propeller.rotation.x += delta * (boost ? 90 : 58);
  trailLeft.scale.setScalar(boost ? 1.45 : 0.75);
  trailRight.scale.setScalar(boost ? 1.45 : 0.75);

  const right = rightVector();
  const cameraTarget = aircraft.position
    .clone()
    .add(forward.clone().multiplyScalar(-18))
    .add(new THREE.Vector3(0, 5.8 + Math.sin(elapsed * 1.7) * 0.35, 0))
    .add(right.clone().multiplyScalar(-flight.roll * 4));
  camera.position.lerp(cameraTarget, delta * 4.2);
  camera.lookAt(aircraft.position.clone().add(forward.clone().multiplyScalar(72)).add(new THREE.Vector3(0, 2.5, 0)));

  if (controls.KeyZ && game.fireCooldown <= 0) {
    shoot();
    game.fireCooldown = 0.14;
  }
  game.fireCooldown -= delta;
}

function updateEnemies(delta, elapsed) {
  game.spawnTimer -= delta;
  if (game.started && game.spawnTimer <= 0 && game.enemies.length < 12) {
    const pos = aircraft.position
      .clone()
      .add(forwardVector().multiplyScalar(260 + Math.random() * 260))
      .add(rightVector().multiplyScalar((Math.random() - 0.5) * 260))
      .add(new THREE.Vector3(0, Math.random() * 120 - 30, 0));
    createEnemy(pos);
    game.spawnTimer = 1.6;
  }

  for (let i = game.enemies.length - 1; i >= 0; i -= 1) {
    const enemy = game.enemies[i];
    const toPlane = aircraft.position.clone().sub(enemy.position);
    const distance = toPlane.length();
    const chase = toPlane.normalize().multiplyScalar(distance < 210 ? 24 : -10);
    const wobble = new THREE.Vector3(
      Math.sin(elapsed * 2 + enemy.userData.wobble) * 12,
      Math.cos(elapsed * 1.5 + enemy.userData.wobble) * 7,
      Math.cos(elapsed * 2.2 + enemy.userData.wobble) * 12
    );
    enemy.userData.velocity.lerp(chase.add(wobble), delta * 1.4);
    enemy.position.addScaledVector(enemy.userData.velocity, delta);
    enemy.rotation.y += delta * 2.2;
    enemy.rotation.z = Math.sin(elapsed * 3 + enemy.userData.wobble) * 0.35;

    if (distance < 11) {
      game.shield = Math.max(0, game.shield - 18);
      game.hitFlash = 0.25;
      burst(enemy.position, 0xff5a67);
      enemyGroup.remove(enemy);
      game.enemies.splice(i, 1);
    } else if (distance > 900) {
      enemyGroup.remove(enemy);
      game.enemies.splice(i, 1);
    }
  }
}

function updateShots(delta) {
  for (let i = game.shots.length - 1; i >= 0; i -= 1) {
    const shot = game.shots[i];
    shot.position.addScaledVector(shot.userData.velocity, delta);
    shot.userData.life -= delta;

    let removed = false;
    for (let j = game.enemies.length - 1; j >= 0; j -= 1) {
      const enemy = game.enemies[j];
      if (shot.position.distanceTo(enemy.position) < 6.4) {
        enemy.userData.health -= 1;
        burst(shot.position, 0x8ff8ff);
        projectileGroup.remove(shot);
        game.shots.splice(i, 1);
        removed = true;
        if (enemy.userData.health <= 0) {
          burst(enemy.position, 0xffcf4a);
          enemyGroup.remove(enemy);
          game.enemies.splice(j, 1);
          game.score += 120;
        }
        break;
      }
    }

    if (!removed && shot.userData.life <= 0) {
      projectileGroup.remove(shot);
      game.shots.splice(i, 1);
    }
  }
}

function updateRings(delta, elapsed) {
  if (game.rings.length < 18 && Math.random() < 0.015) {
    const pos = aircraft.position
      .clone()
      .add(forwardVector().multiplyScalar(250 + Math.random() * 500))
      .add(rightVector().multiplyScalar((Math.random() - 0.5) * 340));
    pos.y = THREE.MathUtils.clamp(40 + Math.random() * 230, 35, 280);
    createRing(pos);
  }

  for (let i = game.rings.length - 1; i >= 0; i -= 1) {
    const ring = game.rings[i];
    ring.rotation.z += delta * ring.userData.spin;
    ring.material.opacity = 0.55 + Math.sin(elapsed * 4 + i) * 0.18;
    const distance = ring.position.distanceTo(aircraft.position);
    if (distance < 14) {
      game.score += 50;
      game.shield = Math.min(100, game.shield + 6);
      burst(ring.position, 0x64f2b9);
      ringsGroup.remove(ring);
      game.rings.splice(i, 1);
    } else if (distance > 1100) {
      ringsGroup.remove(ring);
      game.rings.splice(i, 1);
    }
  }
}

function updateWorld(delta, elapsed) {
  ocean.material.color.offsetHSL(Math.sin(elapsed * 0.08) * 0.00015, 0, 0);
  ocean.rotation.z = Math.sin(elapsed * 0.08) * 0.018;

  cloudGroup.children.forEach((cloud, index) => {
    cloud.position.x += Math.sin(elapsed * 0.035 + index) * 0.02 * cloud.userData.drift;
    cloud.position.z += Math.cos(elapsed * 0.03 + index) * 0.018 * cloud.userData.drift;
  });

  for (let i = game.particles.length - 1; i >= 0; i -= 1) {
    const particle = game.particles[i];
    particle.position.addScaledVector(particle.userData.velocity, delta);
    particle.userData.life -= delta;
    particle.material.opacity = Math.max(0, particle.userData.life);
    if (particle.userData.life <= 0) {
      fxGroup.remove(particle);
      game.particles.splice(i, 1);
    }
  }

  skyDome.position.copy(aircraft.position);
  sun.position.set(aircraft.position.x - 430, aircraft.position.y + 265, aircraft.position.z - 720);
}

function updateHud() {
  scoreLabel.textContent = `Score ${game.score}`;
  speedLabel.textContent = `Speed ${Math.round(flight.speed * 5)}`;
  altitudeLabel.textContent = `Altitude ${Math.round(aircraft.position.y * 3)}`;
  shieldLabel.textContent = `Shield ${Math.round(game.shield)}`;
  shieldLabel.style.color = game.shield < 35 ? "var(--danger)" : "var(--ink)";

  if (game.shield <= 0) {
    game.shield = 100;
    game.score = Math.max(0, game.score - 250);
    burst(aircraft.position, 0xff5a67);
  }
}

function animate() {
  const delta = Math.min(clock.getDelta(), 0.033);
  const elapsed = clock.elapsedTime;

  updateFlight(delta, elapsed);
  updateEnemies(delta, elapsed);
  updateShots(delta);
  updateRings(delta, elapsed);
  updateWorld(delta, elapsed);
  updateHud();

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
