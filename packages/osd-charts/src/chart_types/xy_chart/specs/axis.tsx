import { inject } from 'mobx-react';
import { PureComponent } from 'react';
import { AxisSpec as AxisSpecType, Position, DEFAULT_GLOBAL_ID } from '../utils/specs';
import { getGroupId } from '../../../utils/ids';
import { SpecProps } from '../../../specs/specs_parser';

type AxisSpecProps = SpecProps & AxisSpecType;

class AxisSpec extends PureComponent<AxisSpecProps> {
  static defaultProps: Partial<AxisSpecProps> = {
    groupId: getGroupId(DEFAULT_GLOBAL_ID),
    hide: false,
    showOverlappingTicks: false,
    showOverlappingLabels: false,
    position: Position.Left,
    tickSize: 10,
    tickPadding: 10,
    tickFormat: (tick: any) => `${tick}`,
    tickLabelRotation: 0,
  };
  componentDidMount() {
    const { chartStore, children, ...spec } = this.props;
    chartStore!.addAxisSpec({ ...spec });
  }
  componentDidUpdate() {
    const { chartStore, children, ...spec } = this.props;
    chartStore!.addAxisSpec({ ...spec });
  }
  componentWillUnmount() {
    const { id } = this.props;
    this.props.chartStore!.removeAxisSpec(id);
  }
  render() {
    return null;
  }
}

export const Axis = inject('chartStore')(AxisSpec);
