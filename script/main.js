const canvas = document.getElementById('webgl-surface')
const gl = canvas.getContext('webgl')
if (!gl) {
    alert('Gl context is null')
} else {
    const glController = new GlController(gl);
    glController.draw()
}
