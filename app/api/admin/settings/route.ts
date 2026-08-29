import { NextRequest, NextResponse } from 'next/server';
import { createSettingsService } from '@/services';
import { requireRole, isAuthError } from '@/lib/auth';
import { revalidateTag } from 'next/cache';

const settingsService = createSettingsService();

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, 'admin');
  if (isAuthError(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key) {
      const settingResult = await settingsService.getByKey(key);
      if (settingResult.isFailure()) {
        throw settingResult.error;
      }
      return NextResponse.json(settingResult.data || { key, value: null });
    } else {
      const settingsResult = await settingsService.getAll();
      if (settingsResult.isFailure()) {
        throw settingsResult.error;
      }
      return NextResponse.json(settingsResult.data || []);
    }
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authPost = await requireRole(request, 'admin');
  if (isAuthError(authPost)) return authPost;

  try {
    const body = await request.json();
    const { settings, userId } = body;

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json({ error: 'Settings array is required' }, { status: 400 });
    }

    const results = await settingsService.bulkUpsert(settings, userId ?? null);
    if (results.isFailure()) {
      throw results.error;
    }
    revalidateTag('site-settings');

    return NextResponse.json({
      success: true,
      updated: results.data.length,
      settings: results.data,
    });
  } catch (error) {
    console.error('Error bulk updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const authPut = await requireRole(request, 'admin');
  if (isAuthError(authPut)) return authPut;

  try {
    const body = await request.json();
    const { key, value, userId, description } = body;

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    const result = await settingsService.upsert(key, value, userId ?? null, description ?? null);
    if (result.isFailure()) {
      throw result.error;
    }
    revalidateTag('site-settings');

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error updating setting:', error);
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const authDel = await requireRole(request, 'admin');
  if (isAuthError(authDel)) return authDel;

  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    const deleteResult = await settingsService.deleteByKey(key);
    if (deleteResult.isFailure()) {
      throw deleteResult.error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting setting:', error);
    return NextResponse.json({ error: 'Failed to delete setting' }, { status: 500 });
  }
}
