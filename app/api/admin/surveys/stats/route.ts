import { type NextRequest, NextResponse } from 'next/server';
import { createSurveyService } from '@/services';
import { requireRole, isAuthError } from '@/lib/auth';

const surveyService = createSurveyService();

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, 'admin');
  if (isAuthError(auth)) return auth;

  try {
    const stats = await surveyService.getStats();
    if (stats.isFailure()) {
      throw stats.error;
    }
    return NextResponse.json(stats.data);
  } catch (error) {
    console.error('Surveys stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
