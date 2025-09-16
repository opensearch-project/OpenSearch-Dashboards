/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React from 'react';
import { EuiFormRow, EuiSwitch } from '@elastic/eui';
import { StyleAccordion } from '../style_accordion';
import { TitleOptions } from '../../types';
import { DebouncedFieldText } from '../utils';

export interface TitleOptionsPanelProps {
  titleOptions: TitleOptions;
  onShowTitleChange: (show: Partial<TitleOptions>) => void;
}

export const TitleOptionsPanel: React.FC<TitleOptionsPanelProps> = ({
  titleOptions,
  onShowTitleChange,
}) => {
  return (
    <StyleAccordion
      id="titleSection"
      accordionLabel={i18n.translate('explore.stylePanel.tabs.title', {
        defaultMessage: 'Title',
      })}
      initialIsOpen={true}
    >
      <EuiFormRow>
        <EuiSwitch
          compressed
          label={i18n.translate('explore.stylePanel.title.showTitle', {
            defaultMessage: 'Show title',
          })}
          checked={titleOptions?.show}
          onChange={(e) => onShowTitleChange({ show: e.target.checked })}
          data-test-subj="titleModeSwitch"
        />
      </EuiFormRow>
      {titleOptions?.show && (
        <EuiFormRow
          label={i18n.translate('explore.stylePanel.title.displayName', {
            defaultMessage: 'Display name',
          })}
        >
          <DebouncedFieldText
            compressed
            value={titleOptions.titleName}
            onChange={(value) => onShowTitleChange({ titleName: value })}
            placeholder={i18n.translate('explore.stylePanel.title.default', {
              defaultMessage: 'Default title',
            })}
          />
        </EuiFormRow>
      )}
    </StyleAccordion>
  );
};
