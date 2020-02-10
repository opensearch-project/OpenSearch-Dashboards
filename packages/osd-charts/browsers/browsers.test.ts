import webdriver, { By } from 'selenium-webdriver';
import path from 'path';
jest.setTimeout(30000);

let driver: webdriver.WebDriver;
describe('smoke tests', () => {
  beforeAll(async () => {
    let capabilities: webdriver.Capabilities | null = null;
    switch (process.env.BROWSER || 'chrome') {
      case 'ie': {
        // HACK: include IEDriver path by nuget
        const driverPath = path.join(__dirname, '../Selenium.WebDriver.IEDriver.3.150.0/driver/');
        process.env.PATH = `${process.env.PATH};${driverPath};`;
        capabilities = webdriver.Capabilities.ie();
        capabilities.set('ignoreProtectedModeSettings', true);
        capabilities.set('ignoreZoomSetting', true);
        break;
      }
      case 'safari': {
        capabilities = webdriver.Capabilities.safari();
        break;
      }
      case 'firefox': {
        require('geckodriver');
        capabilities = webdriver.Capabilities.firefox();
        break;
      }
      case 'chrome': {
        require('chromedriver');
        capabilities = webdriver.Capabilities.chrome();
        capabilities.set('chromeOptions', {
          args: ['--headless', '--no-sandbox', '--disable-gpu', '--window-size=1980,1200'],
        });
        break;
      }
    }
    if (capabilities) {
      driver = await new webdriver.Builder().withCapabilities(capabilities).build();
    }
  });

  afterAll(async () => {
    await driver.quit();
  });

  test('elastic-chart element smoke test', async () => {
    await driver.get('http://localhost:8080');
    await driver.sleep(5000);

    const elements = await driver.findElements(By.className('echChart'));

    expect(elements.length).toBeGreaterThan(0);
  });
});
