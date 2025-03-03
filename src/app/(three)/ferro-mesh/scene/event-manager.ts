import { Canvas, events, RootState } from "@react-three/fiber"
import { DomEvent } from "@react-three/fiber/dist/declarations/src/core/events"
import * as THREE from "three"

import { valueRemap } from "~/lib/utils/math"

export const hitConfig = {
  scale: 1
}

export const eventManagerFactory: Parameters<typeof Canvas>[0]["events"] = (
  state
) => ({
  // Default configuration
  ...events(state),

  // Determines if the event layer is active
  enabled: true,

  // Event layer priority, higher prioritized layers come first and may stop(-propagate) lower layer
  priority: 1,

  // The filter can re-order or re-structure the intersections
  filter: (items: THREE.Intersection[], _state: RootState) => items,

  // The compute defines how pointer events are translated into the raycaster and pointer vector2
  compute: (event: DomEvent, state: RootState, _previous?: RootState) => {
    let pointerX = (event.offsetX / state.size.width) * 2 - 1
    let pointerY = -(event.offsetY / state.size.height) * 2 + 1

    if (hitConfig.scale !== 1) {
      pointerX = valueRemap(pointerX, -1, 1, 0, hitConfig.scale)
      pointerY = valueRemap(pointerY, -1, 1, 0, hitConfig.scale)

      pointerX = pointerX % 1
      pointerY = pointerY % 1

      pointerX = valueRemap(pointerX, 0, 1, -1, 1)
      pointerY = valueRemap(pointerY, 0, 1, -1, 1)
    }

    state.pointer.set(pointerX, pointerY)
    state.raycaster.setFromCamera(state.pointer, state.camera)
  }

  // Find more configuration default on ./packages/fiber/src/web/events.ts
  // And type definitions in ./packages/fiber/src/core/events.ts
})
