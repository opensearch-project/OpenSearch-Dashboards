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

import React from 'react';
import { EuiButton, EuiCallOut, EuiLink } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { i18n } from '@osd/i18n';

interface Props {
  isMapsAvailable: boolean;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => Promise<void>;
  visualizationLabel: string;
}

export function LegacyMapDeprecationMessage(props: Props) {
  const getMapsMessage = !props.isMapsAvailable ? (
    <FormattedMessage
      id="maps_legacy.defaultDistributionMessage"
      defaultMessage="To get Maps, upgrade to the {defaultDistribution} of OpenSearch and OpenSearch Dashboards."
      values={{
        defaultDistribution: (
          <EuiLink
            color="accent"
            external
            // TODO: link
            href="https://www.opensearch.org/downloads/kibana"
            target="_blank"
          >
            default distribution
          </EuiLink>
        ),
      }}
    />
  ) : null;

  const button = props.isMapsAvailable ? (
    <div>
      <EuiButton onClick={props.onClick} size="s">
        <FormattedMessage id="maps_legacy.openInMapsButtonLabel" defaultMessage="View in Maps" />
      </EuiButton>
    </div>
  ) : null;

  return (
    <EuiCallOut
      className="hide-for-sharing"
      data-test-subj="deprecatedVisInfo"
      size="s"
      title={i18n.translate('maps_legacy.legacyMapDeprecationTitle', {
        defaultMessage: '{label} will migrate to Maps in 8.0.',
        values: { label: props.visualizationLabel },
      })}
    >
      <p>
        <FormattedMessage
          id="maps_legacy.legacyMapDeprecationMessage"
          defaultMessage="With Maps, you can add multiple layers and indices, plot individual documents, symbolize features from data values, add heatmaps, grids, and clusters, and more. {getMapsMessage}"
          values={{ getMapsMessage }}
        />
      </p>
      {button}
    </EuiCallOut>
  );
}
