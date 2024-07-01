/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { Content, Section } from '../services';
import { ViewMode } from '../../../embeddable/public';
import { DashboardContainerInput } from '../../../dashboard/public';
import { CUSTOM_CONTENT_RENDER } from './custom_content_embeddable';
import { CardContainerInput } from './card_container/card_container';
import { CARD_EMBEDDABLE } from './card_container/card_embeddable';

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

export const createDashboardSection = async (section: Section, contents: Content[]) => {
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
        counter.next(counter.value + 1);
        // TODO: it should catch exception
        config.explicitInput.savedObjectId = await content.input.get();
        counter.next(counter.value - 1);
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
