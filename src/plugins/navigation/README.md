# navigation

The navigation plugins exports the `TopNavMenu` component.
It also provides a stateful version of it on the `start` contract.

## navigation.ui.TopNavMenu

The `naivgation.ui` module exposes the `TopNavMenu` component that features The search bar, time filter and menu options to be used across the app in multiple locations. It primarity consists of 2 components:

- Menu options: Options to show on the menu bar alongside the breadcrumbs
- Search bar: The [`data.ui.SearchBar`](../data/public/ui/search_bar/) component responsible for the query bar, time filter and field filters.

Most of the logic for the component resides in the `SearchBar` component. This simply adds a way to add menu options on top of the search bar.
