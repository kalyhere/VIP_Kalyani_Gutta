import type { StorybookConfig } from '@storybook/react-vite'
import { mergeConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const config: StorybookConfig = {
  stories: [
    '../packages/aimms-web-frontend/src/**/*.mdx',
    '../packages/aimms-web-frontend/src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-links',
    '@chromatic-com/storybook',
    '@storybook/addon-themes',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {},
  async viteFinal(config) {
    return mergeConfig(config, {
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '../packages/aimms-web-frontend/src'),
          '@components': path.resolve(__dirname, '../packages/aimms-web-frontend/src/components'),
          '@hooks': path.resolve(__dirname, '../packages/aimms-web-frontend/src/hooks'),
          '@utils': path.resolve(__dirname, '../packages/aimms-web-frontend/src/utils'),
          '@lib': path.resolve(__dirname, '../packages/aimms-web-frontend/src/lib'),
          '@types': path.resolve(__dirname, '../packages/aimms-web-frontend/src/types'),
          '@services': path.resolve(__dirname, '../packages/aimms-web-frontend/src/services'),
          '@contexts': path.resolve(__dirname, '../packages/aimms-web-frontend/src/contexts'),
          '@constants': path.resolve(__dirname, '../packages/aimms-web-frontend/src/constants'),
        },
      },
    })
  },
}

export default config
