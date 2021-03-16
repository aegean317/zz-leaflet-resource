export function injectKey(key) {
    if (key && decodeURI(key) !== '\u60a8\u7684\u5bc6\u94a5') {
        L.esri.DynamicMapLayer.include({
            _requestExport: function (params, bounds) {
                params.app_key = key;
                if (this.options.f === 'json') {
                    this.service.request('export', params, function (error, response) {
                        if (error) {
                            return;
                        }
                        if (this.options.token && response.href) {
                            response.href += '?token=' + this.options.token;
                        }
                        if (this.options.proxy && response.href) {
                            response.href = this.options.proxy + '?' + response.href;
                        }
                        if (response.href) {
                            this._renderImage(response.href, bounds);
                        } else {
                            this._renderImage(response.imageData, bounds, response.contentType);
                        }
                    }, this);
                } else {
                    params.f = 'image';
                    this._renderImage(this.options.url + 'export' + L.Util.getParamString(params), bounds);
                }
            }
        });
        L.TileLayer.addInitHook(function () {
            this.tileUrl += '?app_key=' + key;
        });
    }
}