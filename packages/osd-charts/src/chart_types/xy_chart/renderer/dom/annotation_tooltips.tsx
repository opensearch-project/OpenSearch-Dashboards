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
 * under the License. */

import React from 'react';
import { isLineAnnotation, AnnotationSpec, AnnotationTypes } from '../../utils/specs';
import { AnnotationId } from '../../../../utils/ids';
import {
  AnnotationDimensions,
  AnnotationTooltipState,
  AnnotationTooltipFormatter,
} from '../../annotations/annotation_utils';
import { connect } from 'react-redux';
import { Dimensions } from '../../../../utils/dimensions';
import { GlobalChartState, BackwardRef } from '../../../../state/chart_state';
import { isInitialized } from '../../../../state/selectors/is_initialized';
import { computeAnnotationDimensionsSelector } from '../../state/selectors/compute_annotations';
import { getAnnotationSpecsSelector } from '../../state/selectors/get_specs';
import { getAnnotationTooltipStateSelector } from '../../state/selectors/get_annotation_tooltip_state';
import { isChartEmptySelector } from '../../state/selectors/is_chart_empty';
import { AnnotationLineProps } from '../../annotations/line_annotation_tooltip';
import { computeChartDimensionsSelector } from '../../state/selectors/compute_chart_dimensions';
import { createPortal } from 'react-dom';
import { getFinalAnnotationTooltipPosition } from '../../annotations/annotation_tooltip';
import { getSpecsById } from '../../state/utils';

interface AnnotationTooltipStateProps {
  isChartEmpty: boolean;
  tooltipState: AnnotationTooltipState | null;
  chartDimensions: Dimensions;
  annotationDimensions: Map<AnnotationId, AnnotationDimensions>;
  annotationSpecs: AnnotationSpec[];
}

interface AnnotationTooltipOwnProps {
  getChartContainerRef: BackwardRef;
}

type AnnotationTooltipProps = AnnotationTooltipStateProps & AnnotationTooltipOwnProps;

const ANNOTATION_CONTAINER_ID = 'echAnnotationContainerPortal';

class AnnotationTooltipComponent extends React.Component<AnnotationTooltipProps> {
  static displayName = 'AnnotationTooltip';
  portalNode: HTMLDivElement | null = null;
  tooltipRef: React.RefObject<HTMLDivElement>;

  constructor(props: AnnotationTooltipProps) {
    super(props);
    this.tooltipRef = React.createRef();
  }

  createPortalNode() {
    const container = document.getElementById(ANNOTATION_CONTAINER_ID);
    if (container) {
      this.portalNode = container as HTMLDivElement;
    } else {
      this.portalNode = document.createElement('div');
      this.portalNode.id = ANNOTATION_CONTAINER_ID;
      document.body.appendChild(this.portalNode);
    }
  }
  componentDidMount() {
    this.createPortalNode();
  }
  componentDidUpdate() {
    // calling on componentDidUpdate because the annotation container can be
    // removed by another chart on the same page
    this.createPortalNode();
    if (!this.tooltipRef.current) {
      return;
    }
    const { getChartContainerRef } = this.props;
    const chartContainerRef = getChartContainerRef();
    if (!chartContainerRef.current) {
      return;
    }

    const { tooltipState, chartDimensions } = this.props;
    if (!tooltipState || !tooltipState.isVisible || !this.portalNode) {
      return null;
    }

    const chartContainerBBox = chartContainerRef.current.getBoundingClientRect();
    const tooltipBBox = this.tooltipRef.current.getBoundingClientRect();
    const tooltipStyle = getFinalAnnotationTooltipPosition(
      chartContainerBBox,
      chartDimensions,
      tooltipBBox,
      tooltipState.anchor,
    );

    if (tooltipStyle.left) {
      this.portalNode.style.left = tooltipStyle.left;
    }
    if (tooltipStyle.top) {
      this.portalNode.style.top = tooltipStyle.top;
    }
  }

  componentWillUnmount() {
    if (this.portalNode && this.portalNode.parentNode) {
      this.portalNode.parentNode.removeChild(this.portalNode);
    }
  }

