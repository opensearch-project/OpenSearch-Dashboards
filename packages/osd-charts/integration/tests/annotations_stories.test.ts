import { common } from '../page_objects';

describe('Annotations stories', () => {
  describe('rotation', () => {
    it('rotation - 0', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/annotations--test-line-annotation-single-value-histogram&knob-debug=&knob-chartRotation=0',
      );
    });
    it('rotation - 90', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/annotations--test-line-annotation-single-value-histogram&knob-debug=&knob-chartRotation=90',
      );
    });
    it('rotation - negative 90', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/annotations--test-line-annotation-single-value-histogram&knob-debug=&knob-chartRotation=-90',
      );
    });
    it('rotation - 180', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/annotations--test-line-annotation-single-value-histogram&knob-debug=&knob-chartRotation=180',
      );
    });
  });
});
