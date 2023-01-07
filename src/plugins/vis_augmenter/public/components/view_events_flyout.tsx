/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { get } from 'lodash';
import {
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiFlyout,
  EuiTitle,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import { getEmbeddable, getQueryService } from '../services';
import './styles.scss';
import { VisualizeEmbeddable, VisualizeInput } from '../../../visualizations/public';
import { TimeRange } from '../../../data/common';
import { BaseVisItem } from './base_vis_item';
import { isPointInTimeEventsVisLayer, PointInTimeEventsVisLayer, VisLayer } from '../../common';
import { DateRangeItem } from './date_range_item';
import { LoadingFlyoutBody } from './loading_flyout_body';
import { ErrorFlyoutBody } from './error_flyout_body';
import { EventsPanel } from './events_panel';
import { TimelinePanel } from './timeline_panel';
import { ErrorEmbeddable } from '../../../embeddable/public';
import { getErrorMessage } from './utils';

interface Props {
  onClose: () => void;
  savedObjectId: string;
}

export type EventVisEmbeddableItem = {
  visLayer: VisLayer;
  embeddable: VisualizeEmbeddable;
};

export type EventVisEmbeddablesMap = Map<string, EventVisEmbeddableItem[]>;

export const DATE_RANGE_FORMAT = 'MM/DD/YYYY HH:mm';

export function ViewEventsFlyout(props: Props) {
  const [visEmbeddable, setVisEmbeddable] = useState<VisualizeEmbeddable | undefined>(undefined);
  // This map persists a plugin resource type -> a list of vis embeddables
  // for each VisLayer of that type
  const [eventVisEmbeddablesMap, setEventVisEmbeddablesMap] = useState<
    EventVisEmbeddablesMap | undefined
  >(undefined);
  const [timelineVisEmbeddable, setTimelineVisEmbeddable] = useState<
    VisualizeEmbeddable | undefined
  >(undefined);
  const [timeRange, setTimeRange] = useState<TimeRange | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const embeddableVisFactory = getEmbeddable().getEmbeddableFactory('visualization');

  function reload() {
    visEmbeddable?.reload();
    eventVisEmbeddablesMap?.forEach((embeddableItems) => {
      embeddableItems.forEach((embeddableItem) => {
        embeddableItem.embeddable.reload();
      });
    });
  }

  async function fetchVisEmbeddable() {
    try {
      const contextInput = {
        filters: getQueryService().filterManager.getFilters(),
        query: getQueryService().queryString.getQuery(),
        timeRange: getQueryService().timefilter.timefilter.getTime(),
        visLayerResourceIds: [
          'detector-1-id',
          'detector-2-id',
          'monitor-1-id',
          'monitor-2-id',
          'monitor-3-id',
          'monitor-4-id',
        ],
      };
      setTimeRange(contextInput.timeRange);

      const embeddable = (await embeddableVisFactory?.createFromSavedObject(
        props.savedObjectId,
        contextInput
      )) as VisualizeEmbeddable | ErrorEmbeddable;

      if (embeddable instanceof ErrorEmbeddable) {
        throw getErrorMessage(embeddable);
      }

      embeddable.updateInput({
        // @ts-ignore
        refreshConfig: {
          value: 0,
          pause: true,
        },
      });

      // reload is needed so we can fetch the initial VisLayers, and so they're
      // assigned to the vislayers field in the embeddable itself
      embeddable.reload();

      setVisEmbeddable(embeddable);
    } catch (err: any) {
      setErrorMessage(String(err));
    }
  }

  // For each VisLayer in the base vis embeddable, generate a new filtered vis
  // embeddable to only show datapoints for that particular VisLayer. Partition them by
  // plugin resource type
  async function createEventEmbeddables(visEmbeddable: VisualizeEmbeddable) {
    try {
      let map = new Map<string, EventVisEmbeddableItem[]>() as EventVisEmbeddablesMap;
      // Currently only support PointInTimeEventVisLayers. Different layer types
      // may require different logic in here
      const visLayers = (get(visEmbeddable, 'visLayers', []) as VisLayer[]).filter((visLayer) =>
        isPointInTimeEventsVisLayer(visLayer)
      ) as PointInTimeEventsVisLayer[];
      if (visLayers !== undefined) {
        const contextInput = {
          filters: visEmbeddable.getInput().filters,
          query: visEmbeddable.getInput().query,
          timeRange: visEmbeddable.getInput().timeRange,
        };

        await Promise.all(
          visLayers.map(async (visLayer) => {
            const pluginResourceType = visLayer.pluginResource.type;
            const eventEmbeddable = (await embeddableVisFactory?.createFromSavedObject(
              props.savedObjectId,
              {
                ...contextInput,
                visLayerResourceIds: [visLayer.pluginResource.id as string],
              } as VisualizeInput
            )) as VisualizeEmbeddable | ErrorEmbeddable;

            if (eventEmbeddable instanceof ErrorEmbeddable) {
              throw getErrorMessage(eventEmbeddable);
            }

            eventEmbeddable.updateInput({
              // @ts-ignore
              refreshConfig: {
                value: 0,
                pause: true,
              },
            });

            const curList = (map.get(pluginResourceType) === undefined
              ? []
              : map.get(pluginResourceType)) as EventVisEmbeddableItem[];
            curList.push({
              visLayer,
              embeddable: eventEmbeddable,
            } as EventVisEmbeddableItem);
            map.set(pluginResourceType, curList);
          })
        );
        setEventVisEmbeddablesMap(map);
      }
    } catch (err: any) {
      setErrorMessage(String(err));
    }
  }

  async function createTimelineEmbeddable(visEmbeddable: VisualizeEmbeddable) {
    try {
      const contextInput = {
        filters: visEmbeddable.getInput().filters,
        query: visEmbeddable.getInput().query,
        timeRange: visEmbeddable.getInput().timeRange,
        // TODO: add some field in the visualize embeddable to define
        // showing any data at all
      };

      const embeddable = (await embeddableVisFactory?.createFromSavedObject(
        props.savedObjectId,
        contextInput
      )) as VisualizeEmbeddable | ErrorEmbeddable;

      if (embeddable instanceof ErrorEmbeddable) {
        throw getErrorMessage(embeddable);
      }

      embeddable.updateInput({
        // @ts-ignore
        refreshConfig: {
          value: 0,
          pause: true,
        },
      });
      setTimelineVisEmbeddable(embeddable);
    } catch (err: any) {
      setErrorMessage(String(err));
    }
  }

  useEffect(() => {
    fetchVisEmbeddable();
  }, [props.savedObjectId]);

  useEffect(() => {
    if (visEmbeddable?.visLayers) {
      createEventEmbeddables(visEmbeddable);
      createTimelineEmbeddable(visEmbeddable);
    }
  }, [visEmbeddable?.visLayers]);

  useEffect(() => {
    if (
      visEmbeddable !== undefined &&
      eventVisEmbeddablesMap !== undefined &&
      timeRange !== undefined &&
      timelineVisEmbeddable !== undefined
    ) {
      setIsLoading(false);
    }
  }, [visEmbeddable, eventVisEmbeddablesMap, timeRange, timelineVisEmbeddable]);

  return (
    <>
      <EuiFlyout size="l" onClose={props.onClose}>
        <EuiFlyoutHeader hasBorder>
          <EuiTitle size="l">
            <h1>{isLoading || errorMessage ? <>&nbsp;</> : `${visEmbeddable.getTitle()}`}</h1>
          </EuiTitle>
        </EuiFlyoutHeader>
        {errorMessage ? (
          <ErrorFlyoutBody errorMessage={errorMessage} />
        ) : isLoading ? (
          <LoadingFlyoutBody />
        ) : (
          <EuiFlyoutBody>
            <EuiFlexGroup className="view-events-flyout__content" direction="column">
              <EuiFlexItem
                className="view-events-flyout__contentPanel hide-y-scroll date-range-panel-height"
                grow={false}
              >
                <DateRangeItem timeRange={timeRange} reload={reload} />
              </EuiFlexItem>
              <EuiFlexItem className="view-events-flyout__contentPanel hide-y-scroll" grow={4}>
                <BaseVisItem embeddable={visEmbeddable} />
              </EuiFlexItem>
              <EuiFlexItem className="view-events-flyout__contentPanel show-y-scroll" grow={6}>
                <EventsPanel eventVisEmbeddablesMap={eventVisEmbeddablesMap} />
              </EuiFlexItem>
              <EuiFlexItem
                className="view-events-flyout__contentPanel hide-y-scroll timeline-panel-height"
                grow={false}
              >
                <TimelinePanel embeddable={timelineVisEmbeddable}></TimelinePanel>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlyoutBody>
        )}
      </EuiFlyout>
    </>
  );
}
