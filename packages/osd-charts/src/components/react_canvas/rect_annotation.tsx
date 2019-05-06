import React from 'react';
import { Group, Rect } from 'react-konva';
import { RectAnnotationStyle } from '../../lib/themes/theme';
import { Dimensions } from '../../lib/utils/dimensions';
import { AnnotationRectProps } from '../../state/annotation_utils';

interface RectAnnotationProps {
  chartDimensions: Dimensions;
  debug: boolean;
  rects: AnnotationRectProps[];
  rectStyle: RectAnnotationStyle;
}

export class RectAnnotation extends React.PureComponent<RectAnnotationProps> {
  render() {
    return this.renderAnnotation();
  }
  private renderAnnotationRect = (props: AnnotationRectProps, i: number) => {
    const { x, y, width, height } = props.rect;

    const rectProps = {
      ...this.props.rectStyle,
      x,
      y,
      width,
      height,
    };

    return <Rect key={`rect-${i}`} {...rectProps} />;
  }

  private renderAnnotation = () => {
    const { rects } = this.props;

    return (
      <Group>
        {rects.map(this.renderAnnotationRect)}
      </Group>
    );
  }
}
