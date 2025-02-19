import { useCallback, useEffect, useRef, useState } from "react"
import { Content } from "./content"
import { Canvas } from "@react-three/fiber"
import { Scene } from "./scene"

export function Form() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleSubmit = useCallback(() => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      setIsSubmitted(true)
    }, 2000)
  }, [])

  const reflectionStyle = {
    filter: "url(#reflection-filter)",
    willChange: "filter"
  }

  const displacementMapRef = useRef<SVGFEImageElement | null>(null)

  return (
    <div
      className={`min-h-screen bg-black text-white flex flex-col items-center justify-center p-4`}
      ref={containerRef}
    >
      <div className="w-full max-w-4xl mx-auto">
        {/* Original Content */}
        <div className="mb-8">
          <Content
            name={name}
            email={email}
            setName={setName}
            setEmail={setEmail}
            isReflection={false}
            isLoading={isLoading}
            isSubmitted={isSubmitted}
            onSubmit={handleSubmit}
          />
        </div>

        {/* Reflected Content */}
        <div className="relative">
          <div
            className="opacity-30 pointer-events-none"
            style={reflectionStyle}
          >
            <div className="scale-y-[-1]">
              <Content
                name={name}
                email={email}
                setName={setName}
                setEmail={setEmail}
                isReflection={true}
                isLoading={isLoading}
                isSubmitted={isSubmitted}
                onSubmit={() => {}}
              />
            </div>
          </div>
          <Canvas
            dpr={0.5}
            className="!absolute top-0 left-0 !w-full !h-full opacity-20"
            id="displacementCanvasContainer"
          >
            <Scene />
          </Canvas>
        </div>

        {/* SVG Filter */}
        <svg width="0" height="0">
          <filter id="reflection-filter">
            <feImage
              ref={displacementMapRef}
              id="displacementMapImage"
              result="displacementMap"
            />
            <feDisplacementMap
              scale="3"
              in="SourceGraphic"
              in2="displacementMap"
              xChannelSelector="R"
              yChannelSelector="G"
            ></feDisplacementMap>
          </filter>
        </svg>
      </div>
    </div>
  )
}
