/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { mockReactDomRender, mockReactDomUnmount } from '../overlay.test.mocks';

import { mount } from 'enzyme';
import { i18nServiceMock } from '../../i18n/i18n_service.mock';
import {
  SidecarService,
  OverlaySidecarStart,
  OverlaySidecarOpenOptions,
  SIDECAR_DOCKED_MODE,
} from './sidecar_service';
import { OverlayRef } from '../types';

const i18nMock = i18nServiceMock.createStartContract();

beforeEach(() => {
  mockReactDomRender.mockClear();
  mockReactDomUnmount.mockClear();
});

const mountText = (text: string) => (container: HTMLElement) => {
  const content = document.createElement('span');
  content.textContent = text;
  container.append(content);
  return () => {};
};

const getServiceStart = () => {
  const service = new SidecarService();
  return service.start({ i18n: i18nMock, targetDomElement: document.createElement('div') });
};

describe('SidecarService', () => {
  let sidecar: OverlaySidecarStart;
  const options: OverlaySidecarOpenOptions = {
    config: {
      dockedMode: SIDECAR_DOCKED_MODE.RIGHT,
      paddingSize: 460,
    },
  };
  beforeEach(() => {
    sidecar = getServiceStart();
  });

  describe('open sidecar', () => {
    it('renders a sidecar to the DOM', () => {
      expect(mockReactDomRender).not.toHaveBeenCalled();
      sidecar.open(mountText('Sidecar content'), options);
      const content = mount(mockReactDomRender.mock.calls[0][0]);
      expect(content.html()).toMatchSnapshot();
    });

    it('does not unmount if targetDom is null', async () => {
      const sidecarRef = new SidecarService().start({ i18n: i18nMock, targetDomElement: null });
      const ref = sidecarRef.open(mountText('Sidecar content'), options);
      const content = mount(mockReactDomRender.mock.calls[0][0]);
      expect(content.html()).toMatchSnapshot();
      await ref.close();
      expect(mockReactDomUnmount).not.toHaveBeenCalled();
    });

    describe('with a currently active sidecar', () => {
      let ref1: OverlayRef;
      beforeEach(() => {
        ref1 = sidecar.open(mountText('Sidecar content'), options);
      });
      it('replaces the current sidecar with a new one', () => {
        sidecar.open(mountText('Sidecar content 2'), options);
        expect(mockReactDomUnmount).toHaveBeenCalledTimes(1);
        const modalContent = mount(mockReactDomRender.mock.calls[1][0]);
        expect(modalContent.html()).toMatchSnapshot();
        expect(() => ref1.close()).not.toThrowError();
        expect(mockReactDomUnmount).toHaveBeenCalledTimes(1);
      });
      it('resolves onClose on the previous ref', async () => {
        const onCloseComplete = jest.fn();
        ref1.onClose.then(onCloseComplete);
        sidecar.open(mountText('Sidecar content 2'), options);
        await ref1.onClose;
        expect(onCloseComplete).toBeCalledTimes(1);
      });
    });
  });
  describe('SidecarRef#close()', () => {
    it('resolves the onClose Promise', async () => {
      const ref = sidecar.open(mountText('Sidecar content'), options);

      const onCloseComplete = jest.fn();
      ref.onClose.then(onCloseComplete);
      await ref.close();
      await ref.close();
      expect(onCloseComplete).toHaveBeenCalledTimes(1);
    });
    it('can be called multiple times on the same SidecarRef', async () => {
      const ref = sidecar.open(mountText('Sidecar content'), options);
      expect(mockReactDomUnmount).not.toHaveBeenCalled();
      await ref.close();
      expect(mockReactDomUnmount.mock.calls).toMatchSnapshot();
      await ref.close();
      expect(mockReactDomUnmount).toHaveBeenCalledTimes(1);
    });
    it("on a stale Sidecar doesn't affect the active sidecar", async () => {
      const ref1 = sidecar.open(mountText('Sidecar content 1'), options);
      const ref2 = sidecar.open(mountText('Sidecar content 2'), options);
      const onCloseComplete = jest.fn();
      ref2.onClose.then(onCloseComplete);
      mockReactDomUnmount.mockClear();
      await ref1.close();
      expect(mockReactDomUnmount).toBeCalledTimes(0);
      expect(onCloseComplete).toBeCalledTimes(0);
    });
  });

  describe('SidecarRef#Hide()', () => {
    it('hide the sidecar when calling hide ', () => {
      expect(mockReactDomRender).not.toHaveBeenCalled();
      sidecar.open(mountText('Sidecar content'), options);
      sidecar.hide();
      const content = mount(mockReactDomRender.mock.calls[0][0]);
      expect(content.html()).toMatchSnapshot();
      expect(content.hasClass('osdSidecarFlyout--hide'));
    });
  });

  describe('SidecarRef#Show()', () => {
    it('recover sidecar when calling show after calling hide', () => {
      expect(mockReactDomRender).not.toHaveBeenCalled();
      sidecar.open(mountText('Sidecar content'), options);
      sidecar.hide();
      expect(mount(mockReactDomRender.mock.calls[0][0]).hasClass('osdSidecarFlyout--hide'));
      sidecar.show();
      const content = mount(mockReactDomRender.mock.calls[0][0]);
      expect(content.html()).toMatchSnapshot();
      expect(content.hasClass('osdSidecarFlyout--hide')).toEqual(false);
    });
  });
});
