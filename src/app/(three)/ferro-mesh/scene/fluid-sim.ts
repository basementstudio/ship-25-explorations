import { calculatePyramid, getPyramidNormal } from "./materials/main-pyramid/fn"

const simHeight = 1
const simWidth = 1

const FLUID_CELL = 0
const AIR_CELL = 1
const SOLID_CELL = 2

export interface Atractor {
  position: [number, number]
  velocity: [number, number]
  radius: number
}

function clamp(x: number, min: number, max: number): number {
  if (x < min) return min
  else if (x > max) return max
  return x
}

const lerp = (a: number, b: number, t: number): number => {
  return a + (b - a) * t
}

export function mix3(
  a: number[],
  b: number[],
  t: number
): [number, number, number] {
  const result = [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t
  ]
  return result as [number, number, number]
}

export function mix4(
  a: number[],
  b: number[],
  t: number
): [number, number, number, number] {
  const result = [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
    a[3] + (b[3] - a[3]) * t
  ]
  return result as [number, number, number, number]
}

const PARTICLE_COLOR_ATTR_COUNT = 4

type ColorRepresentation = [number, number, number, number]

const colorsDark = {
  bumpColor: [0.2, 0.4, 2.0, 1.0] as ColorRepresentation,
  baseColor: [0.1, 0.1, 0.1, 0.0] as ColorRepresentation,
  foamColor: [0.1, 0.1, 0.1, 1.0] as ColorRepresentation
}

const colorsLight = {
  bumpColor: [0.1, 0.1, 4.0, 1.0] as ColorRepresentation,
  baseColor: [0.1, 0.1, 0.1, 0.0] as ColorRepresentation,
  foamColor: [0.1, 0.1, 0.1, 1.0] as ColorRepresentation
}

const particlePosDim = 4
const particlePosLerpDim = 4
const particleNormalDim = 4

// ----------------- start of simulator ------------------------------

class FlipFluid {
  public density: number
  public prevU: Float32Array
  public prevV: Float32Array
  public du: Float32Array
  public dv: Float32Array
  public u: Float32Array
  public v: Float32Array
  public cellType: Int32Array
  public s: Float32Array
  public fNumX: number
  public fNumY: number
  public fInvSpacing: number
  public h: number
  public numParticles: number
  public fNumCells: number
  public cellColor: Float32Array
  public p: Float32Array
  public maxParticles: number
  public particleVel: Float32Array
  public particleDensity: Float32Array
  public particleRestDensity: number
  public particleRadius: number
  public pInvSpacing: number
  public pNumX: number
  public pNumY: number
  public pNumCells: number
  public numCellParticles: Int32Array
  public firstCellParticle: Int32Array
  public cellParticleIds: Int32Array

  // positions
  public particlePos: Float32Array
  public particlePosLerp: Float32Array
  public particleNormal: Float32Array

  // colors
  public particleColor: Float32Array
  public particleFoam: Float32Array
  public particleBump: Float32Array

  // colorSettings
  public bumpColor: ColorRepresentation
  public baseColor: ColorRepresentation
  public foamColor: ColorRepresentation

  public colorSchema: "light" | "dark"

  public setColorSchema(isDark: boolean): void {
    const selectedSchema = isDark ? colorsDark : colorsLight
    this.bumpColor = selectedSchema.bumpColor
    this.baseColor = selectedSchema.baseColor
    this.foamColor = selectedSchema.foamColor
    this.colorSchema = isDark ? "dark" : "light"
  }

