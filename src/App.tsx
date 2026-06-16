import { renderApp } from '@fayz-ai/core'
import { defineSaas } from '@fayz-ai/saas'
import { agencyOsAppConfig } from './config/app'

const agencyOsManifest = defineSaas(agencyOsAppConfig)

export function App() {
  return renderApp(agencyOsManifest, { surface: 'admin' })
}
