/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { filter } from 'lodash';
import React, { useEffect, useState, useCallback } from 'react';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiBadge,
  EuiText,
  EuiLink,
  EuiCallOut,
  EuiPanel,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { DataView, IndexPatternField, ConfiguratorV2 } from '../../../../data/public';
import {
  useOpenSearchDashboards,
  toMountPoint,
} from '../../../../opensearch_dashboards_react/public';
import { DatasetManagmentContext } from '../../types';
import { Tabs } from './tabs';
import { IndexHeader } from './index_header';
import { DatasetInfoPanel } from './dataset_info_panel';
import { DatasetTableItem } from '../types';
import { getDatasets } from '../utils';
import { TopNavControlDescriptionData } from '../../../../navigation/public';
import { Query, DEFAULT_DATA } from '../../../../data/common';

export interface EditDatasetProps extends RouteComponentProps {
  dataset: DataView;
}

const mappingAPILink = i18n.translate(
  'datasetManagement.editDataset.timeFilterLabel.mappingAPILink',
  {
    defaultMessage: 'Mapping API',
  }
);

const mappingConflictHeader = i18n.translate(
  'datasetManagement.editDataset.mappingConflictHeader',
  {
    defaultMessage: 'Mapping conflict',
  }
);

const confirmMessage = i18n.translate('datasetManagement.editDataset.refreshLabel', {
  defaultMessage: 'This action resets the popularity counter of each field.',
});

const confirmModalOptionsRefresh = {
  confirmButtonText: i18n.translate('datasetManagement.editDataset.refreshButton', {
    defaultMessage: 'Refresh',
  }),
  title: i18n.translate('datasetManagement.editDataset.refreshHeader', {
    defaultMessage: 'Refresh field list?',
  }),
};

const confirmModalOptionsDelete = {
  confirmButtonText: i18n.translate('datasetManagement.editDataset.deleteButton', {
    defaultMessage: 'Delete',
  }),
  title: i18n.translate('datasetManagement.editDataset.deleteHeader', {
    defaultMessage: 'Delete index pattern?',
  }),
};

