import React from 'react';
import { Group, Line } from 'react-konva';
import { LineAnnotationStyle } from '../../lib/themes/theme';
import { Dimensions } from '../../lib/utils/dimensions';
import { AnnotationLineProps } from '../../state/annotation_utils';

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
    const { position } = lineConfig;

    const lineProps = {
      points: position,
      ...line,
    };

    return <Line {...lineProps} key={`tick-${i}`} />;
  };

  private renderAnnotation = () => {
    const { lines } = this.props;

    return <Group>{lines.map(this.renderAnnotationLine)}</Group>;
  };
}
