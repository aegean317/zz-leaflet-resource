export default L.Class.extend({
    initialize: function (map, options) {
        this.map = map
        L.setOptions(this, options)
        this.drawLayer = L.featureGroup().addTo(this.map) // 绘制层
        this.resultLayer = L.layerGroup().addTo(this.map) // 分析结果层
        this.dataLayer = L.featureGroup().addTo(this.map) // 导入数据层
        this.labelLayer = L.featureGroup().addTo(this.map) // 注记层
        this.locationLayer = L.featureGroup().addTo(this.map).on('layeradd', e => {
            let shine = true,
                timer = 0
            const fun = () => {
                timer++
                if (shine && timer < 4) {
                    e.target.setStyle({
                        fillColor: '#ff0000',
                        fillOpacity: 1,
                        weight: 2
                    })
                    shine = false
                } else {
                    e.target.setStyle({
                        fillOpacity: 0
                    })
                    shine = true
                }
            }
            fun.call()
            this.timer = setInterval(fun, 500)
        }).on('layerremove', e => {
            clearInterval(this.timer)
        })
    },
    clearLayers() {
        this.map.closePopup()
        this.drawLayer.clearLayers()
        this.resultLayer.clearLayers()
        this.locationLayer.clearLayers()
        this.dataLayer.clearLayers()
        this.labelLayer.clearLayers()
    }
})