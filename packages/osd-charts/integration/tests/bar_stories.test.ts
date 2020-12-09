/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { DisplayValueStyle, HorizontalAlignment, Rotation, VerticalAlignment } from '../../src';
import { common } from '../page_objects';

describe('Bar series stories', () => {
  describe('[test] axis positions with histogram bar series', () => {
    [0, 90, -90, 180].forEach((rotation) => {
      it(`Should render correct axis - rotation ${rotation === -90 ? 'negative 90' : rotation}`, async () => {
        await common.expectChartAtUrlToMatchScreenshot(
          `http://localhost:9001/?path=/story/interactions--brush-selection-tool-on-histogram-time-charts&knob-debug=&knob-chartRotation=${rotation}`,
        );
      });
    });
  });

  describe('[test] switch ordinal/linear x axis', () => {
    it('using ordinal x axis', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/bar-chart--test-switch-ordinal-linear-axis&knob-scaleType=ordinal',
      );
    });
  });

  describe('[test] discover', () => {
    it('using no custom minInterval', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/bar-chart--test-discover&knob-use custom minInterval of 30s=',
      );
    });
  });

  describe('[test] histogram mode (linear)', () => {
    describe('enableHistogramMode is true', () => {
      it('rotation - 0', async () => {
        await common.expectChartAtUrlToMatchScreenshot(
          'http://localhost:9001/?path=/story/bar-chart--test-histogram-mode-linear&knob-chartRotation=0&knob-bars padding=0.25&knob-histogram padding=0.05&knob-other series=line&knob-point series alignment=center&knob-hasHistogramBarSeries=&knob-debug=true&knob-bars-1 enableHistogramMode=true&knob-bars-2 enableHistogramMode=',
        );
      });
      it('rotation - 90', async () => {
        await common.expectChartAtUrlToMatchScreenshot(
          'http://localhost:9001/?path=/story/bar-chart--test-histogram-mode-linear&knob-chartRotation=90&knob-bars padding=0.25&knob-histogram padding=0.05&knob-other series=line&knob-point series alignment=center&knob-hasHistogramBarSeries=&knob-debug=true&knob-bars-1 enableHistogramMode=true&knob-bars-2 enableHistogramMode=',
        );
      });
      it('rotation - negative 90', async () => {
        await common.expectChartAtUrlToMatchScreenshot(
          'http://localhost:9001/?path=/story/bar-chart--test-histogram-mode-linear&knob-chartRotation=-90&knob-bars padding=0.25&knob-histogram padding=0.05&knob-other series=line&knob-point series alignment=center&knob-hasHistogramBarSeries=&knob-debug=true&knob-bars-1 enableHistogramMode=true&knob-bars-2 enableHistogramMode=',
        );
      });
      it('rotation - 180', async () => {
        await common.expectChartAtUrlToMatchScreenshot(
          'http://localhost:9001/?path=/story/bar-chart--test-histogram-mode-linear&knob-chartRotation=180&knob-bars padding=0.25&knob-histogram padding=0.05&knob-other series=line&knob-point series alignment=center&knob-hasHistogramBarSeries=&knob-debug=true&knob-bars-1 enableHistogramMode=true&knob-bars-2 enableHistogramMode=',
        );
      });
    });

    describe('enableHistogramMode is false', () => {
      it('rotation - 0', async () => {
        await common.expectChartAtUrlToMatchScreenshot(
          'http://localhost:9001/?path=/story/bar-chart--test-histogram-mode-linear&knob-chartRotation=0&knob-bars padding=0.25&knob-histogram padding=0.05&knob-other series=line&knob-point series alignment=center&knob-hasHistogramBarSeries=&knob-debug=true&knob-bars-1 enableHistogramMode=&knob-bars-2 enableHistogramMode=',
        );
      });
      it('rotation - 90', async () => {
        await common.expectChartAtUrlToMatchScreenshot(
          'http://localhost:9001/?path=/story/bar-chart--test-histogram-mode-linear&knob-chartRotation=90&knob-bars padding=0.25&knob-histogram padding=0.05&knob-other series=line&knob-point series alignment=center&knob-hasHistogramBarSeries=&knob-debug=true&knob-bars-1 enableHistogramMode=&knob-bars-2 enableHistogramMode=',
        );
      });
      it('rotation - negative 90', async () => {
        await common.expectChartAtUrlToMatchScreenshot(
          'http://localhost:9001/?path=/story/bar-chart--test-histogram-mode-linear&knob-chartRotation=-90&knob-bars padding=0.25&knob-histogram padding=0.05&knob-other series=line&knob-point series alignment=center&knob-hasHistogramBarSeries=&knob-debug=true&knob-bars-1 enableHistogramMode=&knob-bars-2 enableHistogramMode=',
        );
      });
      it('rotation - 180', async () => {
        await common.expectChartAtUrlToMatchScreenshot(
          'http://localhost:9001/?path=/story/bar-chart--test-histogram-mode-linear&knob-chartRotation=180&knob-bars padding=0.25&knob-histogram padding=0.05&knob-other series=line&knob-point series alignment=center&knob-hasHistogramBarSeries=&knob-debug=true&knob-bars-1 enableHistogramMode=&knob-bars-2 enableHistogramMode=',
        );
      });
    });

    describe('point alignment', () => {
      it('start', async () => {
        await common.expectChartAtUrlToMatchScreenshot(
          'http://localhost:9001/?path=/story/bar-chart--test-histogram-mode-linear&knob-chartRotation=-90&knob-bars padding=0.25&knob-histogram padding=0.05&knob-other series=area&knob-point series alignment=start&knob-hasHistogramBarSeries=true&knob-debug=true&knob-bars-1 enableHistogramMode=&knob-bars-2 enableHistogramMode=',
        );
      });
      it('center', async () => {
        await common.expectChartAtUrlToMatchScreenshot(
          'http://localhost:9001/?path=/story/bar-chart--test-histogram-mode-linear&knob-chartRotation=-90&knob-bars padding=0.25&knob-histogram padding=0.05&knob-other series=area&knob-point series alignment=center&knob-hasHistogramBarSeries=true&knob-debug=true&knob-bars-1 enableHistogramMode=&knob-bars-2 enableHistogramMode=',
        );
      });
      it('end', async () => {
        await common.expectChartAtUrlToMatchScreenshot(
          'http://localhost:9001/?path=/story/bar-chart--test-histogram-mode-linear&knob-chartRotation=-90&knob-bars padding=0.25&knob-histogram padding=0.05&knob-other series=area&knob-point series alignment=end&knob-hasHistogramBarSeries=true&knob-debug=true&knob-bars-1 enableHistogramMode=&knob-bars-2 enableHistogramMode=',
        );
      });
    });
  });

  describe('[test] histogram mode (ordinal)', () => {
    describe('enableHistogramMode is false, hasHistogramBarSeries is false', () => {
      it('rotation - 0', async () => {
        await common.expectChartAtUrlToMatchScreenshot(
          'http://localhost:9001/?path=/story/bar-chart--test-histogram-mode-ordinal&knob-chartRotation=0&knob-bars padding=0.25&knob-hasHistogramBarSeries=&knob-debug=true&knob-bars-1 enableHistogramMode=true&knob-bars-2 enableHistogramMode=',
        );
      });
      it('rotation - 90', async () => {
        await common.expectChartAtUrlToMatchScreenshot(
          'http://localhost:9001/?path=/story/bar-chart--test-histogram-mode-ordinal&knob-chartRotation=90&knob-bars padding=0.25&knob-hasHistogramBarSeries=&knob-debug=true&knob-bars-1 enableHistogramMode=true&knob-bars-2 enableHistogramMode=',
        );
      });
      it('rotation - negative 90', async () => {
        await common.expectChartAtUrlToMatchScreenshot(
          'http://localhost:9001/?path=/story/bar-chart--test-histogram-mode-ordinal&knob-chartRotation=-90&knob-bars padding=0.25&knob-hasHistogramBarSeries=&knob-debug=true&knob-bars-1 enableHistogramMode=true&knob-bars-2 enableHistogramMode=',
        );
      });
      it('rotation - 180', async () => {
        await common.expectChartAtUrlToMatchScreenshot(
          'http://localhost:9001/?path=/story/bar-chart--test-histogram-mode-ordinal&knob-chartRotation=180&knob-bars padding=0.25&knob-hasHistogramBarSeries=&knob-debug=true&knob-bars-1 enableHistogramMode=true&knob-bars-2 enableHistogramMode=',
        );
      });
    });

    describe('enableHistogramMode is true, hasHistogramBarSeries is true', () => {
      it('rotation - 0', async () => {
        await common.expectChartAtUrlToMatchScreenshot(
          'http://localhost:9001/?path=/story/bar-chart--test-histogram-mode-ordinal&knob-chartRotation=0&knob-bars padding=0.25&knob-hasHistogramBarSeries=true&knob-debug=true&knob-bars-1 enableHistogramMode=true&knob-bars-2 enableHistogramMode=',
        );
      });
      it('rotation - 90', async () => {
        await common.expectChartAtUrlToMatchScreenshot(
          'http://localhost:9001/?path=/story/bar-chart--test-histogram-mode-ordinal&knob-chartRotation=90&knob-bars padding=0.25&knob-hasHistogramBarSeries=true&knob-debug=true&knob-bars-1 enableHistogramMode=true&knob-bars-2 enableHistogramMode=',
        );
      });
      it('rotation - negative 90', async () => {
        await common.expectChartAtUrlToMatchScreenshot(
          'http://localhost:9001/?path=/story/bar-chart--test-histogram-mode-ordinal&knob-chartRotation=-90&knob-bars padding=0.25&knob-hasHistogramBarSeries=true&knob-debug=true&knob-bars-1 enableHistogramMode=true&knob-bars-2 enableHistogramMode=',
        );
      });
      it('rotation - 180', async () => {
        await common.expectChartAtUrlToMatchScreenshot(
          'http://localhost:9001/?path=/story/bar-chart--test-histogram-mode-ordinal&knob-chartRotation=180&knob-bars padding=0.25&knob-hasHistogramBarSeries=true&knob-debug=true&knob-bars-1 enableHistogramMode=true&knob-bars-2 enableHistogramMode=',
        );
      });
    });
  });

  describe('different groupId', () => {
    it('render different axis scale', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        `http://localhost:9001/?path=/story/bar-chart--dual-axis-same-y-domain&knob-Apply a different groupId to some series=true&knob-Use the same data domain for each group=`,
      );
    });

    it('render the same domain with useDefaultGroupDomain', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        `http://localhost:9001/?path=/story/bar-chart--dual-axis-same-y-domain&knob-Apply a different groupId to some series=true&knob-Use the same data domain for each group=true`,
      );
    });
  });

  describe('value labels positioning', () => {
    describe.each<[string, Rotation]>([
      ['0', 0],
      ['90', 90],
      ['180', 180],
      ['negative 90', -90],
    ])('rotation - %s', (_, rotation) => {
      describe.each<NonNullable<DisplayValueStyle['alignment']>['vertical']>([
        VerticalAlignment.Middle,
        VerticalAlignment.Top,
        VerticalAlignment.Bottom,
      ])('Vertical Alignment - %s', (verticalAlignment) => {
        describe.each<NonNullable<DisplayValueStyle['alignment']>['horizontal']>([
          HorizontalAlignment.Left,
          HorizontalAlignment.Center,
          HorizontalAlignment.Right,
        ])('Horizontal Alignment - %s', (horizontalAlignment) => {
          const url = `http://localhost:9001/?path=/story/bar-chart--with-value-label-advanced&knob-chartRotation=${rotation}&knob-Horizontal alignment=${horizontalAlignment}&knob-Vertical alignment=${verticalAlignment}`;
          it('place the value labels on the correct area', async () => {
            await common.expectChartAtUrlToMatchScreenshot(url);
          });
        });
      });
    });
  });

  describe('functional accessors', () => {
    it('functional accessors with fieldName', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/bar-chart--functional-accessors&knob-y fn name=testY&knob-split fn name=testSplit',
      );
    });

    it('functional accessors with fieldName - with tooltip', async () => {
      await common.expectChartWithMouseAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/bar-chart--functional-accessors&knob-y fn name=testY&knob-split fn name=testSplit',
        {
          top: 60,
          right: 180,
        },
        {
          screenshotSelector: 'body',
        },
      );
    });

    it('y1Accessors and y0Accessors', async () => {
      await common.expectChartAtUrlToMatchScreenshot(
        'http://localhost:9001/?path=/story/bar-chart--band-bar-chart&knob-fit Y domain=true&knob-use fn accessors=true',
      );
    });
  });
});
