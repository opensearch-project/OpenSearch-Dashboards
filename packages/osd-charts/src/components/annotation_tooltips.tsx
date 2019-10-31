import { inject, observer } from 'mobx-react';
import React from 'react';
import { isLineAnnotation } from '../chart_types/xy_chart/utils/specs';
import { AnnotationId } from '../utils/ids';
import {
  AnnotationDimensions,
  AnnotationLineProps,
  AnnotationTooltipFormatter,
} from '../chart_types/xy_chart/annotations/annotation_utils';
import { ChartStore } from '../chart_types/xy_chart/store/chart_state';
import { createPortal } from 'react-dom';
import { getFinalAnnotationTooltipPosition } from '../chart_types/xy_chart/annotations/annotation_tooltip';

interface AnnotationTooltipProps {
  chartStore?: ChartStore;
  getChartContainerRef: () => React.RefObject<HTMLDivElement>;
}
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
    const { annotationTooltipState, chartDimensions } = this.props.chartStore!;
    const tooltipState = annotationTooltipState.get();
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

    this.portalNode.style.left = tooltipStyle.left;
    this.portalNode.style.top = tooltipStyle.top;
  }

  componentWillUnmount() {
    if (this.portalNode && this.portalNode.parentNode) {
      this.portalNode.parentNode.removeChild(this.portalNode);
    }
  }

  renderTooltip = () => {
    const { annotationTooltipState } = this.props.chartStore!;
    const tooltipState = annotationTooltipState.get();
    if (!this.portalNode) {
      return null;
    }
    if (!tooltipState || !tooltipState.isVisible) {
      return <div className="echAnnotation__tooltip echAnnotation__tooltip--hidden" />;
    }

    const { details, header } = tooltipState;

    switch (tooltipState.annotationType) {
      case 'line': {
        const props = { details, header };
        return createPortal(<LineAnnotationTooltip {...props} ref={this.tooltipRef} />, this.portalNode);
      }
      case 'rectangle': {
        const props = { details, customTooltip: tooltipState.renderTooltip };
        return createPortal(<RectAnnotationTooltip {...props} ref={this.tooltipRef} />, this.portalNode);
      }
      default:
        return null;
    }
  };

  renderAnnotationLineMarkers(annotationLines: AnnotationLineProps[], id: AnnotationId): JSX.Element[] {
    const { chartDimensions } = this.props.chartStore!;

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
    const { annotationDimensions, annotationSpecs } = this.props.chartStore!;
    const markers: JSX.Element[] = [];

    annotationDimensions.forEach((dimensions: AnnotationDimensions, id: AnnotationId) => {
      const annotationSpec = annotationSpecs.get(id);
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
    const { chartStore } = this.props;

    if (chartStore!.isChartEmpty.get()) {
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

export const AnnotationTooltip = inject('chartStore')(observer(AnnotationTooltipComponent));

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
