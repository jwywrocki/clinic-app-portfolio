import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { requireRole, isAuthError } from '@/lib/auth';
import { createBackupService } from '@/services';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, 'admin');
  if (isAuthError(auth)) return auth;

  try {
    const backupService = createBackupService();
    const { id: backupId } = params;

    const backupResult = await backupService.findCompletedById(backupId);
    if (backupResult.isFailure()) {
      throw backupResult.error;
    }

    const backup = backupResult.data;

    if (!backup) {
      return NextResponse.json(
        { error: 'Kopia zapasowa nie została znaleziona lub nie jest gotowa' },
        { status: 404 }
      );
    }

    const backupsDir = path.join(process.cwd(), 'backups');
    const filePath = path.join(backupsDir, backup.filename);

    try {
      await fs.access(filePath);

      const fileBuffer = await fs.readFile(filePath);
      const bytes = new Uint8Array(fileBuffer);

      return new Response(bytes, {
        status: 200,
        headers: {
          'Content-Type': 'application/sql',
          'Content-Disposition': `attachment; filename="${backup.filename}"`,
          'Content-Length': bytes.byteLength.toString(),
        },
      });
    } catch (fileError) {
      console.error('Backup file not found locally:', fileError);
      return NextResponse.json(
        { error: 'Plik kopii zapasowej nie jest dostępny' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in backup download:', error);
    return NextResponse.json({ error: 'Nieoczekiwany błąd serwera' }, { status: 500 });
  }
}
