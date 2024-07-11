/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

import { EuiButton, EuiContextMenu, EuiPopover } from '@elastic/eui';
// import { DataSourceSelectable } from '../../data_sources/datasource_selector'

export const DataSetNavigator = ({ indexPatternSelectable, dataConnectionsRef }) => {
  const [isDataSetNavigatorOpen, setIsDataSetNavigatorOpen] = useState(false);

  const onButtonClick = () => setIsDataSetNavigatorOpen((isOpen) => !isOpen);
  const closePopover = () => setIsDataSetNavigatorOpen(false);

  const panels = [
    {
      id: 0,
      title: 'DATA SOURCE',
      items: [
        {
          name: 'Index Patterns',
          panel: 1,
        },
        {
          name: 'Clusters',
          panel: 2,
        },
        {
          name: '...',
          onClick: () => console.log('clicked ...'),
        },
      ],
    },
    {
      id: 1,
      title: 'Index Patterns',
      content: <div>{indexPatternSelectable}</div>,
    },
    {
      id: 2,
      title: 'Clusters',
      content: <div>{dataConnectionsRef?.current}</div>,
    },
  ];

  const button = (
    <EuiButton iconType="arrowDown" iconSide="right" onClick={onButtonClick}>
      Datasets
    </EuiButton>
  );

  return (
    <EuiPopover
      button={button}
      isOpen={isDataSetNavigatorOpen}
      closePopover={closePopover}
      anchorPosition="downLeft"
    >
      <EuiContextMenu initialPanelId={0} panels={panels} />
    </EuiPopover>
  );
};