  constructor(
    density: number,
    width: number,
    height: number,
    spacing: number,
    particleRadius: number,
    maxParticles: number,
    isDarkMode: boolean
  ) {
    // fluid
    const selectedSchema = isDarkMode ? colorsDark : colorsLight
    this.bumpColor = selectedSchema.bumpColor
    this.baseColor = selectedSchema.baseColor
    this.foamColor = selectedSchema.foamColor
    this.colorSchema = isDarkMode ? "dark" : "light"

    this.density = density
    this.fNumX = Math.floor(width / spacing) + 1
    this.fNumY = Math.floor(height / spacing) + 1
    this.h = Math.max(width / this.fNumX, height / this.fNumY)
    this.fInvSpacing = 1.0 / this.h
    this.fNumCells = this.fNumX * this.fNumY

    this.u = new Float32Array(this.fNumCells)
    this.v = new Float32Array(this.fNumCells)
    this.du = new Float32Array(this.fNumCells)
    this.dv = new Float32Array(this.fNumCells)
    this.prevU = new Float32Array(this.fNumCells)
    this.prevV = new Float32Array(this.fNumCells)
    this.p = new Float32Array(this.fNumCells)
    this.s = new Float32Array(this.fNumCells)
    this.cellType = new Int32Array(this.fNumCells)
    this.cellColor = new Float32Array(3 * this.fNumCells)

    // particles

    this.maxParticles = maxParticles

    this.particlePos = new Float32Array(particlePosDim * this.maxParticles)
    this.particlePos.fill(0.0)

    this.particlePosLerp = new Float32Array(particlePosLerpDim * this.maxParticles)
    this.particlePosLerp.fill(0.0)

    this.particleNormal = new Float32Array(particleNormalDim * this.maxParticles)
    this.particleNormal.fill(0.0)

    this.particleColor = new Float32Array(
      PARTICLE_COLOR_ATTR_COUNT * this.maxParticles
    )
    // for (let i = 0; i < this.maxParticles; i++) {
    //   this.particleColor[3 * i + 2] = 1.0;
    // }

    this.particleFoam = new Float32Array(this.maxParticles)
    this.particleFoam.fill(0.0)

    this.particleBump = new Float32Array(this.maxParticles)
    this.particleBump.fill(0.0)

    this.particleVel = new Float32Array(2 * this.maxParticles)
    this.particleDensity = new Float32Array(this.fNumCells)
    this.particleRestDensity = 0.0

    this.particleRadius = particleRadius
    this.pInvSpacing = 1.0 / (2.2 * particleRadius)
    this.pNumX = Math.floor(width * this.pInvSpacing) + 1
    this.pNumY = Math.floor(height * this.pInvSpacing) + 1
    this.pNumCells = this.pNumX * this.pNumY

    this.numCellParticles = new Int32Array(this.pNumCells)
    this.firstCellParticle = new Int32Array(this.pNumCells + 1)
    this.cellParticleIds = new Int32Array(maxParticles)

    this.numParticles = 0

    // Add bump values array
    this.particleBump = new Float32Array(this.maxParticles)
  }

  integrateParticles(
    dt: number,
    gravity: [number, number],
    atractor?: Atractor
  ): void {
    // console.log(this.particlePos[0], this.particlePos[1])
    const gravityStrength = 0.14
    const dampingFactor = 0.9 // General velocity damping
    const orbitDampingFactor = 0.99 // Stronger damping for orbital motion

    for (let i = 0; i < this.numParticles; i++) {
      const particleIndex = i * particlePosDim

      // Calculate distance vector from particle to gravity point
      const gdx = gravity[0] - this.particlePos[particleIndex]
      const gdy = gravity[1] - this.particlePos[particleIndex + 1]

      // Calculate distance squared
      const gd2 = gdx * gdx + gdy * gdy
      if (gd2 < 0.0001) continue

      const gd = Math.sqrt(gd2)

      // Calculate normalized direction
      const gaX = gdx / gd
      const gaY = gdy / gd

      // Apply gravitational force
      const force = gravityStrength / Math.max(0.1, gd2)
      this.particleVel[2 * i] += gaX * force * dt
      this.particleVel[2 * i + 1] += gaY * force * dt

      // Apply general velocity damping (like air resistance)
      this.particleVel[2 * i] *= dampingFactor
      this.particleVel[2 * i + 1] *= dampingFactor

      // Apply additional orbit damping
      // Calculate the tangential component of velocity (perpendicular to radius)
      // First get current velocity direction
      const velX = this.particleVel[2 * i]
      const velY = this.particleVel[2 * i + 1]

      // Calculate dot product to find radial component
      const radialComponent = velX * gaX + velY * gaY

      // Calculate the tangential (orbital) components
      const tangentialX = velX - radialComponent * gaX
      const tangentialY = velY - radialComponent * gaY

      // Apply stronger damping to the tangential component
      this.particleVel[2 * i] =
        radialComponent * gaX + tangentialX * orbitDampingFactor
      this.particleVel[2 * i + 1] =
        radialComponent * gaY + tangentialY * orbitDampingFactor

      // update velocity attractor
      if (atractor) {
        // Calculate distance vector from particle to attractor
        const dx = this.particlePos[particleIndex] - atractor.position[0]
        const dy = this.particlePos[particleIndex + 1] - atractor.position[1]

        // console.log(this.particlePos[particleIndex]);


        // Calculate distance magnitude
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Skip if too close to avoid division by zero
        if (distance < 0.0001) return

        // Only apply force if within radius
        if (distance < atractor.radius) {
          // console.log('apply');

          // Calculate normalized direction vector and scale by force
          const forceX = atractor.velocity[0] * 20
          const forceY = atractor.velocity[1] * 20

          // Apply force to velocity
          // this.particleVel[2 * i] /= 1.1
          // this.particleVel[2 * i] -= forceX
          // this.particleVel[2 * i + 1] /= 1.1
          // this.particleVel[2 * i + 1] -= forceY

          this.particleVel[2 * i] += forceX * 1
          this.particleVel[2 * i + 1] += forceY * 1
        }
      } else {
      }

      // update position
      this.particlePos[particleIndex] += this.particleVel[2 * i] * dt
      this.particlePos[particleIndex + 1] +=
        this.particleVel[2 * i + 1] * dt

      this.calculateSmoothParticles(this.particlePos[particleIndex], this.particlePos[particleIndex + 1], i)
    }
  }

