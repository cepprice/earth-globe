class TextureSourceDrawer {

    static #TILE_SOURCE_URL = 'https://tile.openstreetmap.org'
    static #TILE_EXT = '.png'

    static TILES_ZOOM = 4
    static TILES_COUNT = 1 << TextureSourceDrawer.TILES_ZOOM

    static #MIN_TILES_TO_UPDATE_TEXTURE = 16

    #canvas
    #context

    #listener

    constructor(onSourceUpdatedListener) {
        this.#canvas = document.createElement('canvas')
        this.#canvas.width = TextureSourceDrawer.TILES_COUNT * MapUtils.TILE_SIZE
        this.#canvas.height = TextureSourceDrawer.TILES_COUNT * MapUtils.TILE_SIZE
        this.#context = this.#canvas.getContext('2d')
        this.#listener = onSourceUpdatedListener
    }

    getTextureSource() {
        return this.#canvas
    }

    drawTexture() {
        this.#drawPlaceholder()
        this.#listener()
        this.#drawMapTiles()
    }

    #drawPlaceholder() {
        const canvas = this.#canvas
        const context = this.#context

        context.fillStyle = "#fff"
        context.fillRect(0, 0, canvas.width, canvas.height)

        context.strokeStyle = "#000"
        const step = MapUtils.TILE_SIZE / 8

        for (let x = 0; x < canvas.width; x += step) {
            context.beginPath()
            context.moveTo(x, 0)
            context.lineTo(x, canvas.height)
            context.stroke()
        }

        for (let y = 0; y < canvas.height; y += step) {
            context.beginPath()
            context.moveTo(0, y)
            context.lineTo(canvas.width, y)
            context.stroke()
        }
    }

    #drawMapTiles() {
        const context = this.#context

        let loadedTiles = 0

        for (let tileX = 0; tileX < TextureSourceDrawer.TILES_COUNT; tileX++) {

            for (let tileY = 0; tileY < TextureSourceDrawer.TILES_COUNT; tileY++) {

                const tileImage = new Image()
                tileImage.onload = () => {
                    const dx = tileX * MapUtils.TILE_SIZE
                    const dy = tileY * MapUtils.TILE_SIZE
                    context.drawImage(tileImage, dx, dy, MapUtils.TILE_SIZE, MapUtils.TILE_SIZE)

                    loadedTiles++
                    const notifyListener = TextureSourceDrawer.TILES_COUNT < TextureSourceDrawer.#MIN_TILES_TO_UPDATE_TEXTURE
                        || loadedTiles % TextureSourceDrawer.#MIN_TILES_TO_UPDATE_TEXTURE === 0
                    if (notifyListener) {
                        this.#listener()
                    }
                }
                tileImage.crossOrigin = 'anonymous';
                tileImage.src = `${TextureSourceDrawer.#TILE_SOURCE_URL}/${TextureSourceDrawer.TILES_ZOOM}/${tileX}/${tileY}${TextureSourceDrawer.#TILE_EXT}`
            }
        }
    }
}