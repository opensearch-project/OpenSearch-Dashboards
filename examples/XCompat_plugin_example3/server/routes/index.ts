import { IRouter } from '../../../../src/core/server';
import { ExamplePlugin3Plugin } from '../plugin';

export function defineRoutes(router: IRouter, pluginInstance: ExamplePlugin3Plugin) {
  router.get(
    {
      path: '/api/example_plugin_3/verify_crosscompatability',
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
