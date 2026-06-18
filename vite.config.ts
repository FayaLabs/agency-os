import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { existsSync } from 'fs'

const fayzSdk = resolve(__dirname, '../../fayz-sdk')
const useLocalSdk = process.env.FAYZ_SDK_SOURCE !== 'published'

const localSdkAliases = {
  '@fayz-ai/sdk': resolve(fayzSdk, 'packages/sdk/src'),
  '@fayz-ai/core': resolve(fayzSdk, 'packages/core/src'),
  '@fayz-ai/auth': resolve(fayzSdk, 'packages/auth/src'),
  '@fayz-ai/ui': resolve(fayzSdk, 'packages/ui/src'),
  '@fayz-ai/saas': resolve(fayzSdk, 'packages/saas/src'),
  '@fayz-ai/courses': resolve(fayzSdk, 'packages/courses/src'),
  '@fayz-ai/db': resolve(fayzSdk, 'packages/db/src'),
  // Reused domain plugins
  '@fayz-ai/plugin-dashboard': resolve(fayzSdk, 'plugins/plugin-dashboard/src'),
  '@fayz-ai/plugin-agenda': resolve(fayzSdk, 'plugins/plugin-agenda/src'),
  '@fayz-ai/plugin-crm': resolve(fayzSdk, 'plugins/plugin-crm/src'),
  '@fayz-ai/plugin-financial': resolve(fayzSdk, 'plugins/plugin-financial/src'),
  '@fayz-ai/plugin-forms': resolve(fayzSdk, 'plugins/plugin-forms/src'),
  '@fayz-ai/plugin-reports': resolve(fayzSdk, 'plugins/plugin-reports/src'),
  '@fayz-ai/plugin-courses': resolve(fayzSdk, 'plugins/plugin-courses/src'),
  '@fayz-ai/plugin-tasks': resolve(fayzSdk, 'plugins/plugin-tasks/src'),
  // New agency modules (built in this repo)
  '@fayz-ai/plugin-conversations': resolve(fayzSdk, 'plugins/plugin-conversations/src'),
  '@fayz-ai/plugin-marketing': resolve(fayzSdk, 'plugins/plugin-marketing/src'),
  '@fayz-ai/plugin-automations': resolve(fayzSdk, 'plugins/plugin-automations/src'),
  '@fayz-ai/plugin-sites': resolve(fayzSdk, 'plugins/plugin-sites/src'),
  '@fayz-ai/plugin-reputation': resolve(fayzSdk, 'plugins/plugin-reputation/src'),
}

const sdkAliases =
  useLocalSdk && existsSync(resolve(fayzSdk, 'packages/core/src/index.ts'))
    ? localSdkAliases
    : {}

const sdkExclude = useLocalSdk ? Object.keys(localSdkAliases) : []

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      ...sdkAliases,
    },
    dedupe: ['react', 'react-dom'],
    conditions: useLocalSdk ? ['source', 'browser', 'module', 'jsnext:main', 'jsnext'] : undefined,
  },
  optimizeDeps: {
    exclude: sdkExclude,
  },
  server: {
    port: 5190,
    fs: {
      allow: [__dirname, fayzSdk],
    },
  },
})
