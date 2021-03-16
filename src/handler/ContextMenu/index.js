import "./style.css";
import location from "./images/location.png";
import zoomin from "./images/zoomin.png";
import zoomout from "./images/zoomout.png";
L.Map.mergeOptions({
    contextmenuWidth: 140,
    contextmenuItems: []
});

const ContextMenu = L.Handler.extend({
    _touchstart: L.Browser.msPointer ? 'MSPointerDown' : L.Browser.pointer ? 'pointerdown' : 'touchstart',

    statics: {
        BASE_CLS: 'zz-leaflet-contextmenu'
    },

    initialize: function (map) {
        const this_ = this
        L.Handler.prototype.initialize.call(this, map);

        this._contextmenuItems = [
            {
                index: 0, text: '重置鼠标', callback: e => {
                    map.off('click mousedown mouseup')
                    map._container.style.cursor = 'default'
                }
            },
            {
                index: 1, text: '清除临时要素', callback: e => {
                    map.mapUtil.clearLayers()
                }
            },
            {
                index: 2, text: '显示坐标', callback: e => {
                    const content = `<div style="padding: 10px"><b>经度：</b>${e.latlng.lng.toFixed(8)}<br/><b>纬度：</b>${e.latlng.lat.toFixed(8)}</div>`
                    map.openPopup(content, e.latlng, { minWidth: 160 })
                }
            },
            {
                index: 3, text: '开启拖动', callback: e => {
                    this.relatedFeature.pm.disable()
                    this.relatedFeature.pm.enableLayerDrag()
                }
            },
            {
                index: 4, text: '开启编辑', callback: e => {
                    this.relatedFeature.pm.disableLayerDrag()
                    this.relatedFeature.pm.enable()
                }
            },
            {
                index: 5, text: '关闭拖动（编辑）', callback: e => {
                    this.relatedFeature.pm.disable()
                    this.relatedFeature.pm.disableLayerDrag()
                }
            },
            '-',
            {
                index: 6, text: '放大', icon: zoomin, callback: e => {
                    if (map.getZoom() == map.getMaxZoom()) {
                        alert('已达到最大层级');
                        return;
                    }
                    map.setZoom(map.getZoom() + 1)
                }
            },
            {
                index: 7, text: '缩小', icon: zoomout, callback: e => {
                    if (map.getZoom() == map.getMinZoom()) {
                        alert('已达到最小层级');
                        return;
                    }
                    map.setZoom(map.getZoom() - 1)
                }
            },
            {
                index: 8, text: '定位到此', icon: location, callback: e => {
                    map.panTo(e.latlng)
                }
            },
        ]

        L.Path.addInitHook(function () {
            this.on('contextmenu', e => {
                this_.relatedFeature = this
            })
        })

        this._items = [];
        this._visible = false;

        var container = this._container = L.DomUtil.create('div', ContextMenu.BASE_CLS, map._container);
        container.style.zIndex = 10000;
        container.style.position = 'absolute';

        if (map.options.contextmenuWidth) {
            container.style.width = map.options.contextmenuWidth + 'px';
        }

        this._createItems();

        L.DomEvent
            .on(container, 'click', L.DomEvent.stop)
            .on(container, 'mousedown', L.DomEvent.stop)
            .on(container, 'dblclick', L.DomEvent.stop)
            .on(container, 'contextmenu', L.DomEvent.stop);
    },

    addHooks: function () {
        var container = this._map.getContainer();

        L.DomEvent
            .on(container, 'mouseleave', this._hide, this)
            .on(document, 'keydown', this._onKeyDown, this);

        if (L.Browser.touch) {
            L.DomEvent.on(document, this._touchstart, this._hide, this);
        }

        this._map.on({
            contextmenu: this._show,
            mousedown: this._hide,
            zoomstart: this._hide
        }, this);
    },

    removeHooks: function () {
        var container = this._map.getContainer();

        L.DomEvent
            .off(container, 'mouseleave', this._hide, this)
            .off(document, 'keydown', this._onKeyDown, this);

        if (L.Browser.touch) {
            L.DomEvent.off(document, this._touchstart, this._hide, this);
        }

        this._map.off({
            contextmenu: this._show,
            mousedown: this._hide,
            zoomstart: this._hide
        }, this);
    },

    showAt: function (point, data) {
        if (point instanceof L.LatLng) {
            point = this._map.latLngToContainerPoint(point);
        }
        this._showAtPoint(point, data);
    },

    hide: function () {
        this._hide();
    },

    addItem: function (options) {
        return this.insertItem(options);
    },

    insertItem: function (options, index) {
        index = index !== undefined ? index : this._items.length;

        var item = this._createItem(this._container, options, index);

        this._items.push(item);

        this._sizeChanged = true;

        this._map.fire('contextmenu.additem', {
            contextmenu: this,
            el: item.el,
            index: index
        });

        return item.el;
    },

    removeItem: function (item) {
        var container = this._container;

        if (!isNaN(item)) {
            item = container.children[item];
        }

        if (item) {
            this._removeItem(L.Util.stamp(item));

            this._sizeChanged = true;

            this._map.fire('contextmenu.removeitem', {
                contextmenu: this,
                el: item
            });

            return item;
        }

        return null;
    },

    removeAllItems: function () {
        var items = this._container.children,
            item;

        while (items.length) {
            item = items[0];
            this._removeItem(L.Util.stamp(item));
        }
        return items;
    },

    hideAllItems: function () {
        var item, i, l;

        for (i = 0, l = this._items.length; i < l; i++) {
            item = this._items[i];
            item.el.style.display = 'none';
        }
    },

    showAllItems: function () {
        var item, i, l;

        for (i = 0, l = this._items.length; i < l; i++) {
            item = this._items[i];
            item.el.style.display = '';
        }
    },

    setDisabled: function (item, disabled) {
        var container = this._container,
            itemCls = ContextMenu.BASE_CLS + '-item';

        if (!isNaN(item)) {
            item = container.children[item];
        }

        if (item && L.DomUtil.hasClass(item, itemCls)) {
            if (disabled) {
                L.DomUtil.addClass(item, itemCls + '-disabled');
                this._map.fire('contextmenu.disableitem', {
                    contextmenu: this,
                    el: item
                });
            } else {
                L.DomUtil.removeClass(item, itemCls + '-disabled');
                this._map.fire('contextmenu.enableitem', {
                    contextmenu: this,
                    el: item
                });
            }
        }
    },

    isVisible: function () {
        return this._visible;
    },

    _createItems: function () {
        const { contextmenuItems } = this._map.options
        var itemOptions = contextmenuItems.length ? contextmenuItems : this._contextmenuItems
        for (let i = 0; i < itemOptions.length; i++) {
            this._items.push(this._createItem(this._container, itemOptions[i]));
        }
    },

    _createItem: function (container, options, index) {
        if (options.separator || options === '-') {
            return this._createSeparator(container, index);
        }

        var itemCls = ContextMenu.BASE_CLS + '-item',
            cls = options.disabled ? (itemCls + ' ' + itemCls + '-disabled') : itemCls,
            el = this._insertElementAt('a', cls, container, index),
            callback = this._createEventHandler(el, options.callback, options.context, options.hideOnSelect),
            icon = this._getIcon(options),
            iconCls = this._getIconCls(options),
            html = '';

        if (icon) {
            html = '<img class="' + ContextMenu.BASE_CLS + '-icon" src="' + icon + '"/>';
        } else if (iconCls) {
            html = '<span class="' + ContextMenu.BASE_CLS + '-icon ' + iconCls + '"></span>';
        }

        el.innerHTML = html + options.text;
        el.href = '#';

        L.DomEvent
            .on(el, 'mouseover', this._onItemMouseOver, this)
            .on(el, 'mouseout', this._onItemMouseOut, this)
            .on(el, 'mousedown', L.DomEvent.stopPropagation)
            .on(el, 'click', callback);

        if (L.Browser.touch) {
            L.DomEvent.on(el, this._touchstart, L.DomEvent.stopPropagation);
        }

        // Devices without a mouse fire "mouseover" on tap, but never “mouseout"
        if (!L.Browser.pointer) {
            L.DomEvent.on(el, 'click', this._onItemMouseOut, this);
        }

        return {
            id: L.Util.stamp(el),
            el: el,
            callback: callback
        };
    },

    _removeItem: function (id) {
        var item,
            el,
            i, l, callback;

        for (i = 0, l = this._items.length; i < l; i++) {
            item = this._items[i];

            if (item.id === id) {
                el = item.el;
                callback = item.callback;

                if (callback) {
                    L.DomEvent
                        .off(el, 'mouseover', this._onItemMouseOver, this)
                        .off(el, 'mouseover', this._onItemMouseOut, this)
                        .off(el, 'mousedown', L.DomEvent.stopPropagation)
                        .off(el, 'click', callback);

                    if (L.Browser.touch) {
                        L.DomEvent.off(el, this._touchstart, L.DomEvent.stopPropagation);
                    }

                    if (!L.Browser.pointer) {
                        L.DomEvent.on(el, 'click', this._onItemMouseOut, this);
                    }
                }

                this._container.removeChild(el);
                this._items.splice(i, 1);

                return item;
            }
        }
        return null;
    },

    _createSeparator: function (container, index) {
        var el = this._insertElementAt('div', ContextMenu.BASE_CLS + '-separator', container, index);

        return {
            id: L.Util.stamp(el),
            el: el
        };
    },

    _createEventHandler: function (el, func, context, hideOnSelect) {
        var me = this,
            map = this._map,
            disabledCls = ContextMenu.BASE_CLS + '-item-disabled',
            hideOnSelect = (hideOnSelect !== undefined) ? hideOnSelect : true;

        return function (e) {
            if (L.DomUtil.hasClass(el, disabledCls)) {
                return;
            }

            var map = me._map,
                containerPoint = me._showLocation.containerPoint,
                layerPoint = map.containerPointToLayerPoint(containerPoint),
                latlng = map.layerPointToLatLng(layerPoint),
                relatedTarget = me._showLocation.relatedTarget,
                data = {
                    containerPoint: containerPoint,
                    layerPoint: layerPoint,
                    latlng: latlng,
                    relatedTarget: relatedTarget
                };

            if (hideOnSelect) {
                me._hide();
            }

            if (func) {
                func.call(context || map, data);
            }

            me._map.fire('contextmenu.select', {
                contextmenu: me,
                el: el
            });
        };
    },

    _insertElementAt: function (tagName, className, container, index) {
        var refEl,
            el = document.createElement(tagName);

        el.className = className;

        if (index !== undefined) {
            refEl = container.children[index];
        }

        if (refEl) {
            container.insertBefore(el, refEl);
        } else {
            container.appendChild(el);
        }

        return el;
    },

    _show: function (e) {
        this._showAtPoint(e.containerPoint, e);
    },

    _showAtPoint: function (pt, data) {
        if (data.originalEvent.target.tagName === 'path') {
            this.setDisabled(3, false)
            this.setDisabled(4, false)
            this.setDisabled(5, false)
        } else {
            this.setDisabled(3, true)
            this.setDisabled(4, true)
            this.setDisabled(5, true)
        }
        if (this._items.length) {
            var map = this._map,
                event = L.extend(data || {}, { contextmenu: this });

            this._showLocation = {
                containerPoint: pt
            };

            if (data && data.relatedTarget) {
                this._showLocation.relatedTarget = data.relatedTarget;
            }

            this._setPosition(pt);

            if (!this._visible) {
                this._container.style.display = 'block';
                this._visible = true;
            }

            this._map.fire('contextmenu.show', event);
        }
    },

    _hide: function () {
        if (this._visible) {
            this._visible = false;
            this._container.style.display = 'none';
            this._map.fire('contextmenu.hide', { contextmenu: this });
        }
    },

    _getIcon: function (options) {
        return L.Browser.retina && options.retinaIcon || options.icon;
    },

    _getIconCls: function (options) {
        return L.Browser.retina && options.retinaIconCls || options.iconCls;
    },

    _setPosition: function (pt) {
        var mapSize = this._map.getSize(),
            container = this._container,
            containerSize = this._getElementSize(container),
            anchor;

        if (this._map.options.contextmenuAnchor) {
            anchor = L.point(this._map.options.contextmenuAnchor);
            pt = pt.add(anchor);
        }

        container._leaflet_pos = pt;

        if (pt.x + containerSize.x > mapSize.x) {
            container.style.left = 'auto';
            container.style.right = Math.min(Math.max(mapSize.x - pt.x, 0), mapSize.x - containerSize.x - 1) + 'px';
        } else {
            container.style.left = Math.max(pt.x, 0) + 'px';
            container.style.right = 'auto';
        }

        if (pt.y + containerSize.y > mapSize.y) {
            container.style.top = 'auto';
            container.style.bottom = Math.min(Math.max(mapSize.y - pt.y, 0), mapSize.y - containerSize.y - 1) + 'px';
        } else {
            container.style.top = Math.max(pt.y, 0) + 'px';
            container.style.bottom = 'auto';
        }
    },

    _getElementSize: function (el) {
        var size = this._size,
            initialDisplay = el.style.display;

        if (!size || this._sizeChanged) {
            size = {};

            el.style.left = '-999999px';
            el.style.right = 'auto';
            el.style.display = 'block';

            size.x = el.offsetWidth;
            size.y = el.offsetHeight;

            el.style.left = 'auto';
            el.style.display = initialDisplay;

            this._sizeChanged = false;
        }

        return size;
    },

    _onKeyDown: function (e) {
        var key = e.keyCode;

        // If ESC pressed and context menu is visible hide it
        if (key === 27) {
            this._hide();
        }
    },

    _onItemMouseOver: function (e) {
        L.DomUtil.addClass(e.target || e.srcElement, 'over');
    },

    _onItemMouseOut: function (e) {
        L.DomUtil.removeClass(e.target || e.srcElement, 'over');
    }
});

L.Map.addInitHook('addHandler', 'contextmenu', ContextMenu);
export default ContextMenu