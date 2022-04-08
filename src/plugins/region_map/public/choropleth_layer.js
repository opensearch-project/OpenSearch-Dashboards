/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import $ from 'jquery';
import _ from 'lodash';
import d3 from 'd3';
import { i18n } from '@osd/i18n';
import * as topojson from 'topojson-client';
import { getNotifications } from './opensearch_dashboards_services';
import { colorUtil, OpenSearchDashboardsMapLayer } from '../../maps_legacy/public';
import { truncatedColorMaps } from '../../charts/public';

const EMPTY_STYLE = {
  weight: 1,
  opacity: 0.6,
  color: 'rgb(200,200,200)',
  fillOpacity: 0,
};

export class ChoroplethLayer extends OpenSearchDashboardsMapLayer {
  static _doInnerJoin(sortedMetrics, sortedGeojsonFeatures, joinField) {
    let j = 0;
    for (let i = 0; i < sortedGeojsonFeatures.length; i++) {
      const property = sortedGeojsonFeatures[i].properties[joinField];
      sortedGeojsonFeatures[i].__osdJoinedMetric = null;
      const position = sortedMetrics.length
        ? compareLexicographically(property, sortedMetrics[j].term)
        : -1;
      if (position === -1) {
        //just need to cycle on
      } else if (position === 0) {
        sortedGeojsonFeatures[i].__osdJoinedMetric = sortedMetrics[j];
      } else if (position === 1) {
        //needs to catch up
        while (j < sortedMetrics.length) {
          const newTerm = sortedMetrics[j].term;
          const newPosition = compareLexicographically(newTerm, property);
          if (newPosition === -1) {
            //not far enough
          } else if (newPosition === 0) {
            sortedGeojsonFeatures[i].__osdJoinedMetric = sortedMetrics[j];
            break;
          } else if (newPosition === 1) {
            //too far!
            break;
          }
          if (j === sortedMetrics.length - 1) {
            //always keep a reference to the last metric
            break;
          } else {
            j++;
          }
        }
      }
    }
  }

