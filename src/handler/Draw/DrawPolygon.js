import Measurement from './Measurement'
import Draw from './Draw'
export class Polygon extends Draw {
    constructor(map, options) {
        super(map)
        this.points = []
        this.redoBuffer = []
        this.options = Object.assign({}, {
            color: '#ffff00',
            fillColor: '#3388ff',
            fillOpacity: 0.8,
            weight: 2
        }, options)
        this.type = 'polygon'
        this.options.showMeasurements && Measurement.enable(map)
    }
    _keyDown(e) {
        if (e.keyCode == 90) { //CTRL+Z
            this.redoBuffer.push(this.temp.getLatLngs()[0].pop())
            this.points.pop()
            this.temp.redraw()
        }
        if (e.keyCode == 89) { // CTRL+Y
            if (this.redoBuffer.length) {
                const pop = this.redoBuffer.pop()
                this.temp.addLatLng(pop)
                this.points.push(pop)
            }
        }
    }
    _onMouseUp(e) {
        this.points.push(e.latlng)
    }
    _mouseMove(e) {
        this.temp && this.layer.removeLayer(this.temp)
        this.temp = L.polygon([...this.points, e.latlng], this.options).addTo(this.layer)
    }
    _dblClick(e) {
        if (this.enableDblclick) {
            this.points.splice(this.points.length - 1, 1)
            if (this.points.length < 3) {
                alert('节点数小于三个，请继续绘制！')
            } else {
                this.temp && this.layer.removeLayer(this.temp)
                this.map.off('click', this._onMouseUp, this).off('mousemove', this._mouseMove, this)
                this.feature = L.polygon(this.points, this.options).addTo(this.layer)
                this.finishedCallback && this.finishedCallback(this.feature, this.layer)
                this.points = []
                this.enableDblclick = false
            }
        }
    }
    deactivate() {
        this.active = false
        L.DomEvent.removeListener(document, 'keydown', this._keyDown, this.map)
        this.map.off('click', this._onMouseUp, this).off('mousemove', this._mouseMove, this)
        this.enableDblclick = false
        this.map.getContainer().style.cursor = 'default'
    }
}
export function polygon(map, options) {
    return new Polygon(map, options)
}
export default polygon
