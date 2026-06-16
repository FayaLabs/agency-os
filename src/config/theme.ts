import type { SaasTheme } from '@fayz-ai/saas'

/**
 * Agency OS theme — GoHighLevel-inspired: dark slate sidebar, indigo brand,
 * light content surface.
 */
export const agencyTheme: SaasTheme = {
  name: 'Agency OS',
  preset: 'classic_admin',
  brand: '243 75% 59%', // indigo-600
  radius: 'round',
  shadow: 'subtle',
  font: 'inter',
  sidebar: {
    background: '222 47% 11%', // slate-900
    foreground: '215 20% 80%',
    border: '222 30% 20%',
    accent: '243 60% 30%',
    accentForeground: '0 0% 100%',
    muted: '215 16% 55%',
  },
  content: {
    background: '210 20% 98%',
  },
  colors: {
    card: '0 0% 100%',
    cardForeground: '222 47% 14%',
    secondary: '210 20% 96%',
    secondaryForeground: '222 40% 18%',
    muted: '210 16% 94%',
    mutedForeground: '215 14% 45%',
    border: '214 18% 90%',
    input: '214 18% 90%',
  },
}
