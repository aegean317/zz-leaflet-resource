import Draw from './Draw'
export class Point extends Draw {
    constructor(map, options) {
        super(map)
        this.options = Object.assign({}, {
            radius: 4,
            color: '#ffff00',
            fillColor: '#ff0000',
            fillOpacity: 1,
            weight: 1
        }, options)
        this.type = 'point'
    }
    _mouseDown(e) {
        this.feature = L.circleMarker(e.latlng, this.options).addTo(this.layer)
        this.finishedCallback && this.finishedCallback(this.feature, this.layer)
    }
    deactivate() {
        this.active = false
        this.map.off('click', this._mouseDown, this)
        this.map.getContainer().style.cursor = 'default'
    }
}
export function point(map, options) {
    return new Point(map, options)
}
export default point