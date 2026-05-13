/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFormRow, EuiSelect, EuiSwitch } from '@elastic/eui';
import { SplitConfig, SplitLayout } from './visualization_builder.types';
import { VisColumn } from './types';
import { SplitFieldSelector } from './split_field_selector';
import { StyleAccordion } from './style_panel/style_accordion';

interface SplitSettingsAccordionProps {
  categoricalColumns: VisColumn[];
  numericalColumns: VisColumn[];
  splitField?: string;
  splitLayout?: SplitLayout;
  showSplitLabel?: boolean;
  onSplitConfigChange: (config: Partial<SplitConfig>) => void;
}

const layoutOptions = [
  { value: 'auto', text: 'Auto' },
  { value: 'horizontal', text: 'Horizontal' },
  { value: 'vertical', text: 'Vertical' },
];

export const SplitSettingsAccordion: React.FC<SplitSettingsAccordionProps> = ({
  categoricalColumns,
  numericalColumns,
  splitField,
  splitLayout,
  showSplitLabel,
  onSplitConfigChange,
}) => {
  return (
    <StyleAccordion id="splitSettings" accordionLabel="Split" initialIsOpen={!!splitField}>
      <SplitFieldSelector
        categoricalColumns={categoricalColumns}
        numericalColumns={numericalColumns}
        splitField={splitField}
        onSplitFieldChange={(field) => onSplitConfigChange({ splitField: field })}
      />
      {splitField && (
        <>
          <EuiFormRow label="Layout" data-test-subj="splitLayoutSelector">
            <EuiSelect
              compressed
              options={layoutOptions}
              value={splitLayout || 'auto'}
              onChange={(e) => onSplitConfigChange({ splitLayout: e.target.value as SplitLayout })}
              data-test-subj="splitLayoutSelect"
            />
          </EuiFormRow>
          <EuiFormRow>
            <EuiSwitch
              label="Show labels"
              checked={showSplitLabel ?? false}
              onChange={(e) => onSplitConfigChange({ showSplitLabel: e.target.checked })}
              data-test-subj="splitShowLabelSwitch"
              compressed
            />
          </EuiFormRow>
        </>
      )}
    </StyleAccordion>
  );
};
