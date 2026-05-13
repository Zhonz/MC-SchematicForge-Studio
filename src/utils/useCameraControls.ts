import { useRef, useCallback, useEffect, useState } from 'react';
import * as THREE from 'three';

export interface CameraControlsOptions {
  minDistance?: number;
  maxDistance?: number;
  minPolarAngle?: number;
  maxPolarAngle?: number;
  rotateSpeed?: number;
  panSpeed?: number;
  zoomSpeed?: number;
  enableDamping?: boolean;
  dampingFactor?: number;
  target?: THREE.Vector3;
}

export interface GestureState {
  type: 'none' | 'rotate' | 'pan' | 'zoom' | 'two-finger-rotate';
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  lastDistance?: number;
  lastAngle?: number;
  isActive: boolean;
}

export interface UseCameraControlsReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isMobile: boolean;
  isTablet: boolean;
  currentGesture: GestureState['type'];
  resetCamera: () => void;
  zoomToFit: () => void;
  setViewAngle: (angle: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom' | 'isometric') => void;
}

export function useCameraControls(
  camera: THREE.PerspectiveCamera | null,
  options: CameraControlsOptions = {}
): UseCameraControlsReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [currentGesture, setCurrentGesture] = useState<GestureState['type']>('none');

  const spherical = useRef(new THREE.Spherical(50, Math.PI / 3, Math.PI / 4));
  const target = useRef(options.target?.clone() || new THREE.Vector3(0, 5, 0));
  const isRotating = useRef(false);
  const isPanning = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const gestureState = useRef<GestureState>({
    type: 'none',
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    isActive: false,
  });

  const {
    minDistance = 5,
    maxDistance = 200,
    minPolarAngle = 0.1,
    maxPolarAngle = Math.PI - 0.1,
    rotateSpeed = 0.005,
    panSpeed = 0.05,
    zoomSpeed = 0.1,
    enableDamping = true,
    dampingFactor = 0.1,
  } = options;

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const updateCamera = useCallback(() => {
    if (!camera) return;

    const offset = new THREE.Vector3();
    offset.setFromSpherical(spherical.current);
    camera.position.copy(target.current).add(offset);
    camera.lookAt(target.current);
  }, [camera]);

  const rotate = useCallback((dx: number, dy: number) => {
    spherical.current.theta -= dx * rotateSpeed;
    spherical.current.phi = Math.max(
      minPolarAngle,
      Math.min(maxPolarAngle, spherical.current.phi + dy * rotateSpeed)
    );
    updateCamera();
  }, [rotateSpeed, minPolarAngle, maxPolarAngle, updateCamera]);

  const pan = useCallback((dx: number, dy: number) => {
    if (!camera) return;

    const distance = spherical.current.radius;
    const panOffset = new THREE.Vector3();

    const right = new THREE.Vector3();
    right.crossVectors(camera.up, new THREE.Vector3().subVectors(camera.position, target.current).normalize()).normalize();

    const up = camera.up.clone();

    panOffset.addScaledVector(right, -dx * panSpeed * distance * 0.002);
    panOffset.addScaledVector(up, dy * panSpeed * distance * 0.002);

    target.current.add(panOffset);
    updateCamera();
  }, [camera, panSpeed, updateCamera]);

  const zoom = useCallback((delta: number) => {
    const zoomAmount = delta > 0 ? 1 + zoomSpeed : 1 - zoomSpeed;
    spherical.current.radius = Math.max(
      minDistance,
      Math.min(maxDistance, spherical.current.radius * zoomAmount)
    );
    updateCamera();
  }, [zoomSpeed, minDistance, maxDistance, updateCamera]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      isRotating.current = true;
      setCurrentGesture('rotate');
    } else if (e.button === 2 || (e.button === 0 && e.ctrlKey)) {
      isPanning.current = true;
      setCurrentGesture('pan');
    }
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isRotating.current) {
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      rotate(dx, dy);
      lastMouse.current = { x: e.clientX, y: e.clientY };
    } else if (isPanning.current) {
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      pan(dx, dy);
      lastMouse.current = { x: e.clientX, y: e.clientY };
    }
  }, [rotate, pan]);

  const handleMouseUp = useCallback(() => {
    isRotating.current = false;
    isPanning.current = false;
    setCurrentGesture('none');
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    zoom(e.deltaY);
  }, [zoom]);

  const handleContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();
  }, []);

  const getTouchDistance = (touches: TouchList): number => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchAngle = (touches: TouchList): number => {
    if (touches.length < 2) return 0;
    return Math.atan2(
      touches[1].clientY - touches[0].clientY,
      touches[1].clientX - touches[0].clientX
    );
  };

  const handleTouchStart = useCallback((e: TouchEvent) => {
    e.preventDefault();

    if (e.touches.length === 1) {
      gestureState.current = {
        type: 'rotate',
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        lastX: e.touches[0].clientX,
        lastY: e.touches[0].clientY,
        isActive: true,
      };
      setCurrentGesture('rotate');
    } else if (e.touches.length === 2) {
      gestureState.current = {
        type: 'two-finger-rotate',
        startX: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        startY: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        lastX: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        lastY: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        lastDistance: getTouchDistance(e.touches),
        lastAngle: getTouchAngle(e.touches),
        isActive: true,
      };
      setCurrentGesture('two-finger-rotate');
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();

    if (e.touches.length === 1 && gestureState.current.type === 'rotate') {
      const dx = e.touches[0].clientX - gestureState.current.lastX;
      const dy = e.touches[0].clientY - gestureState.current.lastY;
      rotate(dx, dy);
      gestureState.current.lastX = e.touches[0].clientX;
      gestureState.current.lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2 && gestureState.current.type === 'two-finger-rotate') {
      const currentDistance = getTouchDistance(e.touches);
      const currentAngle = getTouchAngle(e.touches);

      if (gestureState.current.lastDistance) {
        const distanceDelta = gestureState.current.lastDistance - currentDistance;
        zoom(distanceDelta > 0 ? -1 : 1);
      }

      if (gestureState.current.lastAngle !== undefined) {
        const angleDelta = currentAngle - gestureState.current.lastAngle;
        rotate(angleDelta * 100, 0);
      }

      const dx = ((e.touches[0].clientX + e.touches[1].clientX) / 2) - gestureState.current.lastX;
      const dy = ((e.touches[0].clientY + e.touches[1].clientY) / 2) - gestureState.current.lastY;
      pan(dx, dy);

      gestureState.current.lastX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      gestureState.current.lastY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      gestureState.current.lastDistance = currentDistance;
      gestureState.current.lastAngle = currentAngle;
    }
  }, [rotate, pan, zoom]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (e.touches.length === 0) {
      gestureState.current = { type: 'none', startX: 0, startY: 0, lastX: 0, lastY: 0, isActive: false };
      setCurrentGesture('none');
    } else if (e.touches.length === 1) {
      gestureState.current = {
        type: 'rotate',
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        lastX: e.touches[0].clientX,
        lastY: e.touches[0].clientY,
        isActive: true,
      };
      setCurrentGesture('rotate');
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('contextmenu', handleContextMenu);
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('contextmenu', handleContextMenu);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleWheel, handleContextMenu, handleTouchStart, handleTouchMove, handleTouchEnd]);

  const resetCamera = useCallback(() => {
    spherical.current.set(50, Math.PI / 3, Math.PI / 4);
    target.current.set(0, 5, 0);
    updateCamera();
  }, [updateCamera]);

  const zoomToFit = useCallback(() => {
    spherical.current.radius = 30;
    updateCamera();
  }, [updateCamera]);

  const setViewAngle = useCallback((angle: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom' | 'isometric') => {
    const distances = { front: Math.PI, back: 0, left: -Math.PI / 2, right: Math.PI / 2, top: Math.PI / 2, bottom: -Math.PI / 2, isometric: Math.PI / 4 };
    const thetas = { front: Math.PI, back: 0, left: -Math.PI / 2, right: Math.PI / 2, top: 0, bottom: 0, isometric: Math.PI / 4 };
    const phis = { front: Math.PI / 2, back: Math.PI / 2, left: Math.PI / 2, right: Math.PI / 2, top: 0.01, bottom: Math.PI - 0.01, isometric: Math.PI / 3 };

    spherical.current.theta = thetas[angle] + (angle === 'isometric' ? Math.PI / 4 : 0);
    spherical.current.phi = phis[angle];
    updateCamera();
  }, [updateCamera]);

  return { containerRef, isMobile, isTablet, currentGesture, resetCamera, zoomToFit, setViewAngle };
}
