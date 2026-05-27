import { StatusPill } from '@components/common';

export function ProviderHealthBadge({ status, enabled = true }: { status: string; enabled?: boolean }) {
  if (!enabled) {
    return <StatusPill status="disabled" label="Выключен" />;
  }

  if (status === 'active') {
    return <StatusPill status="active" label="Работает" />;
  }

  if (status === 'limited') {
    return <StatusPill status="limited" label="Ограничен" />;
  }

  if (status === 'error') {
    return <StatusPill status="error" label="Ошибка" />;
  }

  return <StatusPill status={status} label={status || 'Нет данных'} />;
}
