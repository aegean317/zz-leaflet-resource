import Measurement from './Measurement'
import Draw from './Draw'
export class Circle extends Draw {
    constructor(map, options) {
        super(map)
        this.options = Object.assign({}, {
            color: '#ffff00',
            fillColor: '#3388ff',
            fillOpacity: 0.8,
            weight: 2
        }, options)
        this.type = 'circle'
        this.options.showMeasurements && Measurement.enable(map)
    }
    _mouseDown(e) {
        if (!this.map.options.crs) {
            alert('坐标系未定义')
            return
        }
        this.map.off('mousedown', this._mouseDown, this)
        this.map.dragging.disable()
        this.center = e.latlng
    }
    _mouseMove(e) {
        this.temp && this.layer.removeLayer(this.temp)
        if (this.center) {
            this.radius = this.map.options.crs.distance(this.center, e.latlng)
            this.temp = L.circle(this.center, this.radius, this.options).addTo(this.layer)
        }
    }
    _mouseUp(e) {
        this.map.dragging.enable()
        this.temp && this.layer.removeLayer(this.temp)
        if (this.radius) {
            this.feature = L.circle(this.center, this.radius, this.options).addTo(this.layer)
            this.map.off('mousemove', this._mouseMove, this).off('mouseup', this._mouseUp, this)
            this.finishedCallback && this.finishedCallback(this.feature, this.layer)
        }
    }
    deactivate() {
        this.active = false
        this.map.off('mousedown', this._mouseDown, this).off('mousemove', this._mouseMove, this).off('mouseup', this._mouseUp, this)
        this.map.getContainer().style.cursor = 'default'
    }
}
export function circle(map, options) {
    return new Circle(map, options)
}
export default circle