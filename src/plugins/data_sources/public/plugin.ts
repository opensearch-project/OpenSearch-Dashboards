import { SavedObjectLoader } from 'src/plugins/saved_objects/public';
import {
  AppMountParameters,
  CoreSetup,
  CoreStart,
  Plugin,
  PluginInitializerContext,
  SavedObjectsClientContract,
} from '../../../core/public';
import { createSavedDataSourceLoader } from './saved_data_sources/saved_data_sources';
import { DataPublicPluginSetup, DataPublicPluginStart } from '../../../plugins/data/public';

export interface DataSourceStartDeps {
  data: DataPublicPluginStart;
  savedObjectsClient: SavedObjectsClientContract;
}

export interface DataSourceStart {
  savedDataSourceLoader: SavedObjectLoader;
}
// HelloWorldPlugin plu = ...
// HelloWprldPluginSetup res = plu.setup(..)
// res.getGreeting()
export class DataSourcePlugin
  implements Plugin<void, DataSourceStart, object, DataSourceStartDeps> {
  public setup() {}

  public start(core: CoreStart, { data }: DataSourceStartDeps): DataSourceStart {
    const savedDataSourceLoader = createSavedDataSourceLoader({
      savedObjectsClient: core.savedObjects.client,
      indexPatterns: data.indexPatterns,
      search: data.search,
      chrome: core.chrome,
      overlays: core.overlays,
    });

    return {
      savedDataSourceLoader,
    };
  }

  public stop() {}
}
