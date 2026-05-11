/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFormRow, EuiSelect, EuiSwitch } from '@elastic/eui';
import { SplitLayout } from './visualization_builder.types';
import { VisColumn } from './types';
import { SplitFieldSelector } from './split_field_selector';
import { StyleAccordion } from './style_panel/style_accordion';

interface SplitSettingsAccordionProps {
  categoricalColumns: VisColumn[];
  numericalColumns: VisColumn[];
  splitField?: string;
  splitLayout?: SplitLayout;
  showSplitLabel?: boolean;
  onSplitFieldChange: (field: string | undefined) => void;
  onSplitLayoutChange: (layout: SplitLayout) => void;
  onShowSplitLabelChange: (show: boolean) => void;
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
  onSplitFieldChange,
  onSplitLayoutChange,
  onShowSplitLabelChange,
}) => {
  return (
    <StyleAccordion id="splitSettings" accordionLabel="Split" initialIsOpen={!!splitField}>
      <SplitFieldSelector
        categoricalColumns={categoricalColumns}
        numericalColumns={numericalColumns}
        splitField={splitField}
        onSplitFieldChange={onSplitFieldChange}
      />
      {splitField && (
        <>
          <EuiFormRow label="Layout" data-test-subj="splitLayoutSelector">
            <EuiSelect
              compressed
              options={layoutOptions}
              value={splitLayout || 'auto'}
              onChange={(e) => onSplitLayoutChange(e.target.value as SplitLayout)}
              data-test-subj="splitLayoutSelect"
            />
          </EuiFormRow>
          <EuiFormRow>
            <EuiSwitch
              label="Show labels"
              checked={showSplitLabel ?? false}
              onChange={(e) => onShowSplitLabelChange(e.target.checked)}
              data-test-subj="splitShowLabelSwitch"
              compressed
            />
          </EuiFormRow>
        </>
      )}
    </StyleAccordion>
  );
};
