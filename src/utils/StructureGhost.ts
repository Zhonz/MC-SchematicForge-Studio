import * as THREE from 'three'

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

    // 虚化外框
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

    // 半透明填充
    const fillMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
    })
    const fill = new THREE.Mesh(boxGeometry, fillMaterial)
    fill.position.set(center.x, center.y, center.z)
    this.group.add(fill)

    // 地面网格效果
    const gridHelper = new THREE.GridHelper(
      Math.max(size.x, size.z),
      Math.max(size.x, size.z),
      new THREE.Color(color).multiplyScalar(0.5),
      new THREE.Color(color).multiplyScalar(0.3),
    )
    gridHelper.position.set(center.x, 0.01, center.z)
    this.group.add(gridHelper)
  }

  addSpawnerMarker(
    position: { x: number; y: number; z: number },
    icon: string,
    description: string,
    count?: string
  ) {
    // 创建文字精灵
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    canvas.width = 128
    canvas.height = 128

    // 背景圆
    context.fillStyle = 'rgba(239, 68, 68, 0.8)'
    context.beginPath()
    context.arc(64, 64, 50, 0, Math.PI * 2)
    context.fill()

    // 文字
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

    // 添加光柱效果
    const beamGeometry = new THREE.CylinderGeometry(0.3, 0.3, 10, 8)
    const beamMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#ef4444'),
      transparent: true,
      opacity: 0.15,
    })
    const beam = new THREE.Mesh(beamGeometry, beamMaterial)
    beam.position.set(position.x, position.y + 5, position.z)
    this.group.add(beam)

    // 底部标记
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
