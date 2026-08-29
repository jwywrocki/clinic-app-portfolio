import { NextRequest, NextResponse } from 'next/server';
import { createSettingsService, createBackupService } from '@/services';
import { ensureSchedulerInitialized } from '@/lib/scheduler-init';
import { handleAutoBackup, handleBackupCleanup, calculateNextBackupTime } from '@/lib/backup-utils';
import { requireRole, isAuthError } from '@/lib/auth';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const settingsService = createSettingsService();

async function authenticateSchedulerRequest(request: NextRequest): Promise<NextResponse | null> {
  const session = await requireRole(request, 'admin');
  if (!isAuthError(session)) return null;

  const authHeader = request.headers.get('authorization') || '';
  const secretKey = process.env.SCHEDULER_SECRET_KEY;

  if (!secretKey) {
    console.error('SCHEDULER_SECRET_KEY not configured');
    return NextResponse.json({ error: 'Konfiguracja serwera nieprawidłowa' }, { status: 500 });
  }

  const expected = `Bearer ${secretKey}`;
  const isValid =
    authHeader.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected));

  if (!isValid) {
    return NextResponse.json({ error: 'Nieautoryzowany dostęp' }, { status: 401 });
  }

  return null;
}

export async function POST(request: NextRequest) {
  await ensureSchedulerInitialized();

  try {
    const authError = await authenticateSchedulerRequest(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const taskType = searchParams.get('task');

    switch (taskType) {
      case 'backup':
        const backupResult = await handleAutoBackup();
        return NextResponse.json(backupResult);
      case 'cleanup':
        const cleanupResult = await handleBackupCleanup();
        return NextResponse.json(cleanupResult);
      case 'all':
        const allBackupResult = await handleAutoBackup();
        const allCleanupResult = await handleBackupCleanup();
        return NextResponse.json({
          backup: allBackupResult,
          cleanup: allCleanupResult,
          message: 'Wszystkie zadania schedulera zostały wykonane',
        });
      default:
        return NextResponse.json({ error: 'Nieznany typ zadania' }, { status: 400 });
    }
  } catch (error) {
    console.error('Scheduler error:', error);
    return NextResponse.json({ error: 'Błąd wykonania zadań schedulera' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const authError = await authenticateSchedulerRequest(request);
  if (authError) return authError;

  await ensureSchedulerInitialized();

  try {
    const backupService = createBackupService();
    const settingsResult = await settingsService.getAllAsMap();
    if (settingsResult.isFailure()) {
      throw settingsResult.error;
    }
    const settingsMap = settingsResult.data;

    const lastBackupResult = await backupService.findLatestByType('automatic');
    if (lastBackupResult.isFailure()) {
      throw lastBackupResult.error;
    }
    const lastBackup = lastBackupResult.data;

    const frequency = settingsMap.db_backup_frequency || 'daily';
    const nextBackup = calculateNextBackupTime(lastBackup?.created_at ?? null, frequency);

    const retentionDays = parseInt(settingsMap.db_backup_retention_days || '30');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const allBackupsResult = await backupService.listAll();
    if (allBackupsResult.isFailure()) {
      throw allBackupsResult.error;
    }
    const allBackups = allBackupsResult.data;

    const oldBackups = allBackups.filter(
      (b: any) => b.status === 'completed' && new Date(b.created_at) < cutoffDate
    );

    const completedBackups =
      allBackups?.filter((backup: any) => backup.status === 'completed') || [];
    const failedBackups = allBackups?.filter((backup: any) => backup.status === 'failed') || [];
    const inProgressBackups =
      allBackups?.filter((backup: any) => backup.status === 'in_progress') || [];

    const backupsDir = path.join(process.cwd(), 'backups');
    let physicalBackupsCount = 0;

    try {
      const files = fs.readdirSync(backupsDir);
      physicalBackupsCount = files.filter((file: string) => file.endsWith('.sql')).length;
    } catch (error) {
      console.error('Error reading backups directory:', error);
    }

    return NextResponse.json({
      scheduler_status: 'active',
      backup_enabled: settingsMap.db_backup_enabled === 'true',
      backup_frequency: frequency,
      retention_days: retentionDays,
      last_backup: lastBackup
        ? {
            created_at: lastBackup.created_at,
            status: lastBackup.status,
          }
        : null,
      next_backup: nextBackup,
      total_backups_count: allBackups?.length || 0,
      completed_backups_count: completedBackups.length,
      failed_backups_count: failedBackups.length,
      in_progress_backups_count: inProgressBackups.length,
      physical_backups_count: physicalBackupsCount,
      old_backups_count: oldBackups?.length || 0,
      old_backups:
        oldBackups?.map((b: any) => ({
          id: b.id,
          filename: b.filename,
          created_at: b.created_at,
        })) || [],
    });
  } catch (error) {
    console.error('Error getting scheduler status:', error);
    return NextResponse.json({ error: 'Błąd pobierania statusu schedulera' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  await ensureSchedulerInitialized();

  try {
    const authError = await authenticateSchedulerRequest(request);
    if (authError) return authError;

    const { restartScheduler, getSchedulerStatus } = await import('@/lib/scheduler');

    await restartScheduler();

    const status = getSchedulerStatus();

    return NextResponse.json({
      success: true,
      message: 'Scheduler został zrestartowany',
      scheduler_status: status,
    });
  } catch (error) {
    console.error('Error restarting scheduler:', error);
    return NextResponse.json({ error: 'Błąd restartu schedulera' }, { status: 500 });
  }
}
