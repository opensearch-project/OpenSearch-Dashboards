import React from 'react';
import { Group, Rect } from 'react-konva';
import deepEqual from 'fast-deep-equal/es6';
import { RectAnnotationStyle } from '../../../../utils/themes/theme';
import { AnnotationRectProps } from '../../annotations/rect_annotation_tooltip';

interface Props {
  rects: AnnotationRectProps[];
  rectStyle: RectAnnotationStyle;
}

export class RectAnnotation extends React.Component<Props> {
  shouldComponentUpdate(nextProps: Props) {
    return !deepEqual(this.props, nextProps);
  }

  render() {
    const { rects } = this.props;
    return <Group>{rects.map(this.renderAnnotationRect)}</Group>;
  }
  private renderAnnotationRect = ({ rect }: AnnotationRectProps, index: number) => {
    const { x, y, width, height } = rect;

    const rectProps = {
      ...this.props.rectStyle,
      x,
      y,
      width,
      height,
    };

    return <Rect {...rectProps} key={`rect-annotation-${index}`} />;
  };
}
