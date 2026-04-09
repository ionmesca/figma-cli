# ledgy-figma-cli

Figma CLI for Ledgy's design system. Forked from silships/figma-cli. Controls Figma Desktop directly via CDP — no API key needed.

## Connection

```bash
node src/index.js connect        # Yolo mode (recommended, patches Figma once)
node src/index.js connect --safe  # Safe mode (uses plugin, no patching)
```

After connecting: `node src/index.js canvas info` to verify.

**Connection is file-specific.** Switching files in Figma requires running `connect` again. If commands fail with "fetch failed", run `daemon restart` or `connect` again.

## Variable Binding

Use `bind` to attach Figma variables from ANY collection (including TailwindCSS):

```bash
node src/index.js bind fill "color/primary/500"     # select a node first
node src/index.js bind stroke "color/primary/600"
node src/index.js bind list                          # show available variables
```

The Figma file has a TailwindCSS collection with 379 color variables. Use `bind` with the variable path (e.g., `color/primary/500`, `color/slate/200`, `color/white`).

**Do NOT use `var:` syntax** — it only searches shadcn collections and will silently fall back to #808080 if no shadcn collection exists.

## Creating Components

Use `render` for frame creation (has smart positioning), then bind variables after:

```bash
# 1. Render the frame structure
node src/index.js render '<Frame name="Button" flex="row" items="center" justify="center" gap={4} px={8} h={36} rounded={6}><Frame name="LeadingIcon" w={16} h={16} /><Text name="Label" size={14} weight={500}>Button</Text><Frame name="TrailingIcon" w={16} h={16} /></Frame>'

# 2. Select the rendered node and bind variables
node src/index.js bind fill "color/primary/500"
node src/index.js bind stroke "color/primary/600"

# 3. Convert to component
node src/index.js node to-component "NODE_ID"

# 4. Convert icon frames to slots
node src/index.js slot convert "LEADING_ICON_ID"
node src/index.js slot convert "TRAILING_ICON_ID"
```

### Slots

Create slots by rendering plain `<Frame>` elements, then converting:

```bash
node src/index.js slot convert "FRAME_ID"        # convert existing frame to slot
node src/index.js slot preferred "SLOT_ID" "COMP_ID_1" "COMP_ID_2"  # set preferred instances
```

**Do NOT use `<Slot>` in JSX** — it doesn't render reliably (children after the first Slot may be dropped). Use `<Frame>` then `slot convert`.

**Do NOT use `eval` with `isSlot = true`** — it doesn't create proper slots. Always use `slot convert`.

**`slot convert` reorders children.** After converting frames to slots, re-fix the order with `parent.insertChild(index, node)`. Always verify child ordering after slot operations.

### Replacing Slot Content in Instances

Use `slot replace` to populate slots in component instances without detaching:

```bash
node src/index.js slot replace "SLOT_NODE_ID" -c '[
  {"componentId": "6322:3608", "properties": {"Show LeadingIcon#6323:134": true}, "text": "Pause Sending"},
  {"componentId": "6322:3590", "text": "Add Transaction"}
]'
```

Each item: `componentId` (required), `properties` (optional setProperties object), `text` (optional — string for "Label", array of `[{name, value}]`, or object `{NodeName: "value"}`).

**Do NOT use `setProperties()`, `remove()`, or `findOne()` directly on default slot children** — they permanently break all sublayer IDs. Use `slot replace` instead.

## Text Styles

The Figma file has text styles (text-xs through text-9xl with weight variants). Apply via eval:

```bash
node src/index.js eval '
(async () => {
  const styles = await figma.getLocalTextStylesAsync();
  const style = styles.find(s => s.name === "text-sm/medium");
  const node = figma.currentPage.selection[0];
  const textNode = node.children?.find(c => c.type === "TEXT");
  if (textNode && style) textNode.textStyleId = style.id;
  return textNode?.textStyleId;
})()
'
```

Available text styles: text-xs, text-sm, text-base, text-lg, text-xl, text-2xl through text-9xl. Each has weight variants: thin, extralight, light, normal, medium, semibold, bold, extrabold.

Format: `text-{size}/{weight}` (e.g., `text-sm/medium`, `text-lg/semibold`).

## Effect Styles

The Figma file has shadow effect styles. Apply via eval:

```bash
node src/index.js eval '
(async () => {
  const styles = await figma.getLocalEffectStylesAsync();
  const shadow = styles.find(s => s.name === "shadow/sm");
  const node = figma.currentPage.selection[0];
  if (node && shadow) node.effectStyleId = shadow.id;
  return node?.effectStyleId;
})()
'
```

Available: shadow/sm, shadow/base, shadow/md, shadow/lg, shadow/xl, shadow/2xl, shadow/inner.

