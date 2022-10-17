/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import './side_nav.scss';
import { DataSourceSelect } from './data_source_select';
import { DataTab } from './data_tab';

export const LeftNav = () => {
  return (
    <section className="vbSidenav left">
      <div className="vbDatasourceSelect vbSidenav__header">
        <DataSourceSelect />
      </div>
      <DataTab key="containerName" />
    </section>
  );
};
