/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { withRouter, RouteComponentProps } from 'react-router-dom';

import { DataView } from '../../../../../../plugins/data/public';
import { getEditFieldBreadcrumbs, getCreateFieldBreadcrumbs } from '../../breadcrumbs';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { DatasetManagmentContext } from '../../../types';
import { CreateEditField } from './create_edit_field';

export type CreateEditFieldContainerProps = RouteComponentProps<{ id: string; fieldName: string }>;

const CreateEditFieldCont: React.FC<CreateEditFieldContainerProps> = ({ ...props }) => {
  const { setBreadcrumbs, data } = useOpenSearchDashboards<DatasetManagmentContext>().services;
  const [dataset, setDataset] = useState<DataView>();

  useEffect(() => {
    data.dataViews.get(props.match.params.id).then((ip: DataView) => {
      setDataset(ip);
      if (ip) {
        setBreadcrumbs(
          props.match.params.fieldName
            ? getEditFieldBreadcrumbs(ip, props.match.params.fieldName)
            : getCreateFieldBreadcrumbs(ip)
        );
      }
    });
  }, [props.match.params.id, props.match.params.fieldName, setBreadcrumbs, data.dataViews]);

  if (dataset) {
    return (
      <CreateEditField
        dataset={dataset}
        mode={props.match.params.fieldName ? 'edit' : 'create'}
        fieldName={props.match.params.fieldName}
      />
    );
  } else {
    return <></>;
  }
};

export const CreateEditFieldContainer = withRouter(CreateEditFieldCont);
