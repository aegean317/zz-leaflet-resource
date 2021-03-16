import Measurement from './Measurement'
import Draw from './Draw'
export class Rectangle extends Draw {
    constructor(map, options) {
        super(map)
        this.options = Object.assign({}, {
            color: '#ffff00',
            fillColor: '#3388ff',
            fillOpacity: 0.8,
            weight: 2
        }, options)
        this.type = 'rectangle'
        this.options.showMeasurements && Measurement.enable(map)
    }
    _mouseDown(e) {
        this.map.off('mousedown', this._mouseDown, this)
        this.map.dragging.disable()
        this.startPoint = e.latlng
    }
    _mouseMove(e) {
        this.temp && this.layer.removeLayer(this.temp)
        if (this.startPoint) {
            this.endPoint = e.latlng
            this.temp = L.rectangle([this.startPoint, this.endPoint], this.options).addTo(this.layer)
        }
    }
    _mouseUp(e) {
        this.map.dragging.enable()
        this.temp && this.layer.removeLayer(this.temp)
        if (this.endPoint) {
            this.feature = L.rectangle([this.startPoint, this.endPoint], this.options).addTo(this.layer)
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
export function rectangle(map, options) {
    return new Rectangle(map, options)
}
export default rectangle
