export default L.Handler.extend({
    statics: {
        BASE_CLS: 'zz-leaflet-toolbar-item'
    },
    options: {
        id: '',
        iconUrl: '',
        iconClass: '',
        label: '',
        className: '',
        direction: 'vertical' // horizontal
    },
    initialize: function (options) {
        L.setOptions(this, options)
    },
    enable: function (e) {
        e && L.DomEvent.preventDefault(e)
        this.hook && this.hook(e)
    },
    _createIcon: function (toolbar, container, args) {
        this.toolbar = toolbar
        this._map = toolbar._map
        this._container = L.DomUtil.create('div', `${this.constructor.BASE_CLS} ${this.options.direction}`, container);
        this._iconUrl = this._getIconUrl(this.options)
        this._iconClass = this._getIconClass(this.options)
        let html = ''
        if (this._iconUrl) {
            html = '<img src="' + this._iconUrl + '"/>';
        } else if (this._iconClass) {
            html = '<i class="' + this._iconClass + '"></i>';
        }
        html += `<span>${this.options.label}</span>`
        this._container.innerHTML = html
        if (this.options.className) {
            L.DomUtil.addClass(this._container, this.options.className);
        }
        L.DomEvent.on(this._container, 'click', this.enable, this);
    },
    _getIconUrl: function (options) {
        return options.iconUrl;
    },

    _getIconClass: function (options) {
        return options.iconClass;
    }
})