  // 3d point in space
  public mousePoint: [number, number, number] = [0, 0, 0]

  public particlesScale = 1.2

  calculateSmoothParticles(x: number, y: number, i: number) {
    const particleIndex = i * particlePosLerpDim
    const remapedX = x * this.particlesScale - this.particlesScale / 2
    const remapedY = y * this.particlesScale - this.particlesScale / 2
    // lerp x,z
    this.particlePosLerp[particleIndex] = lerp(this.particlePosLerp[particleIndex], remapedX, 0.1)
    this.particlePosLerp[particleIndex + 2] = lerp(this.particlePosLerp[particleIndex + 2], remapedY, 0.1)
    // update y
    this.particlePosLerp[particleIndex + 1] = calculatePyramid(this.particlePosLerp[particleIndex], this.particlePosLerp[particleIndex + 2])

    // alpha: is active
    const distToMouse = Math.hypot(
      this.particlePosLerp[particleIndex] - this.mousePoint[0],
      this.particlePosLerp[particleIndex + 1] - this.mousePoint[1],
      this.particlePosLerp[particleIndex + 2] - this.mousePoint[2]
    )

    // disable particles when on the ground
    // const particleHFactor = clamp(this.particlePosLerp[particleIndex + 1] * 20, 0.0, 1.0)

    const scale = 10
    const rad = 0.1

    let activeFactror = (1 - clamp(distToMouse * scale - rad, 0.0, 1.0))
    activeFactror = Math.pow(activeFactror, 0.5)

    this.particlePosLerp[particleIndex + 3] = lerp(this.particlePosLerp[particleIndex + 3], activeFactror, 0.1)


    this.particleNormal.set(
      getPyramidNormal(this.particlePosLerp[particleIndex], this.particlePosLerp[particleIndex + 2], this.particlePosLerp[particleIndex + 1]),
      i * particleNormalDim
    )
  }