  renderTooltip = () => {
    const { tooltipState } = this.props;
    if (!this.portalNode) {
      return null;
    }
    if (!tooltipState || !tooltipState.isVisible) {
      return <div className="echAnnotation__tooltip echAnnotation__tooltip--hidden" />;
    }

    const { details, header } = tooltipState;

    switch (tooltipState.annotationType) {
      case AnnotationTypes.Line: {
        const props = { details, header };
        return createPortal(<LineAnnotationTooltip {...props} ref={this.tooltipRef} />, this.portalNode);
      }
      case AnnotationTypes.Rectangle: {
        const props = { details, customTooltip: tooltipState.renderTooltip };
        return createPortal(<RectAnnotationTooltip {...props} ref={this.tooltipRef} />, this.portalNode);
      }
      default:
        return null;
    }
  };

  renderAnnotationLineMarkers(annotationLines: AnnotationLineProps[], id: AnnotationId): JSX.Element[] {
    const { chartDimensions } = this.props;

    const markers: JSX.Element[] = [];

    annotationLines.forEach((line: AnnotationLineProps, index: number) => {
      if (!line.marker) {
        return;
      }

      const { icon, color, position } = line.marker;

      const style = {
        color,
        top: chartDimensions.top + position.top,
        left: chartDimensions.left + position.left,
      };

      const markerElement = (
        <div className="echAnnotation" style={{ ...style }} key={`annotation-${id}-${index}`}>
          {icon}
        </div>
      );

      markers.push(markerElement);
    });

    return markers;
  }

  renderAnnotationMarkers(): JSX.Element[] {
    const { annotationDimensions, annotationSpecs } = this.props;
    const markers: JSX.Element[] = [];

    annotationDimensions.forEach((dimensions: AnnotationDimensions, id: AnnotationId) => {
      const annotationSpec = getSpecsById<AnnotationSpec>(annotationSpecs, id);
      if (!annotationSpec) {
        return;
      }

      if (isLineAnnotation(annotationSpec)) {
        const annotationLines = dimensions as AnnotationLineProps[];
        const lineMarkers = this.renderAnnotationLineMarkers(annotationLines, id);
        markers.push(...lineMarkers);
      }
    });

    return markers;
  }

  render() {
    const { isChartEmpty } = this.props;

    if (isChartEmpty) {
      return null;
    }

    return (
      <React.Fragment>
        {this.renderAnnotationMarkers()}
        {this.renderTooltip()}
      </React.Fragment>
    );
  }
}

interface RectAnnotationTooltipProps {
  details?: string;
  customTooltip?: AnnotationTooltipFormatter;
}
function RectAnnotationTooltipRender(props: RectAnnotationTooltipProps, ref: React.Ref<HTMLDivElement>) {
  const { details, customTooltip } = props;
  const tooltipContent = customTooltip ? customTooltip(details) : details;

  if (!tooltipContent) {
    return null;
  }

  return (
    <div className="echAnnotation__tooltip" ref={ref}>
      <div className="echAnnotation__details">
        <div className="echAnnotation__detailsText">{tooltipContent}</div>
      </div>
    </div>
  );
}

const RectAnnotationTooltip = React.forwardRef(RectAnnotationTooltipRender);

interface LineAnnotationTooltipProps {
  details?: string;
  header?: string;
}
function LineAnnotationTooltipRender(props: LineAnnotationTooltipProps, ref: React.Ref<HTMLDivElement>) {
  const { details, header } = props;
  return (
    <div className="echAnnotation__tooltip" ref={ref}>
      <p className="echAnnotation__header">{header}</p>
      <div className="echAnnotation__details">{details}</div>
    </div>
  );
}
const LineAnnotationTooltip = React.forwardRef(LineAnnotationTooltipRender);

const mapStateToProps = (state: GlobalChartState): AnnotationTooltipStateProps => {
  if (!isInitialized(state)) {
    return {
      isChartEmpty: true,
      chartDimensions: { top: 0, left: 0, width: 0, height: 0 },
      annotationDimensions: new Map(),
      annotationSpecs: [],
      tooltipState: null,
    };
  }
  return {
    isChartEmpty: isChartEmptySelector(state),
    chartDimensions: computeChartDimensionsSelector(state).chartDimensions,
    annotationDimensions: computeAnnotationDimensionsSelector(state),
    annotationSpecs: getAnnotationSpecsSelector(state),
    tooltipState: getAnnotationTooltipStateSelector(state),
  };
};

/** @internal */
export const AnnotationTooltip = connect(mapStateToProps)(AnnotationTooltipComponent);
