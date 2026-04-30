# IMPLEMENTATION_PLAN

## 1. Overview
Replace the current dark Tailwind/Angular theme tokens with the light OKLCH palette defined in `.afa/VISUAL_MANIFEST.json`.
Keep the existing Angular shell/navigation structure, but rebind all shell-level colors to semantic CSS custom properties so the new palette is applied consistently across the app.
The implementation is frontend-only and must not change API contracts or backend behavior.

## 2. Folder structure and files to create
- `frontend/src/styles.css` (modify)
- `frontend/src/app/layout/shell.component.ts` (modify)
- `frontend/src/app/layout/sidebar.component.ts` (modify)
- `frontend/src/app/layout/topbar.component.ts` (modify)
- `frontend/src/app/layout/shell.component.spec.ts` (create)
- `frontend/src/app/layout/sidebar.component.spec.ts` (create)
- `frontend/src/app/layout/topbar.component.spec.ts` (create)
- `frontend/src/app/theme/theme-tokens.spec.ts` (create)
- `bootstrap.sh` (modify)
- `bootstrap.ps1` (modify)

## 2b. Visual Requirements
### Canonical color palette
Use the visual manifest as the source of truth and normalize the shared light palette into the existing semantic token set.

| Semantic token | Value / mapping |
|---|---|
| `--color-primary` | `oklch(0.52 0.19 250)` |
| `--color-primary-hover` | `oklch(0.44 0.19 250)` |
| `--color-background` | map to `--color-surface-subtle` |
| `--color-surface` | `oklch(0.98 0.00 0)` |
| `--color-surface-raised` | `oklch(1.00 0.00 0)` |
| `--color-surface-subtle` | `oklch(0.95 0.00 0)` |
| `--color-surface-overlay` | light overlay alias derived from raised/subtle surface; keep token for compatibility |
| `--color-border` | `oklch(0.88 0.00 0)` |
| `--color-text-primary` | `oklch(0.20 0.00 0)` |
| `--color-text-secondary` | `oklch(0.45 0.00 0)` |
| `--color-text-placeholder` | `oklch(0.65 0.00 0)` |
| `--color-danger` | `oklch(0.56 0.22 27)` |
| `--color-warning` | `oklch(0.75 0.17 75)` |
| `--color-success` | `oklch(0.60 0.17 150)` |
| `--color-sidebar-bg` | `oklch(0.96 0.00 0)` |
| `--color-topbar-bg` | `oklch(1.00 0.00 0)` |
| `--color-button-primary-text` | `oklch(1.00 0.00 0)` |
| `--color-button-secondary-bg` | `oklch(0.93 0.00 0)` |
| `--color-button-ghost-bg` | `oklch(0.95 0.005 240)` |
| `--color-button-ghost-text` | `oklch(0.30 0.02 250)` |

### Component-library / styling decisions
- Keep the existing Angular standalone + Tailwind CSS v4 stack.
- Do not introduce Angular Material or another UI kit; the manifest only requires shell, navigation, table, form, and button primitives already supported by Tailwind utilities and semantic tokens.
- Preserve `chart.js` / `ng2-charts` compatibility by keeping semantic chart tokens in `styles.css` and remapping them to the new palette.

### Layout strategy
- Preserve the manifest shell pattern: top-level column layout, horizontal body split, sidebar on desktop, collapsible navigation on mobile.
- Continue using Flex for shell/topbar/sidebar composition.
- Use Grid for content forms/tables where the manifest specifies multi-column layouts.
- Responsive breakpoints: mobile `<768px`, tablet `768px–1024px`, desktop `>1024px`.
- On mobile, keep the existing collapsible sidebar behavior and ensure full-width action buttons and single-column content sections.

### Visual tokens to enforce project-wide
- Font family: `Inter, system-ui, -apple-system, sans-serif`.
- Border radius: standardize interactive controls and cards on Tailwind `rounded-md`.
- Spacing scale: keep Tailwind defaults, but use a consistent semantic rhythm (`gap-2/4/6`, `p-4/6`, `px-4/6`).
- Do not use raw hard-coded OKLCH/hex values inside component templates once the global tokens exist.