  pushParticlesApart(numIters: number): void {
    // const colorDiffusionCoeff = 0.01
    const foamDiffusionCoeff = this.colorSchema === "dark" ? 0.1 : 0.01

    // count particles per cell

    this.numCellParticles.fill(0)

    for (let i = 0; i < this.numParticles; i++) {
      const x = this.particlePos[particlePosDim * i]
      const y = this.particlePos[particlePosDim * i + 1]

      const xi = clamp(Math.floor(x * this.pInvSpacing), 0, this.pNumX - 1)
      const yi = clamp(Math.floor(y * this.pInvSpacing), 0, this.pNumY - 1)
      const cellNr = xi * this.pNumY + yi
      this.numCellParticles[cellNr]++
    }

    // partial sums

    let firstParticle = 0

    for (let i = 0; i < this.pNumCells; i++) {
      firstParticle += this.numCellParticles[i]
      this.firstCellParticle[i] = firstParticle
    }
    this.firstCellParticle[this.pNumCells] = firstParticle // guard

    // fill particles into cells

    for (let i = 0; i < this.numParticles; i++) {
      const x = this.particlePos[particlePosDim * i]
      const y = this.particlePos[particlePosDim * i + 1]

      const xi = clamp(Math.floor(x * this.pInvSpacing), 0, this.pNumX - 1)
      const yi = clamp(Math.floor(y * this.pInvSpacing), 0, this.pNumY - 1)
      const cellNr = xi * this.pNumY + yi
      this.firstCellParticle[cellNr]--
      this.cellParticleIds[this.firstCellParticle[cellNr]] = i
    }

    // push particles apart

    const minDist = 0.8 * this.particleRadius
    const minDist2 = minDist * minDist

    for (let iter = 0; iter < numIters; iter++) {
      for (let i = 0; i < this.numParticles; i++) {
        const px = this.particlePos[particlePosDim * i]
        const py = this.particlePos[particlePosDim * i + 1]

        const pxi = Math.floor(px * this.pInvSpacing)
        const pyi = Math.floor(py * this.pInvSpacing)
        const x0 = Math.max(pxi - 1, 0)
        const y0 = Math.max(pyi - 1, 0)
        const x1 = Math.min(pxi + 1, this.pNumX - 1)
        const y1 = Math.min(pyi + 1, this.pNumY - 1)

        for (let xi = x0; xi <= x1; xi++) {
          for (let yi = y0; yi <= y1; yi++) {
            const cellNr = xi * this.pNumY + yi
            const first = this.firstCellParticle[cellNr]
            const last = this.firstCellParticle[cellNr + 1]
            for (let j = first; j < last; j++) {
              const id = this.cellParticleIds[j]
              if (id === i) continue
              const qx = this.particlePos[particlePosDim * id]
              const qy = this.particlePos[particlePosDim * id + 1]

              let dx = qx - px
              let dy = qy - py
              const d2 = dx * dx + dy * dy
              if (d2 > minDist2 || d2 === 0.0) continue
              const d = Math.sqrt(d2)
              const s = (0.2 * (minDist - d)) / d
              dx *= s
              dy *= s
              this.particlePos[particlePosDim * i] -= dx
              this.particlePos[particlePosDim * i + 1] -= dy
              //this.particlePos[particlePosDim * i + 2] = 0
              this.particlePos[particlePosDim * id] += dx
              this.particlePos[particlePosDim * id + 1] += dy
              //this.particlePos[particlePosDim * id + 2] = 0

              // foam
              for (let k = 0; k < 3; k++) {
                const foam0 = this.particleFoam[i]
                const foam1 = this.particleFoam[id]
                const foam = (foam0 + foam1) * 0.5
                this.particleFoam[i] =
                  foam0 + (foam - foam0) * foamDiffusionCoeff
                foam0 + (foam - foam0) * foamDiffusionCoeff
                this.particleFoam[id] =
                  foam1 + (foam - foam1) * foamDiffusionCoeff
              }
            }
          }
        }
      }
    }
  }

  handleParticleCollisions(
    obstacleX: number,
    obstacleY: number,
    obstacleRadius: number
  ): void {
    const h = 1.0 / this.fInvSpacing
    const r = this.particleRadius
    // const or = obstacleRadius;
    // const or2 = or * or;
    const minDist = obstacleRadius + r
    const minDist2 = minDist * minDist

    const minX = h + r
    const maxX = (this.fNumX - 1) * h - r
    const minY = h + r
    const maxY = (this.fNumY - 1) * h - r

    for (let i = 0; i < this.numParticles; i++) {
      let x = this.particlePos[particlePosDim * i]
      let y = this.particlePos[particlePosDim * i + 1]

      const dx = x - obstacleX
      const dy = y - obstacleY
      const d2 = dx * dx + dy * dy

      // obstacle collision

      if (d2 < minDist2) {
        // var d = Math.sqrt(d2);
        // var s = (minDist - d) / d;
        // x += dx * s;
        // y += dy * s;

        this.particleVel[2 * i] = scene.obstacleVelX
        this.particleVel[2 * i + 1] = scene.obstacleVelY
      }

      // wall collisions

      if (x < minX) {
        x = minX
        this.particleVel[2 * i] = -this.particleVel[2 * i] * 0.5 // Bounce with energy loss
      }
      if (x > maxX) {
        x = maxX
        this.particleVel[2 * i] = -this.particleVel[2 * i] * 0.5 // Bounce with energy loss
      }
      if (y < minY) {
        y = minY
        this.particleVel[2 * i + 1] = -this.particleVel[2 * i + 1] * 0.5 // Bounce with energy loss
      }
      if (y > maxY) {
        y = maxY
        this.particleVel[2 * i + 1] = -this.particleVel[2 * i + 1] * 0.5 // Bounce with energy loss
      }
      this.particlePos[particlePosDim * i] = x
      this.particlePos[particlePosDim * i + 1] = y
      //this.particlePos[particlePosDim * i + 2] = 0
    }
  }

