import React, { RefObject } from 'react';
import ResizeObserver from 'resize-observer-polyfill';
import { debounce } from 'ts-debounce';
import { Dimensions } from '../utils/dimensions';
import { updateParentDimensions } from '../state/actions/chart_settings';
import { Dispatch, bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { getSettingsSpecSelector } from '../state/selectors/get_settings_specs';
import { GlobalChartState } from '../state/chart_state';

interface ResizerStateProps {
  resizeDebounce: number;
}

interface ResizerDispatchProps {
  updateParentDimensions(dimension: Dimensions): void;
}

type ResizerProps = ResizerStateProps & ResizerDispatchProps;

class Resizer extends React.Component<ResizerProps> {
  private initialResizeComplete = false;
  private containerRef: RefObject<HTMLDivElement>;
  private ro: ResizeObserver;
  private animationFrameID: number | null;
  private onResizeDebounced: (entries: ResizeObserverEntry[]) => void = () => undefined;

  constructor(props: ResizerProps) {
    super(props);
    this.containerRef = React.createRef();
    this.ro = new ResizeObserver(this.handleResize);
    this.animationFrameID = null;
  }

  componentDidMount() {
    this.onResizeDebounced = debounce(this.onResize, this.props.resizeDebounce);
    if (this.containerRef.current) {
      const { clientWidth, clientHeight } = this.containerRef.current;
      this.props.updateParentDimensions({ width: clientWidth, height: clientHeight, top: 0, left: 0 });
    }
    this.ro.observe(this.containerRef.current as Element);
  }

  componentWillUnmount() {
    if (this.animationFrameID) {
      window.cancelAnimationFrame(this.animationFrameID);
    }
    this.ro.disconnect();
  }

  onResize = (entries: ResizeObserverEntry[]) => {
    if (!Array.isArray(entries)) {
      return;
    }
    if (!entries.length || !entries[0]) {
      return;
    }
    const { width, height } = entries[0].contentRect;
    this.animationFrameID = window.requestAnimationFrame(() => {
      this.props.updateParentDimensions({ width, height, top: 0, left: 0 });
    });
  };

  render() {
    return <div ref={this.containerRef} className="echChartResizer" />;
  }

  private handleResize = (entries: ResizeObserverEntry[]) => {
    if (this.initialResizeComplete) {
      this.onResizeDebounced(entries);
    } else {
      this.initialResizeComplete = true;
      this.onResize(entries);
    }
  };
}

const mapDispatchToProps = (dispatch: Dispatch): ResizerDispatchProps =>
  bindActionCreators(
    {
      updateParentDimensions,
    },
    dispatch,
  );

const mapStateToProps = (state: GlobalChartState): ResizerStateProps => {
  const settings = getSettingsSpecSelector(state);
  const resizeDebounce =
    settings.resizeDebounce === undefined || settings.resizeDebounce === null ? 200 : settings.resizeDebounce;
  return {
    resizeDebounce,
  };
};

export const ChartResizer = connect(mapStateToProps, mapDispatchToProps)(Resizer);
