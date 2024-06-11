/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiFlyout,
  EuiTitle,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLoadingContent,
} from '@elastic/eui';
import './styles.scss';
import { VisualizeEmbeddable } from '../../../../visualizations/public';
import { TimeRange } from '../../../../data/common';
import { BaseVisItem } from './base_vis_item';
import { DateRangeItem } from './date_range_item';
import { LoadingFlyoutBody } from './loading_flyout_body';
import { ErrorFlyoutBody } from './error_flyout_body';
import { EventsPanel } from './events_panel';
import { TimelinePanel } from './timeline_panel';
import {
  fetchVisEmbeddableWithSetters,
  createEventEmbeddables,
  createTimelineEmbeddable,
} from './utils';
import { EventVisEmbeddablesMap } from './types';

interface Props {
  onClose: () => void;
  savedObjectId: string;
}

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

  function reload() {
    visEmbeddable?.reload();
    eventVisEmbeddablesMap?.forEach((embeddableItems) => {
      embeddableItems.forEach((embeddableItem) => {
        embeddableItem.embeddable.reload();
      });
    });
  }

  useEffect(() => {
    fetchVisEmbeddableWithSetters(
      props.savedObjectId,
      setTimeRange,
      setVisEmbeddable,
      setErrorMessage
    );
    // adding all of the values to the deps array cause a circular re-render. we don't want
    // to keep re-fetching the visEmbeddable after it is set.
    /* eslint-disable react-hooks/exhaustive-deps */
  }, [props.savedObjectId]);

  useEffect(() => {
    if (visEmbeddable?.visLayers) {
      createEventEmbeddables(
        props.savedObjectId,
        visEmbeddable,
        setEventVisEmbeddablesMap,
        setErrorMessage
      );
      createTimelineEmbeddable(
        props.savedObjectId,
        visEmbeddable,
        setTimelineVisEmbeddable,
        setErrorMessage
      );
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
          <EuiTitle size="m">
            <h1>
              {isLoading ? (
                <EuiLoadingContent lines={1} />
              ) : errorMessage ? (
                'Error fetching events'
              ) : (
                `${visEmbeddable?.getTitle()}`
              )}
            </h1>
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
                className="view-events-flyout__contentPanel date-range-panel-height"
                grow={false}
              >
                <DateRangeItem timeRange={timeRange as TimeRange} reload={reload} />
              </EuiFlexItem>
              <EuiFlexItem
                className="view-events-flyout__contentPanel"
                grow={7}
                style={{ maxHeight: '40vh' }}
              >
                <BaseVisItem embeddable={visEmbeddable as VisualizeEmbeddable} />
              </EuiFlexItem>
              <EuiFlexItem className="view-events-flyout__contentPanel show-y-scroll" grow={3}>
                <EventsPanel
                  eventVisEmbeddablesMap={eventVisEmbeddablesMap as EventVisEmbeddablesMap}
                />
              </EuiFlexItem>
              <EuiFlexItem
                className="view-events-flyout__contentPanel timeline-panel-height"
                grow={false}
              >
                <TimelinePanel embeddable={timelineVisEmbeddable as VisualizeEmbeddable} />
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlyoutBody>
        )}
      </EuiFlyout>
    </>
  );
}
