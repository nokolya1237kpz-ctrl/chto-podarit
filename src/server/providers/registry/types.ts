export type ProviderHealthStatus = 'active' | 'limited' | 'disabled' | 'error';

export type ProviderRegistryItem = {
  id: string;
  displayName: string;
  supportsSearch: boolean;
  supportsImport: boolean;
  supportsPriceRefresh: boolean;
  rateLimit?: {
    maxRequestsPerHour: number;
    crawlDelaySeconds: number;
  };
  cooldown?: {
    until?: string;
    reason?: string;
  };
  health: ProviderHealthStatus;
};
