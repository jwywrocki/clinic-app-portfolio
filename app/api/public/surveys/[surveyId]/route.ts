import { NextResponse } from 'next/server';
import { createSurveyService } from '@/services';
import { NotFoundError } from '@/domain';

const surveyService = createSurveyService();

export async function GET(request: Request, { params }: { params: { surveyId: string } }) {
  try {
    const { surveyId } = params;
    const surveyResult = await surveyService.getPublishedSurveyForPage(surveyId);
    if (surveyResult.isFailure()) {
      if (surveyResult.error instanceof NotFoundError) {
        return NextResponse.json({ error: 'Survey not found or not published' }, { status: 404 });
      }
      throw surveyResult.error;
    }

    // Add caching headers for better performance
    const response = NextResponse.json(surveyResult.data);
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

    return response;
  } catch (error: any) {
    console.error('Error in GET /api/public/surveys/[surveyId]:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
