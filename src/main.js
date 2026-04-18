import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";

const canvas = document.querySelector("#scene");
const speedLabel = document.querySelector("#speedLabel");
const altitudeLabel = document.querySelector("#altitudeLabel");
const musicLabel = document.querySelector("#musicLabel");
const startOverlay = document.querySelector("#startOverlay");
const startButton = document.querySelector("#startButton");

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xa9e8ff, 0.00032);

const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 5000);
camera.position.set(0, 18, 54);

const clock = new THREE.Clock();

const hemiLight = new THREE.HemisphereLight(0xdff6ff, 0x5b9070, 1.8);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight(0xfff5d9, 2.4);
sunLight.position.set(-150, 220, 120);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.near = 10;
sunLight.shadow.camera.far = 600;
sunLight.shadow.camera.left = -220;
sunLight.shadow.camera.right = 220;
sunLight.shadow.camera.top = 220;
sunLight.shadow.camera.bottom = -220;
scene.add(sunLight);

const skyGeometry = new THREE.SphereGeometry(2400, 48, 48);
const skyMaterial = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  uniforms: {
    topColor: { value: new THREE.Color(0x72cfff) },
    horizonColor: { value: new THREE.Color(0xcff6ff) },
    bottomColor: { value: new THREE.Color(0xf8fcff) },
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
      vec3 color = mix(bottomColor, horizonColor, smoothstep(0.0, 0.45, h));
      color = mix(color, topColor, smoothstep(0.45, 1.0, h));
      gl_FragColor = vec4(color, 1.0);
    }
  `,
});
const skyDome = new THREE.Mesh(skyGeometry, skyMaterial);
scene.add(skyDome);

const sun = new THREE.Mesh(
  new THREE.SphereGeometry(30, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0xffefb2, transparent: true, opacity: 0.9 })
);
sun.position.set(-420, 280, -700);
scene.add(sun);

const ocean = new THREE.Mesh(
  new THREE.CircleGeometry(2200, 128),
  new THREE.MeshStandardMaterial({
    color: 0x5eaee6,
    metalness: 0.08,
    roughness: 0.22,
    transparent: true,
    opacity: 0.96,
  })
);
ocean.rotation.x = -Math.PI / 2;
ocean.position.y = -8;
ocean.receiveShadow = true;
scene.add(ocean);

const world = new THREE.Group();
scene.add(world);

const islandMaterial = new THREE.MeshStandardMaterial({
  color: 0x7ec67c,
  roughness: 0.92,
  metalness: 0.02,
});

const rockMaterial = new THREE.MeshStandardMaterial({
  color: 0xd4be8e,
  roughness: 1,
  metalness: 0,
});

for (let i = 0; i < 40; i += 1) {
  const radius = 90 + Math.random() * 1200;
  const angle = Math.random() * Math.PI * 2;
  const island = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(8 + Math.random() * 20, 18 + Math.random() * 30, 10 + Math.random() * 28, 8),
    rockMaterial
  );
  base.castShadow = true;
  base.receiveShadow = true;
  island.add(base);

  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(10 + Math.random() * 25, 12 + Math.random() * 25, 5 + Math.random() * 10, 10),
    islandMaterial
  );
  top.position.y = 6 + Math.random() * 2;
  top.castShadow = true;
  top.receiveShadow = true;
  island.add(top);

  const treeCount = 3 + Math.floor(Math.random() * 6);
  for (let t = 0; t < treeCount; t += 1) {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.8, 5, 6),
      new THREE.MeshStandardMaterial({ color: 0x7b5a3c, roughness: 1 })
    );
    trunk.position.y = 4;

    const leaves = new THREE.Mesh(
      new THREE.ConeGeometry(2.8, 6 + Math.random() * 4, 8),
      new THREE.MeshStandardMaterial({ color: 0x5ea85b, roughness: 0.95 })
    );
    leaves.position.y = 8;

    tree.add(trunk);
    tree.add(leaves);
    tree.position.set((Math.random() - 0.5) * 14, 4, (Math.random() - 0.5) * 14);
    tree.rotation.y = Math.random() * Math.PI;
    island.add(tree);
  }

  island.position.set(Math.cos(angle) * radius, -4 + Math.random() * 5, Math.sin(angle) * radius);
  island.rotation.y = Math.random() * Math.PI;
  world.add(island);
}

const cloudGroup = new THREE.Group();
scene.add(cloudGroup);

function makeCloud() {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xdff5ff,
    emissiveIntensity: 0.14,
    roughness: 1,
    transparent: true,
    opacity: 0.9,
  });

  const puffCount = 4 + Math.floor(Math.random() * 5);
  for (let i = 0; i < puffCount; i += 1) {
    const puff = new THREE.Mesh(
      new THREE.SphereGeometry(6 + Math.random() * 10, 18, 18),
      material
    );
    puff.position.set((Math.random() - 0.5) * 24, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 12);
    puff.scale.y = 0.65 + Math.random() * 0.5;
    group.add(puff);
  }

  return group;
}

for (let i = 0; i < 80; i += 1) {
  const cloud = makeCloud();
  cloud.position.set((Math.random() - 0.5) * 2600, 70 + Math.random() * 160, (Math.random() - 0.5) * 2600);
  cloud.userData.drift = 2 + Math.random() * 6;
  cloudGroup.add(cloud);
}

const aircraft = new THREE.Group();

const fuselage = new THREE.Mesh(
  new THREE.CapsuleGeometry(1.4, 8, 5, 12),
  new THREE.MeshStandardMaterial({
    color: 0xfff6e0,
    roughness: 0.55,
    metalness: 0.25,
  })
);
fuselage.rotation.z = Math.PI / 2;
fuselage.castShadow = true;
aircraft.add(fuselage);

const cockpit = new THREE.Mesh(
  new THREE.SphereGeometry(1.45, 18, 18),
  new THREE.MeshStandardMaterial({
    color: 0x7ec9ff,
    roughness: 0.18,
    metalness: 0.2,
    transparent: true,
    opacity: 0.9,
  })
);
cockpit.position.set(1.8, 0.8, 0);
cockpit.scale.set(1.2, 0.8, 0.8);
aircraft.add(cockpit);

const wingMaterial = new THREE.MeshStandardMaterial({ color: 0xffb96c, roughness: 0.58, metalness: 0.16 });
const mainWing = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.25, 14), wingMaterial);
mainWing.castShadow = true;
aircraft.add(mainWing);

const tailWing = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.18, 5), wingMaterial);
tailWing.position.set(-4.1, 1.2, 0);
tailWing.castShadow = true;
aircraft.add(tailWing);

const tailFin = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.8, 0.18), wingMaterial);
tailFin.position.set(-4.3, 2.1, 0);
tailFin.castShadow = true;
aircraft.add(tailFin);

const propeller = new THREE.Mesh(
  new THREE.BoxGeometry(0.15, 5.4, 0.18),
  new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.4,
    metalness: 0.3,
    transparent: true,
    opacity: 0.9,
  })
);
propeller.position.set(5.4, 0, 0);
aircraft.add(propeller);

aircraft.position.set(0, 42, 0);
scene.add(aircraft);

const controls = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
  Space: false,
};

const flight = {
  speed: 26,
  targetSpeed: 26,
  heading: 0,
  pitch: 0.05,
  roll: 0,
  altitudeFloor: 8,
  altitudeCeiling: 320,
};

let musicSystem = null;
let musicEnabled = false;

function lerp(current, target, alpha) {
  return current + (target - current) * alpha;
}

function createMusicSystem() {
  const audioContext = new window.AudioContext();
  const master = audioContext.createGain();
  master.gain.value = 0.14;
  master.connect(audioContext.destination);

  const lowpass = audioContext.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 1600;
  lowpass.Q.value = 0.4;
  lowpass.connect(master);

  const padGain = audioContext.createGain();
  padGain.gain.value = 0.22;
  padGain.connect(lowpass);

  const melodyGain = audioContext.createGain();
  melodyGain.gain.value = 0.15;
  melodyGain.connect(lowpass);

  const notes = [220, 261.63, 329.63, 392.0, 440.0, 523.25];
  const bass = [55, 65.41, 82.41, 98.0];

  function scheduleLoop(startAt) {
    for (let bar = 0; bar < 8; bar += 1) {
      const time = startAt + bar * 2.6;
      const padOsc = audioContext.createOscillator();
      const padOsc2 = audioContext.createOscillator();
      const padEnvelope = audioContext.createGain();
      const base = notes[bar % notes.length];

      padOsc.type = "sine";
      padOsc2.type = "triangle";
      padOsc.frequency.setValueAtTime(base, time);
      padOsc2.frequency.setValueAtTime(base * 1.5, time);

      padEnvelope.gain.setValueAtTime(0.0001, time);
      padEnvelope.gain.linearRampToValueAtTime(0.18, time + 1.1);
      padEnvelope.gain.linearRampToValueAtTime(0.0001, time + 2.5);

      padOsc.connect(padEnvelope);
      padOsc2.connect(padEnvelope);
      padEnvelope.connect(padGain);

      padOsc.start(time);
      padOsc2.start(time);
      padOsc.stop(time + 2.6);
      padOsc2.stop(time + 2.6);

      const bassOsc = audioContext.createOscillator();
      const bassEnvelope = audioContext.createGain();
      bassOsc.type = "sawtooth";
      bassOsc.frequency.setValueAtTime(bass[bar % bass.length], time);
      bassEnvelope.gain.setValueAtTime(0.0001, time);
      bassEnvelope.gain.linearRampToValueAtTime(0.06, time + 0.08);
      bassEnvelope.gain.exponentialRampToValueAtTime(0.0001, time + 2.0);
      bassOsc.connect(bassEnvelope);
      bassEnvelope.connect(melodyGain);
      bassOsc.start(time);
      bassOsc.stop(time + 2.1);

      for (let step = 0; step < 3; step += 1) {
        const sparkleTime = time + 0.5 + step * 0.6;
        const lead = audioContext.createOscillator();
        const leadEnv = audioContext.createGain();
        const note = notes[(bar + step * 2) % notes.length] * (step === 1 ? 2 : 1);
        lead.type = "triangle";
        lead.frequency.setValueAtTime(note, sparkleTime);
        leadEnv.gain.setValueAtTime(0.0001, sparkleTime);
        leadEnv.gain.linearRampToValueAtTime(0.03, sparkleTime + 0.1);
        leadEnv.gain.exponentialRampToValueAtTime(0.0001, sparkleTime + 0.65);
        lead.connect(leadEnv);
        leadEnv.connect(melodyGain);
        lead.start(sparkleTime);
        lead.stop(sparkleTime + 0.7);
      }
    }
  }

  let nextTime = audioContext.currentTime + 0.1;
  scheduleLoop(nextTime);

  const scheduler = window.setInterval(() => {
    if (audioContext.currentTime + 8 > nextTime) {
      nextTime += 20.8;
      scheduleLoop(nextTime);
    }
  }, 1200);

  return {
    audioContext,
    scheduler,
    setEnabled(enabled) {
      musicEnabled = enabled;
      master.gain.cancelScheduledValues(audioContext.currentTime);
      master.gain.linearRampToValueAtTime(enabled ? 0.14 : 0.0001, audioContext.currentTime + 0.6);
      musicLabel.textContent = enabled ? "Music on" : "Music muted";
    },
  };
}

async function startExperience() {
  if (!musicSystem) {
    musicSystem = createMusicSystem();
  }

  if (musicSystem.audioContext.state === "suspended") {
    await musicSystem.audioContext.resume();
  }

  musicSystem.setEnabled(true);
  startOverlay.classList.add("hidden");
}

startButton.addEventListener("click", () => {
  startExperience();
});

window.addEventListener("keydown", (event) => {
  if (event.code in controls) {
    controls[event.code] = true;
    event.preventDefault();
  }

  if (event.code === "KeyM" && musicSystem) {
    musicSystem.setEnabled(!musicEnabled);
  }
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

  flight.targetSpeed = controls.Space ? 43 : 26;
  flight.speed = lerp(flight.speed, flight.targetSpeed, delta * 1.5);
  flight.pitch = lerp(flight.pitch, 0.04 + climbIntent * 0.33, delta * 2.2);
  flight.roll = lerp(flight.roll, -turnIntent * 0.5, delta * 3.2);
  flight.heading += turnIntent * delta * (0.72 + flight.speed * 0.008);

  const forward = new THREE.Vector3(Math.cos(flight.heading), 0, Math.sin(flight.heading));
  aircraft.position.addScaledVector(forward, flight.speed * delta);
  aircraft.position.y += flight.pitch * flight.speed * delta * 0.55;

  aircraft.position.y = THREE.MathUtils.clamp(
    aircraft.position.y,
    flight.altitudeFloor,
    flight.altitudeCeiling
  );

  const wave = Math.sin(elapsed * 1.2) * 0.04;
  aircraft.rotation.set(flight.pitch * 0.85 + wave, -flight.heading, flight.roll + wave * 0.7);
  propeller.rotation.x += delta * 42;

  const bob = Math.sin(elapsed * 1.6) * 1.4;
  const cameraOffset = new THREE.Vector3(
    -22 * Math.cos(flight.heading) + 9 * Math.sin(flight.heading),
    10 + bob,
    -22 * Math.sin(flight.heading) - 9 * Math.cos(flight.heading)
  );
  camera.position.lerp(aircraft.position.clone().add(cameraOffset), delta * 1.8);
  camera.lookAt(aircraft.position.clone().add(forward.clone().multiplyScalar(28)));

  speedLabel.textContent = `Speed ${Math.round(flight.speed * 5)}`;
  altitudeLabel.textContent = `Altitude ${Math.round(aircraft.position.y * 3)}`;
}

function updateWorld(elapsed) {
  ocean.material.color.offsetHSL(Math.sin(elapsed * 0.04) * 0.0002, 0, 0);
  ocean.rotation.z = Math.sin(elapsed * 0.05) * 0.02;

  cloudGroup.children.forEach((cloud, index) => {
    cloud.position.x += Math.sin(elapsed * 0.03 + index) * 0.03 * cloud.userData.drift;
    cloud.position.z += Math.cos(elapsed * 0.03 + index) * 0.02 * cloud.userData.drift;
  });

  world.children.forEach((island, index) => {
    island.position.y += Math.sin(elapsed * 0.35 + index * 0.7) * 0.01;
  });
}

function animate() {
  const delta = Math.min(clock.getDelta(), 0.033);
  const elapsed = clock.elapsedTime;

  updateFlight(delta, elapsed);
  updateWorld(elapsed);

  skyMaterial.uniforms.topColor.value.offsetHSL(0, 0, Math.sin(elapsed * 0.04) * 0.0002);
  skyDome.position.copy(aircraft.position);
  sun.position.x = aircraft.position.x - 420;
  sun.position.z = aircraft.position.z - 700;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
