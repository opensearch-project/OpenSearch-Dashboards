import { IRouter } from '../../../../src/core/server';
import { ExamplePlugin2Plugin } from '../plugin';

export function defineRoutes(router: IRouter, pluginInstance: ExamplePlugin2Plugin) {
  router.get(
    {
      path: '/api/example_plugin_2/verify_crosscompatability',
      validate: false,
    },
    async (context, request, response) => {
      // Call exampleCompatibilityCheck() method from pluginInstance
      const { message, status } = await pluginInstance.exampleCompatibilityCheck();
      return response.ok({
        body: {
          time: new Date().toISOString(),
          message,
          status,
        },
      });
    }
  );
}
