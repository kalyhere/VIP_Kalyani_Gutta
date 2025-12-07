import React from 'react'
import type { Preview } from '@storybook/react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { withThemeFromJSXProvider } from '@storybook/addon-themes'
import theme from '../packages/aimms-web-frontend/src/theme'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      toc: true,
    },
  },
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    withThemeFromJSXProvider({
      themes: {
        light: theme,
        dark: theme,
      },
      defaultTheme: 'light',
      Provider: ThemeProvider,
      GlobalStyles: CssBaseline,
    }),
  ],
}

export default preview
