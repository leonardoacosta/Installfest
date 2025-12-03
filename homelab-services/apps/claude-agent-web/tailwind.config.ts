import type { Config } from 'tailwindcss'
import baseConfig from '@homelab/ui/tailwind.config'

export default {
  presets: [baseConfig],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
} satisfies Config
