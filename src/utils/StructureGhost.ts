import * as THREE from 'three'
import type { StructureBlock } from '@/data/minecraftStructures'

const BLOCK_COLORS: Record<string, string> = {
  'minecraft:stone': '#808080',
  'minecraft:cobblestone': '#6B6B6B',
  'minecraft:oak_planks': '#BC9862',
  'minecraft:spruce_planks': '#6B5430',
  'minecraft:birch_planks': '#D4C59E',
  'minecraft:dark_oak_planks': '#4A3728',
  'minecraft:bricks': '#9B5B3C',
  'minecraft:stone_bricks': '#7A7A7A',
  'minecraft:glass': '#CCE5FF',
  'minecraft:tinted_glass': '#4A4A5A',
  'minecraft:white_wool': '#F0F0F0',
  'minecraft:concrete': '#D9D9D9',
  'minecraft:obsidian': '#1a1a2e',
  'minecraft:crying_obsidian': '#2a1a4e',
  'minecraft:grass_block': '#5D8C3E',
  'minecraft:dirt': '#866043',
  'minecraft:oak_log': '#7B5B3A',
  'minecraft:spruce_log': '#4A3728',
  'minecraft:sand': '#DBD3A0',
  'minecraft:gravel': '#8A8A8A',
  'minecraft:end_stone': '#E8E8CC',
  'minecraft:netherrack': '#8B3A3A',
  'minecraft:basalt': '#3D3D4A',
  'minecraft:blackstone': '#1a1a1a',
  'minecraft:redstone_block': '#B80000',
  'minecraft:redstone_wire': '#FF0000',
  'minecraft:redstone_torch': '#FF6600',
  'minecraft:repeater': '#8B8B8B',
  'minecraft:comparator': '#8B8B8B',
  'minecraft:lever': '#808080',
  'minecraft:stone_button': '#909090',
  'minecraft:wooden_button': '#BC9862',
  'minecraft:piston': '#9B9B9B',
  'minecraft:sticky_piston': '#5D8C3E',
  'minecraft:observer': '#6B6B6B',
  'minecraft:hopper': '#6B6B6B',
  'minecraft:dropper': '#8B8B8B',
  'minecraft:dispenser': '#8B8B8B',
  'minecraft:trapped_chest': '#9B7B4B',
  'minecraft:daylight_detector': '#D4C59E',
  'minecraft:heavy_weighted_pressure_plate': '#E8E8E8',
  'minecraft:light_weighted_pressure_plate': '#FFAA00',
  'minecraft:stone_pressure_plate': '#909090',
  'minecraft:tripwire_hook': '#BC9862',
  'minecraft:oak_stairs': '#BC9862',
  'minecraft:oak_slab': '#BC9862',
  'minecraft:stone_stairs': '#808080',
  'minecraft:torch': '#FFAA00',
  'minecraft:soul_torch': '#6699CC',
  'minecraft:ladder': '#BC9862',
  'minecraft:iron_bars': '#404040',
  'minecraft:chain': '#505050',
  'minecraft:crafting_table': '#BC9862',
  'minecraft:furnace': '#808080',
  'minecraft:chest': '#BC9862',
  'minecraft:ender_chest': '#2A2A4A',
  'minecraft:iron_block': '#E8E8E8',
  'minecraft:gold_block': '#FFAA00',
  'minecraft:diamond_block': '#4AEDD9',
  'minecraft:netherite_block': '#4A4A52',
  'minecraft:slime_block': '#7FCC19',
  'minecraft:honey_block': '#E4A128',
  'minecraft:honeycomb_block': '#DDA62B',
  'minecraft:target': '#CC3333',
  'minecraft:sculk_sensor': '#1A5F5F',
  'minecraft:sculk_catalyst': '#1A4F4F',
  'minecraft:sculk_shrieker': '#1A3F3F',
}

export class StructureGhost {
  private group: THREE.Group
  private spawnerMarkers: THREE.Sprite[] = []
  private boxHelper: THREE.BoxHelper | null = null

