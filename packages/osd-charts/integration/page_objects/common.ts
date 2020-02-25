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

class CommonPage {
  static parseUrl(url: string): string {
    const { query } = Url.parse(url);

    return `${baseUrl}?${query}${query ? '&' : ''}knob-debug=false`;
  }
  async getBoundingClientRect(selector = '.echChart') {
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
   * Capture screenshot or chart element only
   */
  async screenshotDOMElement(selector = '.echChart', opts?: ScreenshotDOMElementOptions) {
    const padding: number = opts && opts.padding ? opts.padding : 0;
    const path: string | undefined = opts && opts.path ? opts.path : undefined;
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

  async moveMouseRelativeToDOMElement(mousePosition: { x: number; y: number }, selector = '.echChart') {
    const chartContainer = await this.getBoundingClientRect(selector);
    await page.mouse.move(chartContainer.left + mousePosition.x, chartContainer.top + mousePosition.y);
  }

  /**
   * Expect a chart given a url from storybook.
   *
   * - Note: No need to fix host or port. They will be set automatically.
   *
   * @param url Storybook url from knobs section
   */
  async expectChartAtUrlToMatchScreenshot(url: string) {
    try {
      await this.loadChartFromURL(url);
      await this.waitForElement();

      const chart = await this.screenshotDOMElement();

      if (!chart) {
        throw new Error(`Error: Unable to find chart element\n\n\t${url}`);
      }

      expect(chart).toMatchImageSnapshot();
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   * Expect a chart given a url from storybook.
   *
   * - Note: No need to fix host or port. They will be set automatically.
   *
   * @param url Storybook url from knobs section
   */
  async expectChartWithMouseAtUrlToMatchScreenshot(url: string, mousePosition: { x: number; y: number }) {
    try {
      await this.loadChartFromURL(url);
      await this.waitForElement();
      await this.moveMouseRelativeToDOMElement(mousePosition);
      const chart = await this.screenshotDOMElement();
      if (!chart) {
        throw new Error(`Error: Unable to find chart element\n\n\t${url}`);
      }

      expect(chart).toMatchImageSnapshot();
    } catch (error) {
      throw new Error(`${error}\n\n${url}`);
    }
  }
  async loadChartFromURL(url: string) {
    const cleanUrl = CommonPage.parseUrl(url);
    await page.goto(cleanUrl);
    this.waitForElement();
  }
  /**
   * Wait for an element to be on the DOM
   * @param {string} [selector] the DOM selector to wait for, default to '.echChartStatus[data-ech-render-complete=true]'
   * @param {number} [timeout] - the timeout for the operation, default to 10000ms
   */
  async waitForElement(selector = '.echChartStatus[data-ech-render-complete=true]', timeout = JEST_TIMEOUT) {
    await page.waitForSelector(selector, { timeout });
  }
}

export const common = new CommonPage();
