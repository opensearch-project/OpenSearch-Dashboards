/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';

import { ValueMappingOptions } from '../../types';
import { StyleAccordion } from '../style_accordion';
import { ValueMappingSection } from './value_mapping_section';

export interface ValueMappingPanelProps {
  valueMappingOption?: ValueMappingOptions;
  onChange: (ValueMappingOptions: ValueMappingOptions) => void;
}

export const ValueMappingPanel = ({ valueMappingOption, onChange }: ValueMappingPanelProps) => {
  const handleUpdateOptions = <K extends keyof ValueMappingOptions>(
    key: K,
    value: ValueMappingOptions[K]
  ) => {
    onChange({ ...valueMappingOption, [key]: value });
  };
  return (
    // @ts-expect-error TS2322 TODO(ts-error): fixme
    <StyleAccordion
      id="thresholdSection"
      accordionLabel={i18n.translate('explore.stylePanel.valueMapping.panel.title', {
        defaultMessage: 'Value mappings',
      })}
      initialIsOpen={true}
    >
      <ValueMappingSection
        valueMappings={valueMappingOption?.valueMappings}
        onChange={(mappings) => handleUpdateOptions('valueMappings', mappings)}
      />
    </StyleAccordion>
  );
};
