import "./style.css";
import { isEmpty } from "../../utils/CommUtil";
export const ToolBar = L.Control.extend({
    statics: {
        BASE_CLS: 'zz-leaflet-toolbar'
    },
    options: {
        position: L.ANCHOR.TOP_RIGHT,
        direction: 'horizontal', // vertical
        container: '',
        items: []
    },
    initialize: function (options) {
        L.setOptions(this, options);
    },
    onAdd: function (map) {
        const div = L.DomUtil.create('div', ToolBar.BASE_CLS, this.options.container || null)
        div.style.display = 'flex'
        div.style.flexDirection = (this.options.direction === 'horizontal' ? 'initial' : 'column')
        for (let i = 0, l = this.options.items.length; i < l; i++) {
            const Item = this.options.items[i]
            const item = map[`_${Item.prototype.options.id}`] = new Item();
            item._createIcon(this, div);
        }
        return div
    },
    addItem(obj) {
        obj = isEmpty(obj) ? [] : Array.isArray(obj) ? obj : [obj]
        for (let i = 0, l = obj.length; i < l; i++) {
            const Item = obj[i]
            const item = new Item();
            item._createIcon(this, this._container);
        }
    }
})
L.Map.mergeOptions({
    toolBarControl: false
});
export { default as ToolBarItem } from './ToolBarItem'