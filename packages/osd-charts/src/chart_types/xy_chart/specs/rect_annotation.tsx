import { inject } from 'mobx-react';
import { PureComponent } from 'react';
import { RectAnnotationSpec } from '../utils/specs';
import { getGroupId } from '../../../utils/ids';
import { SpecProps } from '../../../specs/specs_parser';

type RectAnnotationProps = SpecProps & RectAnnotationSpec;

export class RectAnnotationSpecComponent extends PureComponent<RectAnnotationProps> {
  static defaultProps: Partial<RectAnnotationProps> = {
    groupId: getGroupId('__global__'),
    annotationType: 'rectangle',
    zIndex: -1,
  };

  componentDidMount() {
    const { chartStore, children, ...config } = this.props;
    chartStore!.addAnnotationSpec({ ...config });
  }
  componentDidUpdate() {
    const { chartStore, children, ...config } = this.props;
    chartStore!.addAnnotationSpec({ ...config });
  }
  componentWillUnmount() {
    const { chartStore, annotationId } = this.props;
    chartStore!.removeAnnotationSpec(annotationId);
  }
  render() {
    return null;
  }
}

export const RectAnnotation = inject('chartStore')(RectAnnotationSpecComponent);
