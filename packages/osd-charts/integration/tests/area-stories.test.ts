import { common } from '../page_objects';

describe('Area series stories', () => {
  it('stacked as NOT percentage', async () => {
    await common.expectChartAtUrlToMatchScreenshot(
      'http://localhost:9001/?path=/story/area-chart--stacked-as-percentage&knob-stacked as percentage=',
    );
  });
  describe('accessorFormats', () => {
    it('should show custom format', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/area-chart--band-area-chart&knob-scale to extent=&knob-y0AccessorFormat= [min]&knob-y1AccessorFormat= [max]',
      );
    });
  });
  describe('scale to extents', () => {
    describe('scaleyScaleToDataExtent is true', () => {
      it('should show correct extents - Banded', async () => {
        await common.expectChartAtUrlToMatchScreenshot(
          'http://localhost:9001/?path=/story/area-chart--stacked-band-area-chart&knob-scale to extent=true',
        );
      });
      it('should show correct extents - stacked', async () => {
        await common.expectChartAtUrlToMatchScreenshot(
          'http://localhost:9001/?path=/story/area-chart--stacked-band-area-chart&knob-scale to extent=true',
        );
      });
    });
    describe('scaleyScaleToDataExtent is false', () => {
      it('should show correct extents - Banded', async () => {
        await common.expectChartAtUrlToMatchScreenshot(
          'http://localhost:9001/?path=/story/area-chart--stacked-band-area-chart&knob-scale to extent=false',
        );
      });
      it('should show correct extents - stacked', async () => {
        await common.expectChartAtUrlToMatchScreenshot(
          'http://localhost:9001/?path=/story/area-chart--stacked-band-area-chart&knob-scale to extent=false',
        );
      });
    });
  });
});
