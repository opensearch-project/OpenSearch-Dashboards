/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { withRouter, RouteComponentProps } from 'react-router-dom';

import { EuiFlexGroup, EuiFlexItem, EuiPanel } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { DataView, IndexPatternField } from '../../../../../../plugins/data/public';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { DatasetManagmentContext } from '../../../types';
import { IndexHeader } from '../index_header';
import { TAB_SCRIPTED_FIELDS, TAB_INDEXED_FIELDS } from '../constants';

import { FieldEditor } from '../../field_editor';

interface CreateEditFieldProps extends RouteComponentProps {
  dataset: DataView;
  mode?: string;
  fieldName?: string;
}

const newFieldPlaceholder = i18n.translate(
  'datasetManagement.editDataset.scripted.newFieldPlaceholder',
  {
    defaultMessage: 'New Scripted Field',
  }
);

export const CreateEditField = withRouter(
  ({ dataset, mode, fieldName, history }: CreateEditFieldProps) => {
    const { uiSettings, chrome, notifications, data } = useOpenSearchDashboards<
      DatasetManagmentContext
    >().services;
    const spec =
      mode === 'edit' && fieldName
        ? dataset.fields.getByName(fieldName)?.spec
        : (({
            scripted: true,
            type: 'number',
            name: undefined,
          } as unknown) as IndexPatternField);

    const url = `/patterns/${dataset.id}`;

    if (mode === 'edit' && !spec) {
      const message = i18n.translate('datasetManagement.editDataset.scripted.noFieldLabel', {
        defaultMessage:
          "'{datasetTitle}' index pattern doesn't have a scripted field called '{fieldName}'",
        values: { datasetTitle: dataset.title, fieldName },
      });
      notifications.toasts.addWarning(message);
      history.push(url);
    }

    const docFieldName = spec?.name || newFieldPlaceholder;

    chrome.docTitle.change([docFieldName, dataset.title]);

    const redirectAway = () => {
      history.push(
        `${url}#/?_a=(tab:${spec?.scripted ? TAB_SCRIPTED_FIELDS : TAB_INDEXED_FIELDS})`
      );
    };

    if (spec) {
      return (
        <EuiPanel paddingSize={'l'}>
          <EuiFlexGroup direction="column">
            <EuiFlexItem>
              <IndexHeader dataset={dataset} defaultIndex={uiSettings.get('defaultIndex')} />
            </EuiFlexItem>
            <EuiFlexItem>
              <FieldEditor
                dataset={dataset}
                spec={spec}
                services={{
                  saveDataset: data.dataViews.updateSavedObject.bind(data.dataViews),
                  redirectAway,
                }}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      );
    } else {
      return <></>;
    }
  }
);
