## Summary

<!--
  Summarize your PR. This will be included in our newsletter

  - The summary is intended for a consumer audience, avoid any internal or implementation details. You can include those in the details section.
  - Generally only `fix:` and `feat:` PRs will be included in the newsletter. Also, PRs with BREAKING CHANGES are added.
  - Describe the feature or fix as you would if you were advertising it in the newsletter:
      - ❌ : This commit close the request `#123` and adds the prop `helloWorld` to `Settings`
      - ✅ : The `helloWorld` prop is now available in the `Settings` component to bring joy when rendering the chart.
      - ❌ : Fixing the tooltip position outside the chart area avoiding overflows.
      - ✅ : The tooltip no longer overflows the chart DOM container when using the `tooltip.boundary = 'chart'` in the `Settings` component.
  - Add a clear screenshot or animated gif as an example if the change can be understood better and easier with a visual aid.
  - If the PR involves a bigger feature, please add more context to it, describing why the feature was added, what actually improve, and how the users can leverage it to improve their data visualizations
  - If the PR involves a breaking change include the following part and clearly state which contract is broken:

    ### BREAKING CHANGE
    The `tooltip.boundary` prop in the `Settings` component now only accepts a single DOM element ID.
-->



<!-- screenshot/gif/mpeg-4 for visual changes -->


## Details

<!-- Details beyond the summary to explain nuances -->


## Issues

<!--
  Issues this pr is fixing or closing

  e.g.

  This completes a missing feature requested by APM regarding the tooltip positioning #921
  fix #1108
-->



### Checklist

<!-- Delete any items that are not applicable to this PR. -->
- [ ] The proper chart type label was added (e.g. :xy, :partition) if the PR involves a specific chart type
- [ ] The proper feature label was added (e.g. :interactions, :axis) if the PR involves a specific chart feature
- [ ] Whenever possible, please check if the closing issue is connected to a running GH project
- [ ] Any consumer-facing exports were added to `src/index.ts` (and stories only import from `../src` except for test data & storybook)
- [ ] This was checked for cross-browser compatibility
- [ ] Proper documentation or storybook story was added for features that require explanation or tutorials
- [ ] Unit tests were updated or added to match the most common scenarios
