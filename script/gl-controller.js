const { mat4 } = glMatrix

const VERTEX_SHADER_SOURCE = `
precision mediump float;

attribute vec3 aPosition;
attribute vec4 aColor;

varying vec4 vColor;

uniform mat4 uMatrix;

void main() {
    vColor = aColor;
    gl_Position = uMatrix * vec4(aPosition, 1);
}
`

const FRAGMENT_SHADER_SOURCE = `
precision mediump float;

varying vec4 vColor;

void main() {
    gl_FragColor = vColor;
}`

class DrawMode {

    constructor(glMode, getColors, getIndices) {
        this.glMode = glMode
        this.getColors = getColors
        this.getIndices = getIndices
    }
}

class GlController {

    #gl
    #program
    #sphere

    DrawModes = {
        COLORED_FACES: new DrawMode(
            gl.TRIANGLES,
            () => this.#sphere.getTriangleColors(),
            () => this.#sphere.getTriangleIndices()),
        LINES: new DrawMode(
            gl.LINES,
            () => this.#sphere.getLineColors(),
            () => this.#sphere.getLineIndices())
    }

    #drawMode = this.DrawModes.COLORED_FACES
    // #drawMode = this.DrawModes.LINES

    constructor(gl) {
        this.#gl = gl
        this.#program = gl.createProgram()
        this.#sphere = new Sphere(20, 20)
        this.#init()
    }

    draw() {
        const gl = this.#gl
        const drawMode = this.#drawMode

        const uniformMatrixLocation = gl.getUniformLocation(this.#program, 'uMatrix')

        const vpMatrix = mat4.create()

        const projectionMatrix = mat4.create()
        const fovRadians = 60 * Math.PI / 180
        const aspect = gl.canvas.width / gl.canvas.height
        mat4.perspective(projectionMatrix, fovRadians, aspect, 1e-4, 1e4)

        const viewMatrix = mat4.create()
        mat4.translate(viewMatrix, viewMatrix, [0, 0, 2.5])
        mat4.invert(viewMatrix, viewMatrix)

        const animate = () => {
            requestAnimationFrame(animate)

            mat4.rotate(viewMatrix, viewMatrix, Math.PI / 360, [1, 1, 1])
            mat4.multiply(vpMatrix, projectionMatrix, viewMatrix)

            gl.uniformMatrix4fv(uniformMatrixLocation, false, vpMatrix)
            gl.drawElements(drawMode.glMode, drawMode.getIndices().length, gl.UNSIGNED_SHORT, 0)
        }

        animate()
    }

    #init() {
        this.#attachShaders()
        this.#updateBuffers()
        this.#gl.useProgram(this.#program)
        this.#gl.enable(this.#gl.DEPTH_TEST)
    }

    #attachShaders() {
        const gl = this.#gl
        const checkShaderCompiled = (shader) => {
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error('Shader compile:\n', gl.getShaderInfoLog(shader))
            }
        }

        const vertexShader = gl.createShader(gl.VERTEX_SHADER)
        gl.shaderSource(vertexShader, VERTEX_SHADER_SOURCE)
        gl.compileShader(vertexShader)
        checkShaderCompiled(vertexShader)

        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
        gl.shaderSource(fragmentShader, FRAGMENT_SHADER_SOURCE)
        gl.compileShader(fragmentShader)
        checkShaderCompiled(fragmentShader)

        gl.attachShader(this.#program, vertexShader)
        gl.attachShader(this.#program, fragmentShader)
        gl.linkProgram(this.#program)
    }

    #updateBuffers() {
        const gl = this.#gl

        const attrLocations = {
            position: gl.getAttribLocation(this.#program, 'aPosition'),
            color: gl.getAttribLocation(this.#program, 'aColor')
        }

        const vertexBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.#sphere.getVertices()), gl.STATIC_DRAW)
        gl.vertexAttribPointer(attrLocations.position, 3, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(attrLocations.position)

        const colorBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.#drawMode.getColors()), gl.STATIC_DRAW)
        gl.vertexAttribPointer(attrLocations.color, 4, gl.FLOAT, false, 0 , 0)
        gl.enableVertexAttribArray(attrLocations.color)

        const indicesBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.#drawMode.getIndices()), gl.STATIC_DRAW)
    }
}