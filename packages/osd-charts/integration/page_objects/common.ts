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

import Url from 'url';

import { JSDOM } from 'jsdom';
import { AXNode } from 'puppeteer';

import { DRAG_DETECTION_TIMEOUT } from '../../src/state/reducers/interactions';
// @ts-ignore
import defaults from '../defaults';
import { toMatchImageSnapshot } from '../jest_env_setup';

const port = process.env.PORT || defaults.PORT;
const host = process.env.HOST || defaults.HOST;
const baseUrl = `http://${host}:${port}/iframe.html`;

// Use to log console statements from within the page.evaluate blocks
// @ts-ignore
// page.on('console', (msg) => (msg._type === 'log' ? console.log('PAGE LOG:', msg._text) : null)); // eslint-disable-line no-console

expect.extend({ toMatchImageSnapshot });

interface MousePosition {
  /**
   * position from top of reference element, trumps bottom
   */
  top?: number;
  /**
   * position from right of reference element
   */
  right?: number;
  /**
   * position from bottom of reference element
   */
  bottom?: number;
  /**
   * position from left of reference element, trump right
   */
  left?: number;
}

interface ElementBBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface KeyboardKey {
  key: string;
  count: number;
}

type KeyboardKeys = Array<KeyboardKey>;

/**
 * Used to get postion from any value of cursor position
 *
 * @param mousePosition
 * @param element
 */
function getCursorPosition(
  { top, right, bottom, left }: MousePosition,
  element: ElementBBox,
): { x: number; y: number } {
  let x = element.left;
  let y = element.top;

  if (top !== undefined || bottom !== undefined) {
    y = top !== undefined ? element.top + top : element.top + element.height - bottom!;
  }

  if (left !== undefined || right !== undefined) {
    x = left !== undefined ? element.left + left : element.left + element.width - right!;
  }

  return { x, y };
}

interface ScreenshotDOMElementOptions {
  padding?: number;
  path?: string;
  /**
   * Screenshot selector override. Used to select beyond set element.
   */
  hiddenSelectors?: string[];
  /**
   * Pauses just before taking screenshot to debug dom
   *
   * To continue:
   *  - resume script execution in dev tools
   *  - press enter in the terminal running the jest tests
   *
   * **Only triggered when `process.env.DEBUG` is true**
   */
  debug?: boolean;
}

