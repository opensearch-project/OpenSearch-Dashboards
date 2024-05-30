/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import { IPPLEventsDataSource, IPPLVisualizationDataSource } from '../../types';

type PPLResponse = IPPLEventsDataSource & IPPLVisualizationDataSource;

export class PPLDataSource {
  constructor(private pplDataSource: PPLResponse, private dataType: string) {
    if (this.dataType === 'jdbc') {
      this.addSchemaRowMapping();
    } else if (this.dataType === 'viz') {
      this.addStatsMapping();
    }
  }

  private addStatsMapping = () => {
    const visData = this.pplDataSource;

    /**
     * Add vis mapping for runtime fields
     * json data structure added to response will be
     * [{
     *  agent: "mozilla",
     *  avg(bytes): 5756
     *  ...
     * }, {
     *  agent: "MSIE",
     *  avg(bytes): 5605
     *  ...
     * }, {
     *  agent: "chrome",
     *  avg(bytes): 5648
     *  ...
     * }]
     */
    const res = [];
    if (visData?.metadata?.fields) {
      const queriedFields = visData.metadata.fields;
      for (let i = 0; i < visData.size; i++) {
        const entry: any = {};
        queriedFields.map((field: any) => {
          const statsDataSet = visData?.data;
          entry[field.name] = statsDataSet[field.name][i];
        });
        res.push(entry);
      }
      visData.jsonData = res;
    }
  };

  /**
   * Add 'schemaName: data' entries for UI rendering
   */
  private addSchemaRowMapping = () => {
    const pplRes = this.pplDataSource;

    const data: any[] = [];

    _.forEach(pplRes.datarows, (row) => {
      const record: any = {};

      for (let i = 0; i < pplRes.schema.length; i++) {
        const cur = pplRes.schema[i];

        if (typeof row[i] === 'object') {
          record[cur.name] = JSON.stringify(row[i]);
        } else if (typeof row[i] === 'boolean') {
          record[cur.name] = row[i].toString();
        } else {
          record[cur.name] = row[i];
        }
      }

      data.push(record);
    });
    pplRes.jsonData = data;
  };

  public getDataSource = (): PPLResponse => this.pplDataSource;
}
