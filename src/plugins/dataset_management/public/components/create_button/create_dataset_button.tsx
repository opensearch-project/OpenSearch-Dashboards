/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, ReactNode } from 'react';

import {
  EuiButton,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiDescriptionList,
  EuiDescriptionListDescription,
  EuiDescriptionListTitle,
  EuiPopover,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';

import { CORE_SIGNAL_TYPES } from '../../../../data/common';

interface CreateDatasetButtonProps {
  onCreateDataset: (signalType: string) => void;
  children?: ReactNode;
}

export const CreateDatasetButton: React.FC<CreateDatasetButtonProps> = ({
  onCreateDataset,
  children,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const togglePopover = () => {
    setIsPopoverOpen(!isPopoverOpen);
  };

  const closePopover = () => {
    setIsPopoverOpen(false);
  };

  const signalTypeOptions = [
    {
      text: i18n.translate('datasetManagement.createDatasetButton.logsLabel', {
        defaultMessage: 'Logs',
      }),
      description: i18n.translate('datasetManagement.createDatasetButton.logsDescription', {
        defaultMessage: 'Create dataset for log analytics',
      }),
      testSubj: 'createLogsDataset',
      signalType: CORE_SIGNAL_TYPES.LOGS,
    },
    {
      text: i18n.translate('datasetManagement.createDatasetButton.tracesLabel', {
        defaultMessage: 'Traces',
      }),
      description: i18n.translate('datasetManagement.createDatasetButton.tracesDescription', {
        defaultMessage: 'Create dataset for application\nmonitoring and trace analysis',
      }),
      testSubj: 'createTracesDataset',
      signalType: CORE_SIGNAL_TYPES.TRACES,
    },
  ];

  const button = (
    <EuiButton
      data-test-subj="createDatasetButton"
      fill={true}
      size="s"
      iconType="arrowDown"
      iconSide="right"
      onClick={togglePopover}
    >
      {children}
    </EuiButton>
  );

  return (
    <EuiPopover
      id="signalTypePanel"
      button={button}
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      panelPaddingSize="none"
      anchorPosition="downLeft"
    >
      <EuiContextMenuPanel
        size="s"
        items={signalTypeOptions.map((option) => {
          return (
            <EuiContextMenuItem
              key={option.signalType}
              onClick={() => {
                closePopover();
                onCreateDataset(option.signalType);
              }}
              data-test-subj={option.testSubj}
            >
              <EuiDescriptionList compressed={true}>
                <EuiDescriptionListTitle style={{ whiteSpace: 'nowrap' }}>
                  {option.text}
                </EuiDescriptionListTitle>
                <EuiDescriptionListDescription style={{ whiteSpace: 'pre-line' }}>
                  {option.description}
                </EuiDescriptionListDescription>
              </EuiDescriptionList>
            </EuiContextMenuItem>
          );
        })}
      />
    </EuiPopover>
  );
};