Primary/secondary/danger buttons use shadow/sm (maps to Tailwind shadow-xs).

## Font

**Always use text styles** instead of manual font loading. Text styles set the correct font (Aeonik Pro), size, and weight in one call:

```javascript
var textStyles = await figma.getLocalTextStylesAsync();
var style = textStyles.find(s => s.name === "text-sm/medium");
textNode.textStyleId = style.id;
```

`render` creates text in Inter. Applying a text style immediately after fixes both font and size. Never use `figma.loadFontAsync` + manual `fontName` — use text styles.

Available Aeonik Pro styles: Regular, Medium, Bold (and others). Text style format: `text-{size}/{weight}` — e.g., `text-sm/medium`, `text-lg/semibold`, `text-xl/bold`.

## Icons

Font Awesome Sharp SVGs are in `icons/` (square-optimized from `svgs-full`). These are the exact icons used in the Ledgy codebase.

Place an icon via eval:

```bash
node src/index.js eval '
(async () => {
  const resp = await fetch("file:///PATH_TO_REPO/icons/sharp-solid/user.svg");
  const svg = await resp.text();
  const icon = figma.createNodeFromSvg(svg);
  icon.resize(16, 16);
  icon.name = "icon-user";
  return icon.id;
})()
'
```

**Icon naming:** SVG filenames are kebab-case (e.g., `arrow-right.svg`, `chart-line.svg`). The codebase imports use camelCase with `fa` prefix (e.g., `faArrowRight`, `faChartLine`). To convert: strip `fa`, kebab-case the rest.

**368 icons are actively used** in the codebase, imported as 16x16 components on the "Icons" page. Default fill: `color/slate/500` (variable-bound). **Always use these existing components** — never create new icon components. Find them: `iconsPage.findOne(n => n.type === "COMPONENT" && n.name === "icon/chevron-down")`. Use `svgs-full` (square-optimized) only when importing NEW icons not yet on the Icons page.

**Families:** sharp-solid (primary, used for most UI), sharp-regular (outlined variant, used for secondary emphasis).

**Icon color overrides:** Override fill on the VECTOR CHILDREN inside the icon instance, not the outer frame. Setting fill on the outer frame creates a colored square over the icon. Pattern:
```javascript
function setVecColor(node, varName) {
  for (var i = 0; i < (node.children || []).length; i++) {
    var ch = node.children[i];
    if (ch.fills && ch.fills.length > 0 && ch.type !== "FRAME" && ch.type !== "INSTANCE") {
      ch.fills = [bp(varName)]; // bp = setBoundVariableForPaint helper
    }
    if (ch.children) setVecColor(ch, varName);
  }
}
```

**Swapping icons in instances:** When using a Button instance and need a different icon in a slot:
```javascript
var slot = btnInstance.children.find(c => c.name === "LeadingIcon");
var iconInst = slot.children.find(c => c.type === "INSTANCE");
var targetComp = figma.getNodeById("ICON_COMPONENT_ID");
iconInst.swapComponent(targetComp);
```

**Batch import script:** `bash scripts/batch-import-icons.sh /tmp/used-icons.txt 10` — imports icons from filter file into the current Figma page.

## Component Building Rules

When creating or modifying Figma components for Ledgy:

### Naming
- Component names MUST match `@ledgy/library-ui` exports: `Select` not "TextField with chevron"
- Layer names must be semantic: `LabelRow`, `InputRow`, `ErrorMessage` — never `Frame 47`

### Icon Properties (INSTANCE_SWAP — preferred)

For icons in component sets with variants, use INSTANCE_SWAP properties. This lets users swap icons from the properties panel without detaching instances:

```javascript
// Add INSTANCE_SWAP property at component set level
compSet.addComponentProperty("Icon", "INSTANCE_SWAP", defaultIconComp.id);
// Link each variant's icon instance to the property
var propKey = Object.keys(compSet.componentPropertyDefinitions).find(function(k) {
  return compSet.componentPropertyDefinitions[k].type === "INSTANCE_SWAP";
});
iconInstance.componentPropertyReferences = { mainComponent: propKey };
```

For components with optional leading/trailing icons, use the triple pattern:
1. Boolean toggle: `Show LeadingIcon` (BOOLEAN, default false)
2. Instance swap: `LeadingIcon` (INSTANCE_SWAP, default to icon from Icons page)
3. Correct color: vector fills bound to the component's text color variable per variant

**Never use native slots (`slot convert`) for icons** — slots are for content areas where users drag in arbitrary components (like NavGroup children or NavBar content). Icons need INSTANCE_SWAP for clean property-panel swapping.

