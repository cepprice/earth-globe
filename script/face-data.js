class FaceDataComputer {

    addVertices(topStackAngle, bottomStackAngle, leftSectorAngle, rightSectorAngle, vertices) {
        FaceDataComputer.#throwException()
    }

    _addVertex(stackAngle, sectorAngle, vertices) {
        const x = Math.sin(stackAngle) * Math.sin(sectorAngle)
        const y = Math.cos(stackAngle)
        const z = Math.sin(stackAngle) * Math.cos(sectorAngle)
        vertices.push(x, y, z)
    }

    addColors(triangleColors, lineColors, triangleColor, lineColor) {
        for (let i = 0; i < this.getVertexCount(); i++) {
            triangleColors.push(...triangleColor)
            lineColors.push(...lineColor)
        }
    }

    getVertexCount() {
        FaceDataComputer.#throwException()
    }

    addIndices(triangleIndices, lineIndices, vertexIndex) {
        FaceDataComputer.#throwException()
    }

    addTextureCoordinates(topLat, bottomLat, leftLon, rightLon, textureCoordinates) {
        FaceDataComputer.#throwException()
    }

    _addVertexNonTextureCoordinates(textureCoordinates) {
        textureCoordinates.push(-1, -1)
    }

    static #throwException() {
        throw new Error("Abstract method not implemented")
    }
}

class TopPoleFaceDataComputer extends FaceDataComputer {

    addVertices(topStackAngle, bottomStackAngle, leftSectorAngle, rightSectorAngle, vertices) {
        this._addVertex(topStackAngle, leftSectorAngle, vertices)
        this._addVertex(bottomStackAngle, leftSectorAngle, vertices)
        this._addVertex(bottomStackAngle, rightSectorAngle, vertices)
    }

    getVertexCount() {
        return 3
    }

    addIndices(triangleIndices, lineIndices, vertexIndex) {
        const top = vertexIndex
        const bottomLeft = vertexIndex + 1
        const bottomRight = vertexIndex + 2

        triangleIndices.push(top, bottomLeft, bottomRight)
        lineIndices.push(top, bottomLeft)
    }

    addTextureCoordinates(topLat, bottomLat, leftLon, rightLon, textureCoordinates) {
        this._addVertexNonTextureCoordinates(textureCoordinates)
        this._addVertexNonTextureCoordinates(textureCoordinates)
        this._addVertexNonTextureCoordinates(textureCoordinates)
    }
}

class TwoTriangleFaceDataComputer extends FaceDataComputer {

    addVertices(topStackAngle, bottomStackAngle, leftSectorAngle, rightSectorAngle, vertices) {
        this._addVertex(topStackAngle, leftSectorAngle, vertices)
        this._addVertex(bottomStackAngle, leftSectorAngle, vertices)
        this._addVertex(topStackAngle, rightSectorAngle, vertices)
        this._addVertex(bottomStackAngle, rightSectorAngle, vertices)
    }

    getVertexCount() {
        return 4
    }

    addIndices(triangleIndices, lineIndices, vertexIndex) {
        const topLeft = vertexIndex
        const bottomLeft = vertexIndex + 1
        const topRight = vertexIndex + 2
        const bottomRight = vertexIndex + 3

        triangleIndices.push(topLeft, bottomLeft, topRight)
        triangleIndices.push(topRight, bottomLeft, bottomRight)

        lineIndices.push(topLeft, bottomLeft)
        lineIndices.push(topLeft, topRight)
    }

    addTextureCoordinates(topLat, bottomLat, leftLon, rightLon, textureCoordinates) {
        TwoTriangleFaceDataComputer.#addVertexTextureCoordinates(topLat, leftLon, textureCoordinates)
        TwoTriangleFaceDataComputer.#addVertexTextureCoordinates(bottomLat, leftLon, textureCoordinates)
        TwoTriangleFaceDataComputer.#addVertexTextureCoordinates(topLat, rightLon, textureCoordinates)
        TwoTriangleFaceDataComputer.#addVertexTextureCoordinates(bottomLat, rightLon, textureCoordinates)
    }

    static #addVertexTextureCoordinates(lat, lon, textureCoordinates) {
        const u = (lon + 180) / 360
        const v = (Math.log(Math.tan(MapUtils.toRadians(lat) / 2 + Math.PI / 4)) + Math.PI) / (2 * Math.PI)
        textureCoordinates.push(u, v)
    }
}

class BottomPoleFaceDataComputer extends FaceDataComputer {

    addVertices(topStackAngle, bottomStackAngle, leftSectorAngle, rightSectorAngle, vertices) {
        this._addVertex(topStackAngle, leftSectorAngle, vertices)
        this._addVertex(bottomStackAngle, leftSectorAngle, vertices)
        this._addVertex(topStackAngle, rightSectorAngle, vertices)
    }

    getVertexCount() {
        return 3
    }

    addIndices(triangleIndices, lineIndices, vertexIndex) {
        const topLeft = vertexIndex
        const bottom = vertexIndex + 1
        const topRight = vertexIndex + 2

        triangleIndices.push(topLeft, bottom, topRight)

        lineIndices.push(topLeft, bottom)
        lineIndices.push(topLeft, topRight)
    }

    addTextureCoordinates(topLat, bottomLat, leftLon, rightLon, textureCoordinates) {
        this._addVertexNonTextureCoordinates(textureCoordinates)
        this._addVertexNonTextureCoordinates(textureCoordinates)
        this._addVertexNonTextureCoordinates(textureCoordinates)
    }
}