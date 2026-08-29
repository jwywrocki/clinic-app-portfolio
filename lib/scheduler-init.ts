import { initializeScheduler } from '@/lib/scheduler';

let initializationStarted = false;
const isProductionBuild = process.env.NEXT_PHASE === 'phase-production-build';

export async function ensureSchedulerInitialized() {
    if (typeof window !== 'undefined' || isProductionBuild) {
        return;
    }

    if (initializationStarted) {
        return;
    }

    initializationStarted = true;

    try {
        console.log('[SCHEDULER INIT] Inicjalizacja wbudowanego schedulera...');
        await initializeScheduler();
        console.log('[SCHEDULER INIT] Scheduler zainicjalizowany pomyślnie');
    } catch (error) {
        console.error('[SCHEDULER INIT] Błąd inicjalizacji schedulera:', error);
        initializationStarted = false;
    }
}

if (typeof window === 'undefined' && !isProductionBuild) {
    setTimeout(() => {
        ensureSchedulerInitialized();
    }, 1000);
}

export default ensureSchedulerInitialized;
