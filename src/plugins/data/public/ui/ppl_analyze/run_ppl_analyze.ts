/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import dateMath from '@elastic/datemath';
import { HttpStart } from '../../../../../core/public';
import { Query } from '../../index';
import { TimefilterContract } from '../../query';
import {
  setPPLAnalyzeResult,
  setPPLAnalyzeLoading,
  isPPLAnalyzeOpen,
} from '../../query/ppl_analyze_state';

export function runPPLAnalyzeInBackground({
  query,
  http,
  timefilter,
  onlyIfOpen = false,
}: {
  query: Query;
  http: HttpStart;
  timefilter: TimefilterContract;
  onlyIfOpen?: boolean;
}) {
  if (query.language?.toLowerCase() !== 'ppl' || !query.query) return;
  if (onlyIfOpen && !isPPLAnalyzeOpen()) return;

  let queryString = query.query as string;
  let injectedTimeFilter: string | undefined;
  const timeFieldName = query.dataset?.timeFieldName;

  if (timeFieldName) {
    const timeRange = timefilter.getTime();
    const fromMoment = dateMath.parse(timeRange.from);
    const toMoment = dateMath.parse(timeRange.to, { roundUp: true });
    if (fromMoment && toMoment) {
      const fromStr = fromMoment.utc().format('YYYY-MM-DD HH:mm:ss.SSS');
      const toStr = toMoment.utc().format('YYYY-MM-DD HH:mm:ss.SSS');
      injectedTimeFilter = `WHERE \`${timeFieldName}\` >= '${fromStr}' AND \`${timeFieldName}\` <= '${toStr}'`;
      const commands = queryString.split('|');
      commands.splice(1, 0, ` ${injectedTimeFilter} `);
      queryString = commands.map((cmd) => cmd.trim()).join(' | ');
    }
  }

  setPPLAnalyzeLoading(true);
  http
    .fetch({
      method: 'POST',
      path: '/api/enhancements/ppl/analyze',
      body: JSON.stringify({
        query: queryString,
        dataSourceId: query.dataset?.dataSource?.id,
      }),
    })
    .then((result) => {
      setPPLAnalyzeResult({
        query: query.query as string,
        response: result,
        injectedTimeFilter,
      });
    })
    .catch(() => {
      setPPLAnalyzeLoading(false);
    });
}
