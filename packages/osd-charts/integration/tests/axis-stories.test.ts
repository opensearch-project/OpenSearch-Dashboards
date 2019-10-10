import { common } from '../page_objects';

describe('Axis stories', () => {
  it('should render proper tick count', async () => {
    await common.expectChartAtUrlToMatchScreenshot(
      'http://localhost:9001/?path=/story/axis--basic&knob-Tick Label Padding=0&knob-debug=&knob-Bottom overlap labels=&knob-Bottom overlap ticks=true&knob-Number of ticks on bottom=20&knob-Left overlap labels=&knob-Left overlap ticks=true&knob-Number of ticks on left=10',
    );
  });
  it('should render proper tick count with showOverlappingLabels', async () => {
    await common.expectChartAtUrlToMatchScreenshot(
      'http://localhost:9001/?path=/story/axis--basic&knob-Tick Label Padding=0&knob-debug=&knob-Bottom overlap labels=true&knob-Bottom overlap ticks=true&knob-Number of ticks on bottom=20&knob-Left overlap labels=&knob-Left overlap ticks=true&knob-Number of ticks on left=10',
    );
  });
  it('should render ticks with varied rotations', async () => {
    await common.expectChartAtUrlToMatchScreenshot(
      'http://localhost:9001/?path=/story/axis--tick-label-rotation&knob-Tick Label Padding=0&knob-bottom axis tick label rotation=47&knob-hide bottom axis=&knob-left axis tick label rotation=-56&knob-hide left axis=&knob-top axis tick label rotation=-59&knob-hide top axis=&knob-right axis tick label rotation=30&knob-hide right axis=&knob-debug=',
    );
  });
  it('should hide bottom axis', async () => {
    await common.expectChartAtUrlToMatchScreenshot(
      'http://localhost:9001/?path=/story/axis--tick-label-rotation&knob-Tick Label Padding=0&knob-bottom axis tick label rotation=47&knob-hide bottom axis=true&knob-left axis tick label rotation=-56&knob-hide left axis=&knob-top axis tick label rotation=-59&knob-hide top axis=&knob-right axis tick label rotation=30&knob-hide right axis=&knob-debug=',
    );
  });
  it('should hide top axis', async () => {
    await common.expectChartAtUrlToMatchScreenshot(
      'http://localhost:9001/?path=/story/axis--tick-label-rotation&knob-Tick Label Padding=0&knob-bottom axis tick label rotation=47&knob-hide bottom axis=&knob-left axis tick label rotation=-56&knob-hide left axis=&knob-top axis tick label rotation=-59&knob-hide top axis=true&knob-right axis tick label rotation=30&knob-hide right axis=&knob-debug=',
    );
  });
  it('should hide left axis', async () => {
    await common.expectChartAtUrlToMatchScreenshot(
      'http://localhost:9001/?path=/story/axis--tick-label-rotation&knob-Tick Label Padding=0&knob-bottom axis tick label rotation=47&knob-hide bottom axis=&knob-left axis tick label rotation=-56&knob-hide left axis=true&knob-top axis tick label rotation=-59&knob-hide top axis=&knob-right axis tick label rotation=30&knob-hide right axis=&knob-debug=',
    );
  });
  it('should hide right axis', async () => {
    await common.expectChartAtUrlToMatchScreenshot(
      'http://localhost:9001/?path=/story/axis--tick-label-rotation&knob-Tick Label Padding=0&knob-bottom axis tick label rotation=47&knob-hide bottom axis=&knob-left axis tick label rotation=-56&knob-hide left axis=&knob-top axis tick label rotation=-59&knob-hide top axis=&knob-right axis tick label rotation=30&knob-hide right axis=true&knob-debug=',
    );
  });
  it('should render tick padding', async () => {
    await common.expectChartAtUrlToMatchScreenshot(
      'http://localhost:9001/?path=/story/axis--w-many-tick-labels&knob-Tick Label Padding=60',
    );
  });
  it('should render with domain constraints', async () => {
    await common.expectChartAtUrlToMatchScreenshot(
      'http://localhost:9001/?path=/story/axis--customizing-domain-limits-only-one-bound-defined&knob-left min=2&knob-xDomain max=2',
    );
  });
});
