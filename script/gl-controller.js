const { vec3, mat4 } = glMatrix

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
    #camera

    DrawModes = {
        COLORED_FACES: new DrawMode(
            WebGLRenderingContext.TRIANGLES,
            () => this.#sphere.getTriangleColors(),
            () => this.#sphere.getTriangleIndices()),
        LINES: new DrawMode(
            WebGLRenderingContext.LINES,
            () => this.#sphere.getLineColors(),
            () => this.#sphere.getLineIndices())
    }

    // #drawMode = this.DrawModes.COLORED_FACES
    #drawMode = this.DrawModes.LINES

    constructor(gl, camera) {
        this.#gl = gl
        this.#program = gl.createProgram()
        this.#sphere = new Sphere(20, 20)
        this.#camera = camera
        this.#init()
    }

    draw() {
        const gl = this.#gl
        const drawMode = this.#drawMode

        const uniformMatrixLocation = gl.getUniformLocation(this.#program, 'uMatrix')

        const vpMatrix = mat4.create()
        const projectionMatrix = mat4.create()
        const viewMatrix = mat4.create()

        const animate = () => {
            requestAnimationFrame(animate)

            const eye = vec3.fromValues(0, 0, 1 + this.#camera.getHeightKm() / MapUtils.EARTH_RADIUS_KM)
            mat4.lookAt(viewMatrix, eye, vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0))
            mat4.rotateX(viewMatrix, viewMatrix, MapUtils.toRadians(this.#camera.getLatitude()))
            mat4.rotateY(viewMatrix, viewMatrix, -MapUtils.toRadians(this.#camera.getLongitude()))

            const fovRadians = MapUtils.toRadians(this.#camera.getFov())
            const aspect = gl.canvas.width / gl.canvas.height
            mat4.perspective(projectionMatrix, fovRadians, aspect, 1e-4, 1e4)

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
        this.#gl.enable(this.#gl.CULL_FACE)
        this.#gl.cullFace(this.#gl.BACK)
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