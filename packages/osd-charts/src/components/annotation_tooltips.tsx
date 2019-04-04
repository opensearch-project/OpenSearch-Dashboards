import { inject, observer } from 'mobx-react';
import React from 'react';
import { AnnotationTypes } from '../lib/series/specs';
import { AnnotationId } from '../lib/utils/ids';
import { AnnotationLineProps } from '../state/annotation_utils';
import { ChartStore } from '../state/chart_state';

interface AnnotationTooltipProps {
  chartStore?: ChartStore;
}

class AnnotationTooltipComponent extends React.Component<AnnotationTooltipProps> {
  static displayName = 'AnnotationTooltip';

  renderTooltip() {
    const annotationTooltipState = this.props.chartStore!.annotationTooltipState.get();
    if (!annotationTooltipState || !annotationTooltipState.isVisible) {
      return <div className="elasticChartsAnnotation__tooltip elasticChartsAnnotation__tooltip--hidden" />;
    }

    const transform = annotationTooltipState.transform;
    const chartDimensions = this.props.chartStore!.chartDimensions;

    const style = {
      transform,
      top: chartDimensions.top,
      left: chartDimensions.left,
    };

    return (
      <div className="elasticChartsAnnotation__tooltip" style={{ ...style }}>
        <p className="elasticChartsAnnotation__header">{annotationTooltipState.header}</p>
        <div className="elasticChartsAnnotation__details">
          {annotationTooltipState.details}
        </div>
      </div>
    );
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
        <div className="elasticChartsAnnotation" style={{ ...style }} key={`annotation-${id}-${index}`}>
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

    annotationDimensions.forEach((annotationLines: AnnotationLineProps[], id: AnnotationId) => {
      const annotationSpec = annotationSpecs.get(id);
      if (!annotationSpec) {
        return;
      }

      switch (annotationSpec.annotationType) {
        case AnnotationTypes.Line:
          const lineMarkers = this.renderAnnotationLineMarkers(annotationLines, id);
          markers.push(...lineMarkers);
          break;
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
