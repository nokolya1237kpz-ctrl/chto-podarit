CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL,
  product_id uuid NULL,
  query text NULL,
  category text NULL,
  marketplace text NULL,
  user_session text NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analytics_events_event_idx
ON analytics_events(event);

CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx
ON analytics_events(created_at DESC);

CREATE INDEX IF NOT EXISTS analytics_events_product_id_idx
ON analytics_events(product_id);
