/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { httpServerMock } from '../../mocks';
import { mockRouter } from '../../http/router/router.mock';
import { registerSavedObjectAnnotationRoutes } from './routes';

describe('saved object annotation routes', () => {
  const annotation = {
    id: 'tag-1',
    type: 'tag',
    name: 'Production',
  };

  let annotationService: {
    createAnnotation: jest.Mock;
    updateAnnotation: jest.Mock;
    deleteAnnotation: jest.Mock;
    findAnnotations: jest.Mock;
    addAnnotationToObject: jest.Mock;
    removeAnnotationFromObject: jest.Mock;
    setAnnotationsForObject: jest.Mock;
    getAnnotationsForObject: jest.Mock;
  };
  let router: ReturnType<typeof mockRouter.create>;
  let context: any;
  let response: ReturnType<typeof httpServerMock.createResponseFactory>;

  beforeEach(() => {
    annotationService = {
      createAnnotation: jest.fn(),
      updateAnnotation: jest.fn(),
      deleteAnnotation: jest.fn(),
      findAnnotations: jest.fn(),
      addAnnotationToObject: jest.fn(),
      removeAnnotationFromObject: jest.fn(),
      setAnnotationsForObject: jest.fn(),
      getAnnotationsForObject: jest.fn(),
    };
    router = mockRouter.create();
    context = {
      core: {
        savedObjects: {
          annotations: annotationService,
        },
      },
    };
    response = httpServerMock.createResponseFactory();

    registerSavedObjectAnnotationRoutes({
      createRouter: jest.fn().mockReturnValue(router),
    } as any);
  });

  const getHandler = (method: 'post' | 'put' | 'delete', path: string) => {
    const call = router[method].mock.calls.find(([config]) => config.path === path);
    if (!call) {
      throw new Error(`Route ${method.toUpperCase()} ${path} was not registered`);
    }
    return call[1];
  };

  it('registers the annotation operation routes', () => {
    expect(router.post.mock.calls.map(([config]) => config.path)).toEqual([
      '',
      '/_find',
      '/_attach',
      '/_detach',
      '/_set_for_object',
      '/_get_for_object',
    ]);
    expect(router.put.mock.calls.map(([config]) => config.path)).toEqual(['/{annotationId}']);
    expect(router.delete.mock.calls.map(([config]) => config.path)).toEqual(['/{annotationId}']);
  });

  it('delegates definition operations to the request-scoped annotation service', async () => {
    annotationService.createAnnotation.mockResolvedValue(annotation);
    annotationService.updateAnnotation.mockResolvedValue({
      ...annotation,
      name: 'Production systems',
    });
    annotationService.findAnnotations.mockResolvedValue([annotation]);

    await getHandler('post', '')(
      context,
      { body: { type: 'tag', name: 'Production' } } as any,
      response
    );
    await getHandler('put', '/{annotationId}')(
      context,
      {
        params: { annotationId: 'tag-1' },
        body: { type: 'tag', name: 'Production systems' },
      } as any,
      response
    );
    await getHandler('post', '/_find')(context, { body: { type: 'tag' } } as any, response);
    await getHandler('delete', '/{annotationId}')(
      context,
      {
        params: { annotationId: 'tag-1' },
        query: { type: 'tag' },
      } as any,
      response
    );

    expect(annotationService.createAnnotation).toHaveBeenCalledWith({
      type: 'tag',
      name: 'Production',
    });
    expect(annotationService.updateAnnotation).toHaveBeenCalledWith({
      annotationId: 'tag-1',
      type: 'tag',
      name: 'Production systems',
    });
    expect(annotationService.findAnnotations).toHaveBeenCalledWith({ type: 'tag' });
    expect(annotationService.deleteAnnotation).toHaveBeenCalledWith({
      annotationId: 'tag-1',
      type: 'tag',
    });
  });

  it('delegates attachment operations to the request-scoped annotation service', async () => {
    const target = { objectType: 'dashboard', objectId: 'dashboard-1' };
    annotationService.getAnnotationsForObject.mockResolvedValue([annotation]);

    await getHandler('post', '/_attach')(
      context,
      { body: { annotationId: 'tag-1', type: 'tag', target } } as any,
      response
    );
    await getHandler('post', '/_detach')(
      context,
      { body: { annotationId: 'tag-1', type: 'tag', target } } as any,
      response
    );
    await getHandler('post', '/_set_for_object')(
      context,
      { body: { annotationIds: ['tag-1'], type: 'tag', target } } as any,
      response
    );
    await getHandler('post', '/_get_for_object')(
      context,
      { body: { type: 'tag', target } } as any,
      response
    );

    expect(annotationService.addAnnotationToObject).toHaveBeenCalledWith({
      annotationId: 'tag-1',
      type: 'tag',
      target,
    });
    expect(annotationService.removeAnnotationFromObject).toHaveBeenCalledWith({
      annotationId: 'tag-1',
      type: 'tag',
      target,
    });
    expect(annotationService.setAnnotationsForObject).toHaveBeenCalledWith({
      annotationIds: ['tag-1'],
      type: 'tag',
      target,
    });
    expect(annotationService.getAnnotationsForObject).toHaveBeenCalledWith({
      type: 'tag',
      target,
    });
  });
});
