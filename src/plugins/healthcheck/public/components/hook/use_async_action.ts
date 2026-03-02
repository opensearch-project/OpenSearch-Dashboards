/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useState } from 'react';

export function useAsyncAction(action: (...params: any[]) => any, dependencies: any[] = []) {
  const [running, setRunning] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const run = useCallback(async (...params) => {
    try {
      setRunning(true);
      setError(null);
      setData(null);
      const result = await action(...params);
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setRunning(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return { data, error, running, run };
}
