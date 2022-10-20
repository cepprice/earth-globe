class Camera {

    static MIN_ZOOM = 2
    static MAX_ZOOM = 22
    static DEFAULT_FOV = 60

    #canvas

    #zoom = Camera.MIN_ZOOM
    #lat = 0
    #lon = 0
    #heightKm
    #fov = Camera.DEFAULT_FOV

    constructor(canvas) {
        this.#canvas = canvas
        this.#updateHeightKmFromZoom()
        this.#addMouseListeners()
    }

    #updateHeightKmFromZoom() {
        const tilesPerCanvas = MapUtils.CANVAS_SIZE / MapUtils.TILE_SIZE
        const tileWidthKm = MapUtils.getTileWidthKm(this.#zoom, this.#lat, this.#lon)
        this.#heightKm = (tilesPerCanvas * tileWidthKm / 2) / Math.tan(MapUtils.toRadians(this.#fov / 2))
    }

    #addMouseListeners() {
        let trackMovement = false
        let mouseCoords = []

        const getMouseCoords = (event) => {
            const rect = this.#canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const clipX = x / rect.width * 2 - 1;
            const clipY = y / rect.height * -2 + 1;
            return [clipX, clipY];
        }

        this.#canvas.addEventListener("mousedown", (event) => {
            trackMovement = true
            mouseCoords = getMouseCoords(event)
        })
        this.#canvas.addEventListener("mouseup", () => trackMovement = false)
        this.#canvas.addEventListener("mouseout", () => trackMovement = false)

        this.#canvas.addEventListener("mousemove", (event) => {
            if (!trackMovement) {
                return
            }

            const newMouseCoords = getMouseCoords(event)
            const dx = newMouseCoords[0] - mouseCoords[0]
            const dy = newMouseCoords[1] - mouseCoords[1]

            this.#lat = MapUtils.checkLatitude(this.#lat - dy * this.#heightKm / 400)
            this.#lon = MapUtils.checkLongitude(this.#lon - dx * this.#heightKm / 400)

            mouseCoords = newMouseCoords;
        })

        this.#canvas.addEventListener("wheel", (event) => {
            this.#zoom += -event.deltaY * 0.025
            this.#zoom = Math.max(Camera.MIN_ZOOM, Math.min(Camera.MAX_ZOOM, this.#zoom))
            this.#updateHeightKmFromZoom()
        })
    }

    getLatitude() {
        return this.#lat
    }

    getLongitude() {
        return this.#lon
    }

    getFov() {
        return this.#fov
    }

    getHeightKm() {
        return this.#heightKm
    }
}