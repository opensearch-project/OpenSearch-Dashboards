import { inject } from 'mobx-react';
import React, { createRef, CSSProperties, PureComponent } from 'react';
import { LineAnnotationSpec } from '../lib/series/specs';
import { DEFAULT_ANNOTATION_LINE_STYLE } from '../lib/themes/theme';
import { getGroupId } from '../lib/utils/ids';
import { SpecProps } from './specs_parser';

type LineAnnotationProps = SpecProps & LineAnnotationSpec;

export class LineAnnotationSpecComponent extends PureComponent<LineAnnotationProps> {
  static defaultProps: Partial<LineAnnotationProps> = {
    groupId: getGroupId('__global__'),
    annotationType: 'line',
    style: DEFAULT_ANNOTATION_LINE_STYLE,
    hideLines: false,
    hideTooltips: false,
    zIndex: 1,
  };

  private markerRef = createRef<HTMLDivElement>();

  componentDidMount() {
    const { chartStore, children, ...config } = this.props;
    if (this.markerRef.current) {
      const { offsetWidth, offsetHeight } = this.markerRef.current;
      config.markerDimensions = {
        width: offsetWidth,
        height: offsetHeight,
      };
    }
    chartStore!.addAnnotationSpec({ ...config });
  }
  componentDidUpdate() {
    const { chartStore, children, ...config } = this.props;
    if (this.markerRef.current) {
      const { offsetWidth, offsetHeight } = this.markerRef.current;
      config.markerDimensions = {
        width: offsetWidth,
        height: offsetHeight,
      };
    }
    chartStore!.addAnnotationSpec({ ...config });
  }
  componentWillUnmount() {
    const { chartStore, annotationId } = this.props;
    chartStore!.removeAnnotationSpec(annotationId);
  }
  render() {
    if (!this.props.marker) {
      return null;
    }

    // We need to get the width & height of the marker passed into the spec
    // so we render the marker offscreen if one has been defined & update the config
    // with the width & height.
    const offscreenStyle: CSSProperties = {
      position: 'absolute',
      left: -9999,
      opacity: 0,
    };

    return (
      <div ref={this.markerRef} style={{ ...offscreenStyle }}>
        {this.props.marker}
      </div>
    );
  }
}

export const LineAnnotation = inject('chartStore')(LineAnnotationSpecComponent);
