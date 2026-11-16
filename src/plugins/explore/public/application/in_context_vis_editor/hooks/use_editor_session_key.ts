/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

/**
 * A key for the editing session: it changes on every navigation that isn't a REPLACE, i.e. browser
 * back / forward (POP) or a PUSH such as `/edit/a` -> `/edit/b` or saving a new vis. The editor's
 * own URL writes (`_eq`, `_e`, `_v`, `_t`, `_g`, `_c`) all use `replace`, so they keep the session.
 * Use it as the key of the editor's tree so a new session remounts and reads the new URL.
 */
export const useEditorSessionKey = (): number => {
  const history = useHistory();
  const [sessionKey, setSessionKey] = useState(0);

  useEffect(() => {
    const unlisten = history.listen((_location, action) => {
      if (action !== 'REPLACE') {
        setSessionKey((key) => key + 1);
      }
    });
    return unlisten;
  }, [history]);

  return sessionKey;
};
