class Measurement extends L[L.Layer ? 'Layer' : 'Class'] {

  constructor(latlng, measurement, title, rotation, options) {
    super()
    L.setOptions(this, options);
    this._latlng = latlng;
    this._measurement = measurement;
    this._title = title;
    this._rotation = rotation;
    this.MEASUREDDATA = null;
    this.tempAcCurrDrawPoints = null;
  }
  addTo(map) {
    map.addLayer(this);
    return this;
  }
  onAdd(map) {
    this._map = map;
    var pane = this.getPane ? this.getPane() : map.getPanes().markerPane;
    var el = this._element = L.DomUtil.create('div', 'leaflet-zoom-animated leaflet-measure-path-measurement', pane);
    var inner = L.DomUtil.create('div', '', el);
    inner.title = this._title;
    inner.innerHTML = this._measurement;
    map.on('zoomanim', this._animateZoom, this);
    this._setPosition();
  }

  onRemove(map) {
    map.off('zoomanim', this._animateZoom, this);
    var pane = this.getPane ? this.getPane() : map.getPanes().markerPane;
    pane.removeChild(this._element);
    this._map = null;
  }

  _setPosition() {
    L.DomUtil.setPosition(this._element, this._map.latLngToLayerPoint(this._latlng));
    this._element.style.transform += ' rotate(' + this._rotation + 'rad)';
  }

  _animateZoom(opt) {
    var pos = this._map._latLngToNewLayerPoint(this._latlng, opt.zoom, opt.center).round();
    L.DomUtil.setPosition(this._element, pos);
    this._element.style.transform += ' rotate(' + this._rotation + 'rad)';
  }
  static enable(map) {
    L.Polyline.include({
      showMeasurements: function(options) {
        if (!this._map || this._measurementLayer) return this;

        this._measurementOptions = L.extend({
          showOnHover: false,
          minPixelDistance: 30,
          showDistances: true,
          showArea: true,
          lang: {
            totalLength: 'Total length',
            totalArea: 'Total area',
            segmentLength: 'Segment length'
          },
          map: this._map
        }, options || {});

        this._measurementLayer = L.layerGroup().addTo(this._map);
        this.updateMeasurements();
        this.MEASUREDDATA_func();
        this._map.on('zoomend', this.updateMeasurements, this);

        return this;
      },

      hideMeasurements: function() {
        this._map.off('zoomend', this.updateMeasurements, this);

        if (!this._measurementLayer) return this;
        this._map.removeLayer(this._measurementLayer);
        this._measurementLayer = null;

        return this;
      },

      onAdd: override(L.Polyline.prototype.onAdd, function() {
        if (this.options.showMeasurements) {
          this.showMeasurements(this.options.measurementOptions);
        }
      }),

      onRemove: override(L.Polyline.prototype.onRemove, function() {
        this.hideMeasurements();
      }, true),

      setLatLngs: override(L.Polyline.prototype.setLatLngs, function() {
        return this.updateMeasurements();
      }),

      spliceLatLngs: override(L.Polyline.prototype.spliceLatLngs, function() {
        return this.updateMeasurements();
      }),
      tempFormatDistance: tempFormatDistance.bind(map),
      tempMoveFormatDistance: tempMoveFormatDistance.bind(map),
      formatDistance: formatDistance,
      formatArea: formatArea,
      tempFormatArea: tempFormatArea.bind(map),

      updateMeasurements: function() {
        if (!this._measurementLayer) return this;

        var templatLngs = this.getLatLngs();
        var templatLngsArr = new Array();
        templatLngsArr.push(templatLngs);
        var latLngs = this.getLatLngs(),
          isPolygon = this instanceof L.Polygon,
          options = this._measurementOptions,
          totalDist = 0,
          formatter,
          ll1,
          ll2,
          p1,
          p2,
          pixelDist,
          forMoveMatter,
          tempLen,
          dist;

        if (latLngs && latLngs.length && L.Util.isArray(latLngs[0])) {
          // Outer ring is stored as an array in the first element,
          // use that instead.
          latLngs = latLngs[0];
        }

        this._measurementLayer.clearLayers();

        if (this._measurementOptions.showDistances && latLngs.length > 1) {
          //formatter = this._measurementOptions.formatDistance || L.bind(this.formatDistance, this);
          formatter = this.tempFormatDistance;
          forMoveMatter = this.tempMoveFormatDistance;
          tempLen = templatLngs.length - 1;
          for (var i = 1, len = latLngs.length;
            (isPolygon && i <= len) || i < len; i++) {
            ll1 = latLngs[i - 1];
            ll2 = latLngs[i % len];
            dist = ll1.distanceTo(ll2);
            totalDist += dist;

            p1 = this._map.latLngToLayerPoint(ll1);
            p2 = this._map.latLngToLayerPoint(ll2);

            pixelDist = p1.distanceTo(p2);

            if (pixelDist >= options.minPixelDistance) {

              measurement(
                  this._map.layerPointToLatLng([(p1.x + p2.x) / 2, (p1.y + p2.y) / 2]),
                  forMoveMatter(ll1, ll2), options.lang.segmentLength, this._getRotation(ll1, ll2), options)
                .addTo(this._measurementLayer);
            }
          }

          // Show total length for polylines
          if (!isPolygon) {
            measurement(ll2, formatter(templatLngs), options.lang.totalLength, 0, options)
              .addTo(this._measurementLayer);
            this.MEASUREDDATA = formatter(templatLngs);
          }
        }

        if (isPolygon && options.showArea && latLngs.length > 2) {
          formatter = this.tempFormatArea;
          var area = ringArea(latLngs);
          measurement(this.getBounds().getCenter(),
              formatter(templatLngs[0]), options.lang.totalArea, 0, options)
            .addTo(this._measurementLayer);
          this.MEASUREDDATA = formatter(templatLngs[0])
        }

        return this;
      },
      MEASUREDDATA_func: function() {
        if (this.MEASUREDDATA != null) {
          return this.MEASUREDDATA;
        }

      },
      getMeasureStr: function(acCurrDrawPoints) {
        if (acCurrDrawPoints != null) {
          this.tempAcCurrDrawPoints = acCurrDrawPoints
        }
      },
      _getRotation: function(ll1, ll2) {
        var p1 = this._map.project(ll1),
          p2 = this._map.project(ll2);

        return Math.atan((p2.y - p1.y) / (p2.x - p1.x));
      }
    });

    L.Polyline.addInitHook(function() {
      if (this.options.showMeasurements) {
        this.showMeasurements();
      }
    });
  }
}

