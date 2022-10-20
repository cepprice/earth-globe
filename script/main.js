const canvas = document.getElementById('webgl-surface')
const gl = canvas.getContext('webgl')
if (!gl) {
    alert('Gl context is null')
} else {
    const camera = new Camera(canvas)
    const glController = new GlController(gl, camera);
    glController.draw()
}
