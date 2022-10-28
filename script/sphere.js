const FACE_COLORS_COUNT = 32
const LINE_COLOR = [0.1, 0.61, 0.38, 1]

class Sphere {

    static ZOOM = 6

    #vertices

    #triangleColors
    #lineColors

    #triangleIndices
    #lineIndices

    #textureCoordinates

    constructor() {
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

    getTextureCoordinates() {
        return this.#textureCoordinates
    }

    #calculateVertexData() {
        this.#vertices = []
        this.#triangleColors = []
        this.#lineColors = []
        this.#triangleIndices = []
        this.#lineIndices = []
        this.#textureCoordinates = []

        let vertexIndex = 0
        const faceColors = this.#generateFaceColors()
        const tilesCount = 1 << Sphere.ZOOM

        for (let tileY = -1; tileY <= tilesCount; tileY++) {

            let faceDataComputer
            let topLat
            let bottomLat

            if (tileY === -1) {
                faceDataComputer = new TopPoleFaceDataComputer()
                topLat = 90
                bottomLat = MapUtils.getLatitudeFromTile(Sphere.ZOOM, 0)
            } else if (tileY === tilesCount) {
                faceDataComputer = new BottomPoleFaceDataComputer()
                topLat = MapUtils.getLatitudeFromTile(Sphere.ZOOM, tilesCount)
                bottomLat = -90
            } else {
                faceDataComputer = new TwoTriangleFaceDataComputer()
                topLat = MapUtils.getLatitudeFromTile(Sphere.ZOOM, tileY)
                bottomLat = MapUtils.getLatitudeFromTile(Sphere.ZOOM, tileY + 1)
            }

            for (let tileX = 0; tileX < tilesCount; tileX++) {

                const leftLon = MapUtils.getLongitudeFromTile(Sphere.ZOOM, tileX);
                const rightLon = MapUtils.getLongitudeFromTile(Sphere.ZOOM, tileX + 1);

                const faceColor = faceColors[Math.round(Math.random() * 100) % FACE_COLORS_COUNT]

                faceDataComputer.addVertices(
                    MapUtils.toRadians(90 - topLat),
                    MapUtils.toRadians(90 - bottomLat),
                    MapUtils.toRadians(leftLon + 180),
                    MapUtils.toRadians(rightLon + 180),
                    this.#vertices)
                faceDataComputer.addColors(this.#triangleColors, this.#lineColors, faceColor, LINE_COLOR)
                faceDataComputer.addIndices(this.#triangleIndices, this.#lineIndices, vertexIndex)
                faceDataComputer.addTextureCoordinates(topLat, bottomLat, leftLon, rightLon, this.#textureCoordinates)

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