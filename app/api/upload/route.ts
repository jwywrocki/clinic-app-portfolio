import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join, extname } from 'path';
import { stat, mkdir } from 'fs/promises';
import { requireAuth, isAuthError } from '@/lib/auth';

// SVG is intentionally excluded because active content served from the same
// origin could execute in an authenticated user's browser.
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.ico']);

const MAGIC_BYTES: Array<{ ext: string[]; bytes: number[]; offset?: number }> = [
  { ext: ['.jpg', '.jpeg'], bytes: [0xff, 0xd8, 0xff] },
  { ext: ['.png'], bytes: [0x89, 0x50, 0x4e, 0x47] },
  { ext: ['.gif'], bytes: [0x47, 0x49, 0x46, 0x38] },
  { ext: ['.webp'], bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // RIFF header; WEBP at offset 8
  { ext: ['.ico'], bytes: [0x00, 0x00, 0x01, 0x00] },
];

function validateMagicBytes(buffer: Buffer, extension: string): boolean {
  for (const sig of MAGIC_BYTES) {
    if (!sig.ext.includes(extension)) continue;
    const offset = sig.offset ?? 0;
    if (buffer.length < offset + sig.bytes.length) return false;
    const matches = sig.bytes.every((b, i) => buffer[offset + i] === b);
    if (matches) return true;
  }
  return false;
}

async function ensureDirExists(dirPath: string) {
  try {
    await stat(dirPath);
  } catch (e: any) {
    if (e.code === 'ENOENT') {
      await mkdir(dirPath, { recursive: true });
    } else {
      throw e;
    }
  }
}

export async function POST(request: NextRequest) {
  // Require authentication
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Validate extension (whitelist)
    const ext = extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        {
          success: false,
          error: `File type '${ext}' is not allowed. Allowed: ${[...ALLOWED_EXTENSIONS].join(', ')}`,
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate magic bytes to prevent MIME spoofing
    if (!validateMagicBytes(buffer, ext)) {
      return NextResponse.json(
        { success: false, error: 'File content does not match its extension' },
        { status: 400 }
      );
    }

    // Define the path to the public/uploads directory
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    await ensureDirExists(uploadsDir);

    // Special handling for favicon
    if (type === 'favicon') {
      // For favicon, save to public directory as favicon.ico
      const faviconPath = join(process.cwd(), 'public', 'favicon.ico');
      await writeFile(faviconPath, buffer);

      return NextResponse.json({
        success: true,
        url: '/favicon.ico',
        filePath: '/favicon.ico',
        filename: 'favicon.ico',
        size: file.size,
        type: file.type,
      });
    }

    // Regular file upload
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${originalName}`;
    const filePath = join(uploadsDir, filename);
    const publicPath = `/uploads/${filename}`;

    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      url: publicPath,
      filePath: publicPath,
      filename,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: 'Failed to upload file' }, { status: 500 });
  }
}
