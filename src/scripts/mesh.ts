// mesh.ts

import * as THREE from "three"
import { MeshPhysicalNodeMaterial } from "three/webgpu"

export abstract class BaseMesh {
  protected material!: MeshPhysicalNodeMaterial
  protected mesh!: THREE.Mesh
  protected geometry!:
    | THREE.TorusGeometry
    | THREE.BoxGeometry
    | THREE.SphereGeometry

  constructor() {
    this.initGeometry()
    this.initMaterial()
    this.initMesh()
  }

  protected abstract initGeometry(): void
  protected abstract initMaterial(): void

  protected initMesh(): void {
    this.mesh = new THREE.Mesh(this.geometry, this.material)
  }

  public abstract animate(
    camera: THREE.PerspectiveCamera
  ): void

  public getMesh(): THREE.Mesh {
    return this.mesh
  }

  public dispose(): void {
    this.geometry?.dispose()
    this.material?.dispose()
  }
}
