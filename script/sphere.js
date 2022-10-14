const MIN_STACK_COUNT = 4
const MIN_SECTOR_COUNT = 6

const MAX_STACK_COUNT = 100
const MAX_SECTOR_COUNT = 100

const STACK_ANGLE_RANGE = Math.PI
const SECTOR_ANGLE_RANGE = Math.PI * 2

const FACE_COLORS_COUNT = 32
const LINE_COLOR = [0.1, 0.61, 0.38, 1]

class Sphere {

    #stackCount
    #sectorCount

    #vertices

    #triangleColors
    #lineColors

    #triangleIndices
    #lineIndices

    constructor(stackCount, sectorCount) {
        this.setParams(stackCount, sectorCount)
    }

    setParams(stackCount, sectorCount) {
        const checkValue = (value, min, max) => Math.min(max, Math.max(min, value))
        this.#stackCount = checkValue(stackCount, MIN_STACK_COUNT, MAX_STACK_COUNT)
        this.#sectorCount = checkValue(sectorCount, MIN_SECTOR_COUNT, MAX_SECTOR_COUNT)
        this.#calculateVertexData()
    }

    getVertices() {
        return this.#vertices
    }

    getTriangleColors() {
        return this.#triangleColors
    }

    getLineColors() {
        return this.#lineColors
    }

    getTriangleIndices() {
        return this.#triangleIndices
    }

    getLineIndices() {
        return this.#lineIndices
    }

    #calculateVertexData() {
        this.#vertices = []
        this.#triangleColors = []
        this.#lineColors = []
        this.#triangleIndices = []
        this.#lineIndices = []

        let vertexIndex = 0
        const faceColors = this.#generateFaceColors()

        const topPoleFaceDataComputer = new TopPoleFaceDataComputer()
        const twoTriangleFaceDataComputer = new TwoTriangleFaceDataComputer()
        const bottomPoleFaceDataComputer = new BottomPoleFaceDataComputer()
        const getFaceDataComputer = (topPole, bottomPole) => {
            if (topPole) {
                return topPoleFaceDataComputer
            } else if (bottomPole) {
                return bottomPoleFaceDataComputer
            } else {
                return twoTriangleFaceDataComputer
            }
        }

        for (let stack = 0; stack < this.#stackCount; stack++) {

            const topPoleTriangle = stack === 0
            const bottomPoleTriangle = stack + 1 === this.#stackCount
            const faceDataComputer = getFaceDataComputer(topPoleTriangle, bottomPoleTriangle)

            const topStackAngle = STACK_ANGLE_RANGE * (stack / this.#stackCount)
            const bottomStackAngle = STACK_ANGLE_RANGE * ((stack + 1) / this.#stackCount)

            for (let sector = 0; sector < this.#sectorCount; sector++) {

                const leftSectorAngle = SECTOR_ANGLE_RANGE * (sector / this.#sectorCount)
                const rightSectorAngle = SECTOR_ANGLE_RANGE * ((sector + 1) / this.#sectorCount)

                const faceColor = faceColors[Math.round(Math.random() * 100) % FACE_COLORS_COUNT]

                faceDataComputer.addVertices(topStackAngle, bottomStackAngle, leftSectorAngle, rightSectorAngle, this.#vertices)
                faceDataComputer.addColors(this.#triangleColors, this.#lineColors, faceColor, LINE_COLOR)
                faceDataComputer.addIndices(this.#triangleIndices, this.#lineIndices, vertexIndex)

                vertexIndex += faceDataComputer.getVertexCount()
            }
        }
    }

    #generateFaceColors() {
        const colors = []
        const hRange = 360
        const f = (h, n, k = (n + h / 60) % 6) => 1 - Math.max(Math.min(k, 4 - k, 1), 0)
        for (let i = 0; i < FACE_COLORS_COUNT; i++) {
            const h = i * (hRange / FACE_COLORS_COUNT)
            colors.push([f(h, 5), f(h, 3), f(h,1), 1])
        }
        return colors
    }
}