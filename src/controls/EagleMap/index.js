import "./style.css";
const EagleMap = L.Control.extend({

    includes: L.Evented ? L.Evented.prototype : L.Mixin.Events,

    options: {
        position: L.ANCHOR.BOTTOM_RIGHT,
        toggleDisplay: true,
        zoomLevelOffset: 5,
        zoomLevelFixed: false,
        centerFixed: false,
        zoomAnimation: false,
        autoToggleDisplay: false,
        minimized: false,
        width: 100,
        height: 100,
        collapsedWidth: 19,
        collapsedHeight: 19,
        aimingRectOptions: { color: '#ff7800', weight: 1, interactive: false },
        shadowRectOptions: { color: '#000000', weight: 1, interactive: false, opacity: 0, fillOpacity: 0 },
        strings: { hideText: '隐藏鹰眼图', showText: '显示鹰眼图' },
        mapOptions: {}  // Allows definition / override of Leaflet map options.
    },

    // layer is the map layer to be shown in the eaglemap
    initialize: function (layer, options) {
        L.Util.setOptions(this, options);
        // Make sure the aiming rects are non-clickable even if the user tries to set them clickable (most likely by forgetting to specify them false)
        this.options.aimingRectOptions.interactive = false;
        this.options.shadowRectOptions.interactive = false;
        this._layer = layer;
    },

    onAdd: function (map) {

        this._mainMap = map;

        // Creating the container and stopping events from spilling through to the main map.
        this._container = L.DomUtil.create('div', 'leaflet-control-eaglemap');
        this._container.style.width = this.options.width + 'px';
        this._container.style.height = this.options.height + 'px';
        L.DomEvent.disableClickPropagation(this._container);
        L.DomEvent.on(this._container, 'mousewheel', L.DomEvent.stopPropagation);

        var mapOptions = {
            attributionControl: false,
            dragging: !this.options.centerFixed,
            zoomControl: false,
            zoomAnimation: this.options.zoomAnimation,
            autoToggleDisplay: this.options.autoToggleDisplay,
            touchZoom: this.options.centerFixed ? 'center' : !this._isZoomLevelFixed(),
            scrollWheelZoom: this.options.centerFixed ? 'center' : !this._isZoomLevelFixed(),
            doubleClickZoom: this.options.centerFixed ? 'center' : !this._isZoomLevelFixed(),
            boxZoom: !this._isZoomLevelFixed(),
            crs: map.options.crs
        };
        mapOptions = L.Util.extend(this.options.mapOptions, mapOptions);  // merge with priority of the local mapOptions object.

        this._eagleMap = new L.Map(this._container, mapOptions);

        this._layer instanceof L.Layer && this._eagleMap.addLayer(this._layer);

        // These bools are used to prevent infinite loops of the two maps notifying each other that they've moved.
        this._mainMapMoving = false;
        this._eagleMapMoving = false;

        // Keep a record of this to prevent auto toggling when the user explicitly doesn't want it.
        this._userToggledDisplay = false;
        this._minimized = false;

        if (this.options.toggleDisplay) {
            this._addToggleButton();
        }

        this._eagleMap.whenReady(L.Util.bind(function () {
            this._aimingRect = L.rectangle(this._mainMap.getBounds(), this.options.aimingRectOptions).addTo(this._eagleMap);
            this._shadowRect = L.rectangle(this._mainMap.getBounds(), this.options.shadowRectOptions).addTo(this._eagleMap);
            this._mainMap.on('moveend', this._onMainMapMoved, this);
            this._mainMap.on('move', this._onMainMapMoving, this);
            this._eagleMap.on('movestart', this._onEagleMapMoveStarted, this);
            this._eagleMap.on('move', this._onEagleMapMoving, this);
            this._eagleMap.on('moveend', this._onEagleMapMoved, this);
        }, this));

        return this._container;
    },

    addTo: function (map) {
        L.Control.prototype.addTo.call(this, map);

        var center = this.options.centerFixed || this._mainMap.getCenter();
        this._eagleMap.setView(center, this._decideZoom(true));
        this._setDisplay(this.options.minimized);
        return this;
    },

    onRemove: function (map) {
        this._mainMap.off('moveend', this._onMainMapMoved, this);
        this._mainMap.off('move', this._onMainMapMoving, this);
        this._eagleMap.off('moveend', this._onEagleMapMoved, this);

        this._eagleMap.removeLayer(this._layer);
    },

    changeLayer: function (layer) {
        this._eagleMap.removeLayer(this._layer);
        this._layer = layer;
        this._eagleMap.addLayer(this._layer);
    },

    _addToggleButton: function () {
        this._toggleDisplayButton = this.options.toggleDisplay ? this._createButton(
            '', this._toggleButtonInitialTitleText(), ('leaflet-control-eaglemap-toggle-display leaflet-control-eaglemap-toggle-display-' +
                this.options.position), this._container, this._toggleDisplayButtonClicked, this) : undefined;

        this._toggleDisplayButton.style.width = this.options.collapsedWidth + 'px';
        this._toggleDisplayButton.style.height = this.options.collapsedHeight + 'px';
    },

    _toggleButtonInitialTitleText: function () {
        if (this.options.minimized) {
            return this.options.strings.showText;
        } else {
            return this.options.strings.hideText;
        }
    },

    _createButton: function (html, title, className, container, fn, context) {
        var link = L.DomUtil.create('a', className, container);
        link.innerHTML = html;
        link.href = '#';
        link.title = title;

        var stop = L.DomEvent.stopPropagation;

        L.DomEvent
            .on(link, 'click', stop)
            .on(link, 'mousedown', stop)
            .on(link, 'dblclick', stop)
            .on(link, 'click', L.DomEvent.preventDefault)
            .on(link, 'click', fn, context);

        return link;
    },

    _toggleDisplayButtonClicked: function () {
        this._userToggledDisplay = true;
        if (!this._minimized) {
            this._minimize();
        } else {
            this._restore();
        }
    },

    _setDisplay: function (minimize) {
        if (minimize !== this._minimized) {
            if (!this._minimized) {
                this._minimize();
            } else {
                this._restore();
            }
        }
    },

    _minimize: function () {
        // hide the eaglemap
        if (this.options.toggleDisplay) {
            this._container.style.width = this.options.collapsedWidth + 'px';
            this._container.style.height = this.options.collapsedHeight + 'px';
            this._toggleDisplayButton.className += (' minimized-' + this.options.position);
            this._toggleDisplayButton.title = this.options.strings.showText;
        } else {
            this._container.style.display = 'none';
        }
        this._minimized = true;
        this._onToggle();
    },

    _restore: function () {
        if (this.options.toggleDisplay) {
            this._container.style.width = this.options.width + 'px';
            this._container.style.height = this.options.height + 'px';
            this._toggleDisplayButton.className = this._toggleDisplayButton.className
                .replace('minimized-' + this.options.position, '');
            this._toggleDisplayButton.title = this.options.strings.hideText;
        } else {
            this._container.style.display = 'block';
        }
        this._minimized = false;
        this._onToggle();
    },

    _onMainMapMoved: function (e) {
        if (!this._eagleMapMoving) {
            var center = this.options.centerFixed || this._mainMap.getCenter();

            this._mainMapMoving = true;
            this._eagleMap.setView(center, this._decideZoom(true));
            this._setDisplay(this._decideMinimized());
        } else {
            this._eagleMapMoving = false;
        }
        this._aimingRect.setBounds(this._mainMap.getBounds());
    },

    _onMainMapMoving: function (e) {
        this._aimingRect.setBounds(this._mainMap.getBounds());
    },

    _onEagleMapMoveStarted: function (e) {
        if (!this.options.centerFixed) {
            var lastAimingRect = this._aimingRect.getBounds();
            var sw = this._eagleMap.latLngToContainerPoint(lastAimingRect.getSouthWest());
            var ne = this._eagleMap.latLngToContainerPoint(lastAimingRect.getNorthEast());
            this._lastAimingRectPosition = { sw: sw, ne: ne };
        }
    },

    _onEagleMapMoving: function (e) {
        if (!this.options.centerFixed) {
            if (!this._mainMapMoving && this._lastAimingRectPosition) {
                this._shadowRect.setBounds(new L.LatLngBounds(this._eagleMap.containerPointToLatLng(this._lastAimingRectPosition.sw), this._eagleMap.containerPointToLatLng(this._lastAimingRectPosition.ne)));
                this._shadowRect.setStyle({ opacity: 1, fillOpacity: 0.3 });
            }
        }
    },

    _onEagleMapMoved: function (e) {
        if (!this._mainMapMoving) {
            this._eagleMapMoving = true;
            this._mainMap.setView(this._eagleMap.getCenter(), this._decideZoom(false));
            this._shadowRect.setStyle({ opacity: 0, fillOpacity: 0 });
        } else {
            this._mainMapMoving = false;
        }
    },

    _isZoomLevelFixed: function () {
        var zoomLevelFixed = this.options.zoomLevelFixed;
        return this._isDefined(zoomLevelFixed) && this._isInteger(zoomLevelFixed);
    },

    _decideZoom: function (fromMaintoMini) {
        if (!this._isZoomLevelFixed()) {
            if (fromMaintoMini) {
                return this._mainMap.getZoom() - this.options.zoomLevelOffset;
            } else {
                var currentDiff = this._eagleMap.getZoom() - this._mainMap.getZoom();
                var proposedZoom = this._eagleMap.getZoom() + this.options.zoomLevelOffset;
                var toRet;

                if (currentDiff < this.options.zoomLevelOffset && this._mainMap.getZoom() < this._eagleMap.getMinZoom() + this.options.zoomLevelOffset) {
                    // This means the eagleMap is zoomed out to the minimum zoom level and can't zoom any more.
                    if (this._eagleMap.getZoom() > this._lastEagleMapZoom) {
                        // This means the user is trying to zoom in by using the eaglemap, zoom the main map.
                        toRet = this._mainMap.getZoom() + 1;
                        // Also we cheat and zoom the eaglemap out again to keep it visually consistent.
                        this._eagleMap.setZoom(this._eagleMap.getZoom() - 1);
                    } else {
                        // Either the user is trying to zoom out past the mini map's min zoom or has just panned using it, we can't tell the difference.
                        // Therefore, we ignore it!
                        toRet = this._mainMap.getZoom();
                    }
                } else {
                    // This is what happens in the majority of cases, and always if you configure the min levels + offset in a sane fashion.
                    toRet = proposedZoom;
                }
                this._lastEagleMapZoom = this._eagleMap.getZoom();
                return toRet;
            }
        } else {
            if (fromMaintoMini) {
                return this.options.zoomLevelFixed;
            } else {
                return this._mainMap.getZoom();
            }
        }
    },

    _decideMinimized: function () {
        if (this._userToggledDisplay) {
            return this._minimized;
        }

        if (this.options.autoToggleDisplay) {
            if (this._mainMap.getBounds().contains(this._eagleMap.getBounds())) {
                return true;
            }
            return false;
        }

        return this._minimized;
    },

    _isInteger: function (value) {
        return typeof value === 'number';
    },

    _isDefined: function (value) {
        return typeof value !== 'undefined';
    },

    _onToggle: function () {
        L.Util.requestAnimFrame(function () {
            L.DomEvent.on(this._container, 'transitionend', this._fireToggleEvents, this);
            if (!L.Browser.any3d) {
                L.Util.requestAnimFrame(this._fireToggleEvents, this);
            }
        }, this);
    },

    _fireToggleEvents: function () {
        L.DomEvent.off(this._container, 'transitionend', this._fireToggleEvents, this);
        var data = { minimized: this._minimized };
        this.fire(this._minimized ? 'minimize' : 'restore', data);
        this.fire('toggle', data);
    }
});

L.Map.mergeOptions({
    eagleMapControl: false
});
export default EagleMap