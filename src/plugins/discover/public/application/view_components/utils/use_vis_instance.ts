/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { useEffect, useRef, useState } from 'react';
import { EventEmitter } from 'events';
import { parse } from 'query-string';
import { i18n } from '@osd/i18n';

import { redirectWhenMissing } from '../../../../../opensearch_dashboards_utils/public';
import { DefaultEditorController } from '../../../../../vis_default_editor/public';

import { getVisualizationInstance } from '../get_visualization_instance';
import { getEditBreadcrumbs, getCreateBreadcrumbs } from '../breadcrumbs';
import { VisualizeConstants } from '../../visualize_constants';
import { DiscoverServices } from '../../../build_services';
import { SavedVisInstance } from '../../../../../visualize/public/application/types';

// This effect is responsible for creating a new saved vis, embedding and destroying it in DOM
export const useVisInstance = (services: DiscoverServices, eventEmitter: EventEmitter) => {
  const [state, setState] = useState<{
    savedVisInstance?: SavedVisInstance;
    visEditorController?: IEditorController;
  }>({});
  const visRef = useRef<HTMLDivElement>(null);
  const visId = useRef('');

  useEffect(() => {
    const {
      application: { navigateToApp },
      chrome,
      history,
      http: { basePath },
      setActiveUrl,
      toastNotifications,
    } = services;
    const getSavedVisInstance = async () => {
      try {
        let savedVisInstance: SavedVisInstance;
        if (history.location.pathname === '/create') {
          const searchParams = parse(history.location.search);
          const visTypes = services.visualizations.all();
          const visType = visTypes.find(({ name }) => name === searchParams.type);

          if (!visType) {
            throw new Error(
              i18n.translate('visualize.createVisualization.noVisTypeErrorMessage', {
                defaultMessage: 'You must provide a valid visualization type',
              })
            );
          }

          const shouldHaveIndex = visType.requiresSearch && visType.options.showIndexSelection;
          const hasIndex = searchParams.indexPattern || searchParams.savedSearchId;

          if (shouldHaveIndex && !hasIndex) {
            throw new Error(
              i18n.translate(
                'visualize.createVisualization.noIndexPatternOrSavedSearchIdErrorMessage',
                {
                  defaultMessage: 'You must provide either an indexPattern or a savedSearchId',
                }
              )
            );
          }

          savedVisInstance = await getVisualizationInstance(services, searchParams);
        } else {
          savedVisInstance = await getVisualizationInstance(services, visualizationIdFromUrl);
        }

        const { embeddableHandler, savedVis, vis } = savedVisInstance;

        if (savedVis.id) {
          chrome.setBreadcrumbs(getEditBreadcrumbs(savedVis.title));
          chrome.docTitle.change(savedVis.title);
          chrome.recentlyAccessed.add(
            savedVisInstance.savedVis.getFullPath(),
            savedVisInstance.savedVis.title,
            savedVis.id,
            {
              type: savedVisInstance.savedVis.getOpenSearchType(),
            }
          );
        } else {
          chrome.setBreadcrumbs(getCreateBreadcrumbs());
        }

        let visEditorController;
        // do not create editor in embeded mode
        if (isChromeVisible) {
          const Editor = vis.type.editor || DefaultEditorController;
          visEditorController = new Editor(
            visEditorRef.current,
            vis,
            eventEmitter,
            embeddableHandler
          );
        } else if (visEditorRef.current) {
          embeddableHandler.render(visEditorRef.current);
        }

        setState({
          savedVisInstance,
          visEditorController,
        });
      } catch (error) {
        const managementRedirectTarget = {
          app: 'management',
          path: `opensearch-dashboards/objects/savedVisualizations/${visualizationIdFromUrl}`,
        };

        try {
          redirectWhenMissing({
            history,
            navigateToApp,
            toastNotifications,
            basePath,
            mapping: {
              visualization: VisualizeConstants.LANDING_PAGE_PATH,
              search: managementRedirectTarget,
              'index-pattern': managementRedirectTarget,
              'index-pattern-field': managementRedirectTarget,
            },
            onBeforeRedirect() {
              setActiveUrl(VisualizeConstants.LANDING_PAGE_PATH);
            },
          })(error);
        } catch (e) {
          toastNotifications.addWarning({
            title: i18n.translate('visualize.createVisualization.failedToLoadErrorMessage', {
              defaultMessage: 'Failed to load the visualization',
            }),
            text: e.message,
          });
          history.replace(VisualizeConstants.LANDING_PAGE_PATH);
        }
      }
    };

    if (!visId.current) {
      visId.current = visualizationIdFromUrl || 'new';
      getSavedVisInstance();
    } else if (
      visualizationIdFromUrl &&
      visId.current !== visualizationIdFromUrl &&
      state.savedVisInstance?.savedVis.id !== visualizationIdFromUrl
    ) {
      visId.current = visualizationIdFromUrl;
      setState({});
      getSavedVisInstance();
    }
  }, [
    eventEmitter,
    services,
    state.savedVisInstance,
    state.visEditorController,
    visualizationIdFromUrl,
  ]);

  useEffect(() => {
    return () => {
      if (state.visEditorController) {
        state.visEditorController.destroy();
      } else if (state.savedVisInstance?.embeddableHandler) {
        state.savedVisInstance.embeddableHandler.destroy();
      }
      if (state.savedVisInstance?.savedVis) {
        state.savedVisInstance.savedVis.destroy();
      }
    };
  }, [state]);

  return {
    ...state,
    visEditorRef,
  };
};
