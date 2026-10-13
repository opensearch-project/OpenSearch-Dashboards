/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useState } from 'react';
import { i18n } from '@osd/i18n';
import { useDispatch, useSelector } from 'react-redux';
import { EuiButtonEmpty, EuiContextMenuItem, EuiContextMenuPanel, EuiPopover } from '@elastic/eui';
import { EMPTY_QUERY } from '../../../../../data/common';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreFlavor } from '../../../../common';
import { ExploreServices } from '../../../types';
import {
  getSourceTypeRegistry,
  OPENSEARCH_SOURCE_TYPE_ID,
  SourceTypeDefinition,
} from '../../../services/source_type_registry';
import { setQueryWithHistory } from '../../utils/state_management/slices';
import { selectDataset } from '../../utils/state_management/selectors';
import { useClearEditors } from '../../hooks';

/**
 * The Metrics page's source type switch (e.g. Prometheus and a plugin-registered source), next to the
 * dataset picker so it is there in both the Explore and Query modes. Shown only when a source
 * other than the built-in one is registered for Metrics. Picking a source opens its default
 * dataset; its own picker (or the Prometheus connection picker) then refines it.
 */
export const MetricsSourceTypeSelect: React.FC = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const dispatch = useDispatch();
  const clearEditors = useClearEditors();
  const activeDataset = useSelector(selectDataset);
  const [isOpen, setOpen] = useState(false);

  const registry = getSourceTypeRegistry();
  const sourceTypes = registry.getAll(ExploreFlavor.Metrics);
  const active = registry.getForDataset(activeDataset);

  const switchTo = useCallback(
    async (sourceType: SourceTypeDefinition) => {
      setOpen(false);
      if (sourceType.id === active.id) return;
      const queryString = services.data.query.queryString;
      try {
        const target = await sourceType.resolveDefaultDataset({
          data: services.data,
          flavor: ExploreFlavor.Metrics,
        });
        if (!target) {
          if (sourceType.id === OPENSEARCH_SOURCE_TYPE_ID) {
            // No Prometheus connection yet: show the (empty) Prometheus picker.
            queryString.setQuery({
              query: EMPTY_QUERY.QUERY,
              language: 'PROMQL',
              dataset: undefined,
            });
            dispatch(setQueryWithHistory({ ...queryString.getQuery() }));
            clearEditors();
            return;
          }
          services.notifications?.toasts.addWarning({
            title: i18n.translate('explore.metricsSourceType.noDataset', {
              defaultMessage: 'No {sourceType} dataset found to query',
              values: { sourceType: registry.getLabel(sourceType, ExploreFlavor.Metrics) },
            }),
          });
          return;
        }
        try {
          const { storage, ...datasetServices } = services as any;
          await queryString.getDatasetService().cacheDataset(target, datasetServices);
        } catch {
          // Non-fatal: running the query reports a clearer error.
        }
        const initialQuery = queryString.getInitialQueryByDataset(target);
        queryString.setQuery({ ...initialQuery, query: EMPTY_QUERY.QUERY, dataset: target });
        dispatch(setQueryWithHistory({ ...queryString.getQuery() }));
        clearEditors();
      } catch (error) {
        services.notifications?.toasts.addError(error as Error, {
          title: i18n.translate('explore.metricsSourceType.switchError', {
            defaultMessage: 'Could not switch source type',
          }),
        });
      }
    },
    [active.id, services, dispatch, clearEditors, registry]
  );

  if (sourceTypes.length < 2) return null;

  return (
    <EuiPopover
      isOpen={isOpen}
      closePopover={() => setOpen(false)}
      panelPaddingSize="none"
      anchorPosition="downLeft"
      button={
        <EuiButtonEmpty
          size="xs"
          iconType="arrowDown"
          iconSide="right"
          onClick={() => setOpen((open) => !open)}
          data-test-subj="metricsSourceTypeSelect"
          aria-label={i18n.translate('explore.metricsSourceType.ariaLabel', {
            defaultMessage: 'Source type',
          })}
        >
          {registry.getLabel(active, ExploreFlavor.Metrics)}
        </EuiButtonEmpty>
      }
    >
      <EuiContextMenuPanel
        size="s"
        title={i18n.translate('explore.metricsSourceType.title', {
          defaultMessage: 'Source type',
        })}
        items={sourceTypes.map((sourceType) => (
          <EuiContextMenuItem
            key={sourceType.id}
            icon={sourceType.id === active.id ? 'check' : 'empty'}
            onClick={() => switchTo(sourceType)}
            data-test-subj={`metricsSourceType-${sourceType.id}`}
          >
            {registry.getLabel(sourceType, ExploreFlavor.Metrics)}
          </EuiContextMenuItem>
        ))}
      />
    </EuiPopover>
  );
};
