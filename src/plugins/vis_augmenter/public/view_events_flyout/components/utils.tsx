/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { get } from 'lodash';
import { EmbeddableStart, ErrorEmbeddable } from '../../../../embeddable/public';
import { VisualizeEmbeddable, VisualizeInput } from '../../../../visualizations/public';
import { getEmbeddable, getQueryService } from '../../services';
import {
  isPointInTimeEventsVisLayer,
  PointInTimeEventsVisLayer,
  VisFlyoutContext,
  VisLayer,
} from '../../types';
import { EventVisEmbeddableItem, EventVisEmbeddablesMap } from './types';
import { QueryStart } from '../../../../data/public';

export function getErrorMessage(errorEmbeddable: ErrorEmbeddable): string {
  return errorEmbeddable.error instanceof Error
    ? errorEmbeddable.error.message
    : errorEmbeddable.error;
}

/**
 * Given an embeddable, check if/where there is value (y) axes located on the left and/or
 * right of the chart. This is needed so we can properly align all of the event
 * charts in the flyout appropriately.
 */
function getValueAxisPositions(embeddable: VisualizeEmbeddable): { left: boolean; right: boolean } {
  let hasLeftValueAxis = false;
  let hasRightValueAxis = false;
  if (embeddable !== undefined) {
    const valueAxes = embeddable.vis.params.valueAxes;
    const positions = valueAxes.map(
      (valueAxis: { position: string }) => valueAxis.position
    ) as string[];
    hasLeftValueAxis = positions.includes('left');
    hasRightValueAxis = positions.includes('right');
  }
  return {
    left: hasLeftValueAxis,
    right: hasRightValueAxis,
  };
}

/**
 * Fetching the base vis to show in the flyout, based on the saved object ID. Add constraints
 * such that it is static and won't auto-refresh within the flyout.
 * @param savedObjectId the saved object id of the base vis
 * @param embeddableStart Optional EmbeddableStart passed in for plugins to utilize the function
 * @param queryServiceLoader Optional QueryStart passed in for plugins to utilize the function
 */
export async function fetchVisEmbeddable(
  savedObjectId: string,
  embeddableStart?: EmbeddableStart,
  queryStart?: QueryStart
): Promise<VisualizeEmbeddable> {
  const embeddableLoader = embeddableStart ?? getEmbeddable();
  const embeddableVisFactory = embeddableLoader.getEmbeddableFactory('visualization');
  const queryService = queryStart ?? getQueryService();
  const contextInput = {
    filters: queryService.filterManager.getFilters(),
    query: queryService.queryString.getQuery(),
    timeRange: queryService.timefilter.timefilter.getTime(),
  };

  const embeddable = (await embeddableVisFactory?.createFromSavedObject(savedObjectId, {
    ...contextInput,
    visAugmenterConfig: {
      inFlyout: true,
      flyoutContext: VisFlyoutContext.BASE_VIS,
    },
  } as VisualizeInput)) as VisualizeEmbeddable | ErrorEmbeddable;

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

  // By waiting for this to complete, embeddable.visLayers will be populated
  await embeddable.populateVisLayers();

  return embeddable;
}

/**
 * Fetching the base vis to show in the flyout, based on the saved object ID. Add constraints
 * such that it is static and won't auto-refresh within the flyout.
 * @param savedObjectId the saved object id of the base vis
 * @param setTimeRange custom hook used in base component
 * @param setVisEmbeddable custom hook used in base component
 * @param setErrorMessage custom hook used in base component
 */
export async function fetchVisEmbeddableWithSetters(
  savedObjectId: string,
  setTimeRange: Function,
  setVisEmbeddable: Function,
  setErrorMessage: Function
): Promise<void> {
  try {
    const embeddable = await fetchVisEmbeddable(savedObjectId);
    setTimeRange(getQueryService().timefilter.timefilter.getTime());
    setVisEmbeddable(embeddable);
  } catch (err: any) {
    setErrorMessage(String(err));
  }
}

