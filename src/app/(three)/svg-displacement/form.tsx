import { useCallback, useEffect, useRef, useState } from "react"
import { Content } from "./content"
import { Canvas } from "@react-three/fiber"
import { Scene } from "./scene"

export function Form() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [nameFocused, setNameFocused] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
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
  const [formOuterContainer, setFormOuterContainer] =
    useState<HTMLDivElement | null>(null)
  const [formInnerContainer, setFormInnerContainer] =
    useState<HTMLDivElement | null>(null)

  const [displacementMapHeight, setDisplacementMapHeight] = useState(0)

  useEffect(() => {
    if (!formOuterContainer || !formInnerContainer) return
    const controller = new AbortController()
    const signal = controller.signal
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      const { height } = entry.contentRect
      formOuterContainer.style.minHeight = `${height * 2}px`
    })
    observer.observe(formInnerContainer)
    return () => {
      controller.abort()
      observer.disconnect()
    }
  }, [formOuterContainer, formInnerContainer])

  return (
    <div
      className={`min-h-screen bg-black text-white flex flex-col items-center justify-center p-4`}
      ref={containerRef}
    >
      <div className="w-full max-w-4xl mx-auto">
        <div className="relative">
          <div
            className="relative"
            ref={setFormOuterContainer}
            style={reflectionStyle}
          >
            {/* Original Content */}
            <div className="relative" ref={setFormInnerContainer}>
              <Content
                name={name}
                email={email}
                setName={setName}
                setEmail={setEmail}
                nameFocused={nameFocused}
                emailFocused={emailFocused}
                setNameFocused={setNameFocused}
                setEmailFocused={setEmailFocused}
                isReflection={false}
                isLoading={isLoading}
                isSubmitted={isSubmitted}
                onSubmit={handleSubmit}
              />
            </div>
          </div>
          <Canvas
            dpr={0.5}
            className="!absolute top-0 left-0 !w-full !h-full opacity-10 !pointer-events-none"
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
              scale="500"
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