  constructor(
    name,
    attribution,
    format,
    showAllShapes,
    meta,
    layerConfig,
    serviceSettings,
    leaflet,
    layerChosenByUser
  ) {
    super();
    this._serviceSettings = serviceSettings;
    this._metrics = null;
    this._joinField = null;
    this._colorRamp = truncatedColorMaps[Object.keys(truncatedColorMaps)[0]].value;
    this._lineWeight = 1;
    this._tooltipFormatter = () => '';
    this._attribution = attribution;
    this._boundsOfData = null;
    this._showAllShapes = showAllShapes;
    this._layerName = name;
    this._layerConfig = layerConfig;
    this._leaflet = leaflet;
    this._layerChosenByUser = layerChosenByUser;

    // eslint-disable-next-line no-undef
    this._leafletLayer = this._leaflet.geoJson(null, {
      onEachFeature: (feature, layer) => {
        layer.on('click', () => {
          this.emit('select', feature.properties[this._joinField]);
        });
        let location = null;
        layer.on({
          mouseover: () => {
            const tooltipContents = this._tooltipFormatter(feature);
            if (!location) {
              // eslint-disable-next-line no-undef
              const leafletGeojson = this._leaflet.geoJson(feature);
              location = leafletGeojson.getBounds().getCenter();
            }
            this.emit('showTooltip', {
              content: tooltipContents,
              position: location,
            });
          },
          mouseout: () => {
            this.emit('hideTooltip');
          },
        });
      },
      style: this._makeEmptyStyleFunction(),
    });

    this._loaded = false;
    this._error = false;
    this._isJoinValid = false;
    this._whenDataLoaded = new Promise(async (resolve) => {
      try {
        let data;
        alert('_layerChosenByUser');
        console.log(this._layerChosenByUser);
        if (this._layerChosenByUser === 'default') {
          alert('wuhoo party by default!');
          data = await this._makeJsonAjaxCall();
        } else if (this._layerChosenByUser === 'custom') {
          alert('wuhoo party by custom!');
          // data = await this._makeJsonAjaxCall();
          data = {
            name: 'CL',
            type: 'FeatureCollection',
            features: [
              {
                geometry: {
                  coordinates: [
                    [
                      [-69.51009, -17.50659],
                      [-69.50611, -17.58513],
                      [-69.49712, -17.6214],
                      [-69.47578, -17.65241],
                      [-69.39478, -17.72114],
                      [-69.35941, -17.75938],
                      [-69.33424, -17.80579],
                      [-69.32765, -17.84155],
                      [-69.32687, -17.91513],
                      [-69.31786, -17.95162],
                      [-69.30241, -17.97621],
                      [-69.29003, -17.97663],
                      [-69.2776, -17.96753],
                      [-69.26205, -17.96402],
                      [-69.24189, -17.98676],
                      [-69.23481, -17.99296],
                      [-69.22779, -17.99554],
                      [-69.20417, -18.00112],
                      [-69.17389, -18.0189],
                      [-69.15771, -18.02572],
                      [-69.14084, -18.03078],
                      [-69.11988, -18.02985],
                      [-69.10418, -18.02376],
                      [-69.09206, -18.02334],
                      [-69.08228, -18.03908],
                      [-69.08172, -18.03998],
                      [-69.08921, -18.08308],
                      [-69.12593, -18.11109],
                      [-69.15544, -18.14024],
                      [-69.1412, -18.18685],
                      [-69.11066, -18.21796],
                      [-69.10035, -18.23429],
                      [-69.09694, -18.25754],
                      [-69.09684, -18.26798],
                      [-69.09575, -18.27676],
                      [-69.08102, -18.31914],
                      [-69.07929, -18.32803],
                      [-69.08188, -18.38249],
                      [-69.07782, -18.39882],
                      [-69.0417, -18.45774],
                      [-69.03439, -18.4783],
                      [-69.0349, -18.50104],
                      [-69.04165, -18.54889],
                      [-69.04284, -18.60047],
                      [-69.03384, -18.64945],
                      [-69.01015, -18.68976],
                      [-69.00348, -18.70268],
                      [-69.00111, -18.71622],
                      [-69.00317, -18.72955],
                      [-69.01054, -18.74299],
                      [-69.01067, -18.74371],
                      [-69.01054, -18.74454],
                      [-69.01015, -18.74526],
                      [-68.95465, -18.85699],
                      [-68.95145, -18.86732],
                      [-68.95178, -18.88934],
                      [-68.95984, -18.90784],
                      [-68.98961, -18.94649],
                      [-68.99043, -18.9465],
                      [-69.02542, -18.98819],
                      [-69.05627, -19.0191],
                      [-69.07834, -19.04995],
                      [-69.13565, -19.08964],
                      [-69.19298, -19.10286],
                      [-69.2459, -19.09403],
                      [-69.29881, -19.08964],
                      [-69.34292, -19.06757],
                      [-69.40023, -19.05434],
                      [-69.46198, -19.03233],
                      [-69.55898, -19.02788],
                      [-69.58986, -19.0191],
                      [-69.62954, -19.00142],
                      [-69.66042, -18.98819],
                      [-69.71334, -18.98819],
                      [-69.78829, -18.98819],
                      [-69.85444, -19.00142],
                      [-69.90294, -19.02349],
                      [-69.96027, -19.03233],
                      [-70.01319, -19.04556],
                      [-70.06611, -19.06757],
                      [-70.1146, -19.10726],
                      [-70.16752, -19.12932],
                      [-70.21163, -19.15578],
                      [-70.26955, -19.17111],
                      [-70.27033, -19.17148],
                      [-70.27721, -19.16611],
                      [-70.28087, -19.16041],
                      [-70.2753, -19.13307],
                      [-70.27473, -19.12282],
                      [-70.27741, -19.10898],
                      [-70.31273, -19.02191],
                      [-70.3138, -19.00708],
                      [-70.30896, -18.97147],
                      [-70.32012, -18.94428],
                      [-70.33016, -18.87921],
                      [-70.34519, -18.83936],
                      [-70.3531, -18.79705],
                      [-70.3566, -18.77337],
                      [-70.35424, -18.76312],
                      [-70.34293, -18.73594],
                      [-70.34293, -18.70827],
                      [-70.34154, -18.69647],
                      [-70.33617, -18.67571],
                      [-70.33617, -18.66351],
                      [-70.33922, -18.65399],
                      [-70.34805, -18.64332],
                      [-70.35045, -18.63633],
                      [-70.33525, -18.61758],
                      [-70.33886, -18.57822],
                      [-70.3343, -18.54599],
                      [-70.32543, -18.52402],
                      [-70.3225, -18.51336],
                      [-70.32287, -18.50213],
                      [-70.32836, -18.48008],
                      [-70.32934, -18.47186],
                      [-70.30637, -18.46055],
                      [-70.30356, -18.44544],
                      [-70.31371, -18.43011],
                      [-70.32592, -18.41375],
                      [-70.34948, -18.38318],
                      [-70.37009, -18.3627],
                      [-70.39258, -18.33956],
                      [-70.3947, -18.33775],
                      [-70.36939, -18.32473],
                      [-70.31789, -18.32122],
                      [-70.21087, -18.33124],
                      [-70.15907, -18.32597],
                      [-70.13416, -18.31894],
                      [-70.06323, -18.2807],
                      [-70.03936, -18.27305],
                      [-70.01001, -18.27264],
                      [-69.98779, -18.26427],
                      [-69.97034, -18.25063],
                      [-69.9228, -18.19647],
                      [-69.88345, -18.1636],
                      [-69.86534, -18.14459],
                      [-69.84358, -18.11317],
                      [-69.7831, -17.9816],
                      [-69.77989, -17.96258],
                      [-69.78237, -17.94387],
                      [-69.79061, -17.92475],
                      [-69.81278, -17.88827],
                      [-69.81816, -17.87142],
                      [-69.8201, -17.8461],
                      [-69.82904, -17.80383],
                      [-69.84609, -17.7691],
                      [-69.85756, -17.73417],
                      [-69.84984, -17.69159],
                      [-69.81805, -17.65914],
                      [-69.77581, -17.65697],
                      [-69.72904, -17.66327],
                      [-69.6839, -17.65604],
                      [-69.63832, -17.62606],
                      [-69.51009, -17.50659],
                    ],
                  ],
                  type: 'Polygon',
                },
                properties: {
                  iso_3166_2: 'CL-AP',
                  label_en: 'Arica y Parinacota Region',
                  label_es: 'Región de Arica y Parinacota',
                },
                type: 'Feature',
              },
            ],
          };
        } else {
          return;
        }
        let featureCollection;
        let formatType;
        if (typeof format === 'string') {
          formatType = format;
        } else if (format && format.type) {
          formatType = format.type;
        } else {
          formatType = 'geojson';
        }

        if (formatType === 'geojson') {
          featureCollection = data;
          console.log('fetaureCollection');
          console.log(featureCollection);
        } else if (formatType === 'topojson') {
          const features = _.get(data, 'objects.' + meta.feature_collection_path);
          featureCollection = topojson.feature(data, features); //conversion to geojson
        } else {
          //should never happen
          throw new Error(
            i18n.translate('regionMap.choroplethLayer.unrecognizedFormatErrorMessage', {
              defaultMessage: 'Unrecognized format {formatType}',
              values: { formatType },
            })
          );
        }
        this._sortedFeatures = featureCollection.features.slice();
        this._sortFeatures();

        if (showAllShapes) {
          this._leafletLayer.addData(featureCollection);
        } else {
          //we need to delay adding the data until we have performed the join and know which features
          //should be displayed
        }
        this._loaded = true;
        this._setStyle();
        resolve();
      } catch (e) {
        this._loaded = true;
        this._error = true;

        let errorMessage;
        if (e.status === 404) {
          errorMessage = i18n.translate(
            'regionMap.choroplethLayer.downloadingVectorData404ErrorMessage',
            {
              defaultMessage:
                "Server responding with '404' when attempting to fetch {name}. \
Make sure the file exists at that location.",
              values: { name: name },
            }
          );
        } else {
          errorMessage = i18n.translate(
            'regionMap.choroplethLayer.downloadingVectorDataErrorMessage',
            {
              defaultMessage:
                'The vector map {name} is not available. Please ensure the \
CORS configuration of the server permits requests from the OpenSearch Dashboards application on this host.',
              values: { name: name },
            }
          );
        }

        getNotifications().toasts.addDanger({
          title: i18n.translate(
            'regionMap.choroplethLayer.downloadingVectorDataErrorMessageTitle',
            {
              defaultMessage: 'Error downloading vector data',
            }
          ),
          text: errorMessage,
        });

        resolve();
      }
    });
  }

