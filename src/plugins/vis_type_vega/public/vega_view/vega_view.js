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

import { get } from 'lodash';
import {
  VisLayerTypes,
  calculateYAxisPadding,
  VisFlyoutContext,
} from '../../../vis_augmenter/public';
import { vega } from '../lib/vega';
import { VegaBaseView } from './vega_base_view';

export class VegaView extends VegaBaseView {
  async _initViewCustomizations() {
    // In some cases, Vega may be initialized twice... TBD
    if (!this._$container) return;

    const view = new vega.View(
      vega.parse(this._parser.spec, null, this._vegaViewOptions),
      this._vegaViewConfig
    );

    view.warn = this.onWarn.bind(this);
    view.error = this.onError.bind(this);
    if (this._parser.useResize) this.updateVegaSize(view);

    const showPointInTimeEvents =
      this._parser.visibleVisLayers?.get(VisLayerTypes.PointInTimeEvents) === true;

    if (showPointInTimeEvents) {
      this.addPointInTimeEventPadding(view);
      const inFlyout = get(this, '_parser.visAugmenterConfig.inFlyout', false);
      const flyoutContext = get(
        this,
        '_parser.visAugmenterConfig.flyoutContext',
        VisFlyoutContext.BASE_VIS
      );
      const leftValueAxisPadding = get(
        this,
        '_parser.visAugmenterConfig.leftValueAxisPadding',
        false
      );
      const rightValueAxisPadding = get(
        this,
        '_parser.visAugmenterConfig.rightValueAxisPadding',
        false
      );
      const yAxisConfig = get(this, '_parser.vlspec.config.axisY', {});

      // Autosizing is needed here since autosize won't be set correctly when there is PointInTimeEventLayers.
      // This is because these layers cause the spec to use `vconcat` under the hood to stack the base chart
      // with the event chart. Autosize doesn't work at the vega-lite level, so we set here at the vega level.
      // Details here: https://github.com/opensearch-project/OpenSearch-Dashboards/issues/3485#issuecomment-1507442348
      view.autosize({
        type: 'fit',
        contains: 'padding',
      });

      if (inFlyout) {
        const yAxisPadding = calculateYAxisPadding(yAxisConfig);
        view.padding({
          ...view.padding(),
          // If we are displaying an event chart (no vis data), then we need to offset the chart
          // to align the data / events. We do this by checking if padding is needed on the left
          // and/or right, and adding padding based on the y axis config.
          left:
            leftValueAxisPadding &&
            (flyoutContext === VisFlyoutContext.EVENT_VIS ||
              flyoutContext === VisFlyoutContext.TIMELINE_VIS)
              ? yAxisPadding
              : 0,
          right:
            rightValueAxisPadding && flyoutContext === VisFlyoutContext.EVENT_VIS
              ? yAxisPadding
              : 0,
        });
      }
    }

    view.initialize(this._$container.get(0), this._$controls.get(0));

    if (this._parser.useHover) view.hover();

    await this.setView(view);
    this.setDebugValues(view, this._parser.spec, this._parser.vlspec);
  }
}
