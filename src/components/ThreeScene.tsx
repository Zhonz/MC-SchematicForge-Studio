import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { useSceneStore } from '@/stores/sceneStore'
import { getMCTextureURL } from '@/services/textureService'

const BLOCK_SIZE = 1
const CHUNK_SIZE = 16 // 分块大小，用于分层次渲染
const MAX_INSTANCES = 1000 // 最大实例化渲染数量

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

  const textureCache = useRef<Map<string, THREE.Texture>>(new Map())
  const textureLoaderRef = useRef<THREE.TextureLoader | null>(null)
  const sharedGeometryRef = useRef<THREE.BoxGeometry | null>(null) // 共享几何体
  const instancedMeshesRef = useRef<Map<string, THREE.InstancedMesh>>(new Map()) // 实例化网格
  const chunksRef = useRef<Map<string, THREE.Group>>(new Map()) // 分块管理
  
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

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
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

    let lastTime = performance.now()
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate)
      const now = performance.now()
      const delta = (now - lastTime) / 1000
      lastTime = now
      
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
    window.addEventListener('resize', handleResize, { passive: true })

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
    container.addEventListener('wheel', handleWheel, { passive: true })

    return () => {
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
    blockMeshesRef.current.forEach((mesh) => {
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
    instancedMeshesRef.current.forEach((mesh) => {
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

  const updateBlocks = useCallback(() => {
    const { blocks, getBlockKey } = useSceneStore.getState()
    const scene = sceneRef.current
    if (!scene || !textureLoaderRef.current || !sharedGeometryRef.current) return

    // 清理现有网格
    cleanupScene()

    // 按方块类型分组，便于实例化渲染
    const blocksByType = new Map<string, Array<{x: number, y: number, z: number}>>()
    
    blocks.forEach((placement) => {
      const { x, y, z, blockId } = placement
      if (!blocksByType.has(blockId)) {
        blocksByType.set(blockId, [])
      }
      blocksByType.get(blockId)!.push({x, y, z})
    })

    // 为每种方块类型创建实例化网格
    blocksByType.forEach((positions, blockId) => {
      const isTransparent = blockId.includes('glass') || blockId.includes('redstone_wire') || 
                           blockId.includes('torch') || blockId.includes('redstone_torch') ||
                           blockId.includes('repeater') || blockId.includes('comparator') ||
                           blockId.includes('lever') || blockId.includes('button')
      
      // 获取或创建材质
      let material: THREE.MeshStandardMaterial
      const cachedTexture = textureCache.current.get(blockId)
      
      if (cachedTexture) {
        material = new THREE.MeshStandardMaterial({
          map: cachedTexture,
          transparent: isTransparent,
          opacity: isTransparent ? 0.7 : 1.0
        })
      } else {
        const textureURL = getMCTextureURL(blockId)
        const loader = textureLoaderRef.current!
        loader.load(
          textureURL,
          (texture) => {
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
          opacity: isTransparent ? 0.7 : 1.0
        })
      }

      // 根据方块数量决定渲染方式
      if (positions.length > 10 && !isTransparent) {
        // 大量方块使用实例化渲染
        const instancedMesh = new THREE.InstancedMesh(
          sharedGeometryRef.current!,
          material,
          Math.min(positions.length, MAX_INSTANCES)
        )
        
        const dummy = new THREE.Object3D()
        positions.forEach((pos, i) => {
          if (i < MAX_INSTANCES) {
            dummy.position.set(pos.x, pos.y + BLOCK_SIZE / 2, pos.z)
            dummy.updateMatrix()
            instancedMesh.setMatrixAt(i, dummy.matrix)
          }
        })
        
        instancedMesh.instanceMatrix.needsUpdate = true
        instancedMesh.castShadow = true
        instancedMesh.receiveShadow = true
        scene.add(instancedMesh)
        instancedMeshesRef.current.set(blockId, instancedMesh)
      } else {
        // 少量方块或透明方块使用常规渲染
        positions.forEach((pos) => {
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
        })
      }
    })
  }, [cleanupScene, getChunkKey])

  useEffect(() => {
    return initScene()
  }, [initScene])

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
