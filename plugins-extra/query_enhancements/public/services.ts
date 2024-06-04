import { createGetterSetter } from '../../../src/plugins/opensearch_dashboards_utils/common';
import { IStorageWrapper } from '../../../src/plugins/opensearch_dashboards_utils/public';
import { DataPublicPluginStart } from '../../../src/plugins/data/public';

export const [getStorage, setStorage] = createGetterSetter<IStorageWrapper>('storage');
export const [getData, setData] = createGetterSetter<DataPublicPluginStart>('data');
