import { SavedObjectsClientContract } from 'src/core/public';
import { ICredential } from '../../common';
// import { DataSourceManagementStart } from '../plugin';

export async function getCredentials(
  savedObjectsClient: SavedObjectsClientContract,
  defaultIndex: string,
  // dataSourceManagementStart: DataSourceManagementStart
) {
  return (
    savedObjectsClient
      .find<ICredential>({
        type: 'credential',
        fields: ['id', 'credential_name', 'credential_type'],
        perPage: 10000,
      })
      .then((response) => 
        response.savedObjects
          .map((source) => {
            const id = source.id;
            const title = source.get('title');
            const credential_name = source.get('credential_name');
            const credential_type = source.get('credential_type');
            return {
              id,
              title,
              credential_name,
              credential_type,
              sort: `${title}`,
            };
          })
          .sort((a, b) => {
            if (a.sort < b.sort) {
              return -1;
            } else if (a.sort > b.sort) {
              return 1;
            } else {
              return 0;
            }
          })
      ) || []
  );
}