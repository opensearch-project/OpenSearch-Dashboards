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

import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { map, distinctUntilChanged, switchMap, debounceTime } from 'rxjs/operators';
import { isDeepStrictEqual } from 'util';

import { ExtensionName } from '../extensions';
import { ServiceStatus, CoreStatus } from './types';
import { getSummaryStatus } from './get_summary_status';

interface Deps {
  core$: Observable<CoreStatus>;
  extensionDependencies: ReadonlyMap<ExtensionName, ExtensionName[]>;
}

export class ExtensionsStatusService {
  private readonly extensionStatuses = new Map<ExtensionName, Observable<ServiceStatus>>();
  private readonly update$ = new BehaviorSubject(true);
  private readonly defaultInheritedStatus$: Observable<ServiceStatus>;

  constructor(private readonly deps: Deps) {
    this.defaultInheritedStatus$ = this.deps.core$.pipe(
      map((coreStatus) => {
        return getSummaryStatus(Object.entries(coreStatus), {
          allAvailableSummary: `All dependencies are available`,
        });
      })
    );
  }

  public set(extension: ExtensionName, status$: Observable<ServiceStatus>) {
    this.extensionStatuses.set(extension, status$);
    this.update$.next(true); // trigger all existing Observables to update from the new source Observable
  }

  public getAll$(): Observable<Record<ExtensionName, ServiceStatus>> {
    return this.getExtensionStatuses$([...this.deps.extensionDependencies.keys()]);
  }

  public getDependenciesStatus$(
    extension: ExtensionName
  ): Observable<Record<ExtensionName, ServiceStatus>> {
    const dependencies = this.deps.extensionDependencies.get(extension);
    if (!dependencies) {
      throw new Error(`Unknown extension: ${extension}`);
    }

    return this.getExtensionStatuses$(dependencies).pipe(
      // Prevent many emissions at once from dependency status resolution from making this too noisy
      debounceTime(500)
    );
  }

  public getDerivedStatus$(extension: ExtensionName): Observable<ServiceStatus> {
    return this.update$.pipe(
      switchMap(() => {
        // Only go up the dependency tree if any of this extension's dependencies have a custom status
        // Helps eliminate memory overhead of creating thousands of Observables unnecessarily.
        if (this.anyCustomStatuses(extension)) {
          return combineLatest([this.deps.core$, this.getDependenciesStatus$(extension)]).pipe(
            map(([coreStatus, extensionStatuses]) => {
              return getSummaryStatus(
                [...Object.entries(coreStatus), ...Object.entries(extensionStatuses)],
                {
                  allAvailableSummary: `All dependencies are available`,
                }
              );
            })
          );
        } else {
          return this.defaultInheritedStatus$;
        }
      })
    );
  }

  private getExtensionStatuses$(
    extensions: ExtensionName[]
  ): Observable<Record<ExtensionName, ServiceStatus>> {
    if (extensions.length === 0) {
      return of({});
    }

    return this.update$.pipe(
      switchMap(() => {
        const extensionStatuses = extensions
          .map(
            (depName) =>
              [depName, this.extensionStatuses.get(depName) ?? this.getDerivedStatus$(depName)] as [
                ExtensionName,
                Observable<ServiceStatus>
              ]
          )
          .map(([pName, status$]) =>
            status$.pipe(map((status) => [pName, status] as [ExtensionName, ServiceStatus]))
          );

        return combineLatest(extensionStatuses).pipe(
          map((statuses) => Object.fromEntries(statuses)),
          distinctUntilChanged(isDeepStrictEqual)
        );
      })
    );
  }

  /**
   * Determines whether or not this extension or any extension in it's dependency tree have a custom status registered.
   */
  private anyCustomStatuses(extension: ExtensionName): boolean {
    if (this.extensionStatuses.get(extension)) {
      return true;
    }

    return this.deps.extensionDependencies
      .get(extension)!
      .reduce((acc, depName) => acc || this.anyCustomStatuses(depName), false as boolean);
  }
}
