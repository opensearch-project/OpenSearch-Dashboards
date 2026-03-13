/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { History } from 'history';
import { Observable, of } from 'rxjs';
import { catchError, map, share } from 'rxjs/operators';
import {
  IOsdUrlStateStorage,
  HashedItemStore,
  createOsdUrlControls,
  getStateFromOsdUrl,
  setStateToOsdUrl,
} from '../../../opensearch_dashboards_utils/public';
import { FlavoredSessionStorage } from './flavored_session_storage';

/**
 * Creates a flavor-specific URL state storage that uses namespaced session storage
 * This ensures different Explore flavors (logs, traces, metrics) maintain separate state
 * while using the same URL parameter names (_q, _a)
 */
export const createFlavoredUrlStateStorage = (
  {
    useHash = false,
    history,
    onGetError,
    onSetError,
    flavor,
  }: {
    useHash: boolean;
    history?: History;
    onGetError?: (error: Error) => void;
    onSetError?: (error: Error) => void;
    flavor: string;
  } = {
    useHash: false,
    flavor: 'logs',
  }
): IOsdUrlStateStorage => {
  // Create flavor-specific session storage
  const flavoredStorage = new FlavoredSessionStorage(flavor);

  // Create flavor-specific hashed item store
  const flavoredHashedItemStore = new HashedItemStore(flavoredStorage);

  const url = createOsdUrlControls(history);

  return {
    set: <State>(
      key: string,
      state: State,
      { replace = false }: { replace: boolean } = { replace: false }
    ) => {
      // syncState() utils doesn't wait for this promise
      return url.updateAsync((currentUrl) => {
        try {
          return setStateToOsdUrl(
            key,
            state,
            { useHash, hashedItemStore: flavoredHashedItemStore },
            currentUrl
          );
        } catch (error) {
          if (onSetError) onSetError(error);
        }
      }, replace);
    },
    get: (key) => {
      // if there is a pending url update, then state will be extracted from that pending url,
      // otherwise current url will be used to retrieve state from
      try {
        return getStateFromOsdUrl(key, url.getPendingUrl(), {
          hashedItemStore: flavoredHashedItemStore,
        });
      } catch (e) {
        if (onGetError) onGetError(e);
        return null;
      }
    },
    change$: <State>(key: string) =>
      new Observable((observer) => {
        const unlisten = url.listen(() => {
          observer.next();
        });

        return () => {
          unlisten();
        };
      }).pipe(
        map(() =>
          getStateFromOsdUrl<State>(key, undefined, { hashedItemStore: flavoredHashedItemStore })
        ),
        catchError((error) => {
          if (onGetError) onGetError(error);
          return of(null);
        }),
        share()
      ),
    flush: ({ replace = false }: { replace?: boolean } = {}) => {
      return !!url.flush(replace);
    },
    cancel() {
      url.cancel();
    },
  };
};
