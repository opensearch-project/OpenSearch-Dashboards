/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiSuperSelect } from '@elastic/eui';
import { i18n } from '@osd/i18n';

export interface SourceTypeOption {
  id: string;
  label: string;
}

interface Props {
  options: SourceTypeOption[];
  selectedId: string;
  onChange: (id: string) => void;
}

/**
 * The Explore logs page's source type picker: OpenSearch plus every registered source that
 * supports the page. The page renders it only when there is more than one.
 */
export const SourceTypeControl: React.FC<Props> = ({ options, selectedId, onChange }) => (
  <EuiSuperSelect
    compressed
    prepend={i18n.translate('explore.logsDrilldown.sourceType.label', {
      defaultMessage: 'Source',
    })}
    options={options.map((option) => ({
      value: option.id,
      inputDisplay: option.label,
      'data-test-subj': `logsDrilldownSourceType-${option.id}`,
    }))}
    valueOfSelected={selectedId}
    onChange={onChange}
    aria-label={i18n.translate('explore.logsDrilldown.sourceType.ariaLabel', {
      defaultMessage: 'Source type',
    })}
    data-test-subj="logsDrilldownSourceTypeControl"
  />
);
