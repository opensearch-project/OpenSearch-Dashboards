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
 * under the License. */

import { common } from '../page_objects';
import { Fit } from '../../src';

describe('Mixed series stories', () => {
  describe('Fitting functions', () => {
    describe('Area charts - no endValue', () => {
      Object.values(Fit).forEach((fitType) => {
        it(`should display correct fit for type - ${fitType}`, async () => {
          await common.expectChartAtUrlToMatchScreenshot(
            `http://localhost:9001/?path=/story/mixed-charts--fitting-functions-non-stacked-series&knob-seriesType=area&knob-dataset=all&knob-fitting function=${fitType}&knob-Curve=0&knob-End value=none&knob-Explicit valuve (using Fit.Explicit)=8`,
          );
        });
      });
    });

    describe('Area charts - endValue set to 2', () => {
      Object.values(Fit).forEach((fitType) => {
        it(`should display correct fit for type - ${fitType}`, async () => {
          await common.expectChartAtUrlToMatchScreenshot(
            `http://localhost:9001/?path=/story/mixed-charts--fitting-functions-non-stacked-series&knob-seriesType=area&knob-dataset=all&knob-fitting function=${fitType}&knob-Curve=0&knob-End value=2&knob-Explicit valuve (using Fit.Explicit)=8`,
          );
        });
      });
    });

    describe('Area charts - endValue set to "nearest"', () => {
      Object.values(Fit).forEach((fitType) => {
        it(`should display correct fit for type - ${fitType}`, async () => {
          await common.expectChartAtUrlToMatchScreenshot(
            `http://localhost:9001/?path=/story/mixed-charts--fitting-functions-non-stacked-series&knob-seriesType=area&knob-dataset=all&knob-fitting function=${fitType}&knob-Curve=0&knob-End value=nearest&knob-Explicit valuve (using Fit.Explicit)=8`,
          );
        });
      });
    });

    describe('Area charts - with curved - endValue set to 2', () => {
      Object.values(Fit).forEach((fitType) => {
        it(`should display correct fit for type - ${fitType}`, async () => {
          await common.expectChartAtUrlToMatchScreenshot(
            `http://localhost:9001/?path=/story/mixed-charts--fitting-functions-non-stacked-series&knob-seriesType=area&knob-dataset=all&knob-fitting function=${fitType}&knob-Curve=1&knob-End value=2&knob-Explicit valuve (using Fit.Explicit)=8`,
          );
        });
      });
    });

    describe('Area charts - Ordinal dataset - no endValue', () => {
      Object.values(Fit).forEach((fitType) => {
        it(`should display correct fit for type - ${fitType}`, async () => {
          await common.expectChartAtUrlToMatchScreenshot(
            `http://localhost:9001/?path=/story/mixed-charts--fitting-functions-non-stacked-series&knob-seriesType=area&knob-dataset=ordinal&knob-fitting function=${fitType}&knob-Curve=0&knob-End value=none&knob-Explicit valuve (using Fit.Explicit)=8`,
          );
        });
      });
    });

    describe('Line charts - no endValue', () => {
      Object.values(Fit).forEach((fitType) => {
        it(`should display correct fit for type - ${fitType}`, async () => {
          await common.expectChartAtUrlToMatchScreenshot(
            `http://localhost:9001/?path=/story/mixed-charts--fitting-functions-non-stacked-series&knob-seriesType=line&knob-dataset=all&knob-fitting function=${fitType}&knob-Curve=0&knob-End value=none&knob-Explicit valuve (using Fit.Explicit)=8`,
          );
        });
      });
    });

    describe('Line charts - endValue set to 2', () => {
      Object.values(Fit).forEach((fitType) => {
        it(`should display correct fit for type - ${fitType}`, async () => {
          await common.expectChartAtUrlToMatchScreenshot(
            `http://localhost:9001/?path=/story/mixed-charts--fitting-functions-non-stacked-series&knob-seriesType=line&knob-dataset=all&knob-fitting function=${fitType}&knob-Curve=0&knob-End value=2&knob-Explicit valuve (using Fit.Explicit)=8`,
          );
        });
      });
    });

    describe('Line charts - with curve - endValue set to 2', () => {
      Object.values(Fit).forEach((fitType) => {
        it(`should display correct fit for type - ${fitType}`, async () => {
          await common.expectChartAtUrlToMatchScreenshot(
            `http://localhost:9001/?path=/story/mixed-charts--fitting-functions-non-stacked-series&knob-seriesType=line&knob-dataset=all&knob-fitting function=${fitType}&knob-Curve=1&knob-End value=2&knob-Explicit valuve (using Fit.Explicit)=8`,
          );
        });
      });
    });
  });
});
