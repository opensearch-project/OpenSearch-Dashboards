import { createGetterSetter } from '../../../src/plugins/opensearch_dashboards_utils/common';
import { IStorageWrapper } from '../../../src/plugins/opensearch_dashboards_utils/public';

export const [getStorage, setStorage] = createGetterSetter<IStorageWrapper>('storage');
