/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { IContainer } from '../../../embeddable/public';
import { showNewVisModal } from '../wizard';
import { VisualizeEmbeddableFactory } from './visualize_embeddable_factory';

jest.mock('../wizard', () => ({
  showNewVisModal: jest.fn(),
}));

describe('VisualizeEmbeddableFactory', () => {
  it('passes container info from an unsaved parent to the visualization editor', async () => {
    const containerData = { sectionId: 'section-1' };
    const parent = {
      getInput: jest.fn().mockReturnValue({ id: '' }),
      getTitle: jest.fn().mockReturnValue(undefined),
      getStateTransferContainerInfoData: jest.fn().mockReturnValue(containerData),
    } as unknown as IContainer;
    const factory = new VisualizeEmbeddableFactory({
      start: jest.fn().mockReturnValue({
        core: {
          application: {
            currentAppId$: new BehaviorSubject('dashboards'),
          },
        },
      }),
    });

    await factory.create({}, parent);

    expect(showNewVisModal).toHaveBeenCalledWith({
      originatingApp: 'dashboards',
      outsideVisualizeApp: true,
      containerInfo: {
        containerId: '',
        containerName: '',
        containerData,
      },
    });
  });
});
