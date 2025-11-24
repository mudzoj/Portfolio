"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Home() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202030);

    const width = mount.clientWidth || window.innerWidth;
    const height = mount.clientHeight || window.innerHeight;

    // Camera on +Z looking toward origin
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(0, 4, 10);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    mount.appendChild(renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Grid on X–Z plane
    const grid = new THREE.GridHelper(20, 20);
    scene.add(grid);

    // --- Bounds definition (triangle on X–Z plane) ---
    const zMin = -1000; // far back
    const zMax = 5;     // front line, < camera.z (10)
    const xMaxAtZMax = 15;

    // Visualize bounds
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });

    const leftLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-xMaxAtZMax, 0.01, zMax),
      new THREE.Vector3(0, 0.01, zMin),
    ]);
    const leftLine = new THREE.Line(leftLineGeo, lineMat);
    scene.add(leftLine);

    const rightLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(xMaxAtZMax, 0.01, zMax),
      new THREE.Vector3(0, 0.01, zMin),
    ]);
    const rightLine = new THREE.Line(rightLineGeo, lineMat);
    scene.add(rightLine);

    const baseLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-xMaxAtZMax, 0.01, zMax),
      new THREE.Vector3(xMaxAtZMax, 0.01, zMax),
    ]);
    const baseLine = new THREE.Line(baseLineGeo, lineMat);
    scene.add(baseLine);

    // --- Player cube ---
    const playerGeo = new THREE.BoxGeometry(1, 1, 1);
    const playerMat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const player = new THREE.Mesh(playerGeo, playerMat);
    player.position.set(0, 0.5, zMax * 0.5);
    scene.add(player);

    // --- Billboard System ---
    // Helper function to create a more complex procedural texture (can be replaced with actual images)
    const createBillboardTexture = (text, width = 512, height = 256, bgColor = '#000000', textColor = '#00ffff', accentColor = '#ff00ff') => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      // Background with gradient
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, bgColor);
      gradient.addColorStop(1, '#0a0a1a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      // Border frame
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 8;
      ctx.strokeRect(10, 10, width - 20, height - 20);
      
      // Inner border
      ctx.strokeStyle = textColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(20, 20, width - 40, height - 40);
      
      // Decorative corner elements
      const cornerSize = 30;
      ctx.fillStyle = accentColor;
      // Top-left corner
      ctx.fillRect(20, 20, cornerSize, 4);
      ctx.fillRect(20, 20, 4, cornerSize);
      // Top-right corner
      ctx.fillRect(width - 20 - cornerSize, 20, cornerSize, 4);
      ctx.fillRect(width - 24, 20, 4, cornerSize);
      // Bottom-left corner
      ctx.fillRect(20, height - 24, cornerSize, 4);
      ctx.fillRect(20, height - 20 - cornerSize, 4, cornerSize);
      // Bottom-right corner
      ctx.fillRect(width - 20 - cornerSize, height - 24, cornerSize, 4);
      ctx.fillRect(width - 24, height - 20 - cornerSize, 4, cornerSize);
      
      // Main text with glow effect
      if (text) {
        // Glow effect (draw multiple times with blur)
        ctx.shadowColor = textColor;
        ctx.shadowBlur = 15;
        ctx.fillStyle = textColor;
        ctx.font = 'bold 56px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, width / 2, height / 2 - 20);
        
        // Secondary text
        ctx.shadowBlur = 10;
        ctx.fillStyle = accentColor;
        ctx.font = 'bold 24px Arial';
        ctx.fillText('24/7', width / 2, height / 2 + 30);
      }
      
      // Decorative lines
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(30, 30, width - 60, height - 60);
      ctx.setLineDash([]);
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    };

    // Helper function to create a neon billboard
    const createBillboard = (text, position, size = { width: 4, height: 2.5 }, options = {}) => {
      const {
        bgColor = '#000000',
        textColor = '#00ffff',
        accentColor = '#ff00ff',
        emissiveIntensity = 2.0,
        side = 'left' // 'left' or 'right'
      } = options;

      // Create texture
      const texture = createBillboardTexture(text, 512, 320, bgColor, textColor, accentColor);
      
      // Create plane geometry
      const geometry = new THREE.PlaneGeometry(size.width, size.height);
      
      // Create material with emissive for neon glow
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        emissive: new THREE.Color(textColor),
        emissiveIntensity: emissiveIntensity,
        emissiveMap: texture,
        side: THREE.DoubleSide, // Visible from both sides
      });
      
      const billboard = new THREE.Mesh(geometry, material);
      billboard.position.set(position.x, position.y, position.z);
      
      // Rotate to face forward/backward (perpendicular to the side walls)
      // No Y rotation needed - they face along Z axis (forward/backward)
      // Optionally flip 180 degrees to face backward
      if (options.faceBackward) {
        billboard.rotation.y = Math.PI; // Face backward
      }
      // Otherwise rotation.y = 0 (default) faces forward
      
      // Store metadata for future interactivity
      billboard.userData = {
        isBillboard: true,
        text: text,
        ...options
      };
      
      return billboard;
    };

    // Create billboards along the tunnel
    const billboards = [];
    const billboardSpacing = 50; // Distance between billboards
    const billboardHeight = 3.5; // Height above ground
    
    // Neon color palettes for variety
    const colorPalettes = [
      { text: '#00ffff', accent: '#ff00ff', bg: '#1a1a2e' }, // Cyan/Magenta
      { text: '#ff00ff', accent: '#00ffff', bg: '#2e1a2e' }, // Magenta/Cyan
      { text: '#ffff00', accent: '#ff0080', bg: '#2e2e1a' }, // Yellow/Pink
      { text: '#00ff00', accent: '#ff8000', bg: '#1a2e1a' }, // Green/Orange
      { text: '#ff8000', accent: '#00ff00', bg: '#2e1a1a' }, // Orange/Green
      { text: '#ff0080', accent: '#ffff00', bg: '#2e1a2e' }, // Pink/Yellow
    ];
    
    const billboardTexts = [
      'NEON', 'CYBER', 'TOKYO', 'NIGHT', 'DREAM', 'PULSE',
      'GLOW', 'EDGE', 'ZONE', 'VOID', 'FLUX', 'SPARK'
    ];
    
    // Left side billboards (facing forward)
    for (let z = zMin + 100; z < zMax - 50; z += billboardSpacing) {
      const maxXAtZ = (xMaxAtZMax * (z - zMin)) / (zMax - zMin || 1);
      const x = -maxXAtZ - 1.5; // Slightly outside the boundary
      
      const palette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];
      const text = billboardTexts[Math.floor(Math.random() * billboardTexts.length)];
      
      const billboard = createBillboard(
        text,
        { x, y: billboardHeight, z },
        { width: 4, height: 2.5 },
        {
          bgColor: palette.bg,
          textColor: palette.text,
          accentColor: palette.accent,
          emissiveIntensity: 1.8 + Math.random() * 0.7,
          side: 'left'
        }
      );
      scene.add(billboard);
      billboards.push(billboard);
      
      // Add point light for neon glow effect
      const pointLight = new THREE.PointLight(palette.text, 0.6, 12);
      pointLight.position.set(x, billboardHeight, z);
      scene.add(pointLight);
    }
    
    // Right side billboards (facing forward)
    for (let z = zMin + 100; z < zMax - 50; z += billboardSpacing) {
      const maxXAtZ = (xMaxAtZMax * (z - zMin)) / (zMax - zMin || 1);
      const x = maxXAtZ + 1.5; // Slightly outside the boundary
      
      const palette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];
      const text = billboardTexts[Math.floor(Math.random() * billboardTexts.length)];
      
      const billboard = createBillboard(
        text,
        { x, y: billboardHeight, z },
        { width: 4, height: 2.5 },
        {
          bgColor: palette.bg,
          textColor: palette.text,
          accentColor: palette.accent,
          emissiveIntensity: 1.8 + Math.random() * 0.7,
          side: 'right'
        }
      );
      scene.add(billboard);
      billboards.push(billboard);
      
      // Add point light for neon glow effect
      const pointLight = new THREE.PointLight(palette.text, 0.6, 12);
      pointLight.position.set(x, billboardHeight, z);
      scene.add(pointLight);
    }

    // Clamp (x, z) into triangular bounds
    function clampToTriangle(x, z) {
      let clampedZ = Math.max(zMin, Math.min(zMax, z));

      const maxXAtZ =
        (xMaxAtZMax * (clampedZ - zMin)) / (zMax - zMin || 1);

      let clampedX = Math.max(-maxXAtZ, Math.min(maxXAtZ, x));

      return { x: clampedX, z: clampedZ };
    }

    // Input
    const keys = {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
      w: false,
      a: false,
      s: false,
      d: false,
    };

    // Normalize key to handle shift modifier (W vs w)
    const normalizeKey = (key) => {
      if (key.length === 1 && key >= "A" && key <= "Z") {
        return key.toLowerCase();
      }
      return key;
    };

    const onKeyDown = (e) => {
      const normalizedKey = normalizeKey(e.key);
      if (normalizedKey in keys) keys[normalizedKey] = true;
    };

    const onKeyUp = (e) => {
      const normalizedKey = normalizeKey(e.key);
      if (normalizedKey in keys) keys[normalizedKey] = false;
    };

    const clock = new THREE.Clock();
    const speed = 10; // units per second

    // Camera following state
    let cameraFollowing = false;
    let previousPlayerPosition = new THREE.Vector3(
      player.position.x,
      player.position.y,
      player.position.z
    );
    // Store initial camera offset from origin (camera is at (0, 4, 10), looking at (0, 0, 0))
    const initialCameraOffset = new THREE.Vector3(0, 4, 10);
    // Store initial lookAt point (camera initially looks at origin)
    const lookAtPoint = new THREE.Vector3(0, 0, 0);
    
    // Camera transition state
    let isTransitioning = false;
    let transitionProgress = 0;
    const transitionDuration = 0.5; // seconds
    const startCameraPosition = new THREE.Vector3();
    const targetCameraPosition = new THREE.Vector3();
    const startLookAtPoint = new THREE.Vector3();
    const targetLookAtPoint = new THREE.Vector3();

    // Handle left shift key for toggling camera following
    const onKeyDownWithShift = (e) => {
      if (e.code === "ShiftLeft") {
        e.preventDefault(); // Prevent browser shortcuts
        const wasFollowing = cameraFollowing;
        cameraFollowing = !cameraFollowing;
        
        // When enabling following, start smooth transition to center the player
        if (!wasFollowing && cameraFollowing) {
          // Store starting positions
          startCameraPosition.copy(camera.position);
          startLookAtPoint.copy(lookAtPoint);
          
          // Calculate target positions
          targetCameraPosition.set(
            player.position.x + initialCameraOffset.x,
            player.position.y + initialCameraOffset.y,
            player.position.z + initialCameraOffset.z
          );
          targetLookAtPoint.set(player.position.x, player.position.y, player.position.z);
          
          // Start transition
          isTransitioning = true;
          transitionProgress = 0;
        }
      } else {
        const normalizedKey = normalizeKey(e.key);
        if (normalizedKey in keys) keys[normalizedKey] = true;
      }
    };

    window.addEventListener("keydown", onKeyDownWithShift);
    window.addEventListener("keyup", onKeyUp);

    // --- Animation loop with screen clamp ---
    const animate = () => {
      const delta = clock.getDelta();
      const move = speed * delta;

      let nextX = player.position.x;
      let nextZ = player.position.z;

      // Movement input
      if (keys.w || keys.ArrowUp) {
        nextZ -= move; // toward origin
      }
      if (keys.s || keys.ArrowDown) {
        nextZ += move; // toward camera/front line
      }
      if (keys.a || keys.ArrowLeft) {
        nextX -= move;
      }
      if (keys.d || keys.ArrowRight) {
        nextX += move;
      }

      // 1) Clamp to your triangle/world bounds
      const { x: boundedX, z: boundedZ } = clampToTriangle(nextX, nextZ);

      // 2) Check if that bounded position would still be on screen
      const candidate = new THREE.Vector3(
        boundedX,
        player.position.y,
        boundedZ
      );

      const ndc = candidate.clone().project(camera); // NDC space: -1..1

      const margin = 0.9; // how close to edges we allow
      const insideScreen =
        ndc.x > -margin &&
        ndc.x < margin &&
        ndc.y > -margin &&
        ndc.y < margin &&
        ndc.z > 0 &&
        ndc.z < 1; // in front of camera

      // Store previous position for delta calculation
      const previousPos = new THREE.Vector3(
        player.position.x,
        player.position.y,
        player.position.z
      );

      if (insideScreen) {
        // Only move if we stay visible
        player.position.set(candidate.x, candidate.y, candidate.z);
      }
      // else: ignore this frame's movement; stay where we are

      // Camera transition logic (smooth transition when enabling following)
      if (isTransitioning) {
        transitionProgress += delta;
        const t = Math.min(transitionProgress / transitionDuration, 1);
        
        // Update target positions to account for player movement during transition
        targetCameraPosition.set(
          player.position.x + initialCameraOffset.x,
          player.position.y + initialCameraOffset.y,
          player.position.z + initialCameraOffset.z
        );
        targetLookAtPoint.set(player.position.x, player.position.y, player.position.z);
        
        // Use smooth easing function (ease-in-out)
        const easedT = t < 0.5 
          ? 2 * t * t 
          : 1 - Math.pow(-2 * t + 2, 2) / 2;
        
        // Interpolate camera position
        camera.position.lerpVectors(startCameraPosition, targetCameraPosition, easedT);
        
        // Interpolate lookAt point
        lookAtPoint.lerpVectors(startLookAtPoint, targetLookAtPoint, easedT);
        camera.lookAt(lookAtPoint);
        
        // Check if transition is complete
        if (t >= 1) {
          isTransitioning = false;
        }
      }
      // Camera following logic (only when not transitioning)
      else if (cameraFollowing) {
        // Calculate player's actual delta movement
        const playerDelta = new THREE.Vector3().subVectors(
          player.position,
          previousPos
        );

        // Move camera by the player's delta movement
        camera.position.add(playerDelta);
        // Move lookAt point by the same delta to maintain relative view
        lookAtPoint.add(playerDelta);
        camera.lookAt(lookAtPoint);
      }

      renderer.render(scene, camera);
    };

    renderer.setAnimationLoop(animate);

    // Resize
    const handleResize = () => {
      const newWidth = mount.clientWidth || window.innerWidth;
      const newHeight = mount.clientHeight || window.innerHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      renderer.setAnimationLoop(null);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", onKeyDownWithShift);
      window.removeEventListener("keyup", onKeyUp);

      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }

      renderer.dispose();
      playerGeo.dispose();
      playerMat.dispose();
      leftLineGeo.dispose();
      rightLineGeo.dispose();
      baseLineGeo.dispose();
      lineMat.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    />
  );
}