### Structure
- **clipContent on containers** — when composing AddOn + Input side-by-side, container gets `cornerRadius + clipsContent = true`, children get cornerRadius = 0. Solves dynamic rounding.
- **Hug content** — set `primaryAxisSizingMode = "AUTO"` AFTER `resize()` (resize can override it). Components with optional content (description, error, panel) MUST hug — fixed height breaks show/hide toggles.
- **strokesIncludedInLayout = true** — when a frame uses both stroke and padding (like CSS `border + padding`), set this so the stroke is part of the layout. Without it, stroke overlaps with padding and content sits too close to the edge.
- **No spacer frames** — use `layoutGrow = 1` on the element that should fill space
- **Form-level add-ons stay form-level** — NumberField has no built-in EUR prefix. The form wraps it.
- **Composition components use slots, not boolean toggles** — when a container accepts arbitrary children (PageHeader actions, NavigationTabList tabs), use `slot convert` for the content area. Pre-populate with realistic defaults. Don't use show/hide booleans for variable-count content.

### Using Existing Components
- Always use `icon/*` components from the Icons page. Never create duplicate icon components.
- Always use Badge component (6325:681) for badges and counters — never create placeholder frames.
- Always read DESIGN.md Section 4 registry before building — the component may already exist.
- When composing screens, instantiate named field components (TextField, Select, DatePicker) not raw Input.
- Verify against the code CVA before choosing colors/icons — Select uses `faChevronDown`, DatePicker uses `faAngleDown`.
- Button and Link are visually identical in Figma — use the existing Button component for both.

### Verification (after every component create/update)
1. All fills/strokes use variable bindings (no hardcoded hex)
2. All text nodes have text styles applied (Aeonik Pro, not Inter)
3. Icons from Icons page, colored with correct variable
4. Auto-layout frames hug content
5. `verify` screenshot taken

## Recipes

```bash
node src/index.js recipes create button   # Create Ledgy button component
```

Recipes produce slot-based components. See `src/recipes/` for available recipes.

## Verification

```bash
node src/index.js verify               # Screenshot of selection
node src/index.js verify "NODE_ID"     # Screenshot of specific node
```

## JSX Pitfalls

### Silent Prop Mistakes

Wrong prop names fail silently — no error, just broken output:

| WRONG | RIGHT |
|-------|-------|
| `fill="#fff"` | `bg="#fff"` |
| `padding={24}` | `p={24}` |
| `cornerRadius={12}` | `rounded={12}` |
| `fontSize={18}` | `size={18}` |
| `fontWeight="bold"` | `weight="bold"` |
| `layout="horizontal"` | `flex="row"` |
| `justify="between"` | use `grow={1}` spacer |

### Text Gets Cut Off

Every `<Text>` that could be multi-word **must** have `w="fill"`, and its parent must have `w="fill"` or a fixed width.

```jsx
// BAD — text clips
<Frame flex="col" gap={8}>
  <Text size={14}>Long label text here</Text>
</Frame>

// GOOD — text wraps
<Frame flex="col" gap={8} w="fill">
  <Text size={14} w="fill">Long label text here</Text>
</Frame>
```

### eval Positioning

`render` has smart positioning. `eval` does not — elements land at (0,0). When using eval, find the rightmost edge first:

```javascript
const maxX = Math.max(0, ...figma.currentPage.children.map(n => n.x + n.width)) + 100;
```

### Other Rules

- Absolute positioned elements must have a `name` prop or x/y is ignored.
- Never delete existing nodes on the canvas — users' work must be preserved.
- Load fonts with `figma.loadFontAsync()` BEFORE creating any text in eval.
- Keep each render/eval call focused — split complex layouts to avoid 60s timeout.
- Use `render-batch` with `-d row|col` and `-g <gap>` for multiple frames at once.

## Key Rules

1. **Use `render` for frames** — has smart positioning.
2. **Use `bind` for variables** — works with all collections. Never use `var:`.
3. **Use `<Frame>` + `slot convert` for slots** — not JSX `<Slot>`.
4. **Use text styles when possible** — `text-sm/medium` includes Aeonik Pro + correct sizing.
5. **Use effect styles for shadows** — `shadow/sm` not hardcoded values.
6. **Set font to Aeonik Pro** — render defaults to Inter.
7. **Convert to component** with `node to-component` after render.
8. **Verify after every creation.**
9. **Reconnect after switching files** — `connect` or `daemon restart`.

## Gotchas

