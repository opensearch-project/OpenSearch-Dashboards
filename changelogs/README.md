# Revised Changelog and Release Notes Process

- [Introduction](#introduction)
- [Process Overview](#process-overview)

## Introduction

On March 20, 2023, Josh Romero issued a [call for proposals](https://github.com/opensearch-project/.github/issues/148) that would "solve the entire collection of issues around generating both ongoing CHANGELOGs, and release notes during GA of the product, for all OpenSearch project repositories."

On May 4, 2023, a working group voted unanimously to move forward with the "Automation" variation of [Ashwin Chandran's proposal](https://github.com/opensearch-project/.github/issues/156). This proposal has now been implemented, and the details of the new changelog and release notes process are set out below.

## Process Overview

The updated changelog and release notes process involves four primary changes in the repository:

1. Creating a new `changelogs` directory in the root folder of the repository.
   
2. Adding a "Changelog" section to the PR description template, with instructions for how contributors can add valid changelog entries to this section.
   
3. Using a GitHub Actions workflow to extract entries from the "Changelog" section of each PR description, create or update a changeset file in `.yml` format, and add this file to the new `changelogs/fragments` directory. The generated changeset file is automatically included as part of the changes to be merged when the PR is approved.

4. Implementing a script that, when manually triggered from the command line upon general availability of a new product version, will cull the `changelogs/fragments` directory for changeset files and use those files to populate the release notes for the new version.

Details on each of these changes are available in the "[Process Details](#process-details)" section below.

## Benefits of the New Process

The new changelog and release notes process improves both contributor experience as well as the efficiency of product development and release.

Previously, when a contributor opened a PR, they would be prompted to indicate whether or not they had manually added an entry to the changelog. However, they could not add an entry to the changelog without having a PR number to reference. 

This resulted in an inefficient two-step process, in which contributors had to (1) open a PR with their committed code and, once they had the PR number to reference in the changelog, (2) add an entry to the changelog, which then required pushing a new commit to their PR.

<!-- Add details about the previous process for creating release notes -->

## Process Details

This section discusses in greater detail the four primary changes listed in the "[Process Overview](#process-overview)" section above.

### 1. Creating a New `changelogs` Directory