/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiCompressedFieldText, EuiCompressedFormRow } from '@elastic/eui';
import {
  DASHBOARD_TITLE_TOKEN,
  DEFAULT_PANEL_TITLE_TEMPLATE,
  PANEL_TITLE_TOKEN,
  isPanelTitleTemplateValid,
} from '../../../utils/copy_dashboard_panels';

export interface CopyPanelsOptionState {
  copyPanels: boolean;
  panelTitleTemplate: string;
}

export const initialCopyPanelsOptionState: CopyPanelsOptionState = {
  copyPanels: false,
  panelTitleTemplate: DEFAULT_PANEL_TITLE_TEMPLATE,
};

/** The value handed to the save: undefined when "Copy panels" is off. */
export function getCopyPanels({ copyPanels, panelTitleTemplate }: CopyPanelsOptionState) {
  return copyPanels ? { titleTemplate: panelTitleTemplate } : undefined;
}

/** True when the modal can be submitted. */
export function isCopyPanelsOptionValid({ copyPanels, panelTitleTemplate }: CopyPanelsOptionState) {
  return !copyPanels || isPanelTitleTemplateValid(panelTitleTemplate);
}

/** "Copied panel title" field, shared by the save and clone modals. */
export function PanelTitleTemplateField(props: {
  value: string;
  onChange: (value: string) => void;
  'data-test-subj': string;
}) {
  const isInvalid = !isPanelTitleTemplateValid(props.value);
  return (
    <EuiCompressedFormRow
      label={i18n.translate('dashboard.topNav.copyPanels.titleTemplateLabel', {
        defaultMessage: 'Copied panel title',
      })}
      isInvalid={isInvalid}
      error={i18n.translate('dashboard.topNav.copyPanels.titleTemplateError', {
        defaultMessage: 'Enter a title that includes {panelToken}.',
        values: { panelToken: PANEL_TITLE_TOKEN },
      })}
      helpText={i18n.translate('dashboard.topNav.copyPanels.titleTemplateHelp', {
        defaultMessage:
          'Use {panelToken} for the original panel title and {dashboardToken} for the new dashboard title.',
        values: { panelToken: PANEL_TITLE_TOKEN, dashboardToken: DASHBOARD_TITLE_TOKEN },
      })}
    >
      <EuiCompressedFieldText
        data-test-subj={props['data-test-subj']}
        value={props.value}
        isInvalid={isInvalid}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </EuiCompressedFormRow>
  );
}
