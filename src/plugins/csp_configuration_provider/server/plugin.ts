import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
  OnPreResponseHandler,
  OpenSearchClient,
} from '../../../core/server';

import {
  CspClient,
  CspConfigurationProviderPluginSetup,
  CspConfigurationProviderPluginStart,
} from './types';
import { defineRoutes } from './routes';
import { OpenSearchCspClient } from './provider';

const OPENSEARCH_DASHBOARDS_CONFIG_INDEX_NAME = '.opensearch_dashboards_config';
const OPENSEARCH_DASHBOARDS_CONFIG_DOCUMENT_NAME = 'csp.rules';

export class CspConfigurationProviderPlugin
  implements Plugin<CspConfigurationProviderPluginSetup, CspConfigurationProviderPluginStart> {
  private readonly logger: Logger;
  private cspClient: CspClient | undefined;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  private setCspClient(inputCspClient: CspClient) {
    this.cspClient = inputCspClient;
  }

  private getCspClient(inputOpenSearchClient: OpenSearchClient) {
    if (this.cspClient) {
      return this.cspClient;
    }

    return new OpenSearchCspClient(inputOpenSearchClient);
  }

  public setup(core: CoreSetup) {
    this.logger.debug('CspConfigurationProvider: Setup');
    const router = core.http.createRouter();

    // Register server side APIs
    defineRoutes(router);

    core.http.registerOnPreResponse(this.createCspRulesPreResponseHandler(core));

    return {
      setCspClient: this.setCspClient.bind(this),
    };
  }

  public start(core: CoreStart) {
    this.logger.debug('CspConfigurationProvider: Started');
    return {};
  }

  public stop() {}

  private createCspRulesPreResponseHandler(core: CoreSetup): OnPreResponseHandler {
    return async (request, response, toolkit) => {
      const shouldCheckDest = ['document', 'frame', 'iframe', 'embed', 'object'];

      const currentDest = request.headers['sec-fetch-dest'];

      if (!shouldCheckDest.includes(currentDest)) {
        return toolkit.next({});
      }

      const [coreStart] = await core.getStartServices();

      const myClient = this.getCspClient(coreStart.opensearch.client.asInternalUser);

      const existsData = await myClient.exists(OPENSEARCH_DASHBOARDS_CONFIG_INDEX_NAME);

      let header;
      const defaultHeader = core.http.csp.header;

      if (!existsData) {
        header = defaultHeader;
      } else {
        const data = await myClient.get(
          OPENSEARCH_DASHBOARDS_CONFIG_INDEX_NAME,
          OPENSEARCH_DASHBOARDS_CONFIG_DOCUMENT_NAME
        );
        header = data || defaultHeader;
      }

      const additionalHeaders = {
        ['content-security-policy']: header,
      };

      return toolkit.next({ headers: additionalHeaders });
    };
  }
}
