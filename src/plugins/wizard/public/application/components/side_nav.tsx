/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ReactElement } from 'react';
import { EuiTabbedContent, EuiTabbedContentTab } from '@elastic/eui';
import './side_nav.scss';
import { useVisualizationType } from '../utils/use';
import { DataSourceSelect } from './data_source_select';
import { DataTab } from './data_tab';
import { StyleTabConfig } from '../../services/type_service';

export const SideNav = () => {
  const {
    ui: { containerConfig },
  } = useVisualizationType();

  const tabs: EuiTabbedContentTab[] = Object.entries(containerConfig).map(
    ([containerName, config]) => {
      let content: null | ReactElement = null;
      switch (containerName) {
        case 'data':
          content = <DataTab key="containerName" />;
          break;

        case 'style':
          content = (config as StyleTabConfig).render();
          break;
      }

      return {
        id: containerName,
        name: containerName,
        content,
      };
    }
  );

  return (
    <section className="wizSidenav">
      <div className="wizDatasourceSelect">
        <DataSourceSelect />
      </div>
      <EuiTabbedContent tabs={tabs} className="wizSidenavTabs" />
    </section>
  );
};
