/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo } from 'react';
import useObservable from 'react-use/lib/useObservable';
import { BehaviorSubject } from 'rxjs';
import classNames from 'classnames';
import { I18nStart } from '../../../i18n';
import { MountPoint } from '../../../types';
import { MountWrapper } from '../../../utils';
import './sidecar.scss';
import { ResizableButton } from './resizable_button';
import { ISidecarConfig, OverlaySidecarOpenOptions, SIDECAR_DOCKED_MODE } from '../sidecar_service';

export interface Props {
  sidecarConfig$: BehaviorSubject<ISidecarConfig | undefined>;
  options: OverlaySidecarOpenOptions;
  setSidecarConfig: (config: Partial<ISidecarConfig>) => void;
  i18n: I18nStart;
  mount: MountPoint;
}

export const Sidecar = ({ sidecarConfig$, options, setSidecarConfig, i18n, mount }: Props) => {
  const sidecarConfig = useObservable(sidecarConfig$, undefined);

  const classes = classNames(
    'osdSidecarFlyout',
    {
      'osdSidecarFlyout--dockedRight': sidecarConfig?.dockedMode === SIDECAR_DOCKED_MODE.RIGHT,
      'osdSidecarFlyout--dockedLeft': sidecarConfig?.dockedMode === SIDECAR_DOCKED_MODE.LEFT,
      'osdSidecarFlyout--dockedTakeover':
        sidecarConfig?.dockedMode === SIDECAR_DOCKED_MODE.TAKEOVER,
      'osdSidecarFlyout--hide': sidecarConfig?.isHidden === true,
    },
    options.className
  );
  const handleResize = useCallback(
    (newSize: number) => {
      setSidecarConfig({
        paddingSize: newSize,
      });
    },
    [setSidecarConfig]
  );

  const flyoutSizeStyle = useMemo(
    () =>
      sidecarConfig?.dockedMode === SIDECAR_DOCKED_MODE.TAKEOVER
        ? {
            height: sidecarConfig?.paddingSize,
          }
        : {
            width: sidecarConfig?.paddingSize,
          },
    [sidecarConfig]
  );

  return (
    <i18n.Context>
      <div data-test-subj={options['data-test-subj']} style={flyoutSizeStyle} className={classes}>
        <ResizableButton
          onResize={handleResize}
          dockedMode={sidecarConfig?.dockedMode}
          flyoutSize={sidecarConfig?.paddingSize ?? 0}
        />
        <MountWrapper mount={mount} className="osdSidecarMountWrapper" />
      </div>
    </i18n.Context>
  );
};
