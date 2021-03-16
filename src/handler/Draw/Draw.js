export default class Draw {
    constructor(map) {
        this.map = map
        this.temp = null
        this.feature = null
        this.finishedCallback = null
        this.active = false
        this.layer = this.map.mapUtil.drawLayer
    }
    activate(callback) {
        this.active = true
        this.finishedCallback = callback;
        if (this.type == L.Draw.Type.RECTANGLE || this.type == L.Draw.Type.CIRCLE) {
            this.map.on('mousedown', this._mouseDown, this)
                .on('mousemove', this._mouseMove, this)
                .on('mouseup', this._mouseUp, this)
        } else if (this.type == L.Draw.Type.POLYGON || this.type == L.Draw.Type.POLYLINE) {
            this.map.off('mouseup').on('mouseup', this._onMouseUp, this)
                .on('mousemove', this._mouseMove, this)
            L.DomEvent.addListener(document, 'keydown', this._keyDown, this)
            // chrome下dblclick偶尔会失灵，需要清除缓存解决，参见https://github.com/Leaflet/Leaflet/issues/4127
            // this.map.on('dblclick', this._dblclick, this)
            // 以下代码为原生绑定事件
            this.enableDblclick = true
            this.map._container.addEventListener('dblclick', this._dblClick.bind(this))
        } else if (this.type == L.Draw.Type.POINT || this.type == L.Draw.Type.TEXT) {
            this.map.off('click').on('click', this._mouseDown, this)
        }
    }
    destory() {
        this.feature && this.layer.removeLayer(this.feature)
    }
    setOption(option) {
        this.options = Object.assign(this.options, option)
    }
}