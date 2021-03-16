import { getGuid } from '../utils/CommUtil'
export const Text = L.Marker.extend({
    options: {
        fontSize: '12px',
        color: '#0000ff',
        fontShadowColor: 'none', // 阴影颜色
        background: 'none', // 背景颜色
        minLevel: 0, // 最小可见级别
        maxLevel: 99 // 最大可见级别，设置Infinity在JSON.Stringify时会转换成null
    },
    initialize(latlng, text, options = {}) {
        this._latlng = latlng
        this._enabled = false // 编辑状态
        this.options.id = options.id || 'text_' + getGuid()
        this.options.text = text || ''
        options = Object.assign(this.options, options) // 整合默认参数
        L.setOptions(this, options) // 继承Marker参数
        const { id, fontSize, color, background, fontShadowColor } = this.options
        this.options.icon = L.divIcon({
            html: `<span id=${id} style="padding:2px 4px;white-space:nowrap;font-size:${fontSize};color:${color};background:${background};text-shadow:${fontShadowColor} 1px 0px 2px">${text || ''}</span>`
        })
    },
    setStyle(e) {
        const dom = document.getElementById(this._leaflet_id)
        let { color, fontSize, fontShadowColor, background } = e
        background = background || 'none'
        if (dom) {
            color && ((this.options.color = color), (dom.style.color = color))
            fontSize && ((this.options.fontSize = fontSize), (dom.style.fontSize = fontSize))
            background && ((this.options.background = background), (dom.style.background = background))
            if (fontShadowColor) {
                this.options.fontShadowColor = fontShadowColor
                dom.style['text-shadow'] = fontShadowColor + ' 1px 0px 2px'
            } else {
                this.options.fontShadowColor = 'none'
                dom.style['text-shadow'] = 'none'
            }
        }
        return this
    },
    enableEdit(e) {
        if (!this._enabled) {
            this._enabled = true
            const inputIcon = L.divIcon({
                html: "<input type='text' id='text-input-icon' value='" + this.options.text + "'></input>"
            })
            this.setIcon(inputIcon)
            document.getElementById('text-input-icon').onblur = evt => { // 失去光标完成编辑
                this.options.text = evt.target.value
                setTimeout(() => { // 模拟修改的异步操作,使状态的变更滞后
                    this.disableEdit()
                    e && e(this)
                }, 100)
            }
            document.getElementById('text-input-icon').onkeydown = function (evt) { // 按回车完成编辑
                if (evt.keyCode === 13) {
                    this.options.text = evt.target.value
                    this.blur(evt)
                }
            }
            return this
        }
    },
    disableEdit(e) {
        if (this._enabled) {
            this._enabled = false
            const { id, color, fontSize, fontShadowColor } = this.options
            const textIcon = L.divIcon({
                html: `<span id=${id} style="padding:2px 4px;white-space:nowrap;font-size:${fontSize};color:${color};text-shadow:${fontShadowColor} 1px 2px 3px">${this.options.text}</span>`
            })
            this.setIcon(textIcon)
            e && e(this)
            return this
        }
    },
    onAdd(map) {
        L.Marker.prototype.onAdd.call(this, map)
        this._setZoomVisible(map._zoom)
        map.options.zoomAnimation && map.on('zoomanim', this._animateZoom, this)
    },
    onRemove(map) {
        L.Marker.prototype.onRemove.call(this, map)
        map.options.zoomAnimation && map.off('zoomanim', this._animateZoom, this)
    },
    _animateZoom(e) {
        this._setZoomVisible(e.zoom)
    },
    _setZoomVisible(zoom) {
        const { minLevel, maxLevel } = this.options
        if (minLevel <= zoom && maxLevel > zoom) {
            this._icon.style.display = 'initial'
        } else {
            this._icon.style.display = 'none'
        }
    }
})
export function text(latlng, text, options) {
    return new Text(latlng, text, options)
}
export default text