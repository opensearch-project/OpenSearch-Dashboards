import {
  ChromeStart,
  SavedObjectsClientContract,
  OverlayStart,
} from 'opensearch-dashboards/public';
import { DataPublicPluginStart, IndexPatternsContract } from '../../../../plugins/data/public';
import { SavedObjectLoader } from '../../../saved_objects/public';
import { createSavedDataSourceClass } from './_saved_data_source';

// todo: why not share with other type def SavedObjectOpenSearchDashboardsServices
interface Services {
  savedObjectsClient: SavedObjectsClientContract;
  indexPatterns: IndexPatternsContract;
  search: DataPublicPluginStart['search'];
  chrome: ChromeStart;
  overlays: OverlayStart;
}

export function createSavedDataSourceLoader(services: Services) {
  const SavedDataSource = createSavedDataSourceClass(services);

  return new SavedObjectLoader(SavedDataSource, services.savedObjectsClient);
}
