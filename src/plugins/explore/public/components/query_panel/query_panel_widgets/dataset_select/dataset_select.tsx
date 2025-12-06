/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { Dataset, DEFAULT_DATA, EMPTY_QUERY } from '../../../../../../data/common';
import { convertIndexPatternTerminology } from '../../../../../../opensearch_dashboards_utils/public';
import { ExploreServices } from '../../../../types';
import { setQueryWithHistory } from '../../../../application/utils/state_management/slices';
import { selectQuery } from '../../../../application/utils/state_management/selectors';
import { useFlavorId } from '../../../../helpers/use_flavor_id';
import { useClearEditors } from '../../../../application/hooks';
import './dataset_select_terminology.scss';
import { ExploreFlavor } from '../../../../../common';

export const DatasetSelectWidget = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const flavorId = useFlavorId();
  const dispatch = useDispatch();
  const currentQuery = useSelector(selectQuery);
  const clearEditors = useClearEditors();
  const { isDatasetManagementEnabled } = services;

  const {
    data: {
      ui: { DatasetSelect },
      query: { queryString },
      dataViews,
    },
  } = services;

  useEffect(() => {
    let isMounted = true;

    const handleDataset = async () => {
      if (currentQuery.dataset) {
        const dataView = await dataViews.get(
          currentQuery.dataset.id,
          currentQuery.dataset.type !== DEFAULT_DATA.SET_TYPES.INDEX_PATTERN
        );

        if (!dataView) {
          await queryString.getDatasetService().cacheDataset(
            currentQuery.dataset,
            {
              uiSettings: services.uiSettings,
              savedObjects: services.savedObjects,
              notifications: services.notifications,
              http: services.http,
              data: services.data,
            },
            false
          );
        }
      }
    };

    try {
      handleDataset();
    } catch (error) {
      if (isMounted) {
        services.notifications?.toasts.addWarning(
          `Error fetching dataset: ${(error as Error).message}`
        );
      }
    }

    return () => {
      isMounted = false;
    };
  }, [currentQuery, dataViews, queryString, services]);

  const handleDatasetSelect = useCallback(
    async (dataset: Dataset) => {
      if (!dataset) return;

      try {
        const initialQuery = queryString.getInitialQueryByDataset(dataset);

        queryString.setQuery({
          ...initialQuery,
          query: EMPTY_QUERY.QUERY,
          dataset,
        });

        dispatch(
          setQueryWithHistory({
            ...queryString.getQuery(),
          })
        );
        clearEditors();
      } catch (error) {
        services.notifications?.toasts.addError(error, {
          title: i18n.translate('explore.datasetSelect.errorSelectingDataset', {
            defaultMessage: 'Error selecting dataset',
          }),
        });
      }
    },
    [queryString, dispatch, clearEditors, services.notifications?.toasts]
  );

  const supportedTypes = useMemo(() => {
    if (flavorId === ExploreFlavor.Metrics) return ['PROMETHEUS'];

    return (
      services.supportedTypes || [
        DEFAULT_DATA.SET_TYPES.INDEX,
        DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
      ]
    );
  }, [services.supportedTypes, flavorId]);

  const containerRef = useRef<HTMLDivElement>(null);

  // Apply terminology conversion to replace "Index pattern" with "Dataset"
  useEffect(() => {
    if (!isDatasetManagementEnabled) return;

    const convertTextNodes = (element: HTMLElement) => {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);

      const nodesToUpdate: Array<{ node: Text; newText: string }> = [];

      let currentNode;
      while ((currentNode = walker.nextNode())) {
        if (currentNode.textContent) {
          const convertedText = convertIndexPatternTerminology(
            currentNode.textContent,
            isDatasetManagementEnabled
          );
          if (convertedText !== currentNode.textContent) {
            nodesToUpdate.push({
              node: currentNode as Text,
              newText: convertedText,
            });
          }
        }
      }

      // Apply updates after traversal to avoid modifying the tree while walking
      nodesToUpdate.forEach(({ node, newText }) => {
        node.textContent = newText;
      });
    };

    // Convert text in the main component
    const convertMainComponent = () => {
      if (containerRef.current) {
        convertTextNodes(containerRef.current);
      }
    };

    // Convert text in EUI portals (popovers, modals, etc.)
    const convertPortalContent = () => {
      // Only target DatasetSelect-specific class names and test subjects
      const selectors = [
        '.datasetSelect__contextMenu',
        '.datasetSelect__selectable',
        '[data-test-subj="datasetSelectorPopover"]',
        '[data-test-subj="datasetSelectorAdvanced"]',
      ];

      selectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((element) => {
          if (element instanceof HTMLElement) {
            convertTextNodes(element);
          }
        });
      });
    };

    // Initial conversion with delay for DOM rendering
    const timeoutId = setTimeout(() => {
      convertMainComponent();
      convertPortalContent();
    }, 100);

    // Observe for DatasetSelect portal additions
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              // Only match nodes with DatasetSelect-specific classes or test subjects
              const hasDatasetSelectClass =
                node.classList.contains('datasetSelect__contextMenu') ||
                node.classList.contains('datasetSelect__selectable');

              const hasDatasetSelectTestSubj =
                node.getAttribute('data-test-subj') === 'datasetSelectorPopover' ||
                node.getAttribute('data-test-subj') === 'datasetSelectorAdvanced';

              const containsDatasetSelect =
                !!node.querySelector('.datasetSelect__contextMenu') ||
                !!node.querySelector('.datasetSelect__selectable');

              if (hasDatasetSelectClass || hasDatasetSelectTestSubj || containsDatasetSelect) {
                // Give the portal content time to render
                setTimeout(() => convertTextNodes(node), 50);
              }
            }
          });
        }
      });
    });

    // Only watch the container for changes (don't watch entire document.body)
    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
      });
    }

    // Watch document.body only for DatasetSelect portal elements
    // (EUI portals are added directly to body, outside the component tree)
    observer.observe(document.body, {
      childList: true,
      subtree: false,
    });

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [isDatasetManagementEnabled]);

  return (
    <div ref={containerRef} className="exploreDatasetSelectWrapper">
      <DatasetSelect
        onSelect={handleDatasetSelect}
        appName="explore"
        supportedTypes={supportedTypes}
        signalType={flavorId}
      />
    </div>
  );
};
