/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { Content, Section } from '../services';
import { ViewMode } from '../../../embeddable/public';
import { DashboardContainerInput, SavedObjectDashboard } from '../../../dashboard/public';
import { CUSTOM_CONTENT_RENDER } from './custom_content_embeddable';
import { CardContainerInput } from './card_container/card_container';
import { CARD_EMBEDDABLE } from './card_container/card_embeddable';
import { SavedObjectsClientContract } from 'opensearch-dashboards/public';

const DASHBOARD_GRID_COLUMN_COUNT = 48;

export const createCardSection = (
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
    viewMode: ViewMode.VIEW,
    panels: panels,
  };

  contents.forEach((content) => {
    if (content.kind === 'card') {
      panels[content.id] = {
        type: CARD_EMBEDDABLE,
        explicitInput: {
          id: content.id,
          title: content.title,
          description: content.description,
          onClick: content.onClick,
        },
      };
    }
  });

  if (Object.keys(panels).length === 0) {
    return null;
  }

  return input;
};

export const createDashboardSection = async (
  section: Section,
  contents: Content[],
  services: { savedObjectsClient: SavedObjectsClientContract }
) => {
  if (section.kind !== 'dashboard') {
    throw new Error(`function does not support section.type: ${section.kind}`);
  }

  const panels: DashboardContainerInput['panels'] = {};
  let x = 0;
  let y = 0;
  const w = 12;
  const h = 15;
  const counter = new BehaviorSubject(0);

  contents.forEach(async (content, i) => {
    counter.next(counter.value + 1);
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
                const reference = references.find((ref) => ref.name === panel.panelRefName);
                if (reference) {
                  panels[panel.panelIndex] = {
                    gridData: panel.gridData,
                    type: reference.type,
                    explicitInput: {
                      id: panel.panelIndex,
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

      const config: DashboardContainerInput['panels'][string] = {
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

      x = x + w;
      if (x >= DASHBOARD_GRID_COLUMN_COUNT) {
        x = 0;
        y = y + h;
      }

      if (content.kind === 'visualization') {
        config.type = 'visualization';
        if (content.input.kind === 'dynamic') {
          config.explicitInput.savedObjectId = await content.input.get();
        }
        if (content.input.kind === 'static') {
          config.explicitInput.savedObjectId = content.input.id;
        }
      }

      if (content.kind === 'custom') {
        config.type = CUSTOM_CONTENT_RENDER;
        config.explicitInput.render = content.render;
      }

      panels[content.id] = config;
    } catch (e) {
      console.log(e);
    } finally {
      counter.next(counter.value - 1);
    }
  });

  const input: DashboardContainerInput = {
    viewMode: ViewMode.VIEW,
    panels: panels,
    isFullScreenMode: false,
    filters: [],
    useMargins: true,
    id: section.id,
    timeRange: {
      to: 'now',
      from: 'now-7d',
    },
    title: section.title ?? 'test',
    query: {
      query: '',
      language: 'lucene',
    },
    refreshConfig: {
      pause: true,
      value: 15,
    },
  };

  return new Promise<DashboardContainerInput>((resolve) => {
    counter.subscribe((n) => {
      if (n === 0) {
        resolve(input);
      }
    });
  });
};