  updateParticleDensity(): void {
    const n = this.fNumY
    const h = this.h
    const h1 = this.fInvSpacing
    const h2 = 0.5 * h

    const d = this.particleDensity

    d.fill(0.0)

    for (let i = 0; i < this.numParticles; i++) {
      let x = this.particlePos[particlePosDim * i]
      let y = this.particlePos[particlePosDim * i + 1]

      x = clamp(x, h, (this.fNumX - 1) * h)
      y = clamp(y, h, (this.fNumY - 1) * h)

      const x0 = Math.floor((x - h2) * h1)
      const tx = (x - h2 - x0 * h) * h1
      const x1 = Math.min(x0 + 1, this.fNumX - 2)

      const y0 = Math.floor((y - h2) * h1)
      const ty = (y - h2 - y0 * h) * h1
      const y1 = Math.min(y0 + 1, this.fNumY - 2)

      const sx = 1.0 - tx
      const sy = 1.0 - ty

      if (x0 < this.fNumX && y0 < this.fNumY) d[x0 * n + y0] += sx * sy
      if (x1 < this.fNumX && y0 < this.fNumY) d[x1 * n + y0] += tx * sy
      if (x1 < this.fNumX && y1 < this.fNumY) d[x1 * n + y1] += tx * ty
      if (x0 < this.fNumX && y1 < this.fNumY) d[x0 * n + y1] += sx * ty
    }

    if (this.particleRestDensity === 0.0) {
      let sum = 0.0
      let numFluidCells = 0

      for (let i = 0; i < this.fNumCells; i++) {
        if (this.cellType[i] === FLUID_CELL) {
          sum += d[i]
          numFluidCells++
        }
      }

      if (numFluidCells > 0) this.particleRestDensity = sum / numFluidCells
    }
  }

