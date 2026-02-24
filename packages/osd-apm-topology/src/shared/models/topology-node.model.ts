/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TopologyNode } from '../types/sdk.types';
import { TopologyNodePresenter } from '../presenters/topology-node.presenter';

/**
 * A model class that wraps a raw topology node from the SDK and provides
 * convenience methods to access and interpret node data. This class acts as
 * a domain layer between raw API data and application-specific business logic.
 */
export class TopologyNodeModel {
  /** The raw topology node data from the SDK */
  readonly node: TopologyNode;

  /**
   * Creates a new TopologyNodeModel instance
   *
   * @param node - The raw topology node data from the SDK
   */
  constructor(node: TopologyNode) {
    this.node = node;
  }

  /**
   * Gets the unique identifier of the node
   *
   * @returns The node's ID string
   */
  public get id(): string {
    return this.node.NodeId;
  }

  /**
   * Gets the display name of the node
   *
   * @returns The node's name string
   */
  public get name(): string {
    return this.node.Name;
  }

  /**
   * Determines if this node represents a service group rather than an individual service
   *
   * @returns True if the node is a service group, false otherwise
   */
  public get isGroup(): boolean {
    return this.node.KeyAttributes?.Type === 'ServiceGroup';
  }

  /**
   * Gets the aggregated node identifier for this node
   *
   * This identifier is used to group related nodes together in aggregated views.
   * It may be null or undefined if the node is not part of an aggregated group.
   *
   * @returns The aggregated node ID string, null, or undefined
   */
  public get aggregatedNodeId(): string | null | undefined {
    return this.node.AggregatedNodeId;
  }

  /**
   * Determines if this node has instrumentation
   *
   * The definition of "instrumented" differs based on whether the node is a group:
   * - For groups: Checks if at least one service in the group is instrumented
   * - For services: Checks if the service itself is instrumented
   *
   * @returns True if the node is instrumented, false otherwise
   */
  public get isInstrumented(): boolean {
    const attributes = this.node.AttributeMaps;

    if (this.isGroup) {
      // For groups, check if any service in the group is instrumented
      return !!attributes?.some(
        (attr: Record<string, string>) =>
          !!attr?.InstrumentedServiceCount && Number(attr?.InstrumentedServiceCount) > 0
      );
    }

    // For services, check the instrumentation type directly
    return !!attributes?.some(
      (attr: Record<string, string>) =>
        attr.InstrumentationType && attr.InstrumentationType === 'INSTRUMENTED'
    );
  }

  /**
   * Checks if this node has platform type information
   *
   * @returns True if platform type is available, false otherwise
   */
  public get hasPlatformType(): boolean {
    return !!this.node.AttributeMaps?.some((attr: Record<string, string>) => !!attr.PlatformType);
  }

  /**
   * Checks if this node has resource type information
   *
   * @returns True if resource type is available, false otherwise
   */
  public get hasResourceType(): boolean {
    return !!this.node.KeyAttributes?.ResourceType;
  }

  /**
   * Gets the platform type of the node
   *
   * @returns The platform type string if available, undefined otherwise
   */
  public get platform(): string {
    return this.node.AttributeMaps?.find((attr: Record<string, string>) => !!attr.PlatformType)
      ?.PlatformType as string;
  }

  /**
   * Determines the type of the node, prioritizing:
   * 1. PlatformType (if available)
   * 2. ResourceType (if available)
   * 3. Falling back to the node's Type property
   *
   * @returns The determined type string for this node
   */
  public get type(): string {
    if (this.hasPlatformType) {
      return this.node.AttributeMaps?.find((attr: Record<string, string>) => !!attr.PlatformType)
        ?.PlatformType as string;
    }

    if (this.hasResourceType) {
      return this.node.KeyAttributes?.ResourceType;
    }

    return this.node.Type;
  }

  /**
   * Calculates the total number of services within this group
   * Combines both instrumented and uninstrumented services
   *
   * @returns The total number of services, or 0 if not applicable (not a group)
   */
  public get numberOfServices(): number {
    if (!this.isGroup) return 0;

    // Find attribute with service count information
    const attribute = this.node.AttributeMaps?.find(
      (attr: Record<string, string>) =>
        !!attr?.InstrumentedServiceCount || !!attr?.UninstrumentedServiceCount
    );

    if (!attribute) return 0;

    // Sum up all number values in the attribute
    return (
      Object.values(attribute)
        .map(Number)
        .reduce((acc, cur) => acc + cur, 0) ?? 0
    );
  }

  /**
   * Gets the number of uninstrumented services within this group
   *
   * @returns The count of uninstrumented services, or 0 if not applicable (not a group)
   */
  public get numberOfUninstrumentedServices(): number {
    if (!this.isGroup) return 0;

    const count =
      this.node.AttributeMaps?.find(
        (attr: Record<string, string>) => !!attr?.UninstrumentedServiceCount
      )?.UninstrumentedServiceCount ?? 0;

    return Number(count);
  }

  /**
   * Gets the group type designation for this node
   *
   * @returns The group type string if available, undefined otherwise
   */
  public get groupType(): string | undefined {
    return this.node.KeyAttributes.GroupType;
  }

  /**
   * Determines if this is a user-defined custom group
   * Uses the node ID format to identify the source of the group
   *
   * @returns True if this is a custom group defined by a customer, false otherwise
   */
  public get isCustomerDefinedGroup(): boolean {
    if (!this.isGroup) return false;

    // Parse the nodeId to extract source information
    // eg. group/source:declared/groupType:Team/name:Payment
    const source = this.node.NodeId.split('/')?.[1];

    // Check if the source indicates this is a declared (customer-defined) group
    return source?.split(':')?.[1] === 'declared';
  }

  public get isDirectService(): boolean {
    if (this.isGroup) return true;

    return !this.node.AttributeMaps?.find(
      (attr: Record<string, string>) => attr?.isDirectService === 'false'
    );
  }

  /**
   * Creates a presenter instance for this node model
   * Useful for formatting and transforming model data for display purposes
   *
   * @returns A TopologyNodePresenter instance for this node
   */
  public get presenter() {
    return new TopologyNodePresenter(this);
  }
}
