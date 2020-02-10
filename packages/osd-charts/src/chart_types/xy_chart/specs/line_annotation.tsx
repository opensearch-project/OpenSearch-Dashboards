import React, { createRef, CSSProperties, Component } from 'react';
import { deepEqual } from '../../../utils/fast_deep_equal';
import { LineAnnotationSpec, DEFAULT_GLOBAL_ID, AnnotationTypes } from '../utils/specs';
import { DEFAULT_ANNOTATION_LINE_STYLE } from '../../../utils/themes/theme';
import { bindActionCreators, Dispatch } from 'redux';
import { connect } from 'react-redux';
import { upsertSpec, removeSpec } from '../../../state/actions/specs';
import { Spec, SpecTypes } from '../../../specs';
import { ChartTypes } from '../..';

type InjectedProps = LineAnnotationSpec &
  DispatchProps &
  Readonly<{
    children?: React.ReactNode;
  }>;
export class LineAnnotationSpecComponent extends Component<LineAnnotationSpec> {
  static defaultProps: Partial<LineAnnotationSpec> = {
    chartType: ChartTypes.XYAxis,
    specType: SpecTypes.Annotation,
    groupId: DEFAULT_GLOBAL_ID,
    annotationType: AnnotationTypes.Line,
    style: DEFAULT_ANNOTATION_LINE_STYLE,
    hideLines: false,
    hideTooltips: false,
    hideLinesTooltips: true,
    zIndex: 1,
  };

  private markerRef = createRef<HTMLDivElement>();

  componentDidMount() {
    const { children, upsertSpec, removeSpec, ...config } = this.props as InjectedProps;
    if (this.markerRef.current) {
      const { offsetWidth, offsetHeight } = this.markerRef.current;
      config.markerDimensions = {
        width: offsetWidth,
        height: offsetHeight,
      };
    }
    upsertSpec({ ...config });
  }

  shouldComponentUpdate(nextProps: LineAnnotationSpec) {
    return !deepEqual(this.props, nextProps);
  }

  componentDidUpdate() {
    const { upsertSpec, removeSpec, children, ...config } = this.props as InjectedProps;
    if (this.markerRef.current) {
      const { offsetWidth, offsetHeight } = this.markerRef.current;
      config.markerDimensions = {
        width: offsetWidth,
        height: offsetHeight,
      };
    }
    upsertSpec({ ...config });
  }
  componentWillUnmount() {
    const { removeSpec, id } = this.props as InjectedProps;
    removeSpec(id);
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

interface DispatchProps {
  upsertSpec: (spec: Spec) => void;
  removeSpec: (id: string) => void;
}
const mapDispatchToProps = (dispatch: Dispatch): DispatchProps =>
  bindActionCreators(
    {
      upsertSpec,
      removeSpec,
    },
    dispatch,
  );

type SpecRequiredProps = Pick<LineAnnotationSpec, 'id' | 'dataValues' | 'domainType'>;
type SpecOptionalProps = Partial<
  Omit<
    LineAnnotationSpec,
    'chartType' | 'specType' | 'seriesType' | 'id' | 'dataValues' | 'domainType' | 'annotationType'
  >
>;

export const LineAnnotation: React.FunctionComponent<SpecRequiredProps & SpecOptionalProps> = connect<
  {},
  DispatchProps,
  LineAnnotationSpec
>(
  null,
  mapDispatchToProps,
)(LineAnnotationSpecComponent);
