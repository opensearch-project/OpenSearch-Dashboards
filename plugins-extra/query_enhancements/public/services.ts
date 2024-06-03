import { CoreStart } from '../../../src/core/public';
import { createGetterSetter } from '../../../src/plugins/opensearch_dashboards_utils/common';
import { DataPublicPluginStart } from '../../../src/plugins/data/public';
import { IStorageWrapper } from '../../../src/plugins/opensearch_dashboards_utils/public';

export const [getCore, setCore] = createGetterSetter<CoreStart>('core');
export const [getData, setData] = createGetterSetter<DataPublicPluginStart>('data');
export const [getStorage, setStorage] = createGetterSetter<IStorageWrapper>('storage');
