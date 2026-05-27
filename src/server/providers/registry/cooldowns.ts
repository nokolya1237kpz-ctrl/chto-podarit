const cooldowns = new Map<string, { until: number; reason: string }>();

export function setProviderCooldown(providerId: string, ms: number, reason: string) {
  cooldowns.set(providerId, { until: Date.now() + ms, reason });
}

export function getProviderCooldown(providerId: string) {
  const cooldown = cooldowns.get(providerId);
  if (!cooldown) return null;
  if (cooldown.until < Date.now()) {
    cooldowns.delete(providerId);
    return null;
  }
  return cooldown;
}
