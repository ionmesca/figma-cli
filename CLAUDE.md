# ledgy-figma-cli

Figma CLI for Ledgy's design system. Forked from silships/figma-cli. Controls Figma Desktop directly via CDP — no API key needed.

## Connection

```bash
node src/index.js connect        # Yolo mode (recommended, patches Figma once)
node src/index.js connect --safe  # Safe mode (uses plugin, no patching)
```

After connecting: `node src/index.js canvas info` to verify.

## Ledgy Tokens

```bash
node src/index.js tokens preset ledgy    # Load Ledgy semantic tokens
```

This creates a semantic collection with Light mode, mapping to the existing TailwindCSS primitive variables in Figma. Run once per file.

The Figma file already has a TailwindCSS collection with 379 primitive color variables. The Ledgy preset adds a semantic layer on top.

## Creating Components

Always use `render` with JSX syntax and `var:` bindings:

```bash
node src/index.js render '<Frame name="Button" flex="row" items="center" gap={4} px={8} py={0} h={36} rounded={6} bg="var:primary" stroke="var:primary-hover">
  <Text color="var:primary-foreground" size={14} weight={500}>Label</Text>
</Frame>'
```

After render, convert to component:
```bash
node src/index.js node to-component "NODE_ID"
```

### Slots

Create flexible content areas (not variants):
```bash
node src/index.js slot create "SlotName" --flex row --gap 4
node src/index.js slot preferred "SLOT_ID" "COMP_ID_1" "COMP_ID_2"
```

Or inline in JSX:
```jsx
<Slot name="LeadingIcon" flex="row" w={16} h={16} />
```

**Critical:** `isSlot = true` does NOT work via eval. Always use `slot convert` or JSX `<Slot>`.

### Variable Binding

Always use `var:name` syntax. Maps to the semantic collection created by `tokens preset ledgy`:

| var: name | Resolves to |
|-----------|------------|
| var:primary | primary-500 (#4920F5) |
| var:primary-hover | primary-600 (#3313C6) |
| var:primary-foreground | white |
| var:foreground | slate-600 |
| var:heading | slate-800 |
| var:border | slate-200 |
| var:border-hover | slate-300 |
| var:disabled-bg | slate-100 |
| var:danger | red-500 |
| var:success | emerald-500 |
| var:card | white |
| var:surface | slate-50 |
| var:ring | primary-200 |

## Recipes

```bash
node src/index.js recipes create button   # Create Ledgy button component
```

Recipes produce slot-based components with variables bound. See `src/recipes/` for available recipes.

## Verification

After creating anything visual, always verify:

```bash
node src/index.js verify               # Screenshot of selection
node src/index.js verify "NODE_ID"     # Screenshot of specific node
```

## Key Rules

1. **Always use `render` for creating frames** — it has smart positioning.
2. **Never use `eval` to create visual elements** — no positioning, overlaps at (0,0).
3. **Always bind colors with `var:`** — no hardcoded hex values.
4. **Convert to component with `node to-component`** after render.
5. **Use `slot convert`** for slots, never `eval` with `isSlot = true`.
6. **Verify after every creation** with the `verify` command.
7. **Font is Aeonik Pro** — set `weight={500}` for medium, `weight={600}` for semibold.

## Gotchas

- `render-batch` does NOT render text properly in Safe Mode. Use individual `render` commands.
- The daemon has a 60s timeout. For long operations, check `daemon status` and `daemon restart`.
- Variable names are case-sensitive and must match the semantic collection exactly.
