import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { getImportJob, updateImportJob } from '@features/product-import/lib/importJobs';
import { processImportBatch } from '@features/product-import/lib/processImportBatch';

export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) return NextResponse.json({ success: false, error: 'Нет доступа' }, { status: 401 });

  try {
    const body = await request.json();
    const jobId = String(body.jobId || '');
    const rows = Array.isArray(body.items) ? body.items : [];
    const mapping = body.columnMapping || {};
    const detectedDelimiter = body.detectedDelimiter || '';

    if (!jobId) return NextResponse.json({ success: false, error: 'Не передан ID импорта' }, { status: 400 });
    if (!rows.length) return NextResponse.json({ success: false, error: 'Пустой batch импорта' }, { status: 400 });

    const job = await getImportJob(jobId);
    if (!job) return NextResponse.json({ success: false, error: 'Задача импорта не найдена' }, { status: 404 });
    if (job.status === 'cancelled') return NextResponse.json({ success: false, error: 'Импорт отменён' }, { status: 409 });

    await updateImportJob(jobId, {
      status: 'processing',
      startedAt: job.startedAt || new Date().toISOString(),
    });

    const report = await processImportBatch({
      rows,
      mapping,
      detectedDelimiter,
      maxReports: 20,
    });

    const processedRows = Math.min(job.totalRows, job.processedRows + rows.length);
    const status = processedRows >= job.totalRows ? 'completed' : 'processing';
    const updatedJob = await updateImportJob(jobId, {
      status,
      processedRows,
      createdActive: job.createdActive + report.createdActive,
      createdDraft: job.createdDraft + report.createdDraft,
      duplicates: job.duplicates + report.skippedDuplicate + report.skippedAlreadyInBatch,
      errorsCount: job.errorsCount + report.saveErrors + report.skippedNoTitle,
      finishedAt: status === 'completed' ? new Date().toISOString() : null,
    });

    return NextResponse.json({
      success: true,
      job: updatedJob,
      report,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Ошибка обработки batch импорта' }, { status: 500 });
  }
}