export const EditDataset = withRouter(({ dataset, history, location }: EditDatasetProps) => {
  const services = useOpenSearchDashboards<DatasetManagmentContext>().services;
  const {
    uiSettings,
    datasetManagementStart,
    overlays,
    savedObjects,
    chrome,
    data,
    docLinks,
    navigationUI: { HeaderControl },
    application,
    notifications,
  } = services;
  const [fields, setFields] = useState<IndexPatternField[]>(dataset.getNonScriptedFields());
  const [conflictedFields, setConflictedFields] = useState<IndexPatternField[]>(
    dataset.fields.getAll().filter((field) => field.type === 'conflict')
  );
  const [defaultIndex, setDefaultIndex] = useState<string>(uiSettings.get('defaultIndex'));
  const [tags, setTags] = useState<any[]>([]);

  useEffect(() => {
    setFields(dataset.getNonScriptedFields());
    setConflictedFields(dataset.fields.getAll().filter((field) => field.type === 'conflict'));
  }, [dataset]);

  useEffect(() => {
    const datasetTags =
      datasetManagementStart.list.getDatasetTags(dataset, dataset.id === defaultIndex) || [];
    setTags(datasetTags);
  }, [defaultIndex, dataset, datasetManagementStart.list]);

  const setDefaultPattern = useCallback(async () => {
    const isSuccess = await uiSettings.set('defaultIndex', dataset.id);
    if (isSuccess) {
      setDefaultIndex(dataset.id || '');
    }
  }, [uiSettings, dataset.id]);

  const refreshFields = () => {
    overlays.openConfirm(confirmMessage, confirmModalOptionsRefresh).then(async (isConfirmed) => {
      if (isConfirmed) {
        await data.dataViews.refreshFields(dataset);
        await data.dataViews.updateSavedObject(dataset);
        setFields(dataset.getNonScriptedFields());
      }
    });
  };

  const removePattern = () => {
    async function doRemove() {
      if (dataset.id === defaultIndex) {
        const datasets: DatasetTableItem[] = await getDatasets(
          savedObjects.client,
          uiSettings.get('defaultIndex'),
          datasetManagementStart
        );
        uiSettings.remove('defaultIndex');
        const otherPatterns = filter(datasets, (pattern) => {
          return pattern.id !== dataset.id;
        });

        if (otherPatterns.length) {
          uiSettings.set('defaultIndex', otherPatterns[0].id);
        }
      }
      if (dataset.id) {
        Promise.resolve(data.dataViews.delete(dataset.id)).then(function () {
          const datasetService = data.query.queryString.getDatasetService();
          // @ts-expect-error TS2345 TODO(ts-error): fixme
          datasetService.removeFromRecentDatasets(dataset.id);
          history.push('');
        });
      }
    }

    overlays.openConfirm('', confirmModalOptionsDelete).then((isConfirmed) => {
      if (isConfirmed) {
        doRemove();
      }
    });
  };

  const openDatasetEditor = useCallback(async () => {
    // Convert DataView to Dataset format
    const baseDataset = await dataset.toDataset();

    const overlay = overlays?.openModal(
      toMountPoint(
        <ConfiguratorV2
          services={services}
          baseDataset={baseDataset}
          onConfirm={async (query: Partial<Query>) => {
            overlay?.close();
            if (query?.dataset) {
              try {
                // Update dataset properties
                if (query.dataset.timeFieldName !== undefined) {
                  dataset.timeFieldName = query.dataset.timeFieldName;
                }
                if (query.dataset.displayName !== undefined) {
                  dataset.displayName = query.dataset.displayName;
                }
                if (query.dataset.description !== undefined) {
                  dataset.description = query.dataset.description;
                }
                if (query.dataset.schemaMappings !== undefined) {
                  dataset.schemaMappings = query.dataset.schemaMappings;
                }

                // Save changes to the data view
                await data.dataViews.updateSavedObject(dataset);
                data.dataViews.clearCache();

                // Refresh fields to reflect any changes
                await data.dataViews.refreshFields(dataset);

                // Update local state
                setFields(dataset.getNonScriptedFields());
                setConflictedFields(
                  dataset.fields.getAll().filter((field) => field.type === 'conflict')
                );

                notifications?.toasts.addSuccess({
                  title: i18n.translate('datasetManagement.editDataset.updateDatasetSuccessTitle', {
                    defaultMessage: 'Dataset "{title}" updated successfully',
                    values: { title: dataset.title },
                  }),
                });
              } catch (error) {
                notifications?.toasts.addDanger({
                  title: i18n.translate('datasetManagement.editDataset.updateDatasetErrorTitle', {
                    defaultMessage: 'Failed to update dataset',
                  }),
                  text: (error as Error).message,
                });
              }
            }
          }}
          onCancel={() => overlay?.close()}
          onPrevious={() => overlay?.close()}
          alwaysShowDatasetFields={true}
          signalType={dataset.signalType}
        />
      ),
      {
        maxWidth: false,
        className: 'datasetSelector__advancedModal',
      }
    );
  }, [dataset, data, overlays, services, notifications]);

  const typeHeader = i18n.translate('datasetManagement.editDataset.typeHeader', {
    defaultMessage: "Type: '{type}'",
    values: { type: dataset.signalType },
  });

  const timeFilterHeader = i18n.translate('datasetManagement.editDataset.timeFilterHeader', {
    defaultMessage: "Time field: '{timeFieldName}'",
    values: { timeFieldName: dataset.timeFieldName },
  });

  const mappingConflictLabel = i18n.translate(
    'datasetManagement.editDataset.mappingConflictLabel',
    {
      defaultMessage:
        '{conflictFieldsLength, plural, one {A field is} other {# fields are}} defined as several types (string, integer, etc) across the indices that match this pattern. You may still be able to use these conflict fields in parts of OpenSearch Dashboards, but they will be unavailable for functions that require OpenSearch Dashboards to know their type. Correcting this issue will require reindexing your data.',
      values: { conflictFieldsLength: conflictedFields.length },
    }
  );

  const headingAriaLabel = i18n.translate('datasetManagement.editDataset.detailsAria', {
    defaultMessage: 'Index pattern details',
  });

  chrome.docTitle.change(dataset.title);

  const showTagsSection = Boolean(dataset.timeFieldName || (tags && tags.length > 0));

  const useUpdatedUX = uiSettings.get('home:useNewHomePage');

  const renderDescription = () => {
    const descriptionText = dataset.description ? (
      <EuiText>{dataset.description}</EuiText>
    ) : (
      <FormattedMessage
        id="datasetManagement.editDataset.timeFilterLabel.timeFilterDetail"
        defaultMessage="This page lists every field in the {datasetTitle} index and the field's associated core type as recorded by OpenSearch. To change a field type, use the OpenSearch"
        values={{ datasetTitle: <strong>{dataset.displayName || dataset.title}</strong> }}
      />
    );

    return useUpdatedUX ? (
      <HeaderControl
        controls={[
          {
            description: (descriptionText as unknown) as string,
            links: dataset.description
              ? undefined
              : [
                  {
                    href: docLinks.links.opensearch.indexTemplates.base,
                    controlType: 'link',
                    target: '_blank',
                    flush: 'both',
                    label: mappingAPILink,
                  },
                ],
          } as TopNavControlDescriptionData,
        ]}
        setMountPoint={application.setAppDescriptionControls}
      />
    ) : (
      <EuiText size="s">
        <p>
          {descriptionText}{' '}
          {!dataset.description && (
            <EuiLink href={docLinks.links.opensearch.indexTemplates.base} target="_blank" external>
              {mappingAPILink}
            </EuiLink>
          )}
        </p>
      </EuiText>
    );
  };

  const renderBadges = () => {
    if (useUpdatedUX) {
      const components = [
        ...(Boolean(dataset.signalType) ? [<EuiBadge color="primary">{typeHeader}</EuiBadge>] : []),
        ...(Boolean(dataset.timeFieldName)
          ? [<EuiBadge color="warning">{timeFilterHeader}</EuiBadge>]
          : []),
        ...tags.map((tag: any) => <EuiBadge color="hollow">{tag.name}</EuiBadge>),
      ];
      const controls = components.map((component) => ({
        renderComponent: component,
      }));

      return (
        <HeaderControl controls={[...controls]} setMountPoint={application.setAppBadgeControls} />
      );
    } else {
      return (
        <EuiFlexGroup wrap>
          {Boolean(dataset.timeFieldName) && (
            <EuiFlexItem grow={false}>
              <EuiBadge color="warning">{timeFilterHeader}</EuiBadge>
            </EuiFlexItem>
          )}
          {tags.map((tag: any) => (
            <EuiFlexItem grow={false} key={tag.key}>
              <EuiBadge color="hollow">{tag.name}</EuiBadge>
            </EuiFlexItem>
          ))}
        </EuiFlexGroup>
      );
    }
  };

  return useUpdatedUX ? (
    <div data-test-subj="editDataset" role="region" aria-label={headingAriaLabel}>
      <IndexHeader
        dataset={dataset}
        setDefault={setDefaultPattern}
        refreshFields={refreshFields}
        deleteDatasetClick={removePattern}
        defaultIndex={defaultIndex}
      />
      {showTagsSection && renderBadges()}
      {renderDescription()}
      <DatasetInfoPanel
        dataset={dataset}
        editConfiguration={
          dataset.type !== DEFAULT_DATA.SET_TYPES.INDEX_PATTERN ? openDatasetEditor : undefined
        }
      />
      {conflictedFields.length > 0 && (
        <>
          <EuiSpacer />
          <EuiCallOut title={mappingConflictHeader} color="warning" iconType="alert">
            <p>{mappingConflictLabel}</p>
          </EuiCallOut>
        </>
      )}
      <Tabs
        dataset={dataset}
        saveDataset={data.dataViews.updateSavedObject.bind(data.dataViews)}
        fields={fields}
        history={history}
        location={location}
      />
    </div>
  ) : (
    <EuiPanel paddingSize={'l'}>
      <div data-test-subj="editDataset" role="region" aria-label={headingAriaLabel}>
        <IndexHeader
          dataset={dataset}
          setDefault={setDefaultPattern}
          refreshFields={refreshFields}
          deleteDatasetClick={removePattern}
          defaultIndex={defaultIndex}
        />
        <EuiSpacer size="s" />
        {showTagsSection && renderBadges()}
        <EuiSpacer size="m" />
        {renderDescription()}
        <DatasetInfoPanel
          dataset={dataset}
          editConfiguration={
            dataset.type !== DEFAULT_DATA.SET_TYPES.INDEX_PATTERN ? openDatasetEditor : undefined
          }
        />
        {conflictedFields.length > 0 && (
          <>
            <EuiSpacer />
            <EuiCallOut title={mappingConflictHeader} color="warning" iconType="alert">
              <p>{mappingConflictLabel}</p>
            </EuiCallOut>
          </>
        )}
        <EuiSpacer />
        <Tabs
          dataset={dataset}
          saveDataset={data.dataViews.updateSavedObject.bind(data.dataViews)}
          fields={fields}
          history={history}
          location={location}
        />
      </div>
    </EuiPanel>
  );
});