function measurement(latLng, measurement, title, rotation, options) {
  return new Measurement(latLng, measurement, title, rotation, options);
};

function formatDistance(d) {
  var unit,
    feet;

  if (this._measurementOptions.imperial) {
    feet = d / 0.3048;
    if (feet > 3000) {
      d = d / 1609.344;
      unit = 'mi';
    } else {
      d = feet;
      unit = 'ft';
    }
  } else {
    if (d > 1000) {
      d = d / 1000;
      unit = 'km';
    } else {
      unit = 'm';
    }
  }

  if (d < 100) {
    return d.toFixed(1) + ' ' + unit;
  } else {
    return Math.round(d) + ' ' + unit;
  }
}

function tempFormatDistance(tempPoints) {
  var mapCrs = this.options.crs;
  var points = new Array();
  for (var p = 0; p < tempPoints.length; p++) {
    var points_old = mapCrs.project(tempPoints[p]);
    points.push(points_old);
  }
  var len = points.length;
  var dist = 0;
  var p1, p2, x1, y1, x2, y2;
  for (var i = 0; i < len - 1; i++) {
    p1 = points[i];
    x1 = p1.x;
    y1 = p1.y;
    p2 = points[i + 1];
    x2 = p2.x;
    y2 = p2.y;
    dist += Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
  }

  var lineLength = dist;
  var strMeasure = "";
  if (lineLength > 1000) {
    strMeasure = '总长:' + Number(lineLength / 1000).toFixed(1) + "公里";
  } else {
    strMeasure = '总长:' + Math.round(lineLength) + "米";
  }
  return strMeasure;
}

function tempMoveFormatDistance(points, mapPoint) {
  var mapCrs = this.options.crs;
  points = mapCrs.project(points);
  points = new Array(points);

  mapPoint = mapCrs.project(mapPoint);
  points.push(mapPoint); //压入临时点，加入计算
  var len = points.length;
  var dist = 0;
  var p1, p2, x1, y1, x2, y2;
  for (var i = 0; i < len - 1; i++) {
    p1 = points[i];
    x1 = p1.x;
    y1 = p1.y;
    p2 = points[i + 1];
    x2 = p2.x;
    y2 = p2.y;
    dist += Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
  }
  //points.pop();//弹出临时点

  var lineLength = dist;
  var strMeasure = "";
  if (lineLength > 1000) {
    strMeasure = Number(lineLength / 1000).toFixed(1) + "公里";
  } else {
    strMeasure = Math.round(lineLength) + "米";
  }
  return strMeasure;
}

function formatArea(a) {
  var unit,
    sqfeet;

  if (this._measurementOptions.imperial) {
    if (a > 404.685642) {
      a = a / 4046.85642;
      unit = 'ac';
    } else {
      a = a / 0.09290304;
      unit = 'ft²';
    }
  } else {
    if (a > 1000000) {
      a = a / 1000000;
      unit = 'km²';
    } else {
      unit = 'm²';
    }
  }

  if (a < 100) {
    return a.toFixed(1) + ' ' + unit;
  } else {
    return Math.round(a) + ' ' + unit;
  }
}

