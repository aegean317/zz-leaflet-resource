import { injectKey } from "./utils/ServiceUtil";

import * as exports from "leaflet";
import "leaflet/dist/leaflet.css";
import "./assets/css/override-leaflet.css";

// 坐标系转换
import "proj4leaflet";

// 图层编辑
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";

// 解决marker图片请求失败的问题
import iconUrl from "./assets/images/location.png";
let DefaultIcon = window.L.icon({
	iconUrl,
	iconSize: [16, 22],
	iconAnchor: [8, 20]
});
exports.Marker.prototype.options.icon = DefaultIcon;

// esri插件
import * as esri from "esri-leaflet"
import { WmsLayer, wmsLayer } from './layers/esri.WmsLayer'
import { WmtsLayer, wmtsLayer } from './layers/esri.WmtsLayer'
esri.Query.mergeOptions({ useCors: false })
esri.Service.mergeOptions({ useCors: false })
esri.DynamicMapLayer.mergeOptions({ useCors: false })
esri.TiledMapLayer.mergeOptions({ useCors: false })

exports.esri = {
	...esri,
	WmsLayer, wmsLayer, WmtsLayer, wmtsLayer
};

import "./core";

// TextLayer
import { Text, text } from './layers/Marker.Text'

// 状态栏
import StatusBar from './controls/StatusBar'

// 卷帘对比
import SideBySide from './controls/SideBySide'

// 鹰眼图
import EagleMap from './controls/EagleMap'

// 绘制
import Draw from "./handler/Draw";

// 右键菜单
import ContextMenu from './handler/ContextMenu'

// 工具栏
import { ToolBar, ToolBarItem } from "./controls/ToolBar";

// 钩子
import "./hooks";

exports.Text = Text;
exports.text = text;
exports.SideBySide = SideBySide;
exports.Control.StatusBar = StatusBar;
exports.Control.EagleMap = EagleMap;
exports.ToolBar = ToolBar;
exports.ToolBarItem = ToolBarItem;
exports.Draw = Draw;
exports.Map.ContextMenu = ContextMenu;

(function () {
	var scripts = window.document.getElementsByTagName("script"),
		script = scripts[scripts.length - 1],
		src = script.src,
		app_key = (src.match(new RegExp("(?:\\?|&)" + 'app_key' + "=(.*?)(?=&|$)")) || ['', null])[1];
	injectKey(app_key)
})(window)
export default exports;
