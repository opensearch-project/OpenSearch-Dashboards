import React from 'react';
import { Group, Line } from 'react-konva';
import deepEqual from 'fast-deep-equal/es6/react';
import { LineAnnotationStyle } from '../../../../utils/themes/theme';
import { AnnotationLineProps } from '../../annotations/line_annotation_tooltip';

interface LineAnnotationProps {
  lines: AnnotationLineProps[];
  lineStyle: LineAnnotationStyle;
}

export class LineAnnotation extends React.Component<LineAnnotationProps> {
  shouldComponentUpdate(nextProps: LineAnnotationProps) {
    return !deepEqual(this.props, nextProps);
  }

  render() {
    const { lines } = this.props;

    return <Group>{lines.map(this.renderAnnotationLine)}</Group>;
  }
  private renderAnnotationLine = (lineConfig: AnnotationLineProps, index: number) => {
    const { line } = this.props.lineStyle;
    const {
      start: { x1, y1 },
      end: { x2, y2 },
    } = lineConfig.linePathPoints;
    const lineProps = {
      points: [x1, y1, x2, y2],
      ...line,
    };
    return <Line {...lineProps} key={`annotation-line-${index}`} />;
  };
}
