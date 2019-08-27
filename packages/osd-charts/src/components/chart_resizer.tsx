import { inject, observer } from 'mobx-react';
import React, { RefObject } from 'react';
import ResizeObserver from 'resize-observer-polyfill';
import { debounce } from 'ts-debounce';
import { ChartStore } from '../chart_types/xy_chart/store/chart_state';

interface ResizerProps {
  chartStore?: ChartStore;
}
class Resizer extends React.Component<ResizerProps> {
  private initialResizeComplete = false;
  private containerRef: RefObject<HTMLDivElement>;
  private ro: ResizeObserver;
  private onResizeDebounced: (entries: ResizeObserverEntry[]) => void = () => {};

  constructor(props: ResizerProps) {
    super(props);
    this.containerRef = React.createRef();
    this.ro = new ResizeObserver(this.handleResize);
  }

  componentDidMount() {
    this.onResizeDebounced = debounce(this.onResize, this.props.chartStore!.resizeDebounce);
    this.ro.observe(this.containerRef.current as Element);
  }

  componentWillUnmount() {
    this.ro.unobserve(this.containerRef.current as Element);
  }

  onResize = (entries: ResizeObserverEntry[]) => {
    entries.forEach(({ contentRect: { width, height } }) => {
      this.props.chartStore!.updateParentDimensions(width, height, 0, 0);
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

export const ChartResizer = inject('chartStore')(observer(Resizer));
