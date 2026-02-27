/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { Dataset, DEFAULT_DATA, EMPTY_QUERY } from '../../../../../../data/common';
import { convertIndexPatternTerminology } from '../../../../../../opensearch_dashboards_utils/public';
import { AgentTracesServices } from '../../../../types';
import { setQueryWithHistory } from '../../../../application/utils/state_management/slices';
import { selectQuery } from '../../../../application/utils/state_management/selectors';
import { useFlavorId } from '../../../../helpers/use_flavor_id';
import { useClearEditors } from '../../../../application/hooks';
import { AGENT_TRACES_DEFAULT_LANGUAGE } from '../../../../../common';
import './dataset_select_terminology.scss';
import { AgentTracesFlavor } from '../../../../../common';

export const DatasetSelectWidget = () => {
  const { services } = useOpenSearchDashboards<AgentTracesServices>();
  const flavorId = useFlavorId();
  const dispatch = useDispatch();
  const currentQuery = useSelector(selectQuery);
  const clearEditors = useClearEditors();
  const { isDatasetManagementEnabled } = services;

  const {
    data: {
      ui: { DatasetSelect },
      query: { queryString },
    },
  } = services;

  // REMOVED: Redundant useEffect that was fetching DataView on every render
  // This was causing early individual get() calls before the DatasetSelect component's
  // getMultiple() optimization could batch fetch all DataViews together.
  // The dataset caching is now handled by:
  // 1. DatasetSelect.fetchDatasets() - fetches all datasets via bulkGet
  // 2. DatasetProvider - fetches current dataset if needed
  // 3. Query execution - fetches dataset when executing queries

  const handleDatasetSelect = useCallback(
    async (dataset: Dataset | undefined) => {
      try {
        if (!dataset) {
          // Clear dataset - reset to empty query state with agent traces default language
          queryString.setQuery({
            query: EMPTY_QUERY.QUERY,
            language: AGENT_TRACES_DEFAULT_LANGUAGE,
            dataset: undefined,
          });

          dispatch(
            setQueryWithHistory({
              ...queryString.getQuery(),
            })
          );
          clearEditors();
          return;
        }

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
          title: 'Error selecting dataset',
        });
      }
    },
    [queryString, dispatch, clearEditors, services.notifications?.toasts]
  );

  const supportedTypes = useMemo(() => {
    return (
      services.supportedTypes || [
        DEFAULT_DATA.SET_TYPES.INDEX,
        DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
      ]
    );
  }, [services.supportedTypes]);

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
    <div ref={containerRef} className="agentTracesDatasetSelectWrapper">
      <DatasetSelect
        onSelect={handleDatasetSelect}
        appName="agentTraces"
        supportedTypes={supportedTypes}
        signalType={flavorId}
        showNonTimeFieldDatasets={false}
      />
    </div>
  );
};
