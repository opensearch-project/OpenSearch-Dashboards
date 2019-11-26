import React from 'react';
import { connect } from 'react-redux';
import { GlobalChartState } from '../state/chart_state';
import { getSettingsSpecSelector } from '../state/selectors/get_settings_specs';
import { RenderChangeListener } from '../specs';

interface ChartStatusStateProps {
  rendered: boolean;
  renderedCount: number;
  onRenderChange?: RenderChangeListener;
}
class ChartStatusComponent extends React.Component<ChartStatusStateProps> {
  componentDidMount() {
    this.dispatchRenderChange();
  }
  componentDidUpdate() {
    this.dispatchRenderChange();
  }
  dispatchRenderChange = () => {
    const { onRenderChange, rendered } = this.props;
    if (onRenderChange) {
      onRenderChange(rendered);
    }
  };
  render() {
    const { rendered, renderedCount } = this.props;
    return <div className="echChartStatus" data-ech-render-complete={rendered} data-ech-render-count={renderedCount} />;
  }
}

const mapStateToProps = (state: GlobalChartState): ChartStatusStateProps => {
  return {
    rendered: state.chartRendered,
    renderedCount: state.chartRenderedCount,
    onRenderChange: getSettingsSpecSelector(state).onRenderChange,
  };
};

export const ChartStatus = connect(mapStateToProps)(ChartStatusComponent);
