/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiIcon } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import React from 'react';

import './disabled_visualization.scss';

export function DisabledVisualization({ title }: { title: string }) {
  return (
    <div className="vbDisabledVisualization" data-test-subj="disabledVisBuilderVis">
      <EuiIcon type="beaker" size="xl" />
      <div>
        <FormattedMessage
          id="visBuilder.disabledVisualizationTitle"
          defaultMessage="{title} is an experimental visualization."
          values={{ title: <em className="visDisabledLabVisualization__title">{title}</em> }}
        />
      </div>
      <div>
        <FormattedMessage
          id="visBuilder.disabledVisualizationMessage"
          defaultMessage="Please turn on lab-mode in the advanced settings to see these visualizations."
        />
      </div>
    </div>
  );
}
