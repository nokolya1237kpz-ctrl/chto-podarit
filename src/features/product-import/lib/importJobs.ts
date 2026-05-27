import 'server-only';

import { randomUUID } from 'node:crypto';
import { supabaseAdmin } from '@lib/supabase';

export type ImportJobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

export type ImportJob = {
  id: string;
  status: ImportJobStatus;
  progress: number;
  totalRows: number;
  processedRows: number;
  createdActive: number;
  createdDraft: number;
  duplicates: number;
  errorsCount: number;
  startedAt: string | null;
  finishedAt: string | null;
  source: string;
  filename: string;
  errorMessage?: string | null;
};

const memoryJobs = new Map<string, ImportJob>();

function rowToJob(row: any): ImportJob {
  return {
    id: row.id,
    status: row.status,
    progress: Number(row.progress || 0),
    totalRows: row.total_rows || 0,
    processedRows: row.processed_rows || 0,
    createdActive: row.created_active || 0,
    createdDraft: row.created_draft || 0,
    duplicates: row.duplicates || 0,
    errorsCount: row.errors_count || 0,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    source: row.source || 'file_import',
    filename: row.filename || '',
    errorMessage: row.error_message || null,
  };
}

function jobToRow(job: ImportJob) {
  return {
    id: job.id,
    status: job.status,
    progress: job.progress,
    total_rows: job.totalRows,
    processed_rows: job.processedRows,
    created_active: job.createdActive,
    created_draft: job.createdDraft,
    duplicates: job.duplicates,
    errors_count: job.errorsCount,
    started_at: job.startedAt,
    finished_at: job.finishedAt,
    source: job.source,
    filename: job.filename,
    error_message: job.errorMessage || null,
  };
}

export async function createImportJob(input: { totalRows: number; filename: string; source?: string }) {
  const job: ImportJob = {
    id: randomUUID(),
    status: 'queued',
    progress: 0,
    totalRows: input.totalRows,
    processedRows: 0,
    createdActive: 0,
    createdDraft: 0,
    duplicates: 0,
    errorsCount: 0,
    startedAt: null,
    finishedAt: null,
    source: input.source || 'file_import',
    filename: input.filename,
    errorMessage: null,
  };

  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin.from('import_jobs').insert(jobToRow(job)).select().single();
      if (!error && data) return rowToJob(data);
    } catch {}
  }

  memoryJobs.set(job.id, job);
  return job;
}

export async function getImportJob(id: string) {
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin.from('import_jobs').select('*').eq('id', id).maybeSingle();
      if (!error && data) return rowToJob(data);
    } catch {}
  }
  return memoryJobs.get(id) || null;
}

export async function updateImportJob(id: string, patch: Partial<ImportJob>) {
  const current = await getImportJob(id);
  if (!current) return null;
  const next = {
    ...current,
    ...patch,
    progress: patch.progress ?? Math.min(100, Math.round(((patch.processedRows ?? current.processedRows) / Math.max(1, patch.totalRows ?? current.totalRows)) * 100)),
  };

  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin.from('import_jobs').update(jobToRow(next)).eq('id', id).select().single();
      if (!error && data) return rowToJob(data);
    } catch {}
  }

  memoryJobs.set(id, next);
  return next;
}