function tempFormatArea(tempPoints) {
  var mapCrs = this.options.crs;
  var points = new Array();
  for (var p = 0; p < tempPoints.length; p++) {
    var points_old = mapCrs.project(tempPoints[p]);
    points.push(points_old);
  }
  var isEarthSys = true;
  for (var i = 0; i < points.length - 1; i++) {
    if (points[i].x > 180) {
      isEarthSys = true;
    } else {
      isEarthSys = false;
    }
    break;
  }
  var len = points.length;
  var project = 1;
  var dist = 0;
  var area2 = 0;
  var p1, p2;
  var x1 = 0,
    y1 = 0,
    x2 = 0,
    y2 = 0;

  if (points != null) {
    var j;
    var isProjSys = isEarthSys; //是否投影坐标系

    if (isProjSys) { //大地坐标系面积计算
      for (var i = 0; i < len; i++) {
        j = (i + 1) % len;
        p1 = points[i];
        p2 = points[j];
        area2 += p1.x * p2.y;
        area2 -= p1.y * p2.x;
      }
    } else {
      if (project == 1) {
        // 经纬度坐标系面积计算
        // 计算中央经度线
        var x, minX = 0,
          maxX = 0;
        for (var i = 0; i < len; i++) {
          p1 = points[i];
          x = p1.x;
          //System.out.println("x==" + x);
          if (i == 0) {
            minX = x;
            maxX = x;
          } else {
            if (x < minX)
              minX = x;
            if (x > maxX)
              maxX = x;
          }
        }
        var lZone = parseInt(((minX + maxX) / 2 + 3) / 6);
        for (var i = 0; i < len; i++) {
          j = (i + 1) % len;
          if (i == 0) {
            p1 = points[i];
            x1 = widget.LonLatToXA80N(lZone, p1.x, p1.y)[0];
            y1 = widget.LonLatToXA80N(lZone, p1.x, p1.y)[1];
          } else {
            // 利用上一次坐标转换结果
            x1 = x2;
            y1 = y2;
          }
          p2 = points[j];
          x2 = widget.LonLatToXA80N(lZone, p2.x, p2.y)[0];
          y2 = widget.LonLatToXA80N(lZone, p2.x, p2.y)[1];
          area2 += x1 * y2;
          area2 -= x2 * y1;
        }
      }
    }
  }
  var polyArea = Math.abs(area2 / 2);
  var strMeasure = "";
  if (polyArea > 1000000) {
    strMeasure = "总面积:" + Number(polyArea / 1000000).toFixed(4) + "平方公里\n(约:" + Number(polyArea * 0.0015).toFixed(3) +
      "亩)";
  } else {
    strMeasure = "总面积:" + polyArea.toFixed(0) + "平方米\n(约:" + Number(polyArea * 0.0015).toFixed(3) + "亩)";
  }
  return strMeasure;
}

// ringArea function copied from geojson-area
// (https://github.com/mapbox/geojson-area)
// This function is distributed under a separate license,
// see LICENSE.md.
function ringArea(coords) {
  var rad = function rad(_) {
    return _ * Math.PI / 180;
  };
  var p1, p2, p3, lowerIndex, middleIndex, upperIndex,
    area = 0,
    coordsLength = coords.length;

  if (coordsLength > 2) {
    for (var i = 0; i < coordsLength; i++) {
      if (i === coordsLength - 2) { // i = N-2
        lowerIndex = coordsLength - 2;
        middleIndex = coordsLength - 1;
        upperIndex = 0;
      } else if (i === coordsLength - 1) { // i = N-1
        lowerIndex = coordsLength - 1;
        middleIndex = 0;
        upperIndex = 1;
      } else { // i = 0 to N-3
        lowerIndex = i;
        middleIndex = i + 1;
        upperIndex = i + 2;
      }
      p1 = coords[lowerIndex];
      p2 = coords[middleIndex];
      p3 = coords[upperIndex];
      area += (rad(p3.lng) - rad(p1.lng)) * Math.sin(rad(p2.lat));
    }

    area = area * 6378137 * 6378137 / 2;
  }

  return Math.abs(area);
};

function circleArea(d) {
  var rho = d / 6378137;
  return 2 * Math.PI * 6378137 * 6378137 * (1 - Math.cos(rho));
};

function override(method, fn, hookAfter) {
  if (!hookAfter) {
    return function() {
      method.apply(this, arguments);
      return fn.apply(this, arguments);
    }
  } else {
    return function() {
      fn.apply(this, arguments);
      return method.apply(this, arguments);
    }
  }
};
export default Measurement
