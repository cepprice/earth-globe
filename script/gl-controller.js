const { vec3, mat4 } = glMatrix

const VERTEX_SHADER_SOURCE = `
precision mediump float;

attribute vec3 aVertPosition;
attribute vec4 aColor;
attribute vec2 aTexPosition;

varying vec4 vColor;
varying vec2 vTexPosition;

uniform mat4 uMatrix;

void main() {
    vColor = aColor;
    vTexPosition = aTexPosition;
    gl_Position = uMatrix * vec4(aVertPosition, 1);
}
`

const FRAGMENT_SHADER_SOURCE = `
#define POLE_COLOR vec4(0.81, 0.88, 0.89, 1)

precision mediump float;

varying vec4 vColor;
varying vec2 vTexPosition;

uniform sampler2D uSampler;
uniform lowp int uUseColor;
uniform lowp int uUseTexture;

void main() {
    vec4 color = vec4(uUseColor) * vColor;
    vec4 texture;
    if (vTexPosition.x == -1.0 && vTexPosition.y == -1.0) {
        texture = vec4(uUseTexture) * POLE_COLOR;
    } else {
        texture = vec4(uUseTexture) * texture2D(uSampler, vTexPosition);
    }
    gl_FragColor = color + texture;
}`

class DrawMode {

    constructor(glMode, getColors, getIndices, useTexture) {
        this.glMode = glMode
        this.getColors = getColors
        this.getIndices = getIndices
        this.useTextures = useTexture
    }
}

class GlController {

    #gl
    #program
    #sphere
    #camera
    #uniformLocations
    #textureDrawer

    DrawModes = {
        TRIANGLES: new DrawMode(
            WebGLRenderingContext.TRIANGLES,
            () => this.#sphere.getTriangleColors(),
            () => this.#sphere.getTriangleIndices(),
            true
        ),
        COLORED_FACES: new DrawMode(
            WebGLRenderingContext.TRIANGLES,
            () => this.#sphere.getTriangleColors(),
            () => this.#sphere.getTriangleIndices(),
            false),
        LINES: new DrawMode(
            WebGLRenderingContext.LINES,
            () => this.#sphere.getLineColors(),
            () => this.#sphere.getLineIndices(),
            false
        )
    }

    #drawMode = this.DrawModes.TRIANGLES

    constructor(gl, camera) {
        this.#gl = gl
        this.#program = gl.createProgram()
        this.#sphere = new Sphere()
        this.#camera = camera
        this.#textureDrawer = new TextureSourceDrawer(() => this.#updateTexture())
        this.#init()
    }

    draw() {
        const gl = this.#gl
        const drawMode = this.#drawMode

        const vpMatrix = mat4.create()
        const projectionMatrix = mat4.create()
        const viewMatrix = mat4.create()

        const animate = () => {
            requestAnimationFrame(animate)

            const eye = vec3.fromValues(0, 0, 1 + this.#camera.getHeightKm() / MapUtils.EARTH_RADIUS_KM)
            mat4.lookAt(viewMatrix, eye, vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0))
            mat4.rotateX(viewMatrix, viewMatrix, MapUtils.toRadians(this.#camera.getLatitude()))
            mat4.rotateY(viewMatrix, viewMatrix, -MapUtils.toRadians(this.#camera.getLongitude()) + Math.PI)

            const fovRadians = MapUtils.toRadians(this.#camera.getFov())
            const aspect = gl.canvas.width / gl.canvas.height
            mat4.perspective(projectionMatrix, fovRadians, aspect, 1e-4, 1e4)

            mat4.multiply(vpMatrix, projectionMatrix, viewMatrix)

            gl.uniformMatrix4fv(this.#uniformLocations.matrix, false, vpMatrix)
            gl.drawElements(drawMode.glMode, drawMode.getIndices().length, gl.UNSIGNED_SHORT, 0)
        }

        animate()
    }

    #init() {
        const gl = this.#gl

        this.#attachShaders()
        this.#updateBuffers()

        gl.useProgram(this.#program);
        gl.enable(this.#gl.DEPTH_TEST)
        gl.enable(this.#gl.CULL_FACE)
        gl.cullFace(this.#gl.BACK)
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        this.#uniformLocations = {
            matrix: gl.getUniformLocation(this.#program, 'uMatrix'),
            sampler: gl.getUniformLocation(this.#program, 'uSampler'),
            useColor: gl.getUniformLocation(this.#program, 'uUseColor'),
            useTexture: gl.getUniformLocation(this.#program, 'uUseTexture')
        }

        if (this.#drawMode.useTextures) {
            this.#textureDrawer.drawTexture()
            gl.uniform1i(this.#uniformLocations.useColor, 0)
            gl.uniform1i(this.#uniformLocations.useTexture, 1)
        } else {
            gl.uniform1i(this.#uniformLocations.useColor, 1);
            gl.uniform1i(this.#uniformLocations.useTexture, 0);
        }
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
            vertexPosition: gl.getAttribLocation(this.#program, 'aVertPosition'),
            color: gl.getAttribLocation(this.#program, 'aColor'),
            texturePosition: gl.getAttribLocation(this.#program, 'aTexPosition')
        }

        const vertexBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.#sphere.getVertices()), gl.STATIC_DRAW)
        gl.vertexAttribPointer(attrLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(attrLocations.vertexPosition)

        const colorBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.#drawMode.getColors()), gl.STATIC_DRAW)
        gl.vertexAttribPointer(attrLocations.color, 4, gl.FLOAT, false, 0 , 0)
        gl.enableVertexAttribArray(attrLocations.color)

        const textureBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.#sphere.getTextureCoordinates()), gl.STATIC_DRAW)
        gl.vertexAttribPointer(attrLocations.texturePosition, 2, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(attrLocations.texturePosition)

        const indicesBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.#drawMode.getIndices()), gl.STATIC_DRAW)
    }

    #updateTexture() {
        const gl = this.#gl

        const texture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.#textureDrawer.getTextureSource())
        gl.generateMipmap(gl.TEXTURE_2D)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.uniform1i(this.#uniformLocations.sampler, 0)
    }
}