/**
 * For each VisLayer in the base vis embeddable, generate a new filtered vis
 * embeddable (based off of the base vis), and pass in extra arguments to only
 * show datapoints for that particular VisLayer. Partition them by
 * plugin resource type via an EventVisEmbeddablesMap.
 * @param savedObjectId the saved object id of the base vis embeddable
 * @param embeddable the base vis embeddable
 * @param setEventVisEmbeddablesMap custom hook used in base component
 * @param setErrorMessage custom hook used in base component
 */
export async function createEventEmbeddables(
  savedObjectId: string,
  embeddable: VisualizeEmbeddable,
  setEventVisEmbeddablesMap: Function,
  setErrorMessage: Function
) {
  const embeddableVisFactory = getEmbeddable().getEmbeddableFactory('visualization');
  try {
    const { left, right } = getValueAxisPositions(embeddable);
    const map = new Map<string, EventVisEmbeddableItem[]>() as EventVisEmbeddablesMap;
    // Currently only support PointInTimeEventVisLayers. Different layer types
    // may require different logic in here
    const visLayers = (get(embeddable, 'visLayers', []) as VisLayer[]).filter((visLayer) =>
      isPointInTimeEventsVisLayer(visLayer)
    ) as PointInTimeEventsVisLayer[];
    if (visLayers !== undefined) {
      const contextInput = {
        filters: embeddable.getInput().filters,
        query: embeddable.getInput().query,
        timeRange: embeddable.getInput().timeRange,
      };

      await Promise.all(
        visLayers.map(async (visLayer) => {
          const pluginResourceType = visLayer.pluginResource.type;
          const eventEmbeddable = (await embeddableVisFactory?.createFromSavedObject(
            savedObjectId,
            {
              ...contextInput,
              visAugmenterConfig: {
                visLayerResourceIds: [visLayer.pluginResource.id as string],
                inFlyout: true,
                flyoutContext: VisFlyoutContext.EVENT_VIS,
                leftValueAxisPadding: left,
                rightValueAxisPadding: right,
              },
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

/**
 * Based on the base vis embeddable, generate a new filtered vis, and pass in extra
 * arguments to only show the x-axis (timeline).
 * @param savedObjectId the saved object id of the base vis
 * @param embeddable the base vis embeddable
 * @param setTimelineVisEmbeddable custom hook used in base component
 * @param setErrorMessage custom hook used in base component
 */
export async function createTimelineEmbeddable(
  savedObjectId: string,
  embeddable: VisualizeEmbeddable,
  setTimelineVisEmbeddable: Function,
  setErrorMessage: Function
) {
  const embeddableVisFactory = getEmbeddable().getEmbeddableFactory('visualization');
  try {
    const { left, right } = getValueAxisPositions(embeddable);
    const contextInput = {
      filters: embeddable.getInput().filters,
      query: embeddable.getInput().query,
      timeRange: embeddable.getInput().timeRange,
    };

    const timelineEmbeddable = (await embeddableVisFactory?.createFromSavedObject(savedObjectId, {
      ...contextInput,
      visAugmenterConfig: {
        inFlyout: true,
        flyoutContext: VisFlyoutContext.TIMELINE_VIS,
        leftValueAxisPadding: left,
        rightValueAxisPadding: right,
      },
    } as VisualizeInput)) as VisualizeEmbeddable | ErrorEmbeddable;

    if (timelineEmbeddable instanceof ErrorEmbeddable) {
      throw getErrorMessage(timelineEmbeddable);
    }

    timelineEmbeddable.updateInput({
      // @ts-ignore
      refreshConfig: {
        value: 0,
        pause: true,
      },
    });
    setTimelineVisEmbeddable(timelineEmbeddable);
  } catch (err: any) {
    setErrorMessage(String(err));
  }
}
