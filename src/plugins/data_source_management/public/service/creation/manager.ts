import { DataSourceCreationConfig, DataSourceCreationOption, UrlHandler } from './config';
import { HttpSetup } from '../../../../../core/public';

export class DataSourceCreationManager {
  private configs: DataSourceCreationConfig[] = [];

  setup(httpClient: HttpSetup) {
    return {
      addCreationConfig: (Config: typeof DataSourceCreationConfig) => {
        const config = new Config({ httpClient });

        if (this.configs.findIndex((c) => c.key === config.key) !== -1) {
          throw new Error(`${config.key} exists in DataSourceCreationManager.`);
        }

        this.configs.push(config);
      },
    };
  }

  start() {
    const getType = (key: string | undefined): DataSourceCreationConfig => {
      if (key) {
        const index = this.configs.findIndex((config) => config.key === key);
        const config = this.configs[index];

        if (config) {
          return config;
        } else {
          throw new Error(`Data source creation type not found: ${key}`);
        }
      } else {
        return getType('default');
      }
    };

    return {
      getType,
      getDataSourceCreationOptions: async (urlHandler: UrlHandler) => {
        const options: DataSourceCreationOption[] = [];

        await Promise.all(
          this.configs.map(async (config) => {
            const option = config.getDataSourceCreationOption
              ? await config.getDataSourceCreationOption(urlHandler)
              : null;

            if (option) {
              options.push(option);
            }
          })
        );

        return options;
      },
    };
  }
}
