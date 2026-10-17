/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { EuiCallOut, EuiLoadingSpinner, EuiSmallButton, EuiSpacer } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { CoreStart } from 'src/core/public';
import {
  DirectQueryConnectionFlow,
  IDirectQueryConnectionFlowRegistry,
  isDirectQueryConnectionFlowVisible,
} from '../../direct_query_connection_flow_registry';
import {
  DIRECT_QUERY_CONNECTIONS_LIST_LOCATION,
  getDirectQueryConnectionFlowPath,
  parseDirectQueryConnectionFlowPath,
} from './constants';

interface DirectQueryConnectionFlowMountPointProps {
  registry: IDirectQueryConnectionFlowRegistry;
  core: CoreStart;
}

type FlowState = 'resolving' | 'visible' | 'hidden';

/**
 * Renders a registered {@link DirectQueryConnectionFlow} for the current `/flows/<id>` route.
 * The flow is (re-)mounted whenever its sub-path changes and unmounted when the route is left.
 */
export const DirectQueryConnectionFlowMountPoint = ({
  registry,
  core,
}: DirectQueryConnectionFlowMountPointProps) => {
  const history = useHistory();
  const location = useLocation();
  const parsed = parseDirectQueryConnectionFlowPath(location.pathname);
  const flow: DirectQueryConnectionFlow | undefined = parsed
    ? registry.getFlow(parsed.flowId)
    : undefined;
  const path = parsed?.path ?? '';

  const containerRef = useRef<HTMLDivElement>(null);
  const [flowState, setFlowState] = useState<FlowState>('resolving');

  useEffect(() => {
    let cancelled = false;
    if (!flow) {
      setFlowState('hidden');
      return;
    }
    setFlowState('resolving');
    isDirectQueryConnectionFlowVisible(flow).then((visible) => {
      if (!cancelled) {
        setFlowState(visible ? 'visible' : 'hidden');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [flow]);

  useEffect(() => {
    const element = containerRef.current;
    if (!flow || flowState !== 'visible' || !element) {
      return;
    }
    let cancelled = false;
    let unmount: (() => void) | undefined;

    const flowPath = getDirectQueryConnectionFlowPath(flow.id);
    const onMountError = (e: unknown) => {
      core.notifications.toasts.addDanger({
        title: i18n.translate('dataSourcesManagement.directQueryConnectionFlow.mountError', {
          defaultMessage: 'Could not load {title}',
          values: { title: flow.title },
        }),
        text: e instanceof Error ? e.message : undefined,
      });
    };

    try {
      Promise.resolve(
        flow.mount({
          element,
          path,
          navigate: (subPath: string) => history.push(`${flowPath}${subPath || ''}`),
          navigateToList: () => history.push(DIRECT_QUERY_CONNECTIONS_LIST_LOCATION),
          core,
        })
      )
        .then((unmountFn) => {
          if (cancelled) {
            unmountFn?.();
          } else {
            unmount = unmountFn;
          }
        })
        .catch(onMountError);
    } catch (e) {
      onMountError(e);
    }

    return () => {
      cancelled = true;
      unmount?.();
      unmount = undefined;
    };
  }, [flow, flowState, path, history, core]);

  if (!flow || flowState === 'hidden') {
    return (
      <EuiCallOut
        color="warning"
        iconType="alert"
        data-test-subj="directQueryConnectionFlowNotFound"
        title={i18n.translate('dataSourcesManagement.directQueryConnectionFlow.notFound', {
          defaultMessage: 'This connection flow is not available.',
        })}
      >
        <EuiSpacer size="s" />
        <EuiSmallButton onClick={() => history.push(DIRECT_QUERY_CONNECTIONS_LIST_LOCATION)}>
          {i18n.translate('dataSourcesManagement.directQueryConnectionFlow.backToList', {
            defaultMessage: 'Back to direct query connections',
          })}
        </EuiSmallButton>
      </EuiCallOut>
    );
  }

  return (
    <>
      {flowState === 'resolving' && <EuiLoadingSpinner size="xl" />}
      <div
        ref={containerRef}
        data-test-subj={`directQueryConnectionFlowMountPoint-${flow.id}`}
        className="dataSourceManagement__directQueryConnectionFlow"
      />
    </>
  );
};
