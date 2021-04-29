/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
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

/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';
import { FormattedMessage } from '@osd/i18n/react';
import { EuiSpacer, EuiButtonEmpty, EuiEmptyPrompt } from '@elastic/eui';
import { toMountPoint } from '../../../opensearch_dashboards_react/public';

export const createRegionBlockedWarning = (function () {
  class RegionBlockedWarningOverlay extends React.Component {
    constructor(props) {
      super(props);
    }

    render() {
      return (
        <EuiEmptyPrompt
          iconType="gisApp"
          iconColor={null}
          title={<h2>The default Web Map Service is currently not available in your region.</h2>}
          titleSize="xs"
          body={
            <Fragment>
              <p>
                You can configure OpenSearch Dash to use a different map server for coordinate maps
                by modifying the default WMS properties.
              </p>
            </Fragment>
          }
        />
      );
    }
  }
  return () => {
    let messageBlock = document.getElementById('blocker-div');
    if (!messageBlock) {
      messageBlock = document.createElement('div');
      messageBlock.id = 'blocker-div';
      messageBlock.setAttribute('class', 'visError leaflet-popup-pane');
      Array.prototype.forEach.call(
        document.getElementsByClassName('leaflet-container'),
        (leafletDom) => {
          ReactDOM.render(
            new RegionBlockedWarningOverlay().render(),
            leafletDom.appendChild(messageBlock)
          );
        }
      );
    }
  };
})();

export const removeRegionBlockedWarning = (function () {
  return () => {
    const childEle = document.getElementById('blocker-div');
    if (childEle) {
      childEle.parentNode.removeChild(childEle);
    }
  };
})();

export const createZoomWarningMsg = (function () {
  let disableZoomMsg = false;
  const setZoomMsg = (boolDisableMsg) => (disableZoomMsg = boolDisableMsg);

  class ZoomWarning extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        disabled: false,
      };
    }

    render() {
      return (
        <div>
          <p>
            <FormattedMessage
              id="maps_legacy.opensearchDashboardsMap.zoomWarning"
              defaultMessage="You've reached the maximum number of zoom
              levels. To zoom all the way in, upgrade to the
              {defaultDistribution} of OpenSearch and OpenSearch Dashboards. You'll get
              access to additional zoom levels for free through the {ems}.
              Or, you can configure your own map server. Please go to
              { wms } or { configSettings} for more information."
              // TODO: [RENAMEME] Need valid URLs
              values={{
                defaultDistribution: (
                  <a target="_blank" href="https://www.opensearch.org/downloads/kibana">
                    {`default distribution `}
                  </a>
                ),
                ems: (
                  <a target="_blank" href="https://www.opensearch.org/elastic-maps-service">
                    {`OpenSearch Maps Service`}
                  </a>
                ),
                wms: (
                  <a
                    target="_blank"
                    href="https://www.opensearch.org/guide/en/kibana/current/tilemap.html"
                  >
                    {`Custom WMS Configuration`}
                  </a>
                ),
                configSettings: (
                  <a
                    target="_blank"
                    href="https://www.opensearch.org/guide/en/kibana/current/settings.html"
                  >
                    {`Custom TMS Using Config Settings`}
                  </a>
                ),
              }}
            />
          </p>
          <EuiSpacer size="xs" />
          <EuiButtonEmpty
            size="s"
            flush="left"
            isDisabled={this.state.disabled}
            onClick={() => {
              this.setState(
                {
                  disabled: true,
                },
                () => this.props.onChange(this.state.disabled)
              );
            }}
            data-test-subj="suppressZoomWarnings"
          >
            {`Don't show again`}
          </EuiButtonEmpty>
        </div>
      );
    }
  }

  const zoomToast = {
    title: 'No additional zoom levels',
    text: toMountPoint(<ZoomWarning onChange={setZoomMsg} />),
    'data-test-subj': 'maxZoomWarning',
  };

  return (toastService, getZoomLevel, getMaxZoomLevel) => {
    return () => {
      const zoomLevel = getZoomLevel();
      const maxMapZoom = getMaxZoomLevel();
      if (!disableZoomMsg && zoomLevel === maxMapZoom) {
        toastService.addDanger(zoomToast);
      }
    };
  };
})();
