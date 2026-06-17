import { configureClient } from '@yakupsogut/abp-react-core'
import { loadRuntimeConfig } from '@/lib/env'

// Load runtime config, hand it to core via configureClient, THEN import bootstrap
// (which pulls core auth/api). configureClient must run before any auth/API use.
loadRuntimeConfig().then(async (config) => {
  configureClient(config)
  const { mount } = await import('./bootstrap')
  mount()
})