## 3. Detailed implementation instructions per file
### `frontend/src/styles.css`
- Keep Tailwind v4 `@import "tailwindcss";` and the top-level `@theme` block.
- Replace the current dark palette tokens with the manifest light palette above.
- Keep existing semantic token names to avoid a broad refactor; add any missing manifest tokens needed by shell and form components (`--color-sidebar-bg`, `--color-topbar-bg`, `--color-text-placeholder`, button tokens).
- Preserve compatibility tokens already used elsewhere (`--color-background`, `--color-surface-overlay`, `--color-chart-1/2/3`) by remapping them to the new light palette instead of removing them.
- Remove the extra `Geist` fallback from `--font-sans`; align the font stack with the manifest.
- Update `html, body` defaults to use the light background/text tokens.
- Enforce the pattern: all global raw color values live only in `@theme`; component-level styles/templates must consume semantic tokens.

### `frontend/src/app/layout/shell.component.ts`
- Keep `ShellComponent` as the routing shell/container only; do not move business logic into it.
- Audit the inline template and any class bindings for dark-theme utilities (`bg-*`, `text-*`, `border-*`, opacity overlays) and replace them with semantic Tailwind classes backed by the updated theme tokens.
- Root wrapper should render with semantic background/text classes so routed pages inherit the new palette automatically.
- Preserve existing responsive behavior and interactions with `AppShellStore`; this file is a visual restyling pass, not a logic rewrite.

### `frontend/src/app/layout/sidebar.component.ts`
- Keep `NavItem` and `SidebarComponent` structure unchanged.
- Replace any hard-coded dark sidebar/background/hover/active classes with semantic equivalents based on `--color-sidebar-bg`, `--color-border`, `--color-primary`, `--color-primary-hover`, `--color-text-primary`, and `--color-text-secondary`.
- Active navigation state should use the primary brand color with accessible foreground text (`--color-button-primary-text`).
- Inactive, hover, and focus states must remain visually distinct in the light palette.
- Preserve mobile collapse/open behavior and existing navigation links.

### `frontend/src/app/layout/topbar.component.ts`
- Keep `TopbarComponent` responsibilities limited to shell header/navigation controls.
- Replace any dark topbar, divider, avatar, breadcrumb, button, and text classes with semantic token-based classes.
- Topbar surface must use `--color-topbar-bg` with `--color-border` dividers.
- Breadcrumbs/secondary text should use `--color-text-secondary`; primary controls/CTA states should use `--color-primary` and `--color-primary-hover`.
- Preserve existing actions, menus, and responsive behavior.

### `frontend/src/app/layout/shell.component.spec.ts`
- Create a focused shell smoke test using Angular TestBed.
- Verify the shell renders successfully with the routed layout container.
- Assert that the outer shell uses semantic theme classes rather than obsolete dark-specific classes.
- Verify no component initialization errors occur when the shell is created.

### `frontend/src/app/layout/sidebar.component.spec.ts`
- Create tests for default rendering, active navigation state, and mobile/sidebar toggle rendering.
- Assert navigation items render semantic theme classes for active/inactive states.
- Confirm no dark-theme-only utility classes remain in the rendered output.

### `frontend/src/app/layout/topbar.component.spec.ts`
- Create tests for topbar rendering, navigation/action controls, and secondary text presentation.
- Assert semantic classes are applied to the header container and primary controls.
- Include a no-console-error smoke assertion for component creation if the current test setup supports console spying.

### `frontend/src/app/theme/theme-tokens.spec.ts`
- Create a global-style verification spec.
- Read computed styles from `document.documentElement` and assert that the critical tokens are defined: primary, primary-hover, surface, surface-raised, surface-subtle, border, text-primary, text-secondary, danger, warning, success, sidebar-bg, topbar-bg.
- Add a regression assertion that the app no longer exposes the previous dark background token value.
- If chart tokens are still used in the app, also assert `--color-chart-1/2/3` remain defined.

