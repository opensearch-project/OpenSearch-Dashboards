import { common } from '../page_objects';

describe.only('Tooltips', () => {
  describe('rotation 0', () => {
    it('shows tooltip on first x value - top', async () => {
      await common.expectChartWithMouseAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/bar-chart--test-tooltip-and-rotation',
        {
          x: 160,
          y: 25,
        },
      );
    });
    it('shows tooltip on last x value - top', async () => {
      await common.expectChartWithMouseAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/bar-chart--test-tooltip-and-rotation',
        {
          x: 660,
          y: 25,
        },
      );
    });
    it('shows tooltip on first x value - bottom', async () => {
      await common.expectChartWithMouseAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/bar-chart--test-tooltip-and-rotation',
        {
          x: 160,
          y: 280,
        },
      );
    });
    it('shows tooltip on last x value - bottom', async () => {
      await common.expectChartWithMouseAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/bar-chart--test-tooltip-and-rotation',
        {
          x: 660,
          y: 280,
        },
      );
    });
  });
  describe('rotation 90', () => {
    it('shows tooltip on first x value - top', async () => {
      await common.expectChartWithMouseAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/bar-chart--test-tooltip-and-rotation&knob-chartRotation=90',
        {
          x: 125,
          y: 50,
        },
      );
    });
    it('shows tooltip on last x value - top', async () => {
      await common.expectChartWithMouseAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/bar-chart--test-tooltip-and-rotation&knob-chartRotation=90',
        {
          x: 700,
          y: 50,
        },
      );
    });
    it('shows tooltip on first x value - bottom', async () => {
      await common.expectChartWithMouseAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/bar-chart--test-tooltip-and-rotation&knob-chartRotation=90',
        {
          x: 125,
          y: 270,
        },
      );
    });
    it('shows tooltip on last x value - bottom', async () => {
      await common.expectChartWithMouseAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/bar-chart--test-tooltip-and-rotation&knob-chartRotation=90',
        {
          x: 700,
          y: 270,
        },
      );
    });
  });
});
