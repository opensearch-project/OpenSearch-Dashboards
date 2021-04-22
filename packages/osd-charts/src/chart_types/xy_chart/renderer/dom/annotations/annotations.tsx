/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, { RefObject, useCallback } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';

import {
  onDOMElementEnter as onDOMElementEnterAction,
  onDOMElementLeave as onDOMElementLeaveAction,
} from '../../../../../state/actions/dom_element';
import { onPointerMove as onPointerMoveAction } from '../../../../../state/actions/mouse';
import { GlobalChartState, BackwardRef } from '../../../../../state/chart_state';
import {
  getInternalIsInitializedSelector,
  InitStatus,
} from '../../../../../state/selectors/get_internal_is_intialized';
import { Dimensions } from '../../../../../utils/dimensions';
import { AnnotationId } from '../../../../../utils/ids';
import { AnnotationLineProps } from '../../../annotations/line/types';
import { AnnotationDimensions, AnnotationTooltipState } from '../../../annotations/types';
import { computeAnnotationDimensionsSelector } from '../../../state/selectors/compute_annotations';
import { computeChartDimensionsSelector } from '../../../state/selectors/compute_chart_dimensions';
import { getAnnotationTooltipStateSelector } from '../../../state/selectors/get_annotation_tooltip_state';
import { getAnnotationSpecsSelector } from '../../../state/selectors/get_specs';
import { isChartEmptySelector } from '../../../state/selectors/is_chart_empty';
import { getSpecsById } from '../../../state/utils/spec';
import { isLineAnnotation, AnnotationSpec } from '../../../utils/specs';
import { AnnotationTooltip } from './annotation_tooltip';
import { LineMarker } from './line_marker';

interface AnnotationsDispatchProps {
  onPointerMove: typeof onPointerMoveAction;
  onDOMElementEnter: typeof onDOMElementEnterAction;
  onDOMElementLeave: typeof onDOMElementLeaveAction;
}

interface AnnotationsStateProps {
  isChartEmpty: boolean;
  tooltipState: AnnotationTooltipState | null;
  chartDimensions: Dimensions;
  annotationDimensions: Map<AnnotationId, AnnotationDimensions>;
  annotationSpecs: AnnotationSpec[];
  chartId: string;
  zIndex: number;
}

interface AnnotationsOwnProps {
  getChartContainerRef: BackwardRef;
  chartAreaRef: RefObject<HTMLCanvasElement>;
}

type AnnotationsProps = AnnotationsDispatchProps & AnnotationsStateProps & AnnotationsOwnProps;

function renderAnnotationLineMarkers(
  chartAreaRef: RefObject<HTMLCanvasElement>,
  chartDimensions: Dimensions,
  annotationLines: AnnotationLineProps[],
  onDOMElementEnter: typeof onDOMElementEnterAction,
  onDOMElementLeave: typeof onDOMElementLeaveAction,
) {
  return annotationLines.reduce<JSX.Element[]>((acc, props: AnnotationLineProps) => {
    if (props.markers.length === 0) {
      return acc;
    }

    acc.push(
      <LineMarker
        {...props}
        key={`annotation-${props.id}`}
        chartAreaRef={chartAreaRef}
        chartDimensions={chartDimensions}
        onDOMElementEnter={onDOMElementEnter}
        onDOMElementLeave={onDOMElementLeave}
      />,
    );

    return acc;
  }, []);
}
const AnnotationsComponent = ({
  tooltipState,
  isChartEmpty,
  chartDimensions,
  annotationSpecs,
  annotationDimensions,
  getChartContainerRef,
  chartAreaRef,
  chartId,
  zIndex,
  onPointerMove,
  onDOMElementEnter,
  onDOMElementLeave,
}: AnnotationsProps) => {
  const renderAnnotationMarkers = useCallback((): JSX.Element[] => {
    const markers: JSX.Element[] = [];

    annotationDimensions.forEach((dimensions: AnnotationDimensions, id: AnnotationId) => {
      const annotationSpec = getSpecsById<AnnotationSpec>(annotationSpecs, id);
      if (!annotationSpec) {
        return;
      }

      if (isLineAnnotation(annotationSpec)) {
        const annotationLines = dimensions as AnnotationLineProps[];
        const lineMarkers = renderAnnotationLineMarkers(
          chartAreaRef,
          chartDimensions,
          annotationLines,
          onDOMElementEnter,
          onDOMElementLeave,
        );
        markers.push(...lineMarkers);
      }
    });

    return markers;
  }, [annotationDimensions, annotationSpecs, chartAreaRef, chartDimensions, onDOMElementEnter, onDOMElementLeave]);

  const onScroll = useCallback(() => {
    onPointerMove({ x: -1, y: -1 }, Date.now());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (isChartEmpty) {
    return null;
  }

  return (
    <>
      {renderAnnotationMarkers()}
      <AnnotationTooltip
        chartId={chartId}
        zIndex={zIndex}
        state={tooltipState}
        chartRef={getChartContainerRef()}
        onScroll={onScroll}
      />
    </>
  );
};

AnnotationsComponent.displayName = 'Annotations';

const mapDispatchToProps = (dispatch: Dispatch): AnnotationsDispatchProps =>
  bindActionCreators(
    {
      onPointerMove: onPointerMoveAction,
      onDOMElementLeave: onDOMElementLeaveAction,
      onDOMElementEnter: onDOMElementEnterAction,
    },
    dispatch,
  );

const mapStateToProps = (state: GlobalChartState): AnnotationsStateProps => {
  const { zIndex, chartId } = state;
  if (getInternalIsInitializedSelector(state) !== InitStatus.Initialized) {
    return {
      isChartEmpty: true,
      chartDimensions: { top: 0, left: 0, width: 0, height: 0 },
      annotationDimensions: new Map(),
      annotationSpecs: [],
      tooltipState: null,
      chartId,
      zIndex,
    };
  }
  return {
    isChartEmpty: isChartEmptySelector(state),
    chartDimensions: computeChartDimensionsSelector(state).chartDimensions,
    annotationDimensions: computeAnnotationDimensionsSelector(state),
    annotationSpecs: getAnnotationSpecsSelector(state),
    tooltipState: getAnnotationTooltipStateSelector(state),
    chartId,
    zIndex,
  };
};

/** @internal */
export const Annotations = connect(mapStateToProps, mapDispatchToProps)(AnnotationsComponent);
