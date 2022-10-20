class MapUtils {

    static EARTH_RADIUS_KM = 6356

    static MIN_LATITUDE = -85.0511
    static MAX_LATITUDE =  85.0511

    static MIN_LONGITUDE = -180.0
    static MAX_LONGITUDE = 180.0

    static LATITUDE_TURN = 180.0
    static LONGITUDE_TURN = 360.0

    static TILE_SIZE = 256
    static CANVAS_SIZE = 768

    static getTileWidthKm(zoom, lat, lon) {
        const tileX = this.getTileNumberX(zoom, lon)
        const tileY = Math.floor(this.getTileNumberY(zoom, lat))
        return this.getDistance(
            this.getLatitudeFromTile(zoom, tileY),
            this.getLongitudeFromTile(zoom, tileX),
            this.getLatitudeFromTile(zoom, tileY + 1),
            this.getLongitudeFromTile(zoom, tileX)
        )
    }

    static getDistance(lat1, lon1, lat2, lon2) {
        const lat1Rad = this.toRadians(this.checkLatitude(lat1))
        const lat2Rad = this.toRadians(this.checkLatitude(lat2))
        const dLatRad = this.toRadians(this.checkLatitude(lat2 - lat1))
        const dLonRad = this.toRadians(this.checkLongitude(lon2 - lon1))
        const a = Math.sin(dLatRad / 2) * Math.sin(dLatRad / 2)
            + Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLonRad / 2) * Math.sin(dLonRad / 2)
        return 2 * MapUtils.EARTH_RADIUS_KM * Math.asin(Math.sqrt(a))
    }

    static getTileNumberX(zoom, lon) {
        lon = this.checkLongitude(lon)
        const powZoom = this.getPowZoom(zoom)
        const tileX = powZoom * (lon + 180) / 360
        return tileX >= powZoom
            ? powZoom - 0.01
            : tileX
    }

    static getTileNumberY(zoom, lat) {
        const latRadians = this.toRadians(this.checkLatitude(lat))
        const powZoom = this.getPowZoom(zoom)
        const log = Math.log(Math.tan(latRadians) + 1 / Math.cos(latRadians))
        return powZoom * (1 - log / Math.PI) / 2
    }

    static getLatitudeFromTile(zoom, tileY) {
        const powZoom = this.getPowZoom(zoom)
        const sinh = Math.sinh(Math.PI * (1 - 2 * tileY / powZoom))
        return Math.atan(sinh) * 180 / Math.PI
    }

    static getLongitudeFromTile(zoom, tileX) {
        return tileX / this.getPowZoom(zoom) * 360 - 180
    }

    static getPowZoom(zoom) {
        return zoom >= 0 && zoom - Math.floor(zoom) < 0.001
            ? 1 << zoom
            : Math.pow(2, zoom)
    }

    static checkLatitude(lat) {
        while (lat < -90 || lat > 90) {
            lat += lat < 0 ? MapUtils.LATITUDE_TURN : -MapUtils.LATITUDE_TURN
        }
        return this.#checkValue(lat, MapUtils.MIN_LATITUDE, MapUtils.MAX_LATITUDE)
    }

    static checkLongitude(lon) {
        while (lon < -180 || lon > 180) {
            lon += lon < 0 ? MapUtils.LONGITUDE_TURN : -MapUtils.LONGITUDE_TURN
        }
        return this.#checkValue(lon, MapUtils.MIN_LONGITUDE, MapUtils.MAX_LONGITUDE)
    }

    static toRadians(degree) {
        return degree / 180 * Math.PI
    }

    static #checkValue(value, min, max) {
        return Math.max(min, Math.min(max, value))
    }
}