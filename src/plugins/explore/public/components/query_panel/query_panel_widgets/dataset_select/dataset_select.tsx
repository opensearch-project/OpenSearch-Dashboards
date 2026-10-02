/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { Dataset, DEFAULT_DATA, EMPTY_QUERY } from '../../../../../../data/common';
import {
  getSourceTypeRegistry,
  OPENSEARCH_SOURCE_TYPE_ID,
} from '../../../../services/source_type_registry';
import { convertIndexPatternTerminology } from '../../../../../../opensearch_dashboards_utils/public';
import { ExploreServices } from '../../../../types';
import { setQueryWithHistory } from '../../../../application/utils/state_management/slices';
import { selectDataset } from '../../../../application/utils/state_management/selectors';
import { useFlavorId } from '../../../../helpers/use_flavor_id';
import { useClearEditors } from '../../../../application/hooks';
import { EXPLORE_DEFAULT_LANGUAGE } from '../../../../../common';
import './dataset_select_terminology.scss';
import { ExploreFlavor } from '../../../../../common';

export const DatasetSelectWidget = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const flavorId = useFlavorId();
  const dispatch = useDispatch();
  const clearEditors = useClearEditors();
  const { isDatasetManagementEnabled } = services;

  const {
    data: {
      ui: { DatasetSelect },
      query: { queryString },
    },
  } = services;

  const handleDatasetSelect = useCallback(
    async (dataset: Dataset | undefined) => {
      try {
        if (!dataset) {
          // Clear dataset - reset to empty query state with explore default language
          queryString.setQuery({
            query: EMPTY_QUERY.QUERY,
            language: EXPLORE_DEFAULT_LANGUAGE,
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

        // If the picked type can't run the current language, use PPL when it can, else the
        // type's first language Explore can run. The data plugin would otherwise pick the first
        // one, which for index patterns is kuery, which Explore can't run.
        const typeLanguages = queryString
          .getDatasetService()
          .getType(dataset.type)
          ?.supportedLanguages(dataset);
        const language =
          typeLanguages?.length && !typeLanguages.includes(initialQuery.language)
            ? typeLanguages.includes(EXPLORE_DEFAULT_LANGUAGE)
              ? EXPLORE_DEFAULT_LANGUAGE
              : (typeLanguages.find((languageId) =>
                  getSourceTypeRegistry().isExploreLanguage(languageId)
                ) ?? EXPLORE_DEFAULT_LANGUAGE)
            : initialQuery.language;

        queryString.setQuery({
          ...initialQuery,
          language,
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

  // The active source type decides the picker: its own datasetSelector if it has one, else the
  // generic picker given its dataset types. Read from redux, like the language pill.
  const activeDataset = useSelector(selectDataset);
  const activeSourceType = getSourceTypeRegistry().getForDataset(activeDataset);
  const activeSourceTypeId = activeSourceType.id;

  const isRegisteredSource = activeSourceTypeId !== OPENSEARCH_SOURCE_TYPE_ID;

  const supportedTypes = useMemo(() => {
    if (flavorId === ExploreFlavor.Metrics) return ['PROMETHEUS'];

    if (isRegisteredSource) {
      return getSourceTypeRegistry().get(activeSourceTypeId)?.datasetTypes;
    }

    return (
      services.supportedTypes || [
        DEFAULT_DATA.SET_TYPES.INDEX,
        DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
      ]
    );
  }, [services.supportedTypes, flavorId, isRegisteredSource, activeSourceTypeId]);

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

  // A source type can bring its own selector (e.g. region and multi-select pickers). Its choice
  // still goes through handleDatasetSelect, so the language guard and initial query apply.
  const { datasetSelector: SourceDatasetSelector } = activeSourceType;
  if (SourceDatasetSelector) {
    return (
      <div ref={containerRef} className="exploreDatasetSelectWrapper">
        <SourceDatasetSelector
          dataset={activeDataset}
          onSelect={handleDatasetSelect}
          data={services.data}
          flavor={flavorId}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="exploreDatasetSelectWrapper">
      <DatasetSelect
        onSelect={handleDatasetSelect}
        appName="explore"
        supportedTypes={supportedTypes}
        signalType={flavorId}
        showNonTimeFieldDatasets={false}
      />
    </div>
  );
};
