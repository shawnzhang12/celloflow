// src/components/CelloModel.tsx
import { useGLTF } from '@react-three/drei'

export default function CelloModel(props: any) {
  const { scene } = useGLTF('/models/cello.glb')
  return <primitive object={scene} {...props} />
}
/* Three.js caches the asset after first load */

/* "Cello" (https://skfb.ly/ovOvz) by Lordricker is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/). */