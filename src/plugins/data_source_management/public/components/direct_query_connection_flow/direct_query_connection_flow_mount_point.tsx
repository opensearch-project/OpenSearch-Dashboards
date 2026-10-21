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
} from '../../direct_query_connection_flow_registry';
import {
  DIRECT_QUERY_CONNECTIONS_LIST_LOCATION,
  getDirectQueryConnectionFlowPath,
  normalizeDirectQueryConnectionFlowSubPath,
  parseDirectQueryConnectionFlowPath,
} from './constants';

interface DirectQueryConnectionFlowMountPointProps {
  registry: IDirectQueryConnectionFlowRegistry;
  core: CoreStart;
}

type FlowState = 'resolving' | 'visible' | 'hidden';

/**
 * Renders a registered {@link DirectQueryConnectionFlow} for the current `/flows/<id>` route.
 * The flow is mounted once per flow id; sub-path changes within the flow are reported to it
 * through `onPathChange` instead of re-mounting it. It is unmounted when the route is left.
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
  // Visibility of the flow it was resolved for. An unknown flow id is known to be hidden right
  // away, so it never shows the spinner; switching to another flow is "resolving" again until its
  // own visibility is known, so a flow is never mounted on another flow's result.
  const [resolved, setResolved] = useState<{ flowId?: string; visible: boolean }>({
    visible: false,
  });
  const flowState: FlowState = !flow
    ? 'hidden'
    : resolved.flowId !== flow.id
      ? 'resolving'
      : resolved.visible
        ? 'visible'
        : 'hidden';

  // The current sub-path and the mounted flow's listeners, read by the mount effect without making
  // it depend on (and re-run for) every path change.
  const pathRef = useRef(path);
  const pathListenersRef = useRef(new Set<(path: string) => void>());

  useEffect(() => {
    if (!flow) {
      return;
    }
    let cancelled = false;
    registry.isFlowVisible(flow.id).then((visible) => {
      if (!cancelled) {
        setResolved({ flowId: flow.id, visible });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [flow, registry]);

  useEffect(() => {
    if (pathRef.current === path) {
      return;
    }
    pathRef.current = path;
    pathListenersRef.current.forEach((listener) => {
      try {
        listener(path);
      } catch (e) {
        // A broken listener must not stop the others or the route change.
      }
    });
  }, [path]);

  useEffect(() => {
    const element = containerRef.current;
    if (!flow || flowState !== 'visible' || !element) {
      return;
    }
    let cancelled = false;
    let unmount: (() => void) | undefined;
    const listeners = pathListenersRef.current;

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
          path: pathRef.current,
          navigate: (subPath: string) =>
            history.push(`${flowPath}${normalizeDirectQueryConnectionFlowSubPath(subPath)}`),
          onPathChange: (listener) => {
            listeners.add(listener);
            return () => {
              listeners.delete(listener);
            };
          },
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
      listeners.clear();
      unmount?.();
      unmount = undefined;
    };
  }, [flow, flowState, history, core]);

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
      {/* Rendered while visibility resolves too, so the container exists when the flow mounts. */}
      <div
        ref={containerRef}
        data-test-subj={`directQueryConnectionFlowMountPoint-${flow.id}`}
        className="dataSourceManagement__directQueryConnectionFlow"
      />
    </>
  );
};
