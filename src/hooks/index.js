import { MapUtil } from "../utils";
import StatusBar from '../controls/StatusBar';
import { ToolBar } from '../controls/ToolBar';
import EagleMap from '../controls/EagleMap';
L.Layer.addInitHook(function () {
    this._leaflet_id = this.options.id || L.stamp({})
})
L.Map.addInitHook(function () {
    this.mapUtil = new MapUtil(this)
    if (!this._statusBarAdded && this.options.statusBarControl) {
        if (this.options.statusBarControl === true) {
            this.statusBarControl = new StatusBar();

        } else if (this.options.statusBarControl instanceof L.Control) {
            this.statusBarControl = this.options.statusBarControl;
        }
        if (this.statusBarControl) {
            this.addControl(this.statusBarControl);
            this._statusBarAdded = true;
        }
    }
    if (this.options.toolBarControl) {
        if (this.options.toolBarControl instanceof L.Control) {
            this.toolBarControl = this.options.toolBarControl;
        } else if (Array.isArray(this.options.toolBarControl)) {
            this.options.toolBarControl.forEach((d, i) => {
                this[`toolBarControl${i}`] = new ToolBar(d).addTo(this)
            })
        } else if (this.options.toolBarControl instanceof Object) {
            this.toolBarControl = new ToolBar(this.options.toolBarControl);
        }
        if (this.toolBarControl) {
            this.addControl(this.toolBarControl);
        }
    }
    if (this.options.scaleControl) {
        if (this.options.scaleControl === true) {
            this.scaleControl = L.control.scale({ imperial: false })

        } else if (this.options.scaleControl instanceof L.Control) {
            this.scaleControl = this.options.scaleControl
        }
        if (this.scaleControl) {
            this.addControl(this.scaleControl)
        }
    }
    if (!this._eagleMapAdded && this.options.eagleMapControl) {
        if (this.options.eagleMapControl === true) {
            this.eagleMapControl = new EagleMap();

        } else if (this.options.eagleMapControl instanceof L.Control) {
            this.eagleMapControl = this.options.eagleMapControl;
        }
        if (this.eagleMapControl) {
            this.addControl(this.eagleMapControl);
            this._eagleMapAdded = true;
        }
    }
    this.on('layeradd', e => {
        if (this.attributionControl) {
            this.attributionControl.setPrefix(`Powered by <a target='_blank' href="http://www.zhongzhi.net/">中智信息</a>`)
        }
    })
})