import { positionLocal, sin, color } from 'three/tsl'

import { MeshPhysicalNodeMaterial } from 'three/webgpu'

import * as THREE from 'three/webgpu'
import { BaseMesh } from './mesh'

import { animate } from 'animejs'

export class Torus extends BaseMesh {
  protected initGeometry(): void {
    this.geometry = new THREE.TorusGeometry(1, 0.4, 64, 200)
  }

  private animation = animate(this.mesh.position, {
    x: 5,
    duration: 2000,
    easing: 'easeInOutQuad',
    autoplay: false
  })

  protected initMaterial(): void {
    const wave = sin(positionLocal.x.mul(5)).mul(0.1)

    this.material = new MeshPhysicalNodeMaterial({
      colorNode: color(0.2, 0.6, 1),
      positionNode: positionLocal.add(positionLocal.mul(wave))
    })
  }

  public animate = (): void => {
    this.animation.play()
    //this.mesh.rotation.x += 0.01
  }
}