  constructor(
    size: { x: number; y: number; z: number },
    center: { x: number; y: number; z: number },
    color: string = '#4a90d9'
  ) {
    this.group = new THREE.Group()

    const boxGeometry = new THREE.BoxGeometry(size.x, size.y, size.z)
    const edgesGeometry = new THREE.EdgesGeometry(boxGeometry)
    const edgesMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.6,
    })
    const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial)
    edges.position.set(center.x, center.y, center.z)
    this.group.add(edges)

    const fillMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
    })
    const fill = new THREE.Mesh(boxGeometry, fillMaterial)
    fill.position.set(center.x, center.y, center.z)
    this.group.add(fill)

    const gridHelper = new THREE.GridHelper(
      Math.max(size.x, size.z),
      Math.max(size.x, size.z),
      new THREE.Color(color).multiplyScalar(0.5),
      new THREE.Color(color).multiplyScalar(0.3),
    )
    gridHelper.position.set(center.x, 0.01, center.z)
    this.group.add(gridHelper)
  }

  addBlocks(blocks: StructureBlock[], offsetX: number = 0, offsetY: number = 0, offsetZ: number = 0) {
    const geometry = new THREE.BoxGeometry(0.95, 0.95, 0.95)

    blocks.forEach((block) => {
      const [x, y, z] = block.pos
      const color = BLOCK_COLORS[block.blockId] || '#808080'
      const isTransparent = block.blockId.includes('glass') || 
                           block.blockId.includes('torch') || 
                           block.blockId.includes('slime') ||
                           block.blockId.includes('honey')

      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        transparent: isTransparent,
        opacity: isTransparent ? 0.8 : 1.0,
      })

      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(x + offsetX, y + offsetY + 0.5, z + offsetZ)
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.userData = { blockId: block.blockId }
      this.group.add(mesh)
    })
  }

  addSpawnerMarker(
    position: { x: number; y: number; z: number },
    icon: string,
    description: string,
    count?: string
  ) {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    canvas.width = 128
    canvas.height = 128

    context.fillStyle = 'rgba(239, 68, 68, 0.8)'
    context.beginPath()
    context.arc(64, 64, 50, 0, Math.PI * 2)
    context.fill()

    context.fillStyle = '#ffffff'
    context.font = 'bold 60px Arial'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(icon, 64, 64)

    const texture = new THREE.CanvasTexture(canvas)
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    })
    const sprite = new THREE.Sprite(spriteMaterial)
    sprite.position.set(position.x, position.y + 2, position.z)
    sprite.scale.set(2, 2, 1)
    sprite.userData = { description, count, isSpawner: true }

    this.group.add(sprite)
    this.spawnerMarkers.push(sprite)

    const beamGeometry = new THREE.CylinderGeometry(0.3, 0.3, 10, 8)
    const beamMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#ef4444'),
      transparent: true,
      opacity: 0.15,
    })
    const beam = new THREE.Mesh(beamGeometry, beamMaterial)
    beam.position.set(position.x, position.y + 5, position.z)
    this.group.add(beam)

    const markerGeometry = new THREE.RingGeometry(1, 1.5, 32)
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#ef4444'),
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    })
    const marker = new THREE.Mesh(markerGeometry, markerMaterial)
    marker.rotation.x = -Math.PI / 2
    marker.position.set(position.x, 0.1, position.z)
    this.group.add(marker)
  }

  setOffset(x: number, y: number, z: number) {
    this.group.position.set(x, y, z)
  }

  setOpacity(opacity: number) {
    this.group.children.forEach(child => {
      if (child instanceof THREE.LineSegments) {
        if (child.material instanceof THREE.LineBasicMaterial) {
          child.material.opacity = opacity
        }
      }
      if (child instanceof THREE.Mesh && !(child instanceof THREE.Sprite)) {
        if (child.material instanceof THREE.MeshBasicMaterial) {
          child.material.opacity = opacity * 0.5
        }
      }
    })
  }

  getGroup(): THREE.Group {
    return this.group
  }

  getSpawnerMarkers(): THREE.Sprite[] {
    return this.spawnerMarkers
  }

  dispose() {
    this.group.traverse(child => {
      if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
        child.geometry.dispose()
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose())
        } else {
          child.material.dispose()
        }
      }
      if (child instanceof THREE.Sprite) {
        child.material.map?.dispose()
        child.material.dispose()
      }
    })
  }
}
