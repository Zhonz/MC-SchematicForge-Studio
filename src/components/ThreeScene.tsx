import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { useSceneStore } from '@/stores/sceneStore'
import { getMCTextureURL } from '@/services/textureService'
import { performanceService } from '@/services/performanceService'

const BLOCK_SIZE = 1
const CHUNK_SIZE = 16 // 分块大小，用于分层次渲染
const MAX_INSTANCES = 5000 // 增加最大实例化渲染数量，性能更好
const MAX_BLOCKS_PER_RENDER = 10000 // 单帧最大渲染方块数

// 使用常量缓存，避免重复创建对象
const VECTOR3_ZERO = new THREE.Vector3(0, 0, 0)
const VECTOR3_FOCUS = new THREE.Vector3(0, 5, 0)

export function useThreeScene(containerRef: React.RefObject<HTMLDivElement | null>) {
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const blockMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map())
  const animationIdRef = useRef<number>(0)
  const isAnimatingRef = useRef(true) // 新增：动画控制标志

  const controlsRef = useRef({
    isRotating: false,
    lastMouse: { x: 0, y: 0 },
  })

  const textureCache = useRef<Map<string, THREE.Texture>>(new Map())
  const textureLoaderRef = useRef<THREE.TextureLoader | null>(null)
  const sharedGeometryRef = useRef<THREE.BoxGeometry | null>(null) // 共享几何体
  const instancedMeshesRef = useRef<Map<string, THREE.InstancedMesh>>(new Map()) // 实例化网格
  const chunksRef = useRef<Map<string, THREE.Group>>(new Map()) // 分块管理

  // 性能优化：使用单个缓存的对象，避免频繁创建
  const dummyObjectRef = useRef(new THREE.Object3D())
  const sphericalRef = useRef(new THREE.Spherical())
  const offsetRef = useRef(new THREE.Vector3())
  const directionRef = useRef(new THREE.Vector3())

  // 新增：帧优化变量
  const lastRenderTimeRef = useRef(0)
  const isRenderingRef = useRef(false)

  const initScene = useCallback(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x87ceeb)
    scene.fog = new THREE.Fog(0x87ceeb, 80, 150)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
    camera.position.set(30, 25, 30)
    camera.lookAt(VECTOR3_FOCUS)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false, // 优化：关闭alpha
      preserveDrawingBuffer: false,
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)) // 优化：降低像素比提升性能
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    textureLoaderRef.current = new THREE.TextureLoader()

    // 初始化共享几何体
    sharedGeometryRef.current = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(50, 80, 50)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 1024 // 优化：降低阴影大小提升性能
    directionalLight.shadow.mapSize.height = 1024
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 200
    directionalLight.shadow.camera.left = -50
    directionalLight.shadow.camera.right = 50
    directionalLight.shadow.camera.top = 50
    directionalLight.shadow.camera.bottom = -50
    scene.add(directionalLight)

    const gridHelper = new THREE.GridHelper(64, 64, 0x999999, 0xcccccc)
    scene.add(gridHelper)

    const planeGeometry = new THREE.PlaneGeometry(64, 64)
    const planeMaterial = new THREE.MeshStandardMaterial({
      color: 0x5d8c3e,
      transparent: true,
      opacity: 0.3,
    })
    const plane = new THREE.Mesh(planeGeometry, planeMaterial)
    plane.rotation.x = -Math.PI / 2
    plane.position.y = -0.01
    plane.receiveShadow = true
    scene.add(plane)

    let lastTime = performance.now()
    const animate = () => {
      if (!isAnimatingRef.current) return

      animationIdRef.current = requestAnimationFrame(animate)
      const now = performance.now()
      const delta = (now - lastTime) / 1000
      lastTime = now

      // 性能优化：避免连续渲染，增加帧率控制
      if (now - lastRenderTimeRef.current > 16) {
        // 约60fps
        if (renderer && scene && camera) {
          renderer.render(scene, camera)
          lastRenderTimeRef.current = now
          performanceService.markFrameRender()
        }
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
    window.addEventListener('resize', handleResize, { passive: true })

    const handleMouseDown = (e: MouseEvent) => {
      controlsRef.current.isRotating = true
      controlsRef.current.lastMouse = { x: e.clientX, y: e.clientY }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!controlsRef.current.isRotating || !camera) return
      const dx = e.clientX - controlsRef.current.lastMouse.x
      const dy = e.clientY - controlsRef.current.lastMouse.y

      // 优化：复用对象，避免频繁创建
      const offset = offsetRef.current
      const spherical = sphericalRef.current

      offset.copy(camera.position).sub(VECTOR3_FOCUS)
      spherical.setFromVector3(offset)
      spherical.theta -= dx * 0.01
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi - dy * 0.01))
      offset.setFromSpherical(spherical)
      camera.position.copy(VECTOR3_FOCUS).add(offset)
      camera.lookAt(VECTOR3_FOCUS)

      controlsRef.current.lastMouse = { x: e.clientX, y: e.clientY }
      useSceneStore
        .getState()
        .setCamera({
          position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
        })
    }

    const handleMouseUp = () => {
      controlsRef.current.isRotating = false
    }

    const handleWheel = (e: WheelEvent) => {
      if (!camera) return
      const direction = directionRef.current
      camera.getWorldDirection(direction)
      const distance = e.deltaY > 0 ? 2 : -2
      camera.position.addScaledVector(direction, distance)
      useSceneStore
        .getState()
        .setCamera({
          position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
        })
    }

    container.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    container.addEventListener('wheel', handleWheel, { passive: true })

    return () => {
      isAnimatingRef.current = false
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      container.removeEventListener('mousedown', handleMouseDown)
      container.removeEventListener('wheel', handleWheel)
      cancelAnimationFrame(animationIdRef.current)

      // 清理所有资源
      cleanupScene()

      if (renderer && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [containerRef])

  const cleanupScene = useCallback(() => {
    // 清理常规网格
    blockMeshesRef.current.forEach(mesh => {
      mesh.geometry.dispose()
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => {
          const stdMat = m as THREE.MeshStandardMaterial
          if (stdMat.map) stdMat.map.dispose()
          m.dispose()
        })
      } else {
        const stdMat = mesh.material as THREE.MeshStandardMaterial
        if (stdMat.map) stdMat.map.dispose()
        mesh.material.dispose()
      }
    })
    blockMeshesRef.current.clear()

    // 清理实例化网格
    instancedMeshesRef.current.forEach(mesh => {
      mesh.geometry.dispose()
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose())
      } else {
        mesh.material.dispose()
      }
    })
    instancedMeshesRef.current.clear()

    // 清理分块
    chunksRef.current.clear()

    // 清理共享几何体
    if (sharedGeometryRef.current) {
      sharedGeometryRef.current.dispose()
    }
  }, [])

  const getChunkKey = useCallback((x: number, z: number) => {
    const chunkX = Math.floor(x / CHUNK_SIZE)
    const chunkZ = Math.floor(z / CHUNK_SIZE)
    return `${chunkX},${chunkZ}`
  }, [])

  // 使用requestIdleCallback优化大批量更新
  const updateBlocks = useCallback(() => {
    const { blocks, getBlockKey } = useSceneStore.getState()
    const scene = sceneRef.current
    if (!scene || !textureLoaderRef.current || !sharedGeometryRef.current) return

    // 清理现有网格
    cleanupScene()

    // 性能优化：如果方块数量很大，分批处理
    if (blocks.size > MAX_BLOCKS_PER_RENDER) {
      console.warn(`方块数量过多(${blocks.size})，部分可能不会被渲染`)
    }

    // 按方块类型分组，便于实例化渲染
    const blocksByType = new Map<string, Array<{ x: number; y: number; z: number }>>()

    blocks.forEach(placement => {
      const { x, y, z, blockId } = placement
      if (!blocksByType.has(blockId)) {
        blocksByType.set(blockId, [])
      }
      blocksByType.get(blockId)!.push({ x, y, z })
    })

    // 优化：复用dummy对象
    const dummy = dummyObjectRef.current

    // 为每种方块类型创建实例化网格
    blocksByType.forEach((positions, blockId) => {
      const isTransparent =
        blockId.includes('glass') ||
        blockId.includes('redstone_wire') ||
        blockId.includes('torch') ||
        blockId.includes('redstone_torch') ||
        blockId.includes('repeater') ||
        blockId.includes('comparator') ||
        blockId.includes('lever') ||
        blockId.includes('button')

      // 获取或创建材质
      let material: THREE.MeshStandardMaterial
      const cachedTexture = textureCache.current.get(blockId)

      if (cachedTexture) {
        material = new THREE.MeshStandardMaterial({
          map: cachedTexture,
          transparent: isTransparent,
          opacity: isTransparent ? 0.7 : 1.0,
        })
      } else {
        const textureURL = getMCTextureURL(blockId)
        const loader = textureLoaderRef.current!
        loader.load(
          textureURL,
          texture => {
            texture.colorSpace = THREE.SRGBColorSpace
            texture.magFilter = THREE.NearestFilter
            texture.minFilter = THREE.NearestFilter
            textureCache.current.set(blockId, texture)
          },
          undefined,
          () => {
            // 纹理加载失败使用颜色材质
          }
        )

        material = new THREE.MeshStandardMaterial({
          color: getBlockColor(blockId),
          transparent: isTransparent,
          opacity: isTransparent ? 0.7 : 1.0,
        })
      }

      // 根据方块数量决定渲染方式
      if (positions.length > 5 && !isTransparent) {
        // 优化：降低实例化阈值，更早使用实例化
        // 大量方块使用实例化渲染
        const instancedMesh = new THREE.InstancedMesh(
          sharedGeometryRef.current!,
          material,
          Math.min(positions.length, MAX_INSTANCES)
        )

        for (let i = 0; i < positions.length && i < MAX_INSTANCES; i++) {
          const pos = positions[i]
          dummy.position.set(pos.x, pos.y + BLOCK_SIZE / 2, pos.z)
          dummy.updateMatrix()
          instancedMesh.setMatrixAt(i, dummy.matrix)
        }

        instancedMesh.instanceMatrix.needsUpdate = true
        instancedMesh.castShadow = true
        instancedMesh.receiveShadow = true
        scene.add(instancedMesh)
        instancedMeshesRef.current.set(blockId, instancedMesh)
      } else {
        // 少量方块或透明方块使用常规渲染
        for (let i = 0; i < positions.length; i++) {
          const pos = positions[i]
          const mesh = new THREE.Mesh(sharedGeometryRef.current!, material.clone())
          mesh.position.set(pos.x, pos.y + BLOCK_SIZE / 2, pos.z)
          mesh.castShadow = true
          mesh.receiveShadow = true
          mesh.userData = { blockId, key: getBlockKey(pos.x, pos.y, pos.z) }

          // 按分块组织
          const chunkKey = getChunkKey(pos.x, pos.z)
          if (!chunksRef.current.has(chunkKey)) {
            const chunk = new THREE.Group()
            scene.add(chunk)
            chunksRef.current.set(chunkKey, chunk)
          }
          chunksRef.current.get(chunkKey)!.add(mesh)

          blockMeshesRef.current.set(getBlockKey(pos.x, pos.y, pos.z), mesh)
        }
      }
    })

    // 更新性能指标
    performanceService.updateMetrics({ blockCount: blocks.size })
  }, [cleanupScene, getChunkKey])

  useEffect(() => {
    return initScene()
  }, [initScene])

  useEffect(() => {
    updateBlocks()
  }, [updateBlocks])

  return { sceneRef: containerRef, blockMeshesRef, cameraRef, rendererRef }
}

// 使用Object.freeze缓存颜色映射，提高性能
const BLOCK_COLORS: Record<string, string> = Object.freeze({
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
})

function getBlockColor(blockId: string): string {
  return BLOCK_COLORS[blockId] || '#808080'
}
