L.LayerGroup.include({
    /**
     * 递归获取所有的非group图层
     */
    getRasterLayers: function () {
        const _rasterLayers = {}
        const _get = _layer => {
            if (_layer._layers && _layer.getLayer) {
                for (const key in _layer._layers) {
                    const layer = _layer._layers[key]
                    if (layer._layers && layer.getLayer) {
                        _get(layer)
                    } else {
                        _rasterLayers[layer._leaflet_id] = layer
                    }
                }
            } else {
                _rasterLayers[layer._leaflet_id] = layer
            }
        }
        _get(this)
        return _rasterLayers
    },
    /**
     * 递归删除指定的非group图层
     * @param {*} id 
     */
    removeRasterLayer(id) {
        const _remove = function (_layer) {
            if (_layer._layers && _layer.getLayer && _layer.getLayer(id)) {
                const data = _layer.getLayer(id)
                _layer.removeLayer(data)
            } else if (_layer._layers) {
                for (const key in _layer._layers) {
                    const layer = _layer._layers[key]
                    if (layer._layers && layer.getLayer && layer.getLayer(id)) {
                        const data = layer.getLayer(id)
                        layer.removeLayer(data)
                    } else if (layer._layers) {
                        _remove(layer)
                    }
                }
            }
        }
        _remove(this)
    },
    /**
     * 递归获取非group图层的最高层级.
     */
    getRasterTop() {
        const rasterLayers = Object.values(this.getRasterLayers())
        return rasterLayers.length ? Math.max(...rasterLayers.map(d => d.options.zIndex)) + 1 : null
    }
})