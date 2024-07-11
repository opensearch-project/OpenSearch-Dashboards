/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

import { EuiButtonEmpty, EuiContextMenu, EuiPopover } from '@elastic/eui';
// import { DataSourceSelectable } from '../../data_sources/datasource_selector'

interface DataSetNavigatorProps {
  indexPatternSelectable: any;
  dataConnectionsRef: HTMLDivElement | null;
  children: any;
}

export const DataSetNavigator = ({
  indexPatternSelectable,
  dataConnectionsRef,
  children
}: DataSetNavigatorProps) => {
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
      content: <div>{dataConnectionsRef?.[0]}</div>,
    },
  ];

  const button = (
    <EuiButtonEmpty
      className="dataExplorerDSSelect"
      color="text"
      // size="xs"
      iconType="arrowDown"
      iconSide="right"
      onClick={onButtonClick}
    >
      {children && children.length > 0 ? children[0].label : 'Datasets'}
    </EuiButtonEmpty>
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