  //This method is stubbed in the tests to avoid network request during unit tests.
  async _makeJsonAjaxCall() {
    return this._serviceSettings.getJsonForRegionLayer(this._layerConfig);
  }

  _invalidateJoin() {
    this._isJoinValid = false;
  }

  _doInnerJoin() {
    ChoroplethLayer._doInnerJoin(this._metrics, this._sortedFeatures, this._joinField);
    this._isJoinValid = true;
  }

  _setStyle() {
    if (this._error || !this._loaded || !this._metrics || !this._joinField) {
      return;
    }

    if (!this._isJoinValid) {
      this._doInnerJoin();
      if (!this._showAllShapes) {
        const featureCollection = {
          type: 'FeatureCollection',
          features: this._sortedFeatures.filter((feature) => feature.__osdJoinedMetric),
        };
        this._leafletLayer.addData(featureCollection);
      }
    }

    const styler = this._makeChoroplethStyler();
    this._leafletLayer.setStyle(styler.leafletStyleFunction);

    if (this._metrics && this._metrics.length > 0) {
      const { min, max } = getMinMax(this._metrics);
      this._legendColors = colorUtil.getLegendColors(this._colorRamp);
      const quantizeDomain = min !== max ? [min, max] : d3.scale.quantize().domain();
      this._legendQuantizer = d3.scale.quantize().domain(quantizeDomain).range(this._legendColors);
    }
    this._boundsOfData = styler.getLeafletBounds();
    this.emit('styleChanged', {
      mismatches: styler.getMismatches(),
    });
  }

