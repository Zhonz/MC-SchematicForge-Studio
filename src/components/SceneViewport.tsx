import { useRef, useEffect, useCallback, useState } from 'react'
import * as THREE from 'three'
import { useSceneStore } from '@/stores/sceneStore'
import { useStructureStore } from '@/stores/structureStore'
import { STRUCTURES } from '@/data/minecraftStructures'
import { StructureGhost } from '@/utils/StructureGhost'

const BLOCK_SIZE = 1
const COLORS: Record<string, string> = {
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

export function SceneViewport() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster())
  const blockMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map())
  const structureGhostsRef = useRef<Map<string, StructureGhost>>(new Map())
  const ghostBlockRef = useRef<THREE.Mesh | null>(null)
  const groundPlaneRef = useRef<THREE.Mesh | null>(null)
  const controlsRef = useRef({
    isRotating: false,
    isPanning: false,
    lastMouse: { x: 0, y: 0 }
  })
  const [blockCount, setBlockCount] = useState(0)
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; z: number; blockId: string } | null>(null)

  const { placeBlock, breakBlock, toolMode, selectedBlock, getBlockKey, blocks } = useSceneStore()
  const { activeStructures } = useStructureStore()

  const initScene = useCallback(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0e17)
    scene.fog = new THREE.Fog(0x0a0e17, 60, 120)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 500)
    camera.position.set(35, 30, 35)
    camera.lookAt(0, 5, 0)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)

    const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x3B5C2A, 0.3)
    scene.add(hemiLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9)
    dirLight.position.set(40, 60, 40)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.width = 2048
    dirLight.shadow.mapSize.height = 2048
    dirLight.shadow.camera.near = 0.5
    dirLight.shadow.camera.far = 200
    dirLight.shadow.camera.left = -60
    dirLight.shadow.camera.right = 60
    dirLight.shadow.camera.top = 60
    dirLight.shadow.camera.bottom = -60
    dirLight.shadow.bias = -0.0001
    scene.add(dirLight)

    const gridHelper = new THREE.GridHelper(64, 64, 0x253449, 0x1a2332)
    scene.add(gridHelper)

    const planeGeometry = new THREE.PlaneGeometry(128, 128)
    const planeMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x111827,
      transparent: true,
      opacity: 0.8
    })
    const plane = new THREE.Mesh(planeGeometry, planeMaterial)
    plane.rotation.x = -Math.PI / 2
    plane.position.y = -0.01
    plane.receiveShadow = true
    plane.userData = { isGround: true }
    scene.add(plane)
    groundPlaneRef.current = plane

    const axesHelper = new THREE.AxesHelper(5)
    scene.add(axesHelper)

    const ghostGeometry = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE)
    const ghostMaterial = new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0.3,
      depthWrite: false
    })
    const ghostBlock = new THREE.Mesh(ghostGeometry, ghostMaterial)
    ghostBlock.visible = false
    ghostBlock.userData = { isGhost: true }
    scene.add(ghostBlock)
    ghostBlockRef.current = ghostBlock

    const ghostEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(ghostGeometry),
      new THREE.LineBasicMaterial({ color: 0x4ade80, linewidth: 2 })
    )
    ghostBlock.add(ghostEdges)

    let animationId = 0
    const animate = () => {
      animationId = requestAnimationFrame(animate)
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
      if (e.button === 2) {
        controlsRef.current.isRotating = true
      } else if (e.button === 1) {
        controlsRef.current.isPanning = true
      } else if (e.button === 0) {
        handleClick(e)
      }
      controlsRef.current.lastMouse = { x: e.clientX, y: e.clientY }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!camera || !container) return
      
      const rect = container.getBoundingClientRect()
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      )
      
      raycasterRef.current.setFromCamera(mouse, camera)
      
      const { isRotating, isPanning, lastMouse } = controlsRef.current
      
      if (isRotating) {
        const dx = e.clientX - lastMouse.x
        const dy = e.clientY - lastMouse.y
        
        const spherical = new THREE.Spherical()
        const offset = new THREE.Vector3()
        offset.copy(camera.position).sub(new THREE.Vector3(0, 8, 0))
        spherical.setFromVector3(offset)
        spherical.theta -= dx * 0.005
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi + dy * 0.005))
        offset.setFromSpherical(spherical)
        camera.position.copy(new THREE.Vector3(0, 8, 0)).add(offset)
        camera.lookAt(0, 8, 0)
        
        controlsRef.current.lastMouse = { x: e.clientX, y: e.clientY }
      } else if (isPanning) {
        const dx = e.clientX - lastMouse.x
        const dy = e.clientY - lastMouse.y
        const panSpeed = 0.05
        
        const right = new THREE.Vector3()
        const up = new THREE.Vector3()
        camera.getWorldDirection(new THREE.Vector3())
        right.crossVectors(camera.up, new THREE.Vector3().subVectors(camera.position, new THREE.Vector3(0, 8, 0)).normalize()).normalize()
        up.copy(camera.up)
        
        camera.position.addScaledVector(right, dx * panSpeed)
        camera.position.addScaledVector(up, -dy * panSpeed)
        camera.lookAt(
          camera.position.x + (0 - camera.position.x) * 0.01,
          8 + (camera.position.y - 8) * 0.01,
          camera.position.z + (0 - camera.position.z) * 0.01
        )
        
        controlsRef.current.lastMouse = { x: e.clientX, y: e.clientY }
      }
      
      updateGhostBlock(mouse)
    }

    const updateGhostBlock = (mouse: THREE.Vector2) => {
      if (!ghostBlockRef.current || !scene || !camera) return
      
      raycasterRef.current.setFromCamera(mouse, camera)
      
      const meshes = Array.from(blockMeshesRef.current.values())
      meshes.push(groundPlaneRef.current!)
      const intersects = raycasterRef.current.intersectObjects(meshes)
      
      if (intersects.length > 0) {
        const hit = intersects[0]
        
        if (hit.object.userData.isGround) {
          const point = hit.point
          const x = Math.floor(point.x + 0.5)
          const z = Math.floor(point.z + 0.5)
          
          if (toolMode === 'place') {
            ghostBlockRef.current.visible = true
            ghostBlockRef.current.position.set(x, 0.5, z)
            setHoverInfo({ x, y: 0, z, blockId: selectedBlock.id })
          } else {
            ghostBlockRef.current.visible = false
            setHoverInfo(null)
          }
        } else if (hit.object.userData.isGhost) {
          ghostBlockRef.current.visible = false
          setHoverInfo(null)
        } else {
          const normal = hit.face?.normal
          if (normal) {
            const blockPos = hit.object.position
            const placeX = Math.round(blockPos.x - 0.5 + normal.x)
            const placeY = Math.round(blockPos.y - 0.5 + normal.y)
            const placeZ = Math.round(blockPos.z - 0.5 + normal.z)
            
            if (toolMode === 'place') {
              ghostBlockRef.current.visible = true
              ghostBlockRef.current.position.set(placeX + 0.5, placeY + 0.5, placeZ + 0.5)
              setHoverInfo({ x: placeX, y: placeY, z: placeZ, blockId: selectedBlock.id })
            } else if (toolMode === 'break') {
              ghostBlockRef.current.visible = false
              setHoverInfo({
                x: Math.round(blockPos.x - 0.5),
                y: Math.round(blockPos.y - 0.5),
                z: Math.round(blockPos.z - 0.5),
                blockId: hit.object.userData.blockId
              })
            }
          }
        }
      } else {
        ghostBlockRef.current.visible = false
        setHoverInfo(null)
      }
    }

    const handleClick = (e: MouseEvent) => {
      if (!container || !scene || !camera) return
      
      const rect = container.getBoundingClientRect()
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      )
      
      raycasterRef.current.setFromCamera(mouse, camera)
      
      const meshes = Array.from(blockMeshesRef.current.values())
      if (groundPlaneRef.current) meshes.push(groundPlaneRef.current)
      const intersects = raycasterRef.current.intersectObjects(meshes)
      
      if (intersects.length > 0) {
        const hit = intersects[0]
        
        if (hit.object.userData.isGround && toolMode === 'place') {
          const point = hit.point
          const x = Math.floor(point.x + 0.5)
          const z = Math.floor(point.z + 0.5)
          placeBlock(x, 0, z)
        } else if (!hit.object.userData.isGround && !hit.object.userData.isGhost) {
          if (toolMode === 'break') {
            const pos = hit.object.position
            const x = Math.round(pos.x - 0.5)
            const y = Math.round(pos.y - 0.5)
            const z = Math.round(pos.z - 0.5)
            breakBlock(x, y, z)
          } else if (toolMode === 'place') {
            const normal = hit.face?.normal
            if (normal) {
              const blockPos = hit.object.position
              const placeX = Math.round(blockPos.x - 0.5 + normal.x)
              const placeY = Math.round(blockPos.y - 0.5 + normal.y)
              const placeZ = Math.round(blockPos.z - 0.5 + normal.z)
              placeBlock(placeX, placeY, placeZ)
            }
          }
        }
      }
    }

    const handleMouseUp = () => {
      controlsRef.current.isRotating = false
      controlsRef.current.isPanning = false
    }

    const handleWheel = (e: WheelEvent) => {
      if (!camera) return
      e.preventDefault()
      const direction = new THREE.Vector3()
      camera.getWorldDirection(direction)
      const distance = e.deltaY > 0 ? 1.5 : -1.5
      camera.position.addScaledVector(direction, distance)
    }

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }

    container.addEventListener('mousedown', handleMouseDown)
    container.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    container.addEventListener('wheel', handleWheel, { passive: false })
    container.addEventListener('contextmenu', handleContextMenu)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      container.removeEventListener('mousedown', handleMouseDown)
      container.removeEventListener('wheel', handleWheel)
      container.removeEventListener('contextmenu', handleContextMenu)
      cancelAnimationFrame(animationId)
      if (renderer && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [placeBlock, breakBlock, toolMode, selectedBlock])

  useEffect(() => {
    return initScene()
  }, [initScene])

  useEffect(() => {
    if (ghostBlockRef.current) {
      const material = ghostBlockRef.current.material as THREE.MeshBasicMaterial
      material.color.set(COLORS[selectedBlock.id] || '#4ade80')
      const edges = ghostBlockRef.current.children[0] as THREE.LineSegments
      if (edges && edges.material) {
        (edges.material as THREE.LineBasicMaterial).color.set(COLORS[selectedBlock.id] || '#4ade80')
      }
    }
  }, [selectedBlock])

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    structureGhostsRef.current.forEach((ghost, id) => {
      if (!activeStructures.has(id)) {
        scene.remove(ghost.getGroup())
        ghost.dispose()
        structureGhostsRef.current.delete(id)
      }
    })

    STRUCTURES.forEach(structure => {
      if (activeStructures.has(structure.id) && !structureGhostsRef.current.has(structure.id)) {
        const color = getCategoryColor(structure.category)
        const ghost = new StructureGhost(structure.size, structure.center, color)
        
        structure.spawners.forEach(spawner => {
          ghost.addSpawnerMarker(
            spawner.position,
            spawner.icon,
            spawner.description,
            spawner.count
          )
        })

        ghost.setOffset(-30, 0, -30)
        scene.add(ghost.getGroup())
        structureGhostsRef.current.set(structure.id, ghost)
      }
    })
  }, [activeStructures])

  const updateBlocks = useCallback(() => {
    const currentBlocks = useSceneStore.getState().blocks
    const scene = sceneRef.current
    if (!scene) return

    setBlockCount(currentBlocks.size)

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

    currentBlocks.forEach((placement) => {
      const { x, y, z, blockId } = placement
      const color = COLORS[blockId] || '#808080'
      const isTransparent = blockId.includes('glass') || blockId.includes('redstone_wire') || 
                           blockId.includes('torch') || blockId.includes('repeater') ||
                           blockId.includes('comparator') || blockId.includes('lever') ||
                           blockId.includes('button')

      const geometry = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE)
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        transparent: isTransparent,
        opacity: isTransparent ? 0.7 : 1.0
      })

      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(x + 0.5, y + 0.5, z + 0.5)
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.userData = { blockId, key: getBlockKey(x, y, z) }
      
      scene.add(mesh)
      blockMeshesRef.current.set(getBlockKey(x, y, z), mesh)
    })
  }, [getBlockKey])

  useEffect(() => {
    updateBlocks()
  }, [updateBlocks, blocks])

  return (
    <div className="flex-1 relative overflow-hidden" ref={containerRef}>
      <div className="absolute top-3 left-3 z-10 pointer-events-none space-y-2">
        <div className="px-3 py-2 rounded-md backdrop-blur-sm border" style={{
          background: 'rgba(17, 24, 39, 0.85)',
          borderColor: 'var(--color-border)'
        }}>
          <div className="text-xs font-display font-bold tracking-wider" style={{
            color: 'var(--color-accent-green)'
          }}>
            SCHEMATICFORGE
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {toolMode === 'place' && '🔨 放置模式 - 点击放置方块'}
            {toolMode === 'break' && '⛏️ 破坏模式 - 点击破坏方块'}
            {toolMode === 'select' && '📐 选择模式'}
          </div>
        </div>

        {hoverInfo && (
          <div className="px-3 py-2 rounded-md backdrop-blur-sm border" style={{
            background: 'rgba(17, 24, 39, 0.85)',
            borderColor: toolMode === 'break' ? '#ef4444' : '#4ade80'
          }}>
            <div className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
              {toolMode === 'break' ? '⛏️' : '🧱'} {hoverInfo.blockId}
            </div>
            <div className="text-[10px] font-mono" style={{ 
              color: toolMode === 'break' ? '#ef4444' : '#4ade80' 
            }}>
              ({hoverInfo.x}, {hoverInfo.y}, {hoverInfo.z})
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-3 right-3 z-10 pointer-events-none">
        <div className="px-3 py-1.5 rounded-md backdrop-blur-sm border text-[10px]" style={{
          background: 'rgba(17, 24, 39, 0.85)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-muted)'
        }}>
          方块数: <span style={{ color: 'var(--color-accent-green)' }}>{blockCount}</span>
          {' | '}
          左键放置/破坏 | 右键旋转 | 中键平移 | 滚轮缩放
        </div>
      </div>

      <div className="absolute top-3 right-3 z-10 pointer-events-none">
        <div className="flex flex-col gap-1 text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
          <div className="px-2 py-1 rounded bg-black/50">X</div>
          <div className="px-2 py-1 rounded bg-black/50">Y</div>
          <div className="px-2 py-1 rounded bg-black/50">Z</div>
        </div>
      </div>
    </div>
  )
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    ocean: '#4a90d9',
    nether: '#b80000',
    end: '#9b59b6',
    desert: '#f59e0b',
    jungle: '#5D8C3E',
    forest: '#2d5016',
    plains: '#7c3aed',
    underground: '#808080',
    snow: '#06b6d4',
    deep_dark: '#1a1a2e',
  }
  return colors[category] || '#4a90d9'
}