  transferVelocities(
    params:
      | {
        toGrid: false
        flipRatio: number
      }
      | {
        toGrid: true
      }
  ): void {
    const n = this.fNumY
    const h = this.h
    const h1 = this.fInvSpacing
    const h2 = 0.5 * h
    if (params.toGrid) {
      this.prevU.set(this.u)
      this.prevV.set(this.v)

      this.du.fill(0.0)
      this.dv.fill(0.0)
      this.u.fill(0.0)
      this.v.fill(0.0)

      for (let i = 0; i < this.fNumCells; i++) {
        this.cellType[i] = this.s[i] === 0.0 ? SOLID_CELL : AIR_CELL
      }

      for (let i = 0; i < this.numParticles; i++) {
        const x = this.particlePos[particlePosDim * i]
        const y = this.particlePos[particlePosDim * i + 1]
        const xi = clamp(Math.floor(x * h1), 0, this.fNumX - 1)
        const yi = clamp(Math.floor(y * h1), 0, this.fNumY - 1)
        const cellNr = xi * n + yi
        if (this.cellType[cellNr] === AIR_CELL) {
          this.cellType[cellNr] = FLUID_CELL
        }
      }
    }

    for (let component = 0; component < 2; component++) {
      const dx = component === 0 ? 0.0 : h2
      const dy = component === 0 ? h2 : 0.0

      const f = component === 0 ? this.u : this.v
      const prevF = component === 0 ? this.prevU : this.prevV
      const d = component === 0 ? this.du : this.dv

      for (let i = 0; i < this.numParticles; i++) {
        let x = this.particlePos[particlePosDim * i]
        let y = this.particlePos[particlePosDim * i + 1]

        x = clamp(x, h, (this.fNumX - 1) * h)
        y = clamp(y, h, (this.fNumY - 1) * h)

        const x0 = Math.min(Math.floor((x - dx) * h1), this.fNumX - 2)
        const tx = (x - dx - x0 * h) * h1
        const x1 = Math.min(x0 + 1, this.fNumX - 2)

        const y0 = Math.min(Math.floor((y - dy) * h1), this.fNumY - 2)
        const ty = (y - dy - y0 * h) * h1
        const y1 = Math.min(y0 + 1, this.fNumY - 2)

        const sx = 1.0 - tx
        const sy = 1.0 - ty

        const d0 = sx * sy
        const d1 = tx * sy
        const d2 = tx * ty
        const d3 = sx * ty

        const nr0 = x0 * n + y0
        const nr1 = x1 * n + y0
        const nr2 = x1 * n + y1
        const nr3 = x0 * n + y1

        if (params.toGrid) {
          const pv = this.particleVel[2 * i + component]
          f[nr0] += pv * d0
          d[nr0] += d0
          f[nr1] += pv * d1
          d[nr1] += d1
          f[nr2] += pv * d2
          d[nr2] += d2
          f[nr3] += pv * d3
          d[nr3] += d3
        } else {
          const offset = component === 0 ? n : 1
          const valid0 =
            this.cellType[nr0] !== AIR_CELL ||
              this.cellType[nr0 - offset] !== AIR_CELL
              ? 1.0
              : 0.0
          const valid1 =
            this.cellType[nr1] !== AIR_CELL ||
              this.cellType[nr1 - offset] !== AIR_CELL
              ? 1.0
              : 0.0
          const valid2 =
            this.cellType[nr2] !== AIR_CELL ||
              this.cellType[nr2 - offset] !== AIR_CELL
              ? 1.0
              : 0.0
          const valid3 =
            this.cellType[nr3] !== AIR_CELL ||
              this.cellType[nr3 - offset] !== AIR_CELL
              ? 1.0
              : 0.0

          const v = this.particleVel[2 * i + component]
          const dd = valid0 * d0 + valid1 * d1 + valid2 * d2 + valid3 * d3

          if (dd > 0.0) {
            const picV =
              (valid0 * d0 * f[nr0] +
                valid1 * d1 * f[nr1] +
                valid2 * d2 * f[nr2] +
                valid3 * d3 * f[nr3]) /
              dd
            const corr =
              (valid0 * d0 * (f[nr0] - prevF[nr0]) +
                valid1 * d1 * (f[nr1] - prevF[nr1]) +
                valid2 * d2 * (f[nr2] - prevF[nr2]) +
                valid3 * d3 * (f[nr3] - prevF[nr3])) /
              dd
            const flipV = v + corr

            this.particleVel[2 * i + component] =
              (1.0 - params.flipRatio) * picV + params.flipRatio * flipV
          }
        }
      }

      if (params.toGrid) {
        for (let i = 0; i < f.length; i++) {
          if (d[i] > 0.0) f[i] /= d[i]
        }

        // restore solid cells

        for (let i = 0; i < this.fNumX; i++) {
          for (let j = 0; j < this.fNumY; j++) {
            const solid = this.cellType[i * n + j] === SOLID_CELL
            if (
              solid ||
              (i > 0 && this.cellType[(i - 1) * n + j] === SOLID_CELL)
            ) {
              this.u[i * n + j] = this.prevU[i * n + j]
            }
            if (
              solid ||
              (j > 0 && this.cellType[i * n + j - 1] === SOLID_CELL)
            ) {
              this.v[i * n + j] = this.prevV[i * n + j]
            }
          }
        }
      }
    }
  }

