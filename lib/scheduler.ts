import cron from 'node-cron';
import { createSettingsService } from '@/services';

const log = (message: string) => {
  console.log(`[SCHEDULER ${new Date().toISOString()}] ${message}`);
};

let isInitialized = false;
const runningTasks = new Set<string>();
const activeTasks = new Map<string, any>();

export async function initializeScheduler() {
  if (isInitialized) {
    log('Scheduler już jest zainicjalizowany');
    return;
  }

  try {
    log('Inicjalizacja wbudowanego schedulera...');

    const settings = await getBackupSettings();

    if (!settings.db_backup_enabled) {
      log('Automatyczne backupy są wyłączone w ustawieniach');
      return;
    }

    await setupCronJobs(settings);

    setupCleanupJob();

    isInitialized = true;
    log(`Scheduler zainicjalizowany pomyślnie. Częstotliwość: ${settings.db_backup_frequency}`);
  } catch (error) {
    console.error('[SCHEDULER ERROR] Błąd inicjalizacji schedulera:', error);
  }
}

async function getBackupSettings() {
  try {
    const settingsService = createSettingsService();
    const settingsResult = await settingsService.getAllAsMap();
    if (settingsResult.isFailure()) {
      throw settingsResult.error;
    }
    const settingsMap = settingsResult.data;

    return {
      db_backup_enabled: settingsMap.db_backup_enabled === 'true',
      db_backup_frequency: settingsMap.db_backup_frequency || 'daily',
      db_backup_retention_days: parseInt(settingsMap.db_backup_retention_days || '30'),
    };
  } catch (error) {
    log(`Błąd pobierania ustawień: ${error}`);
    return {
      db_backup_enabled: false,
      db_backup_frequency: 'daily',
      db_backup_retention_days: 30,
    };
  }
}

async function setupCronJobs(settings: { db_backup_frequency: string }) {
  const { db_backup_frequency } = settings;

  activeTasks.forEach((task, name) => {
    if (name.startsWith('backup-')) {
      task.stop();
      task.destroy();
      activeTasks.delete(name);
    }
  });

  let cronExpression: string;

  switch (db_backup_frequency) {
    case 'hourly':
      cronExpression = '0 * * * *'; // Every hour at the start of the hour
      break;
    case 'daily':
      cronExpression = '0 2 * * *'; // Every day at 2:00 AM
      break;
    case 'weekly':
      cronExpression = '0 2 * * 1'; // Every Monday at 2:00 AM
      break;
    case 'monthly':
      cronExpression = '0 2 1 * *'; // 1st day of the month at 2:00 AM
      break;
    default:
      cronExpression = '0 2 * * *'; // Default to daily
  }

  const backupTask = cron.schedule(
    cronExpression,
    async () => {
      await executeScheduledBackup();
    },
    {
      timezone: 'Europe/Warsaw',
    }
  );

  backupTask.start();

  activeTasks.set('backup-automatic', backupTask);

  log(`Zadanie backup skonfigurowane: ${cronExpression} (${db_backup_frequency})`);
}

function setupCleanupJob() {
  const cleanupTask = cron.schedule(
    '0 3 * * *',
    async () => {
      await executeScheduledCleanup();
    },
    {
      timezone: 'Europe/Warsaw',
    }
  );

  cleanupTask.start();

  activeTasks.set('cleanup-automatic', cleanupTask);

  log('Zadanie cleanup skonfigurowane: 0 3 * * * (codziennie o 3:00)');
}

async function executeScheduledBackup() {
  const taskId = 'scheduled-backup';

  if (runningTasks.has(taskId)) {
    log('Backup już jest w trakcie wykonywania, pomijam...');
    return;
  }

  runningTasks.add(taskId);
  log('Uruchamiam zaplanowany backup...');

  try {
    const settings = await getBackupSettings();
    if (!settings.db_backup_enabled) {
      log('Automatyczne backupy zostały wyłączone, pomijam zadanie');
      return;
    }

    const response = await fetch(
      `http://localhost:${process.env.PORT || 4000}/api/admin/scheduler?task=backup`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.SCHEDULER_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.ok) {
      const result = await response.json();
      log(`Backup zakończony pomyślnie: ${result.message}`);
    } else {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
  } catch (error) {
    console.error('[SCHEDULER ERROR] Błąd podczas wykonywania backupu:', error);
  } finally {
    runningTasks.delete(taskId);
  }
}

async function executeScheduledCleanup() {
  const taskId = 'scheduled-cleanup';

  if (runningTasks.has(taskId)) {
    log('Cleanup już jest w trakcie wykonywania, pomijam...');
    return;
  }

  runningTasks.add(taskId);
  log('Uruchamiam zaplanowane czyszczenie...');

  try {
    const response = await fetch(
      `http://localhost:${process.env.PORT || 4000}/api/admin/scheduler?task=cleanup`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.SCHEDULER_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.ok) {
      const result = await response.json();
      log(`Cleanup zakończony pomyślnie: ${result.message}`);
    } else {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
  } catch (error) {
    console.error('[SCHEDULER ERROR] Błąd podczas wykonywania cleanup:', error);
  } finally {
    runningTasks.delete(taskId);
  }
}

export async function restartScheduler() {
  log('Restart schedulera...');

  activeTasks.forEach((task, name) => {
    if (name.startsWith('backup-') || name.startsWith('cleanup-')) {
      task.stop();
      task.destroy();
    }
  });

  activeTasks.clear();

  isInitialized = false;
  await initializeScheduler();
}

export function getSchedulerStatus() {
  const backupTask = activeTasks.get('backup-automatic');
  const cleanupTask = activeTasks.get('cleanup-automatic');

  return {
    initialized: isInitialized,
    runningTasks: Array.from(runningTasks),
    activeTasks: activeTasks.size,
    scheduledTasks: {
      backup: backupTask
        ? {
            running: true,
            expression: '(dynamiczne, oparte na ustawieniach)',
          }
        : null,
      cleanup: cleanupTask
        ? {
            running: true,
            expression: '0 3 * * *',
          }
        : null,
    },
  };
}

export function stopScheduler() {
  log('Zatrzymywanie schedulera...');

  activeTasks.forEach((task, name) => {
    if (name.startsWith('backup-') || name.startsWith('cleanup-')) {
      task.stop();
      task.destroy();
    }
  });

  activeTasks.clear();
  runningTasks.clear();
  isInitialized = false;
  log('Scheduler zatrzymany');
}