- `var:` only searches shadcn collections — use `bind` instead.
- `<Slot>` in JSX drops sibling elements — use `<Frame>` then `slot convert`.
- `render` sets font to Inter — always apply a text style after rendering text.
- `slot convert` reorders children — re-fix ordering with `insertChild` after. Also reparents slots to the component root instead of keeping them in the parent frame. Always `appendChild` slots back into their intended container after conversion.
- eval variable names persist across daemon calls — use IIFEs or `daemon restart` to clear.
- Icon color: target vector children inside instances, not the outer frame.
- `render-batch` does NOT render text properly in Safe Mode.
- Daemon has 60s timeout — `daemon restart` if commands fail.
- Connection is file-specific — switching Figma files requires reconnecting.
- `fetch("file://...")` does NOT work in eval — read SVG content on disk and pass inline instead.
- `layoutSizingHorizontal = "FILL"` must be set AFTER appending node to an auto-layout parent. Setting it before throws an error.
- Remote variable bindings: always use LOCAL TailwindCSS collection. Rebind remote vars with `setBoundVariableForPaint`: `var fills = JSON.parse(JSON.stringify(node.fills)); fills[0] = figma.variables.setBoundVariableForPaint(fills[0], "color", localVar); node.fills = fills;`
- Re-apply local text styles to fix remote typography bindings — `textNode.textStyleId = localStyle.id` replaces all remote type vars at once.
- Daemon times out on large evals (>30 lines). Break complex operations into small sequential evals. Use ES5 syntax (var, function()) — some eval contexts don't support arrow functions or const/let.
- Aeonik Pro has no "Semibold" font style — use "Bold". Available: Regular, Medium, Bold, Light, Thin, Black, Air. Always `loadFontAsync` before changing text characters in eval.
- `layoutPositioning = "ABSOLUTE"` must be set AFTER appending node to an auto-layout parent. Setting before throws "parent node has layoutMode NONE" error.
- Instance sublayers in slots become permanently inaccessible after any mutation (`setProperties`/`remove`/`findOne` throw "does not exist"). Only `swapComponent()` survives. **Use `slot replace` command** to populate slots — it swaps defaults to an invisible placeholder then appends pre-configured real instances. See "Replacing Slot Content in Instances" section above.
- `findOne()` on nodes containing instances with slots crashes when it traverses into broken sublayer IDs. Use direct child indexing (`parent.children[0]`) when you know the structure.
- Multiple `await figma.loadFontAsync()` in loops cause timeouts. Preload ONCE at start via temp instance: `var tmp = comp.createInstance(); await figma.loadFontAsync(tmp.findOne(fn).fontName); tmp.remove();`
- `deleteComponentProperty(key)` removes a component property. NOT `removeComponentProperty` (doesn't exist). Key includes the hash suffix (e.g., `"Show Badge#6412:7"`).
- `strokeWeight` returns a Symbol when per-side weights differ. Use `strokeTopWeight`, `strokeBottomWeight`, `strokeLeftWeight`, `strokeRightWeight` instead.
- `figma.createText()` defaults to Inter Regular. Load Inter BEFORE setting `.characters`, then apply a text style to fix to Aeonik Pro.
- On ETIMEDOUT: restart daemon immediately (`daemon restart`). Don't retry the same eval — the daemon is stale.
- Plan full component transformations before executing. Map all changes (fills, strokes, properties, slots), then batch into minimal evals. Don't patch incrementally.

## Batch Operations

When creating multiple similar items (nav items, form fields, list rows), use the **items array pattern** — 5-10x faster than one eval per item:

```javascript
(async function() {
  var def = figma.getNodeById("COMPONENT_ID");
  // Preload font ONCE
  var tmp = def.createInstance();
  await figma.loadFontAsync(tmp.findOne(function(n){return n.type==="TEXT";}).fontName);
  tmp.remove();

  var items = [
    {n:"Home", ic:"6320:2074"},
    {n:"Settings", ic:"6320:1801", chevron:true, badge:true}
  ];

  for (var i = 0; i < items.length; i++) {
    var it = def.createInstance();
    it.name = items[i].n;
    parent.appendChild(it);
    it.layoutSizingHorizontal = "FILL";
    it.findOne(function(n){return n.name==="Label"&&n.type==="TEXT";}).characters = items[i].n;
    it.findOne(function(n){return n.name==="Icon"&&n.type==="INSTANCE";}).swapComponent(figma.getNodeById(items[i].ic));
    if (items[i].chevron) it.findOne(function(n){return n.name==="Chevron";}).visible = true;
    if (items[i].badge) it.findOne(function(n){return n.name==="Badge";}).visible = true;
  }
  return items.length + " items added";
})()
```

Rules for fast evals:
- **One eval per logical group** (5-10 similar items), not one eval per item.
- **Direct child access** (`parent.children[0]`) over `findOne()` when structure is known.
- **Preload fonts once**, never inside loops.
- **Keep under ~40 lines** for simple operations (no nested async). Under 25 for complex ones.
