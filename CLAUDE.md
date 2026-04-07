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

The file has a font variable `type/fontFamilies/sans` = Aeonik Pro.

**`render` uses the default font (Inter), not Aeonik Pro.** After rendering text, fix the font via eval:

```bash
node src/index.js eval '
(async () => {
  await figma.loadFontAsync({family: "Aeonik Pro", style: "Medium"});
  const node = figma.currentPage.selection[0];
  const text = node.type === "TEXT" ? node : node.children?.find(c => c.type === "TEXT");
  if (text) text.fontName = {family: "Aeonik Pro", style: "Medium"};
  return text?.fontName;
})()
'
```

Styles: Regular (400), Medium (500), SemiBold (600), Bold (700). Or use text styles which include the font.

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
- `render` sets font to Inter, not Aeonik Pro — fix via eval or text styles.
- `render-batch` does NOT render text properly in Safe Mode.
- Daemon has 60s timeout — `daemon restart` if commands fail.
- Connection is file-specific — switching Figma files requires reconnecting.
