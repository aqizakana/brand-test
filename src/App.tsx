import './App.css'
import { useEffect, useRef } from 'react'
import * as THREE from 'three';
import { WebGPURenderer } from "three/webgpu"
import { Torus } from './scripts/torus'
import { uv, texture } from 'three/tsl'
import { MeshStandardNodeMaterial } from 'three/webgpu'
function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<any>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)

  // ← anime.js が補間する値
  const rotationRef = useRef({
    current: 0,
    target: 0,
    xCurrent: 0,
    xTarget: 0,
    camCurrent: new THREE.Vector3(3, 3, 8),
    mode: 'orbit' as 'orbit' | 'approach'
  })

  useEffect(() => {
    if (!canvasRef.current) return
    if (rendererRef.current) return

    let mounted = true

    /* -------------------------
       Scene
    ------------------------- */
    const scene = new THREE.Scene()
    sceneRef.current = scene

    /* -------------------------
       Camera
    ------------------------- */
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.set(3, 3, 8)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    /* -------------------------
       Light
    ------------------------- */
    const light = new THREE.DirectionalLight(0xffffff, 1)
    light.position.set(3, 3, 3)
    scene.add(light)
    const light2 = new THREE.AmbientLight(0xffffff, 1)
    light2.position.set(-3, 3, -10)
    scene.add(light2)

    /* -------------------------
       Objects
    ------------------------- */
    const toruses: Torus[] = []

    const torus1 = new Torus()
    toruses.push(torus1)

    const torus2 = new Torus()
    torus2.getMesh().position.z = 3
    toruses.push(torus2)

    const torusGroup = new THREE.Group()
    toruses.forEach((torus) => {
      torusGroup.add(torus.getMesh())
    })
    scene.add(torusGroup)

    const loader = new THREE.TextureLoader()

    const loadTexturesAndAddBox = async () => {
      const [detailTex, colorTex] = await Promise.all([
        loader.loadAsync(
          'https://dl.dropbox.com/scl/fi/m1qat2m9qa1vrbimqstsb/27623_0.jpg?rlkey=vl4hzq080sus57br8r3out0z4&st=chgujbk0&dl=0'
        ),
        loader.loadAsync(
          'https://dl.dropbox.com/scl/fi/7pcsrqpays2oc407mkckz/bukubuku.jpg?rlkey=5359avfjck8hgnjoyqiypm45d&st=2nf1dj83&dl=0'
        )
      ])

      detailTex.colorSpace = THREE.LinearSRGBColorSpace
      colorTex.colorSpace = THREE.LinearSRGBColorSpace

      const detail = texture(detailTex, uv().div(10))
      const base = texture(colorTex)

      const box = new THREE.BoxGeometry(2, 2, 2)

      const material2 = new MeshStandardNodeMaterial()
      material2.colorNode = base.mul(detail)

      const picMesh = new THREE.Mesh(box, material2)
      picMesh.position.z = 15
      scene.add(picMesh)
      picMesh.receiveShadow = true
    }

    loadTexturesAndAddBox()

    /* -------------------------
       Renderer
    ------------------------- */
    const initRenderer = async () => {
      const renderer = new WebGPURenderer({
        canvas: canvasRef.current!,
        antialias: true
      })

      await renderer.init()

      if (!mounted) return

      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

      rendererRef.current = renderer
    }

    initRenderer()

    /* -------------------------
       Scroll Animation
    ------------------------- */

    const handleScroll = () => {
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight

      const scrollRatio = window.scrollY / maxScroll

      rotationRef.current.target = window.scrollY * 0.006

      const newMode = scrollRatio >= 0.5 ? "approach" : "orbit"

      // モードが変わる瞬間だけ実行
      if (newMode !== rotationRef.current.mode) {

        rotationRef.current.mode = newMode

        // ← 現在のカメラ位置を保存
        rotationRef.current.camCurrent.copy(camera.position)
      }

      rotationRef.current.xTarget =
        scrollRatio >= 0.5 ? Math.PI / 2 : 0
    }


    window.addEventListener('scroll', handleScroll)

    /* -------------------------
       Resize
    ------------------------- */
    const handleResize = () => {
      if (!rendererRef.current || !cameraRef.current) return

      const width = window.innerWidth
      const height = window.innerHeight

      rendererRef.current.setSize(width, height)
      cameraRef.current.aspect = width / height
      cameraRef.current.updateProjectionMatrix()
    }

    window.addEventListener('resize', handleResize)

    /* -------------------------
       Render Loop
    ------------------------- */
    const animateLoop = () => {
      requestAnimationFrame(animateLoop)

      const state = rotationRef.current

      // 回転補間
      state.current += (state.target - state.current) * 0.05
      state.xCurrent += (state.xTarget - state.xCurrent) * 0.05

      const radian = state.current

      if (state.mode === 'orbit') {
        // ← これまでの円運動そのまま
        camera.position.x = 6 * Math.sin(radian) + 2
        camera.position.y = 2.2 * Math.cos(radian) + 2
        camera.position.z = 7 * Math.cos(radian) + 6
    } else {
        // ← 近づくモード（lerpで寄る）
        const targetPos = new THREE.Vector3(5, -3, 3)

        state.camCurrent.lerp(targetPos, 0.05)
        camera.position.copy(state.camCurrent)
      }

      camera.lookAt(0, 0, 0)

      // トーラス逆回転
      toruses.forEach((torus, index) => {
        const direction = index % 2 === 0 ? 1 : -1

        torus.getMesh().rotation.z = state.current * direction * 2

        torusGroup.rotation.x = state.xCurrent
      })

      if (rendererRef.current) {
        rendererRef.current.render(scene, camera)
      }
    }

    animateLoop()

    /* -------------------------
       Cleanup
    ------------------------- */
    return () => {
      mounted = false

      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)

      rendererRef.current?.dispose()
      rendererRef.current = null
    }
  }, [])

  return <canvas ref={canvasRef} className="webgl" />
}

export default App
