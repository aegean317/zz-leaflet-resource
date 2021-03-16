import { } from './Constant'
import { } from './RasterLayer'
import { } from './Path.SVGRender'
import { } from './CommonCRS'
L.GeoJSON.mergeOptions({
    pointToLayer(geoJsonPoint, latlng) {
        return L.circleMarker(latlng, { radius: 5 })
    },
    weight: 2
})
L.GeoJSON.include({
    setZIndex(index) {
        const pane = this.getPane()
        pane.style.zIndex = index
    }
})
L.FeatureGroup.include({
    // override
    getLayerId(layer) {
        return layer._leaflet_id
    },
    hasLayer: function (layer) {
        if (!layer) { return false; }
        var layerId = ['number', 'string'].includes(typeof layer) ? layer : this.getLayerId(layer);
        return layerId in this._layers;
    }
})
L.Control.Zoom.mergeOptions({
    zoomInTitle: '放大',
    zoomOutTitle: '缩小'
})