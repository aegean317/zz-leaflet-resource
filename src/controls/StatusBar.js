const StatusBar = L.Control.extend({
    options: {
        position: L.ANCHOR.BOTTOM_LEFT,
        items: []
    },
    statics: {
        BASE_CLS: 'zz-leaflet-statusbar'
    },
    initialize(options) {
        this._updateScale = cb => {
            let val
            const getScale = map => {
                const zoom = map.getZoom()
                if (zoom) {
                    const scale = 1 / map.options.crs._scales[zoom]
                    return `1:${(scale * 96 / 0.0254).toFixed(0)}`
                }
            }
            val = getScale(this._map)
            cb && val && cb(val)
            this._map.on('zoomend', e => {
                val = getScale(e.target)
                cb && val && cb(val)
            })
        }
        this._updateZoom = cb => {
            let val
            const getZoom = map => {
                const zoom = map.getZoom()
                if (zoom) {
                    const minZoom = map.options.minZoom || 0
                    return zoom - minZoom + 1
                }
            }
            val = getZoom(this._map)
            cb && val && cb(val)
            this._map.on('zoomend', e => {
                val = getZoom(e.target)
                cb && val && cb(val)
            })
        }
        this._updateCoordinateX = cb => {
            this._map.on('mousemove', e => {
                const xy = e.target.options.crs.project(e.latlng)
                cb && cb(`${xy.x.toFixed(1)}`)
            })
            this._map._container.addEventListener('mouseleave', e => {
                cb && cb(`0`)
            })
        }
        this._updateCoordinateY = cb => {
            this._map.on('mousemove', e => {
                const xy = e.target.options.crs.project(e.latlng)
                cb && cb(`${xy.y.toFixed(1)}`)
            })
            this._map._container.addEventListener('mouseleave', e => {
                cb && cb(`0`)
            })
        }
        options = L.extend({}, {
            position: L.ANCHOR.BOTTOM_LEFT,
            items: [
                { label: '比例尺', callback: this._updateScale },
                { label: '级别', callback: this._updateZoom },
                { label: 'X坐标', callback: this._updateCoordinateX },
                { label: 'Y坐标', callback: this._updateCoordinateY }
            ]
        }, options)
        L.Util.setOptions(this, options)
    },
    onAdd: function (map) {
        if (map._statusBarAdded) {
            throw Error('已存在一个StatusBar实例')
        }
        map._statusBarAdded = true
        map.statusBarControl = this
        const div = L.DomUtil.create('div', this.constructor.BASE_CLS)
        div.style.background = '#fff'
        div.style.height = '20px'
        div.style.lineHeight = '20px'
        div.style.marginLeft = '5px'
        div.style.marginBottom = '2px'
        let html = ''
        for (var i = 0, len = this.options.items.length; i < len; i++) {
            const item = this.options.items[i]
            const stamp = L.stamp({})
            html += this._getItemHtml(stamp, item.label)
            item.callback instanceof Function ? item.callback(cb => {
                this._updateItemContent(stamp, cb)
            }) : this._updateItemContent(stamp, item.callback)
        }
        div.innerHTML = html
        return div;
    },
    onRemove: function (map) {
        map._statusBarAdded = false
        delete map.statusBarControl
    },
    addItem(item) {
        const { label, callback } = item
        !this.options.items.includes(item) && this.options.items.push(item)
        const stamp = L.stamp({})
        const html = this._getItemHtml(stamp, label)
        this._container.innerHTML += html
        callback instanceof Function ? callback(cb => {
            this._updateItemContent(stamp, cb)
        }) : this._updateItemContent(stamp, callback)
        return html
    },
    removeItem(id) {
        const container = this._container
        const item = container.children[id]
        if (item) {
            this._container.removeChild(item)
        }
    },
    _getItemHtml(stamp, label) {
        const html = `<div id="statusbar-item-${stamp}" class='${this.constructor.BASE_CLS}-item' style="display: inline-block;">
            <span style="font-weight: bold">${label}:</span>
            <span style="font-size: 12px; color: #0000ff">0</span>
        </div>&emsp;`
        return html
    },
    _updateItemContent(id, content) {
        const el = document.querySelector(`#statusbar-item-${id}`)
        if (!el) {
            setTimeout(() => {
                this._updateItemContent(id, content)
            }, 200)
        } else {
            el.lastElementChild.innerText = content
        }
    }
})
L.Map.mergeOptions({
    statusBarControl: false
});
export default StatusBar