  getUrl() {
    return this._layerName;
  }

  setTooltipFormatter(tooltipFormatter, fieldFormatter, fieldName, metricLabel) {
    this._tooltipFormatter = (geojsonFeature) => {
      if (!this._metrics) {
        return '';
      }
      const match = this._metrics.find((bucket) => {
        return (
          compareLexicographically(bucket.term, geojsonFeature.properties[this._joinField]) === 0
        );
      });
      return tooltipFormatter(match, fieldFormatter, fieldName, metricLabel);
    };
  }

  setJoinField(joinfield) {
    if (joinfield === this._joinField) {
      return;
    }
    this._joinField = joinfield;
    this._sortFeatures();
    this._setStyle();
  }

  cloneChoroplethLayerForNewData(
    name,
    attribution,
    format,
    showAllData,
    meta,
    layerConfig,
    serviceSettings,
    leaflet,
    layerChosenByUser
  ) {
    const clonedLayer = new ChoroplethLayer(
      name,
      attribution,
      format,
      showAllData,
      meta,
      layerConfig,
      serviceSettings,
      leaflet,
      layerChosenByUser
    );
    clonedLayer.setJoinField(this._joinField);
    clonedLayer.setColorRamp(this._colorRamp);
    clonedLayer.setLineWeight(this._lineWeight);
    clonedLayer.setTooltipFormatter(this._tooltipFormatter);
    if (this._metrics) {
      clonedLayer.setMetrics(this._metrics, this._valueFormatter, this._metricTitle);
    }
    return clonedLayer;
  }

  _sortFeatures() {
    if (this._sortedFeatures && this._joinField) {
      this._sortedFeatures.sort((a, b) => {
        const termA = a.properties[this._joinField];
        const termB = b.properties[this._joinField];
        return compareLexicographically(termA, termB);
      });
      this._invalidateJoin();
    }
  }

  whenDataLoaded() {
    return this._whenDataLoaded;
  }

  setLayerChosenByUser(layerChosenByUser) {
    this._layerChosenByUser = layerChosenByUser;
  }

  setMetrics(metrics, fieldFormatter, metricTitle) {
    this._metrics = metrics.slice();
    this._valueFormatter = fieldFormatter;
    this._metricTitle = metricTitle;

    this._metrics.sort((a, b) => compareLexicographically(a.term, b.term));
    this._invalidateJoin();
    this._setStyle();
  }

  setColorRamp(colorRamp) {
    if (_.isEqual(colorRamp, this._colorRamp)) {
      return;
    }
    this._colorRamp = colorRamp;
    this._setStyle();
  }

  setLineWeight(lineWeight) {
    if (this._lineWeight === lineWeight) {
      return;
    }
    this._lineWeight = lineWeight;
    this._setStyle();
  }

  canReuseInstance(name, showAllShapes) {
    return this._layerName === name && this._showAllShapes === showAllShapes;
  }

