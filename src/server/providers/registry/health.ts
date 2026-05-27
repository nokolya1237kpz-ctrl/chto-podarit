import { providerRegistry } from './registry';

export function getProviderHealth() {
  return providerRegistry.map(({ id, displayName, health, cooldown }) => ({ id, displayName, health, cooldown }));
}
