/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { DataView } from '../../../../data/public';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { DatasetManagmentContext } from '../../types';
import { getEditBreadcrumbs } from '../breadcrumbs';

import { EditDataset } from '../edit_dataset';

const EditDatasetCont: React.FC<RouteComponentProps<{ id: string }>> = ({ ...props }) => {
  const { data, setBreadcrumbs } = useOpenSearchDashboards<DatasetManagmentContext>().services;
  const [dataset, setDataset] = useState<DataView>();

  useEffect(() => {
    data.dataViews.get(props.match.params.id).then((ip: DataView) => {
      setDataset(ip);
      setBreadcrumbs(getEditBreadcrumbs(ip));
    });
  }, [data.dataViews, props.match.params.id, setBreadcrumbs]);

  if (dataset) {
    return <EditDataset dataset={dataset} />;
  } else {
    return <></>;
  }
};

export const EditDatasetContainer = withRouter(EditDatasetCont);