  canReuseInstanceForNewMetrics(name, showAllShapes, newMetrics) {
    if (this._layerName !== name) {
      return false;
    }

    if (showAllShapes) {
      return this._showAllShapes === showAllShapes;
    }

    if (!this._metrics) {
      return;
    }

    const currentKeys = Object.keys(this._metrics);
    const newKeys = Object.keys(newMetrics);
    return _.isEqual(currentKeys, newKeys);
  }

  getBounds() {
    const bounds = super.getBounds();
    return this._boundsOfData ? this._boundsOfData : bounds;
  }

  appendLegendContents(jqueryDiv) {
    if (!this._legendColors || !this._legendQuantizer) {
      return;
    }

    const titleText = this._metricTitle;
    const $title = $('<div>').addClass('visMapLegend__title').text(titleText);
    jqueryDiv.append($title);

    this._legendColors.forEach((color) => {
      const labelText = this._legendQuantizer
        .invertExtent(color)
        .map((val) => {
          return this._valueFormatter.convert(val);
        })
        .join(' – ');

      const label = $('<div>');
      const icon = $('<i>').css({
        background: color,
        'border-color': makeColorDarker(color),
      });

      const text = $('<span>').text(labelText);
      label.append(icon);
      label.append(text);

      jqueryDiv.append(label);
    });
  }

  _makeEmptyStyleFunction() {
    const emptyStyle = _.assign({}, EMPTY_STYLE, {
      weight: this._lineWeight,
    });

    return () => {
      return emptyStyle;
    };
  }

  _makeChoroplethStyler() {
    const emptyStyle = this._makeEmptyStyleFunction();
    if (this._metrics.length === 0) {
      return {
        leafletStyleFunction: () => {
          return emptyStyle();
        },
        getMismatches: () => {
          return [];
        },
        getLeafletBounds: () => {
          return null;
        },
      };
    }

    const { min, max } = getMinMax(this._metrics);

    // eslint-disable-next-line no-undef
    const boundsOfAllFeatures = new this._leaflet.LatLngBounds();
    return {
      leafletStyleFunction: (geojsonFeature) => {
        const match = geojsonFeature.__osdJoinedMetric;
        if (!match) {
          return emptyStyle();
        }
        // eslint-disable-next-line no-undef
        const boundsOfFeature = this._leaflet.geoJson(geojsonFeature).getBounds();
        boundsOfAllFeatures.extend(boundsOfFeature);

        return {
          fillColor: getChoroplethColor(match.value, min, max, this._colorRamp),
          weight: this._lineWeight,
          opacity: 1,
          color: 'white',
          fillOpacity: 0.7,
        };
      },
      /**
       * should not be called until getLeafletStyleFunction has been called
       * @return {Array}
       */
      getMismatches: () => {
        const mismatches = this._metrics.slice();
        this._sortedFeatures.forEach((feature) => {
          const index = mismatches.indexOf(feature.__osdJoinedMetric);
          if (index >= 0) {
            mismatches.splice(index, 1);
          }
        });
        return mismatches.map((b) => b.term);
      },
      getLeafletBounds: function () {
        return boundsOfAllFeatures.isValid() ? boundsOfAllFeatures : null;
      },
    };
  }
}

//lexicographic compare
function compareLexicographically(termA, termB) {
  termA = typeof termA === 'string' ? termA : termA.toString();
  termB = typeof termB === 'string' ? termB : termB.toString();
  return termA.localeCompare(termB);
}

function makeColorDarker(color) {
  const amount = 1.3; //magic number, carry over from earlier
  return d3.hcl(color).darker(amount).toString();
}

function getMinMax(data) {
  alert(data);
  console.log('data');
  console.log(data);
  let min = data[0].value;
  let max = data[0].value;
  for (let i = 1; i < data.length; i += 1) {
    min = Math.min(data[i].value, min);
    max = Math.max(data[i].value, max);
  }
  return { min, max };
}

function getChoroplethColor(value, min, max, colorRamp) {
  if (min === max) {
    return colorUtil.getColor(colorRamp, colorRamp.length - 1);
  }
  const fraction = (value - min) / (max - min);
  const index = Math.round(colorRamp.length * fraction) - 1;
  const i = Math.max(Math.min(colorRamp.length - 1, index), 0);

  return colorUtil.getColor(colorRamp, i);
}
