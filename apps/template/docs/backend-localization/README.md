# Backend localization for the SPA's UI strings

The template's UI labels (menu, page titles, form fields, messages) are resolved
through ABP localization using **bare keys** like `Menu:Users`, `UserName`,
`DeleteUserConfirm`, … against your backend's **default localization resource**
(the one returned as `localization.defaultResourceName` in
`/api/abp/application-configuration`, e.g. `AbpDemo` / `MyApp`).

If those keys are **not defined** in your backend resource, `useL` falls back to
the hardcoded Turkish string in the component — so the UI shows Turkish in every
language (only ABP's own `AbpUi::…` / `AbpAccount::…` strings switch). This is the
usual cause of "the language switcher doesn't translate the menu".

## Fix — add these keys to your backend resource

`en.json` and `tr.json` here contain all 134 keys the template uses, in ABP's
localization file format (`{ "culture": ..., "texts": { ... } }`).

1. Find your backend's localization folder, e.g.
   `src/<YourProject>.Domain.Shared/Localization/<YourProject>/`.
2. **Merge** the `texts` entries from `en.json` / `tr.json` here into your
   resource's `en.json` / `tr.json` (keep your existing keys like `AppName`).
3. These `.json` files are usually **embedded resources** — rebuild the backend
   (`dotnet build`) and restart it so the new texts are served.
4. Reload the SPA → switch language → the menu/titles now localize too.

> Add more languages by creating `<culture>.json` in the same backend folder with
> the same keys. Adjust any wording to taste — these are starting points.
