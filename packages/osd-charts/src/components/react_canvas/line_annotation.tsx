import React from 'react';
import { Group, Line } from 'react-konva';
import { LineAnnotationStyle } from '../../utils/themes/theme';
import { Dimensions } from '../../utils/dimensions';
import { AnnotationLineProps } from '../../chart_types/xy_chart/annotations/annotation_utils';

interface LineAnnotationProps {
  chartDimensions: Dimensions;
  debug: boolean;
  lines: AnnotationLineProps[];
  lineStyle: LineAnnotationStyle;
}

export class LineAnnotation extends React.PureComponent<LineAnnotationProps> {
  render() {
    return this.renderAnnotation();
  }
  private renderAnnotationLine = (lineConfig: AnnotationLineProps, i: number) => {
    const { line } = this.props.lineStyle;
    const {
      start: { x1, y1 },
      end: { x2, y2 },
    } = lineConfig.linePathPoints;
    const lineProps = {
      points: [x1, y1, x2, y2],
      ...line,
    };

    return <Line {...lineProps} key={`tick-${i}`} />;
  };

  private renderAnnotation = () => {
    const { lines } = this.props;

    return <Group>{lines.map(this.renderAnnotationLine)}</Group>;
  };
}
