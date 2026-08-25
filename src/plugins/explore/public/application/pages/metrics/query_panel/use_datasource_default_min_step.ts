/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { i18n } from '@osd/i18n';
import { ExploreServices } from '../../../../types';

const DATA_CONNECTION_TYPE = 'data-connection';

interface DataConnectionAttributes {
  connectionId: string;
  type: string;
  meta?: string;
}

interface ConnectionSettings {
  defaultMinStep?: string;
}

function parseSettings(meta?: string): ConnectionSettings {
  if (!meta) return {};
  try {
    const parsed = JSON.parse(meta);
    return parsed && typeof parsed === 'object' ? (parsed as ConnectionSettings) : {};
  } catch {
    return {};
  }
}

export interface DatasourceDefaultMinStep {
  defaultMinStep?: string;
  onDefaultMinStepChange: (next?: string) => void;
}

/**
 * Default min step for every query against a Prometheus connection, stored on
 * that connection's `data-connection` saved object so it survives reloads and
 * applies to all users of the connection.
 */
export function useDatasourceDefaultMinStep(
  services: ExploreServices,
  connectionId: string
): DatasourceDefaultMinStep {
  const [defaultMinStep, setDefaultMinStep] = useState<string | undefined>(undefined);
  const savedObjectIdRef = useRef<string | undefined>(undefined);
  const settingsRef = useRef<ConnectionSettings>({});
  const client = services.savedObjects.client;

  useEffect(() => {
    let cancelled = false;
    savedObjectIdRef.current = undefined;
    settingsRef.current = {};
    setDefaultMinStep(undefined);
    if (!connectionId) return;

    client
      .find<DataConnectionAttributes>({
        type: DATA_CONNECTION_TYPE,
        search: `"${connectionId}"`,
        searchFields: ['connectionId'],
        perPage: 100,
      })
      .then((response) => {
        if (cancelled) return;
        const match = response.savedObjects.find(
          (so) => so.attributes.connectionId === connectionId
        );
        if (!match) return;
        savedObjectIdRef.current = match.id;
        settingsRef.current = parseSettings(match.attributes.meta);
        setDefaultMinStep(settingsRef.current.defaultMinStep);
      })
      .catch(() => {
        // A connection without a readable saved object still works; only the
        // datasource-level default is unavailable.
      });

    return () => {
      cancelled = true;
    };
  }, [client, connectionId]);

  const onDefaultMinStepChange = useCallback(
    (next?: string) => {
      setDefaultMinStep(next);
      settingsRef.current = { ...settingsRef.current, defaultMinStep: next };

      const savedObjectId = savedObjectIdRef.current;
      if (!savedObjectId) {
        services.notifications.toasts.addWarning(
          i18n.translate('explore.metricsQueryPanel.defaultMinStepNotPersisted', {
            defaultMessage:
              'Applied for this session only. {connection} has no saved connection object to store a default min step.',
            values: { connection: connectionId },
          })
        );
        return;
      }

      client
        .update(DATA_CONNECTION_TYPE, savedObjectId, { meta: JSON.stringify(settingsRef.current) })
        .catch(() => {
          services.notifications.toasts.addDanger(
            i18n.translate('explore.metricsQueryPanel.defaultMinStepSaveFailed', {
              defaultMessage:
                'Could not save the default min step for {connection}. It applies for this session only.',
              values: { connection: connectionId },
            })
          );
        });
    },
    [client, connectionId, services.notifications.toasts]
  );

  return { defaultMinStep, onDefaultMinStepChange };
}
