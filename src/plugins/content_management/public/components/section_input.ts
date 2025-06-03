/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { SavedObjectsClientContract } from 'opensearch-dashboards/public';

import { Content, Section } from '../services';
import { ViewMode } from '../../../embeddable/public';
import { DashboardContainerInput, SavedObjectDashboard } from '../../../dashboard/public';
import { CUSTOM_CONTENT_EMBEDDABLE } from './custom_content_embeddable';
import { CARD_EMBEDDABLE } from './card_container/card_embeddable';
import { CardContainerInput } from './card_container/types';

const DASHBOARD_GRID_COLUMN_COUNT = 48;
export const DASHBOARD_PANEL_WIDTH = 12;
export const DASHBOARD_PANEL_HEIGHT = 15;

export const createCardInput = (
  section: Section,
  contents: Content[]
): CardContainerInput | null => {
  if (section.kind !== 'card') {
    throw new Error(`function does not support section.type: ${section.kind}`);
  }

  const panels: CardContainerInput['panels'] = {};

  const input: CardContainerInput = {
    id: section.id,
    title: section.title ?? '',
    hidePanelTitles: true,
    hidePanelActions: true,
    viewMode: ViewMode.VIEW,
    columns: section.columns,
    wrap: section.wrap,
    grid: section.grid,
    panels,
    ...section.input,
  };

  contents.forEach((content) => {
    if (content.kind === 'card') {
      panels[content.id] = {
        type: CARD_EMBEDDABLE,
        explicitInput: {
          id: content.id,
          title: content?.title,
          description: content.description,
          toolTipContent: content?.toolTipContent,
          getTitle: content?.getTitle,
          onClick: content.onClick,
          getIcon: content?.getIcon,
          getFooter: content?.getFooter,
          cardProps: content.cardProps,
        },
      };
    }
  });

  if (Object.keys(panels).length === 0) {
    return null;
  }

  return input;
};

export const createDashboardInput = async (
  section: Section,
  contents: Content[],
  services: { savedObjectsClient: SavedObjectsClientContract }
) => {
  if (section.kind !== 'dashboard') {
    throw new Error(`function does not support section.type: ${section.kind}`);
  }

  // TODO: support different panel size
  const panels: DashboardContainerInput['panels'] = {};
  let x = 0;
  let y = 0;
  const counter = new BehaviorSubject(0);

  contents.forEach(async (content) => {
    counter.next(counter.value + 1);

    let w = DASHBOARD_PANEL_WIDTH;
    let h = DASHBOARD_PANEL_HEIGHT;

    if ('width' in content && typeof content.width === 'number') {
      if (content.width > 0 && content.width <= DASHBOARD_GRID_COLUMN_COUNT) {
        w = content.width;
      }
    }

    if ('height' in content && typeof content.height === 'number') {
      if (content.height > 0) {
        h = content.height;
      }
    }

    try {
      if (content.kind === 'dashboard') {
        let dashboardId = '';
        if (content.input.kind === 'dynamic') {
          dashboardId = await content.input.get();
        }

        if (content.input.kind === 'static') {
          dashboardId = content.input.id;
        }

        if (dashboardId) {
          const dashboardObject = await services.savedObjectsClient.get<SavedObjectDashboard>(
            'dashboard',
            dashboardId
          );
          const references = dashboardObject.references;
          const savedObject = dashboardObject.attributes;
          if (savedObject.panelsJSON && typeof savedObject.panelsJSON === 'string') {
            const dashboardPanels = JSON.parse(savedObject.panelsJSON);
            if (Array.isArray(dashboardPanels)) {
              dashboardPanels.forEach((panel) => {
                if (!panel.panelRefName) {
                  return;
                }
                // panelIndex should be unique
                const panelIndex = panel.panelIndex || panel.panelRefName;
                const reference = references.find((ref) => ref.name === panel.panelRefName);
                if (reference) {
                  panels[panelIndex] = {
                    gridData: { ...panel.gridData, i: panelIndex },
                    type: reference.type,
                    explicitInput: {
                      id: panelIndex,
                      savedObjectId: reference.id,
                    },
                  };
                }
              });
            }
          }
        }
        return;
      }

      // If current panel exceed the max dashboard container width, add the panel to the next row
      if (x + w > DASHBOARD_GRID_COLUMN_COUNT) {
        x = 0;
        y = y + h;
      }

      const panelConfig: DashboardContainerInput['panels'][string] = {
        gridData: {
          w,
          h,
          x,
          y,
          i: content.id,
        },
        type: '',
        explicitInput: {
          id: content.id,
          disabledActions: ['togglePanel'],
        },
      };

      // The new x starts from the current panel x + current panel width
      x = x + w;

      if (content.kind === 'visualization') {
        panelConfig.type = 'visualization';
        if (content.input.kind === 'dynamic') {
          panelConfig.explicitInput.savedObjectId = await content.input.get();
        }
        if (content.input.kind === 'static') {
          panelConfig.explicitInput.savedObjectId = content.input.id;
        }
      }

      if (content.kind === 'custom') {
        panelConfig.type = CUSTOM_CONTENT_EMBEDDABLE;
        panelConfig.explicitInput.render = content.render;
        // Currently, for custom content, there is no case that requires panel actions, so hide it
        panelConfig.explicitInput.hidePanelActions = true;
      }

      panels[content.id] = panelConfig;
    } catch (e) {
      // eslint-disable-next-line
      console.log(e);
    } finally {
      counter.next(counter.value - 1);
    }
  });

  const input: DashboardContainerInput = {
    panels,
    id: section.id,
    title: section.title ?? '',
    viewMode: ViewMode.VIEW,
    useMargins: true,
    isFullScreenMode: false,
    filters: [],
    timeRange: {
      to: 'now',
      from: 'now-7d',
    },
    query: {
      query: '',
      language: 'kuery',
    },
    refreshConfig: {
      pause: true,
      value: 15,
    },
    ...section.input,
  };

  return new Promise<DashboardContainerInput>((resolve) => {
    counter.subscribe((n) => {
      if (n === 0) {
        resolve(input);
      }
    });
  });
};