  solveIncompressibility(
    numIters: number,
    dt: number,
    overRelaxation: number,
    compensateDrift = true
  ): void {
    this.p.fill(0.0)
    this.prevU.set(this.u)
    this.prevV.set(this.v)

    const n = this.fNumY
    const cp = (this.density * this.h) / dt

    for (let iter = 0; iter < numIters; iter++) {
      for (let i = 1; i < this.fNumX - 1; i++) {
        for (let j = 1; j < this.fNumY - 1; j++) {
          if (this.cellType[i * n + j] !== FLUID_CELL) continue

          const center = i * n + j
          const left = (i - 1) * n + j
          const right = (i + 1) * n + j
          const bottom = i * n + j - 1
          const top = i * n + j + 1

          let s = this.s[center]
          const sx0 = this.s[left]
          const sx1 = this.s[right]
          const sy0 = this.s[bottom]
          const sy1 = this.s[top]
          s = sx0 + sx1 + sy0 + sy1
          if (s === 0.0) continue

          let div =
            this.u[right] - this.u[center] + this.v[top] - this.v[center]

          if (this.particleRestDensity > 0.0 && compensateDrift) {
            const k = 1.0
            const compression =
              this.particleDensity[i * n + j] - this.particleRestDensity
            if (compression > 0.0) div = div - k * compression
          }

          let p = -div / s
          p *= overRelaxation
          this.p[center] += cp * p
          this.u[center] -= sx0 * p
          this.u[right] += sx1 * p
          this.v[center] -= sy0 * p
          this.v[top] += sy1 * p
        }
      }
    }
  }

  updateParticleFoam(i: number): void {
    const h1 = this.fInvSpacing
    const foamDecay = 0.01 // How fast the foam fades
    const x = this.particlePos[particlePosDim * i]
    const y = this.particlePos[particlePosDim * i + 1]
    const xi = clamp(Math.floor(x * h1), 1, this.fNumX - 1)
    const yi = clamp(Math.floor(y * h1), 1, this.fNumY - 1)
    const cellNr = xi * this.fNumY + yi
    const d0 = this.particleRestDensity

    if (d0 > 0.0) {
      const relDensity = this.particleDensity[cellNr] / d0
      if (relDensity < 0.7) {
        this.particleFoam[i] = 1
      }
    }

    this.particleFoam[i] -= foamDecay //foam decay
    this.particleFoam[i] = clamp(this.particleFoam[i], 0.0, 1.0)
  }

  updateParticleBump(i: number): void {
    const bumpDecay = 0.1 // How fast the bump fades
    const velocityScale = 0.02 // How much velocity affects the bump
    // Calculate velocity magnitude and update bump
    const velX = this.particleVel[2 * i]
    const velY = this.particleVel[2 * i + 1]
    const velocityMagnitude = Math.sqrt(velX * velX + velY * velY)

    // Add to bump based on velocity
    this.particleBump[i] =
      this.particleBump[i] + velocityMagnitude * velocityScale

    // Decay bump value
    this.particleBump[i] = Math.max(0, this.particleBump[i] - bumpDecay)
    this.particleBump[i] = clamp(this.particleBump[i], 0.0, 5.0)
  }

  updateParticleColors(): void {
    const bumpColor = this.bumpColor // Blue color for velocity bump
    const baseColor = this.baseColor // Base color
    const foamColor = this.foamColor // Foam color

    const colorAttrCount = 4

    for (let i = 0; i < this.numParticles; i++) {
      this.updateParticleFoam(i)
      this.updateParticleBump(i)

      // Mix colors
      let currentColor = [...baseColor]
      const foam = this.particleFoam[i]
      const bump = this.particleBump[i]
      currentColor = mix4(currentColor, foamColor, foam)
      currentColor = mix4(currentColor, bumpColor, bump)
      currentColor[3] = clamp(currentColor[3], 0.0, 1.0)

      this.particleColor.set(currentColor, i * colorAttrCount)
    }
  }

  simulate(
    dt: number,
    gravity: [number, number],
    flipRatio: number,
    numPressureIters: number,
    numParticleIters: number,
    overRelaxation: number,
    compensateDrift: boolean,
    separateParticles: boolean,
    obstacleX: number,
    obstacleY: number,
    obstacleRadius: number,
    attractor?: Atractor
  ): void {
    const numSubSteps = 1
    const sdt = dt / numSubSteps

    for (let step = 0; step < numSubSteps; step++) {
      this.integrateParticles(sdt, gravity, attractor)
      if (separateParticles) this.pushParticlesApart(numParticleIters)
      this.handleParticleCollisions(obstacleX, obstacleY, obstacleRadius)
      this.transferVelocities({ toGrid: true })
      this.updateParticleDensity()
      this.solveIncompressibility(
        numPressureIters,
        sdt,
        overRelaxation,
        compensateDrift
      )
      this.transferVelocities({ toGrid: false, flipRatio })
    }

    this.updateParticleColors()
  }
}

