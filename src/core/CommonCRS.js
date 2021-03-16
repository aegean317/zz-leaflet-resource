L.CRS.CommonCRS = L.Proj.CRS.extend({
    options: {
        origin: [-5123200, 10002100],
        resolutions: Array.from({ length: 20 }, (_, i) => Math.PI * 2 * 6378137 / 256 / Math.pow(2, i + 1))
    },
    initialize: function (code, def, options) {
        L.Util.setOptions(this, options)
        code = code ? `EPSG:${code}` : ''
        const { origin, resolutions } = this.options
        L.Proj.CRS.prototype.initialize.call(this, code, def, { origin, resolutions })
        const this_ = this;
        L.Polygon.include({
            getArea: function () {
                return this_.getArea(this)
            }
        })
        L.Polyline.include({
            getLength: function () {
                return this_.getLength(this)
            }
        })
    },
    getArea(polygon) {
        const points = polygon._latlngs[0]
        let len = points.length
        let area2 = 0
        let p1, p2
        if (points != null) {
            let j
            for (let i = 0; i < len; i++) {
                j = (i + 1) % len
                if (points[i].lng > 180 && points[i].lat > 90) {
                    p1 = {
                        x: points[i].lat,
                        y: points[i].lng
                    }
                } else {
                    p1 = this.project(points[i])
                }
                if (points[j].lng > 180 && points[j].lat > 90) {
                    p2 = {
                        x: points[j].lat,
                        y: points[j].lng
                    }
                } else {
                    p2 = this.project(points[j])
                }
                area2 += p1.x * p2.y
                area2 -= p1.y * p2.x
            }
        }
        return Math.abs(area2 / 2)
    },
    getLength(polyline) {
        var points = []
        const coords = polyline._latlngs
        if (polyline instanceof L.Polygon) {
            for (var p = 0; p < coords.length; p++) {
                points.push(...coords[p])
            }
        } else {
            points.push(coords)
        }
        let dist = 0
        let p1, p2
        for (let i = 0, len = points.length - 1; i < len; i++) {
            if (points[i][0] > 180 && points[i][1] > 90) {
                p1 = {
                    x: points[i].lat,
                    y: points[i].lng
                }
            } else {
                p1 = this.project(points[i])
            }
            if (points[i + 1][0] > 180 && points[i + 1][1] > 90) {
                p2 = {
                    x: points[i + 1].lat,
                    y: points[i + 1].lng
                }
            } else {
                p2 = this.project(points[i + 1])
            }
            const x1 = p1.x
            const y1 = p1.y
            const x2 = p2.x
            const y2 = p2.y
            dist += Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2))
        }
        return dist
    }
})