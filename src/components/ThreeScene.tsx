import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { useSceneStore } from '@/stores/sceneStore'

const BLOCK_SIZE = 1

export function useThreeScene(containerRef: React.RefObject<HTMLDivElement | null>) {
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const blockMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map())
  const animationIdRef = useRef<number>(0)
  const controlsRef = useRef({
    isRotating: false,
    lastMouse: { x: 0, y: 0 }
  })

  const initScene = useCallback(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x87CEEB)
    scene.fog = new THREE.Fog(0x87CEEB, 80, 150)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
    camera.position.set(30, 25, 30)
    camera.lookAt(0, 5, 0)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(50, 80, 50)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 200
    directionalLight.shadow.camera.left = -50
    directionalLight.shadow.camera.right = 50
    directionalLight.shadow.camera.top = 50
    directionalLight.shadow.camera.bottom = -50
    scene.add(directionalLight)

    const gridHelper = new THREE.GridHelper(64, 64, 0x999999, 0xCCCCCC)
    scene.add(gridHelper)

    const planeGeometry = new THREE.PlaneGeometry(64, 64)
    const planeMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x5D8C3E,
      transparent: true,
      opacity: 0.3
    })
    const plane = new THREE.Mesh(planeGeometry, planeMaterial)
    plane.rotation.x = -Math.PI / 2
    plane.position.y = -0.01
    plane.receiveShadow = true
    scene.add(plane)

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate)
      if (renderer && scene && camera) {
        renderer.render(scene, camera)
      }
    }
    animate()

    const handleResize = () => {
      if (!container || !camera || !renderer) return
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    const handleMouseDown = (e: MouseEvent) => {
      controlsRef.current.isRotating = true
      controlsRef.current.lastMouse = { x: e.clientX, y: e.clientY }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!controlsRef.current.isRotating || !camera) return
      const dx = e.clientX - controlsRef.current.lastMouse.x
      const dy = e.clientY - controlsRef.current.lastMouse.y
      
      const spherical = new THREE.Spherical()
      const offset = new THREE.Vector3()
      offset.copy(camera.position).sub(new THREE.Vector3(0, 5, 0))
      spherical.setFromVector3(offset)
      spherical.theta -= dx * 0.01
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi - dy * 0.01))
      offset.setFromSpherical(spherical)
      camera.position.copy(new THREE.Vector3(0, 5, 0)).add(offset)
      camera.lookAt(0, 5, 0)
      
      controlsRef.current.lastMouse = { x: e.clientX, y: e.clientY }
      useSceneStore.getState().setCamera({ position: { x: camera.position.x, y: camera.position.y, z: camera.position.z } })
    }

    const handleMouseUp = () => {
      controlsRef.current.isRotating = false
    }

    const handleWheel = (e: WheelEvent) => {
      if (!camera) return
      const direction = new THREE.Vector3()
      camera.getWorldDirection(direction)
      const distance = e.deltaY > 0 ? 2 : -2
      camera.position.addScaledVector(direction, distance)
      useSceneStore.getState().setCamera({ position: { x: camera.position.x, y: camera.position.y, z: camera.position.z } })
    }

    container.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    container.addEventListener('wheel', handleWheel)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      container.removeEventListener('mousedown', handleMouseDown)
      container.removeEventListener('wheel', handleWheel)
      cancelAnimationFrame(animationIdRef.current)
      if (renderer && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [containerRef])

  useEffect(() => {
    return initScene()
  }, [initScene])

  const updateBlocks = useCallback(() => {
    const { blocks, getBlockKey } = useSceneStore.getState()
    const scene = sceneRef.current
    if (!scene) return

    blockMeshesRef.current.forEach((mesh) => {
      scene.remove(mesh)
      mesh.geometry.dispose()
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose())
      } else {
        mesh.material.dispose()
      }
    })
    blockMeshesRef.current.clear()

    blocks.forEach((placement) => {
      const { x, y, z, blockId } = placement
      
      const blockColor = getBlockColor(blockId)
      
      const geometry = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE)
      const isTransparent = blockId.includes('glass') || blockId.includes('redstone_wire') || 
                           blockId.includes('torch') || blockId.includes('redstone_torch') ||
                           blockId.includes('repeater') || blockId.includes('comparator') ||
                           blockId.includes('lever') || blockId.includes('button')
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(blockColor),
        transparent: isTransparent,
        opacity: isTransparent ? 0.7 : 1.0
      })

      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(x, y + BLOCK_SIZE / 2, z)
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.userData = { blockId, key: getBlockKey(x, y, z) }
      
      scene.add(mesh)
      blockMeshesRef.current.set(getBlockKey(x, y, z), mesh)
    })
  }, [])

  useEffect(() => {
    updateBlocks()
  }, [updateBlocks])

  return { sceneRef: containerRef, blockMeshesRef, cameraRef, rendererRef }
}

function getBlockColor(blockId: string): string {
  const colors: Record<string, string> = {
    'minecraft:stone': '#808080',
    'minecraft:cobblestone': '#6B6B6B',
    'minecraft:oak_planks': '#BC9862',
    'minecraft:spruce_planks': '#6B5430',
    'minecraft:birch_planks': '#D4C59E',
    'minecraft:bricks': '#9B5B3C',
    'minecraft:stone_bricks': '#7A7A7A',
    'minecraft:glass': '#CCE5FF',
    'minecraft:white_wool': '#F0F0F0',
    'minecraft:concrete': '#D9D9D9',
    'minecraft:grass_block': '#5D8C3E',
    'minecraft:dirt': '#866043',
    'minecraft:oak_log': '#7B5B3A',
    'minecraft:spruce_log': '#4A3728',
    'minecraft:sand': '#DBD3A0',
    'minecraft:gravel': '#8A8A8A',
    'minecraft:redstone_block': '#B80000',
    'minecraft:redstone_wire': '#FF0000',
    'minecraft:redstone_torch': '#FF6600',
    'minecraft:repeater': '#8B8B8B',
    'minecraft:comparator': '#8B8B8B',
    'minecraft:lever': '#808080',
    'minecraft:stone_button': '#909090',
    'minecraft:piston': '#9B9B9B',
    'minecraft:sticky_piston': '#5D8C3E',
    'minecraft:observer': '#6B6B6B',
    'minecraft:oak_stairs': '#BC9862',
    'minecraft:oak_slab': '#BC9862',
    'minecraft:stone_stairs': '#808080',
    'minecraft:torch': '#FFAA00',
    'minecraft:ladder': '#BC9862',
    'minecraft:iron_bars': '#404040',
    'minecraft:crafting_table': '#BC9862',
    'minecraft:furnace': '#808080',
    'minecraft:chest': '#BC9862',
    'minecraft:iron_block': '#E8E8E8',
    'minecraft:gold_block': '#FFAA00',
    'minecraft:diamond_block': '#4AEDD9',
  }
  return colors[blockId] || '#808080'
}