type ScreenshotElementAtUrlOptions = ScreenshotDOMElementOptions & {
  /**
   * timeout for waiting on element to appear in DOM
   *
   * @defaultValue 10000
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
  /**
   * Screenshot selector override. Used to select beyond set element.
   */
  screenshotSelector?: string;
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
   * Toggle element visibility
   * @param selector
   */
  async toggleElementVisibility(selector: string) {
    await page.$$eval(selector, (elements) => {
      elements.forEach((element) => {
        element.classList.toggle('echInvisible');
      });
    });
  }

  /**
   * Get getBoundingClientRect of selected element
   *
   * @param selector
   */
  async getBoundingClientRect(selector: string) {
    return await page.$eval(selector, (element) => {
      const { x, y, width, height } = element.getBoundingClientRect();
      return { left: x, top: y, width, height, id: element.id };
    });
  }

  /**
   * Capture screenshot of selected element only
   *
   * @param selector
   * @param options
   */
  async screenshotDOMElement(selector: string, options?: ScreenshotDOMElementOptions): Promise<Buffer> {
    const padding: number = options && options.padding ? options.padding : 0;
    const path: string | undefined = options && options.path ? options.path : undefined;
    const rect = await this.getBoundingClientRect(selector);

    if (options?.hiddenSelectors) {
      await Promise.all(options.hiddenSelectors.map(this.toggleElementVisibility));
    }

    if (options?.debug && process.env.DEBUG === 'true') {
      await jestPuppeteer.debug();
    }

    const buffer = await page.screenshot({
      path,
      clip: {
        x: rect.left - padding,
        y: rect.top - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      },
    });

    if (options?.hiddenSelectors) {
      await Promise.all(options.hiddenSelectors.map(this.toggleElementVisibility));
    }

    return buffer;
  }

  /**
   * Move mouse
   * @param mousePosition
   * @param selector
   */
  async moveMouse(x: number, y: number) {
    await page.mouse.move(x, y);
  }

  /**
   * Move mouse relative to element
   *
   * @param mousePosition
   * @param selector
   */
  async moveMouseRelativeToDOMElement(mousePosition: MousePosition, selector: string) {
    const element = await this.getBoundingClientRect(selector);
    const { x, y } = getCursorPosition(mousePosition, element);
    await this.moveMouse(x, y);
  }

  /**
   * Click mouse relative to element
   *
   * @param mousePosition
   * @param selector
   */
  async clickMouseRelativeToDOMElement(mousePosition: MousePosition, selector: string) {
    const element = await this.getBoundingClientRect(selector);
    const { x, y } = getCursorPosition(mousePosition, element);
    await page.mouse.click(x, y);
  }

  /**
   * Drag mouse relative to element
   *
   * @param mousePosition
   * @param selector
   */
  async dragMouseRelativeToDOMElement(start: MousePosition, end: MousePosition, selector: string) {
    const element = await this.getBoundingClientRect(selector);
    const { x: x0, y: y0 } = getCursorPosition(start, element);
    const { x: x1, y: y1 } = getCursorPosition(end, element);
    await this.moveMouse(x0, y0);
    await page.mouse.down();
    await page.waitFor(DRAG_DETECTION_TIMEOUT);
    await this.moveMouse(x1, y1);
  }

  /**
   * Drop mouse
   *
   * @param mousePosition
   * @param selector
   */
  async dropMouse() {
    await page.mouse.up();
  }

  /**
   * Press keyboard keys
   * @param count
   * @param key
   */
  // eslint-disable-next-line class-methods-use-this
  async pressKey(key: string, count: number) {
    if (key === 'tab') {
      let i = 0;
      while (i < count) {
        // eslint-disable-next-line eslint-comments/disable-enable-pair
        /* eslint-disable no-await-in-loop */
        await page.keyboard.press('Tab');
        i++;
      }
    } else if (key === 'enter') {
      let i = 0;
      while (i < count) {
        await page.keyboard.press('Enter');
        i++;
      }
    }
  }

  /**
   * Drag and drop mouse relative to element
   *
   * @param mousePosition
   * @param selector
   */
  async dragAndDropMouseRelativeToDOMElement(start: MousePosition, end: MousePosition, selector: string) {
    await this.dragMouseRelativeToDOMElement(start, end, selector);
    await this.dropMouse();
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

      const element = await this.screenshotDOMElement(options?.screenshotSelector ?? selector, options);

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
    mousePosition: MousePosition,
    options?: Omit<ScreenshotElementAtUrlOptions, 'action'>,
  ) {
    const action = async () => await this.moveMouseRelativeToDOMElement(mousePosition, this.chartSelector);
    await this.expectChartAtUrlToMatchScreenshot(url, {
      ...options,
      action,
    });
  }

  /**
   * Expect a chart given a url from storybook with keyboard events
   * @param url
   * @param keyboardEvents
   * @param options
   */
  async expectChartWithKeyboardEventsAtUrlToMatchScreenshot(
    url: string,
    keyboardEvents: KeyboardKeys,
    options?: Omit<ScreenshotElementAtUrlOptions, 'action'>,
  ) {
    const action = async () => {
      // click to focus within the chart
      await this.clickMouseRelativeToDOMElement({ top: 0, left: 0 }, this.chartSelector);
      // eslint-disable-next-line no-restricted-syntax
      for (const actions of keyboardEvents) {
        await this.pressKey(actions.key, actions.count);
      }
      await this.moveMouseRelativeToDOMElement({ top: 0, left: 0 }, this.chartSelector);
    };

    await this.expectChartAtUrlToMatchScreenshot(url, {
      ...options,
      action,
    });
  }

  /**
   * Expect a chart given a url from storybook with mouse move
   *
   * @param url Storybook url from knobs section
   * @param start - the start postion of mouse relative to chart
   * @param end - the end postion of mouse relative to chart
   * @param options
   */
  async expectChartWithDragAtUrlToMatchScreenshot(
    url: string,
    start: MousePosition,
    end: MousePosition,
    options?: Omit<ScreenshotElementAtUrlOptions, 'action'>,
  ) {
    const action = async () => await this.dragMouseRelativeToDOMElement(start, end, this.chartSelector);
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

    // activate peripheral visibility
    await page.evaluate(() => {
      document.querySelector('html')!.classList.add('echVisualTesting');
    });
  }

  /**
   * Wait for an element to be on the DOM
   *
   * @param {string} [waitSelector] the DOM selector to wait for, default to '.echChartStatus[data-ech-render-complete=true]'
   * @param {number} [timeout] - the timeout for the operation, default to 10000ms
   */
  async waitForElement(waitSelector: string, timeout = 10000) {
    await page.waitForSelector(waitSelector, { timeout });
  }

  /**
   * puppeteer accessibility functionality
   * @param {string} [url]
   * @param {string} [waitSelector]
   */
  async testAccessibilityTree(url: string, waitSelector: string): Promise<AXNode> {
    await this.loadElementFromURL(url, waitSelector);
    const accessibilitySnapshot = await page.accessibility.snapshot().then((value) => {
      return value;
    });
    return accessibilitySnapshot;
  }

  /**
   * Get HTML for element to test aria labels etc
   */
  // eslint-disable-next-line class-methods-use-this
  async getSelectorHTML(url: string, tagName: string) {
    await this.loadElementFromURL(url, '.echCanvasRenderer');
    const xml = await page.evaluate(() => new XMLSerializer().serializeToString(document));
    return new JSDOM(xml, { contentType: 'text/xml' }).window.document.getElementsByTagName(tagName);
  }
}

export const common = new CommonPage();
