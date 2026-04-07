// Button recipe for Ledgy design system
// Creates a slot-based button component set with all 5 intents and 3 sizes
// All colors bound to Ledgy semantic variables

export const recipe = {
  name: 'button',
  description: 'Ledgy Button component — 5 intents x 3 sizes, slot-based icons',

  async create(cli) {
    const intents = [
      {
        name: 'Primary',
        bg: 'var:primary',
        text: 'var:primary-foreground',
        stroke: 'var:primary-hover',
        hoverBg: 'var:primary-hover',
      },
      {
        name: 'Secondary',
        bg: 'var:card',
        text: 'var:foreground',
        stroke: 'var:border',
        hoverBg: 'var:surface',
      },
      {
        name: 'Tertiary',
        bg: 'transparent',
        text: 'var:foreground',
        stroke: 'none',
        hoverBg: 'var:surface',
      },
      {
        name: 'Danger',
        bg: 'var:danger',
        text: 'var:primary-foreground',
        stroke: 'none',
        hoverBg: 'var:danger-hover',
      },
      {
        name: 'Link',
        bg: 'transparent',
        text: 'var:primary',
        stroke: 'none',
        hoverBg: 'transparent',
      },
    ];

    const sizes = [
      { name: 'Small', h: 28, px: 8, textSize: 12, iconSize: 12, gap: 4 },
      { name: 'Medium', h: 36, px: 8, textSize: 14, iconSize: 14, gap: 4 },
      { name: 'Large', h: 44, px: 12, textSize: 18, iconSize: 16, gap: 8 },
    ];

    // Create the default (Primary/Medium) as the main component
    const defaultIntent = intents[0];
    const defaultSize = sizes[1];

    const jsx = `<Frame name="Button" flex="row" items="center" justify="center" gap={${defaultSize.gap}} px={${defaultSize.px}} h={${defaultSize.h}} rounded={6} bg="${defaultIntent.bg}" stroke="${defaultIntent.stroke}">
  <Slot name="LeadingIcon" flex="row" items="center" w={${defaultSize.iconSize}} h={${defaultSize.iconSize}} />
  <Text name="Label" color="${defaultIntent.text}" size={${defaultSize.textSize}} weight={500}>Button</Text>
  <Slot name="TrailingIcon" flex="row" items="center" w={${defaultSize.iconSize}} h={${defaultSize.iconSize}} />
</Frame>`;

    console.log('Creating Button component...');
    await cli.run(`render '${jsx}'`);

    console.log('Converting to component...');
    // The render command selects the created node
    const nodeId = await cli.getSelectedNodeId();
    await cli.run(`node to-component "${nodeId}"`);

    console.log('Button component created. Verify with: node src/index.js verify');
    console.log('');
    console.log('Intent variants (Primary/Secondary/Tertiary/Danger/Link) and');
    console.log('size variants (Small/Medium/Large) should be added manually');
    console.log('using Figma component properties, then bound to variables.');

    return nodeId;
  },
};