// ----------------- end of simulator ------------------------------

let f: FlipFluid | null = null

const MAX_DT = 1.0 / 25.0
const MIN_DT = 1 / 60

const scene = {
  gravity: [0.5, 0.6] as [number, number],
  dt: MAX_DT, // prevent delta to be too big
  flipRatio: 0.9,
  numPressureIters: 100,
  numParticleIters: 2,
  frameNr: 0,
  overRelaxation: 1.9,
  compensateDrift: true,
  separateParticles: true,
  obstacleX: 0.0,
  obstacleY: 0.0,
  obstacleRadius: 0.15,
  showObstacle: true,
  obstacleVelX: 0.0,
  obstacleVelY: 0.0,
  showParticles: true,
  showGrid: false,
  fluid: null as FlipFluid | null,
  numX: 0,
  numY: 0
}

interface SetupSceneOptions {
  isDarkMode: boolean
}

const numX = 2 * 2 * 2 * 2
const numY = 2 * 2 * 2 * 2
export const maxParticles = numX * numY

export function setupScene({ isDarkMode }: SetupSceneOptions): typeof scene {
  scene.obstacleRadius = 0.15
  scene.overRelaxation = 1.9

  scene.dt = 1.0 / 60.0
  scene.numPressureIters = 50
  scene.numParticleIters = 2

  const res = 35

  const tankHeight = Number(simHeight)
  const tankWidth = Number(simWidth)
  const h = tankHeight / res
  const density = 10.0

  // dam break

  // compute number of particles

  const r = 1.9 * h // particle radius w.r.t. cell size

  scene.numX = numX
  scene.numY = numY

  // create fluid

  f = new FlipFluid(
    density,
    tankWidth,
    tankHeight,
    h,
    r,
    maxParticles,
    isDarkMode
  )
  scene.fluid = f
  f.numParticles = numX * numY

  // create initial particle post

  const getVogel = (current: number, total: number, radius: number) => {
    const angle = (current / total) * Math.PI * 2
    const x = 0.5 + Math.cos(angle) * radius
    const y = 0.5 + Math.sin(angle) * radius
    return [x, y]
  }

  let p = 0

  for (let i = 0; i < numX; i++) {
    for (let j = 0; j < numY; j++) {
      const [x, y] = getVogel(p, maxParticles, 0.1)
      f.particlePos[p * particlePosDim] = x
      f.particlePos[p * particlePosDim + 1] = y
      p++
    }
  }

  // setup grid cells for tank

  const n = f.fNumY

  for (let i = 0; i < f.fNumX; i++) {
    for (let j = 0; j < f.fNumY; j++) {
      let s = 1.0 // fluid
      if (i === 0 || i === f.fNumX - 1 || j === 0) s = 0.0 // solid
      f.s[i * n + j] = s
    }
  }

  setObstacle(3.0, 2.0, true)
  return scene
}

export function setObstacle(x: number, y: number, reset: boolean): void {
  if (!f) return
  let vx = 0.0
  let vy = 0.0

  if (!reset) {
    vx = (x - scene.obstacleX) / scene.dt
    vy = (y - scene.obstacleY) / scene.dt
  }

  scene.obstacleX = x
  scene.obstacleY = y

  scene.showObstacle = true
  scene.obstacleVelX = vx
  scene.obstacleVelY = vy
}

// main -------------------------------------------------------

export function simulate(dt: number, attractor?: Atractor): void {
  if (!scene.fluid) return
  scene.fluid.simulate(
    Math.max(MIN_DT, Math.min(MAX_DT, dt)),
    scene.gravity,
    scene.flipRatio,
    scene.numPressureIters,
    scene.numParticleIters,
    scene.overRelaxation,
    scene.compensateDrift,
    scene.separateParticles,
    scene.obstacleX,
    scene.obstacleY,
    scene.obstacleRadius,
    attractor
  )
  scene.frameNr++
}
