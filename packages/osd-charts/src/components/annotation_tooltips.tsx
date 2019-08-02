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

interface AnnotationTooltipProps {
  chartStore?: ChartStore;
}

class AnnotationTooltipComponent extends React.Component<AnnotationTooltipProps> {
  static displayName = 'AnnotationTooltip';

  renderTooltip() {
    const { annotationTooltipState } = this.props.chartStore!;
    const tooltipState = annotationTooltipState.get();

    if (!tooltipState || !tooltipState.isVisible) {
      return <div className="echAnnotation__tooltip echAnnotation__tooltip--hidden" />;
    }

    const { transform, details, header } = tooltipState;
    const chartDimensions = this.props.chartStore!.chartDimensions;

    const tooltipTop = tooltipState.top;
    const tooltipLeft = tooltipState.left;
    const top = tooltipTop == null ? chartDimensions.top : chartDimensions.top + tooltipTop;
    const left = tooltipLeft == null ? chartDimensions.left : chartDimensions.left + tooltipLeft;

    const position = {
      transform,
      top,
      left,
    };

    switch (tooltipState.annotationType) {
      case 'line': {
        const props = { position, details, header };
        return <LineAnnotationTooltip {...props} />;
      }
      case 'rectangle': {
        const props = { details, position, customTooltip: tooltipState.renderTooltip };
        return <RectAnnotationTooltip {...props} />;
      }
      default:
        return null;
    }
  }

  renderAnnotationLineMarkers(annotationLines: AnnotationLineProps[], id: AnnotationId): JSX.Element[] {
    const { chartDimensions } = this.props.chartStore!;

    const markers: JSX.Element[] = [];

    annotationLines.forEach((line: AnnotationLineProps, index: number) => {
      if (!line.marker) {
        return;
      }

      const { transform, icon, color } = line.marker;

      const style = {
        color,
        transform,
        top: chartDimensions.top,
        left: chartDimensions.left,
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
    return (
      <React.Fragment>
        {this.renderAnnotationMarkers()}
        {this.renderTooltip()}
      </React.Fragment>
    );
  }
}

export const AnnotationTooltip = inject('chartStore')(observer(AnnotationTooltipComponent));

function RectAnnotationTooltip(props: {
  details?: string;
  position: { transform: string; top: number; left: number };
  customTooltip?: AnnotationTooltipFormatter;
}) {
  const { details, position, customTooltip } = props;
  const tooltipContent = customTooltip ? customTooltip(details) : details;

  if (!tooltipContent) {
    return null;
  }

  return (
    <div className="echAnnotation__tooltip" style={{ ...position }}>
      <div className="echAnnotation__details">
        <div className="echAnnotation__detailsText">{tooltipContent}</div>
      </div>
    </div>
  );
}

function LineAnnotationTooltip(props: {
  details?: string;
  header?: string;
  position: { transform: string; top: number; left: number };
}) {
  const { details, position, header } = props;
  return (
    <div className="echAnnotation__tooltip" style={{ ...position }}>
      <p className="echAnnotation__header">{header}</p>
      <div className="echAnnotation__details">{details}</div>
    </div>
  );
}
