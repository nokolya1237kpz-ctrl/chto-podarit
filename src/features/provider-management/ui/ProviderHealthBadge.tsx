import { StatusPill } from '@components/common';

export function ProviderHealthBadge({ status, enabled = true }: { status: string; enabled?: boolean }) {
  if (!enabled) {
    return <StatusPill status="disabled" label="Выключен" />;
  }

  if (status === 'searchable') {
    return <StatusPill status="active" label="Ищет товары" />;
  }

  if (status === 'configured') {
    return <StatusPill status="warning" label="Настроен" />;
  }

  if (status === 'reachable') {
    return <StatusPill status="warning" label="Отвечает" />;
  }

  if (status === 'empty') {
    return <StatusPill status="warning" label="Нет товаров по запросу" />;
  }

  if (status === 'limited') {
    return <StatusPill status="limited" label="Ограничен" />;
  }

  if (status === 'failed' || status === 'error') {
    return <StatusPill status="error" label="Ошибка" />;
  }

  return <StatusPill status={status} label={status || 'Нет данных'} />;
}
