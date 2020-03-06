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

import Url from 'url';

import { JEST_TIMEOUT, toMatchImageSnapshot } from '../jest_env_setup';
// @ts-ignore
import defaults from '../defaults';

const port = process.env.PORT || defaults.PORT;
const host = process.env.HOST || defaults.HOST;
const baseUrl = `http://${host}:${port}/iframe.html`;

expect.extend({ toMatchImageSnapshot });

interface ScreenshotDOMElementOptions {
  padding?: number;
  path?: string;
}

type ScreenshotElementAtUrlOptions = ScreenshotDOMElementOptions & {
  /**
   * timeout for waiting on element to appear in DOM
   *
   * @default JEST_TIMEOUT
   */
  timeout?: number;
  /**
   * any desired action to be performed after loading url, prior to screenshot
   */
  action?: () => void | Promise<void>;
  /**
   * Selector used to wait on DOM element
   */
  waitSelector?: string;
  /**
   * Delay to take screenshot after element is visiable
   */
  delay?: number;
};

class CommonPage {
  readonly chartWaitSelector = '.echChartStatus[data-ech-render-complete=true]';
  readonly chartSelector = '.echChart';

  /**
   * Parse url from knob storybook url to iframe storybook url
   *
   * @param url
   */
  static parseUrl(url: string): string {
    const { query } = Url.parse(url);

    return `${baseUrl}?${query}${query ? '&' : ''}knob-debug=false`;
  }

  /**
   * Get getBoundingClientRect of selected element
   *
   * @param selector
   */
  async getBoundingClientRect(selector: string) {
    return await page.evaluate((selector) => {
      const element = document.querySelector(selector);

      if (!element) {
        throw Error(`Could not find element that matches selector: ${selector}.`);
      }

      const { x, y, width, height } = element.getBoundingClientRect();

      return { left: x, top: y, width, height, id: element.id };
    }, selector);
  }

  /**
   * Capture screenshot of selected element only
   *
   * @param selector
   * @param options
   */
  async screenshotDOMElement(selector: string, options?: ScreenshotDOMElementOptions) {
    const padding: number = options && options.padding ? options.padding : 0;
    const path: string | undefined = options && options.path ? options.path : undefined;
    const rect = await this.getBoundingClientRect(selector);

    return page.screenshot({
      path,
      clip: {
        x: rect.left - padding,
        y: rect.top - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      },
    });
  }

  /**
   * Move mouse relative to element
   *
   * @param mousePosition
   * @param selector
   */
  async moveMouseRelativeToDOMElement(mousePosition: { x: number; y: number }, selector: string) {
    const element = await this.getBoundingClientRect(selector);
    await page.mouse.move(element.left + mousePosition.x, element.top + mousePosition.y);
  }

  /**
   * Click mouse relative to element
   *
   * @param mousePosition
   * @param selector
   */
  async clickMouseRelativeToDOMElement(mousePosition: { x: number; y: number }, selector: string) {
    const element = await this.getBoundingClientRect(selector);
    await page.mouse.click(element.left + mousePosition.x, element.top + mousePosition.y);
  }

  /**
   * Expect an element given a url and selector from storybook
   *
   * - Note: No need to fix host or port. They will be set automatically.
   *
   * @param url Storybook url from knobs section
   * @param selector selector of element to screenshot
   * @param options
   */
  async expectElementAtUrlToMatchScreenshot(
    url: string,
    selector: string = 'body',
    options?: ScreenshotElementAtUrlOptions,
  ) {
    try {
      await this.loadElementFromURL(url, options?.waitSelector ?? selector, options?.timeout);

      if (options?.action) {
        await options.action();
      }

      if (options?.delay) {
        await page.waitFor(options.delay);
      }

      const element = await this.screenshotDOMElement(selector, options);

      if (!element) {
        throw new Error(`Error: Unable to find element\n\n\t${url}`);
      }

      expect(element).toMatchImageSnapshot();
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   * Expect a chart given a url from storybook
   *
   * @param url Storybook url from knobs section
   * @param options
   */
  async expectChartAtUrlToMatchScreenshot(url: string, options?: ScreenshotElementAtUrlOptions) {
    await this.expectElementAtUrlToMatchScreenshot(url, this.chartSelector, {
      waitSelector: this.chartWaitSelector,
      ...options,
    });
  }

  /**
   * Expect a chart given a url from storybook with mouse move
   *
   * @param url Storybook url from knobs section
   * @param mousePosition - postion of mouse relative to chart
   * @param options
   */
  async expectChartWithMouseAtUrlToMatchScreenshot(
    url: string,
    mousePosition: { x: number; y: number },
    options?: Omit<ScreenshotElementAtUrlOptions, 'action'>,
  ) {
    const action = async () => await this.moveMouseRelativeToDOMElement(mousePosition, this.chartSelector);
    await this.expectChartAtUrlToMatchScreenshot(url, {
      ...options,
      action,
    });
  }

  /**
   * Loads storybook page from raw url, and waits for element
   *
   * @param url Storybook url from knobs section
   * @param waitSelector selector of element to wait to appear in DOM
   * @param timeout timeout for waiting on element to appear in DOM
   */
  async loadElementFromURL(url: string, waitSelector?: string, timeout?: number) {
    const cleanUrl = CommonPage.parseUrl(url);
    await page.goto(cleanUrl);

    if (waitSelector) {
      await this.waitForElement(waitSelector, timeout);
    }
  }

  /**
   * Wait for an element to be on the DOM
   *
   * @param {string} [waitSelector] the DOM selector to wait for, default to '.echChartStatus[data-ech-render-complete=true]'
   * @param {number} [timeout] - the timeout for the operation, default to 10000ms
   */
  async waitForElement(waitSelector: string, timeout = JEST_TIMEOUT) {
    await page.waitForSelector(waitSelector, { timeout });
  }
}

export const common = new CommonPage();
