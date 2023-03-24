# TableListView
An OpenDashboardsReact component

## Overview
TableListView is a component composed of several OUI modules, wrapped in a convenient way for flexibility of options and input data.  

The TableListView contains :
- OUI InMemoryTable, including pagination and sortable columns
- OUI SearchBar
- Create button child component or callback handler.

## Props
- createButton - JSX.Element (optinoal)

  - if provided, this element will be rendered at Right of SearchBox.  Element component and callback-handling is expected to be controlled by the component wrapping this TableListView.

- createItem - Function () => void (optional)

  - if provided, and no `createButton`, a default "Create" button will be rendered, using this prop function as callback to the default <Button> `onClick` handler.

- deleteItems - Function (items) ? (items: object[]): Promise<void> (optional)

  - if provided, upon multi-selection of one or more listed items, a "Delete x dashboard" button with "Trashcan" icon will be displayed, using this prop as `onClick` handler.

- editItem - Function (item: object): void (optional)

  - if provided, this function will be called with each item in the items collection.  The function is expected to perform any logic to display or navigate-to the "edit" view/page of the item.  The function returns no value.

- entityName - string
- entityNamePlural - string
- findItems - Function (query: string): Promise<{ total: number; hits: object[] }>

  - This function will be called any time the InMemoryTable requires refreshed items.
- listingLimit: number
- initialFilter: string
- initialPageSize: number
- noItemsFragment: JSX.Element
- tableColumns: Column[]
- tableListTitle: string
- toastNotifications: ToastsStart

- headingId: string (optional)
  - Id of the heading element describing the table. This id will be used as `aria-labelledby` of the wrapper element.  If the table is not empty, this component renders its own h1 element using the same id.
 