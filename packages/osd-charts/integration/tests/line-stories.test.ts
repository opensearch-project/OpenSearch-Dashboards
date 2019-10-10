import { common } from '../page_objects';

describe('Line series stories', () => {
  describe('rotation', () => {
    it('rotation - 0', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/line-chart--ordinal-w-axis&knob-chartRotation=0',
      );
    });
    it('rotation - 90', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/line-chart--ordinal-w-axis&knob-chartRotation=90',
      );
    });
    it('rotation - negative 90', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/line-chart--ordinal-w-axis&knob-chartRotation=-90',
      );
    });
    it('rotation - 180', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/line-chart--ordinal-w-axis&knob-chartRotation=180',
      );
    });
  });
});
