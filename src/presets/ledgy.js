// Ledgy token preset for figma-ds-cli
// Maps to the TailwindCSS variable collection in Figma
// Only includes actively used scales — full Tailwind palette already exists in Figma

export const preset = {
  name: 'ledgy',
  description: 'Ledgy design system tokens — primary + slate + status colors',

  collections: {
    primitives: {
      // Primary scale (brand purple)
      'color/primary/100': '#EAE5FD',
      'color/primary/200': '#C1B5F5',
      'color/primary/300': '#9A86F0',
      'color/primary/400': '#755BEC',
      'color/primary/500': '#4920F5',
      'color/primary/600': '#3313C6',
    },

    semantic: {
      modes: ['Light'],
      values: {
        Light: {
          // Surfaces
          'background': '{color/white}',
          'surface': '{color/slate/50}',
          'card': '{color/white}',

          // Text
          'foreground': '{color/slate/600}',
          'heading': '{color/slate/800}',
          'muted': '{color/slate/500}',
          'placeholder': '{color/slate/400}',

          // Interactive
          'primary': '{color/primary/500}',
          'primary-hover': '{color/primary/600}',
          'primary-foreground': '{color/white}',

          // Borders
          'border': '{color/slate/200}',
          'border-hover': '{color/slate/300}',

          // States
          'disabled-bg': '{color/slate/100}',
          'disabled-text': '{color/slate/300}',
          'danger': '{color/red/500}',
          'danger-hover': '{color/red/700}',
          'success': '{color/emerald/500}',
          'warning-bg': '{color/yellow/100}',
          'warning-text': '{color/yellow/800}',

          // Focus
          'ring': '{color/primary/200}',
        },
      },
    },
  },

  typography: {
    fontFamily: 'Aeonik Pro',
  },
};
