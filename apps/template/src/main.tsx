import { loadRuntimeConfig } from '@strateji/abp-react-core'

// Load runtime config from /dynamic-env.json BEFORE importing bootstrap.
// The dynamic import guarantees that userManager.ts (and any other module
// that reads `env` at module-initialisation time) is evaluated AFTER
// Object.assign has patched the env object with runtime values.
loadRuntimeConfig().then(async () => {
  const { mount } = await import('./bootstrap')
  mount()
})
