/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFieldText, EuiFormRow, EuiTextArea } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { StyleAccordion } from './style_panel/style_accordion';

interface PanelSettingsAccordionProps {
  title?: string;
  description?: string;
  onChange: (settings: { title?: string; description?: string }) => void;
}

export const PanelSettingsAccordion: React.FC<PanelSettingsAccordionProps> = ({
  title,
  description,
  onChange,
}) => {
  return (
    <StyleAccordion
      id="panelSettings"
      accordionLabel={i18n.translate('explore.stylePanel.panelSettings.title', {
        defaultMessage: 'Panel settings',
      })}
      initialIsOpen={false}
    >
      <EuiFormRow
        label={i18n.translate('explore.stylePanel.panelSettings.titleLabel', {
          defaultMessage: 'Title',
        })}
      >
        <EuiFieldText
          compressed
          value={title ?? ''}
          onChange={(event) => onChange({ title: event.target.value })}
          data-test-subj="panelSettingsTitle"
        />
      </EuiFormRow>
      <EuiFormRow
        label={i18n.translate('explore.stylePanel.panelSettings.descriptionLabel', {
          defaultMessage: 'Description',
        })}
      >
        <EuiTextArea
          compressed
          value={description ?? ''}
          onChange={(event) => onChange({ description: event.target.value })}
          data-test-subj="panelSettingsDescription"
        />
      </EuiFormRow>
    </StyleAccordion>
  );
};