### `bootstrap.sh`
- Keep the existing restore/install flow.
- Add frontend verification commands to the printed instructions: `cd frontend && npm run build` and `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless`.
- Keep backend restore instructions unchanged.
- Do not add feature-specific runtime dependencies or environment variables.

### `bootstrap.ps1`
- Mirror the shell script updates in PowerShell form.
- Keep restore/install logic unchanged.
- Add the same frontend verification commands to the final output block.

## 4. Dependencies
No new dependencies are required for this feature.

Relevant existing frontend packages that must remain compatible:
- `@angular/animations` `^20.0.0`
- `@angular/common` `^20.0.0`
- `@angular/compiler` `^20.0.0`
- `@angular/core` `^20.0.0`
- `@angular/forms` `^20.0.0`
- `@angular/platform-browser` `^20.0.0`
- `@angular/router` `^20.0.0`
- `tailwindcss` `^4.0.0`
- `@tailwindcss/postcss` `latest` (leave unchanged unless already pinned by lockfile)
- `chart.js` `^4.4.0`
- `ng2-charts` `^7.0.0`
- `jasmine-core` `~5.1.0`
- `karma` `~6.4.0`
- `karma-chrome-launcher` `~3.2.0`
- `karma-coverage` `~2.2.0`
- `karma-jasmine` `~5.1.0`
- `karma-jasmine-html-reporter` `~2.1.0`

## 5. Automated tests
Test files to create:
- `frontend/src/app/layout/shell.component.spec.ts`
- `frontend/src/app/layout/sidebar.component.spec.ts`
- `frontend/src/app/layout/topbar.component.spec.ts`
- `frontend/src/app/theme/theme-tokens.spec.ts`

Test coverage requirements:
- Global theme-token presence and regression coverage against the old dark palette.
- Shell, topbar, and sidebar rendering with semantic theme classes.
- Active/hover-ready navigation states remain visually differentiated after the palette swap.
- No console errors during component creation.
- Frontend verification command set: `npm run build` and `npm test -- --watch=false --browsers=ChromeHeadless`.

## 6. Acceptance criteria
- **All primary, secondary, accent, and neutral colors from `VISUAL_MANIFEST.json` are identified and documented**  
  Fulfilled by the canonical token mapping in section 2b and by keeping all semantic tokens centralized in `frontend/src/styles.css`.
- **Current color profile/theme configuration is located in the codebase**  
  Fulfilled by updating the existing global Tailwind theme definition in `frontend/src/styles.css`.
- **All color references in the codebase are updated to match `VISUAL_MANIFEST.json` specifications**  
  Fulfilled by replacing dark theme tokens globally and updating shell/topbar/sidebar components to consume only semantic token-driven classes.
- **Visual appearance of the application matches the design represented in `VISUAL_MANIFEST.json`**  
  Fulfilled by moving the app to the manifest’s light palette, font stack, border radius, and shell layout semantics.
- **No console warnings or errors related to undefined colors or styling**  
  Fulfilled by preserving compatibility tokens, adding token smoke tests, and running Angular build/test verification.
- **The change is tested across all major UI components (buttons, links, backgrounds, text, etc.)**  
  Fulfilled by shell/sidebar/topbar component tests plus the global theme-token spec.

## 7. Bootstrap scripts
### `bootstrap.sh`
- Keep command checks for `dotnet` and `npm`.
- Keep `dotnet restore backend/Greenfield.sln`.
- Keep `cd frontend && npm install`.
- Extend the final guidance block with:
  - `cd frontend && npm run build`
  - `cd frontend && npm test -- --watch=false --browsers=ChromeHeadless`
- Keep existing backend run instructions and API documentation URLs.

### `bootstrap.ps1`
- Mirror the shell script behavior for Windows developers.
- Keep `dotnet restore backend/Greenfield.sln` and frontend `npm install`.
- Extend the final guidance block with the same frontend build/test commands.
- Keep existing backend run instructions and API documentation URLs.
