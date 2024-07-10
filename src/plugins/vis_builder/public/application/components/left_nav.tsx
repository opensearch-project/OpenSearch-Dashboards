/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import './side_nav.scss';
import { DataSourceSelect } from './data_source_select';
import { DataTab, DataTabProps } from './data_tab';

export const LeftNav = ({
  vizType,
  editingState,
  schemas,
  aggProps,
  activeSchemaFields,
  setActiveSchemaFields,
  isDragging,
}: DataTabProps) => {
  return (
    <section className="vbSidenav left">
      <div className="vbDatasourceSelect vbSidenav__header">
        <DataSourceSelect />
      </div>
      <DataTab
        isDragging={isDragging}
        vizType={vizType}
        editingState={editingState}
        schemas={schemas}
        aggProps={aggProps}
        activeSchemaFields={activeSchemaFields}
        setActiveSchemaFields={setActiveSchemaFields}
        key="containerName"
      />
    </section>
  );
};
