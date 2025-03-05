import { Environment, Lightformer } from "@react-three/drei"
import { useThree } from "@react-three/fiber"
import * as THREE from "three"
import { mainCamera } from "./cameras"
export function Env() {
  const camera = useThree((state) => state.camera)

  const background = camera === mainCamera ? false : true

  return (
    <Environment
      resolution={1024}
      background={background}
      frames={1}
      environmentIntensity={1.5}
    >
      <Room highlight={"#121212"} />
    </Environment>
  )
}

const box = new THREE.BoxGeometry()
const white = new THREE.MeshStandardMaterial({
  color: new THREE.Color(1, 1, 1)
})
function Room({ highlight }: { highlight: string }) {
  return (
    <group position={[0, -0.5, 0]}>
      {/** Room, just an inverted box */}
      <mesh
        geometry={box}
        castShadow
        receiveShadow
        position={[0.0, 13.2, 0.0]}
        scale={[31.5, 28.5, 31.5]}
      >
        <meshStandardMaterial color="gray" side={THREE.BackSide} />
      </mesh>
      {/** Some boxes */}
      <mesh
        geometry={box}
        material={white}
        castShadow
        receiveShadow
        position={[-10.906, -1.0, 1.846]}
        rotation={[0, -0.195, 0]}
        scale={[2.328, 7.905, 4.651]}
      />
      <mesh
        geometry={box}
        material={white}
        castShadow
        receiveShadow
        position={[-5.607, -0.754, -0.758]}
        rotation={[0, 0.994, 0]}
        scale={[1.97, 1.534, 3.955]}
      />
      <mesh
        geometry={box}
        material={white}
        castShadow
        receiveShadow
        position={[6.167, -0.16, 7.803]}
        rotation={[0, 0.561, 0]}
        scale={[3.927, 6.285, 3.687]}
      />
      <mesh
        geometry={box}
        material={white}
        castShadow
        receiveShadow
        position={[-2.017, 0.018, 6.124]}
        rotation={[0, 0.333, 0]}
        scale={[2.002, 4.566, 2.064]}
      />
      <mesh
        geometry={box}
        material={white}
        castShadow
        receiveShadow
        position={[2.291, -0.756, -2.621]}
        rotation={[0, -0.286, 0]}
        scale={[1.546, 1.552, 1.496]}
      />
      <mesh
        geometry={box}
        material={white}
        castShadow
        receiveShadow
        position={[-2.193, -0.369, -5.547]}
        rotation={[0, 0.516, 0]}
        scale={[3.875, 3.487, 2.986]}
      />

      <Lightformer
        form="box"
        intensity={80}
        position={[-14.0, 14.0, -4.0]}
        scale={[0.1, 10.5, 5.5]}
        target={false}
      />
      {/* <Lightformer
        form="box"
        intensity={23}
        position={[14, 14.0, -10.0]}
        scale={[0.1, 5.0, 5.0]}
        target={false}
        light={{ intensity: 100, distance: 8, decay: 2 }}
      /> */}

      <pointLight intensity={20} decay={0.6} position={[14, 12.0, -10.0]} />
      <pointLight intensity={200} decay={2} position={[2, 12.0, -12.0]} />
      {/* <Lightformer
        form="box"
        intensity={80}
        position={[7.0, 8.0, -14.0]}
        scale={[2.5, 2.5, 0.1]}
        target={false}
        light={{ intensity: 100, distance: 28, decay: 2 }}
      /> */}
      {/* <Lightformer
        form="box"
        intensity={20}
        position={[0.0, 15, 0.0]}
        scale={[10, 1, 10]}
        target={false}
        light={{ intensity: 100, distance: 28, decay: 2 }}
      /> */}

      {/* <Lightformer
        form="ring"
        args={[0.4, 0.5, 64]}
        position={[0.2, 6, 4]}
        scale={10}
        color={highlight}
        intensity={35}
      /> */}
      {/* <Lightformer
        form="box"
        intensity={30}
        position={[-10, 10.0, 9.0]}
        scale={[10, 100, 1]}
        target={false}
      /> */}
    </group>
  )
}
