// mesh.ts

import * as THREE from "three"

export abstract class BaseMesh {
  protected material!: any
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

  public getMesh(): any {
    return this.mesh
  }

  public dispose(): void {
    this.geometry?.dispose()
    this.material?.dispose()
  }
}
