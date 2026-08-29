import { type NextRequest, NextResponse } from 'next/server';
import { createSurveyService } from '@/services';
import { SurveyData, SurveySubmission } from '@/lib/types/surveys';
import { requireAuth, isAuthError } from '@/lib/auth';
import { NotFoundError } from '@/domain';

const surveyService = createSurveyService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const exportSurveyId = searchParams.get('exportSurveyId');

    if (id) {
      // Admin: get survey by id
      const auth = await requireAuth(request);
      if (isAuthError(auth)) return auth;

      const surveyResult = await surveyService.getSurveyById(id);
      if (surveyResult.isFailure()) {
        if (surveyResult.error instanceof NotFoundError) {
          return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
        }
        throw surveyResult.error;
      }
      return NextResponse.json(surveyResult.data);
    }

    if (exportSurveyId) {
      // Admin: export survey responses
      const authExport = await requireAuth(request);
      if (isAuthError(authExport)) return authExport;

      const responsesResult = await surveyService.getSurveyResponsesForExport(exportSurveyId);
      if (responsesResult.isFailure()) {
        throw responsesResult.error;
      }
      const responses = responsesResult.data;

      if (responses.length === 0) {
        return NextResponse.json({ message: 'No responses to export' }, { status: 200 });
      }

      const headers = Object.keys(responses[0]!);
      const csvRows = [
        headers.join(','),
        ...responses.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(',')),
      ];
      const csvContent = csvRows.join('\n');
      return new Response(csvContent, {
        status: 200,
        headers: {
          'Content-Disposition': `attachment; filename="survey_${exportSurveyId}_export.csv"`,
          'Content-Type': 'text/csv',
        },
      });
    }

    // Admin: list all surveys
    const authList = await requireAuth(request);
    if (isAuthError(authList)) return authList;

    const surveysResult = await surveyService.getAllSurveys();
    if (surveysResult.isFailure()) {
      throw surveysResult.error;
    }
    return NextResponse.json(surveysResult.data);
  } catch (error: any) {
    console.error('Error in GET /api/surveys:', error);
    return NextResponse.json({ error: 'Failed to fetch surveys' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.answers && body.survey_id) {
      // Public survey submission — no auth required
      const submission = body as SurveySubmission;

      // Validate submission
      if (!Array.isArray(submission.answers) || submission.answers.length === 0) {
        return NextResponse.json(
          {
            error: 'Brak odpowiedzi w ankiecie',
            details: 'Musisz odpowiedzieć na co najmniej jedno pytanie aby wysłać ankietę',
          },
          { status: 400 }
        );
      }

      // Validate each answer
      for (const answer of submission.answers) {
        if (!answer.question_id) {
          return NextResponse.json(
            {
              error: 'Nieprawidłowe dane ankiety',
              details: 'Każda odpowiedź musi być powiązana z pytaniem',
            },
            { status: 400 }
          );
        }
      }

      const responseResult = await surveyService.submitSurveyResponse(submission);
      if (responseResult.isFailure()) {
        throw responseResult.error;
      }
      return NextResponse.json(
        { message: 'Survey submitted successfully', responseId: responseResult.data },
        { status: 201 }
      );
    } else {
      // Admin: create new survey — requires auth
      const auth = await requireAuth(request);
      if (isAuthError(auth)) return auth;

      const surveyData = body as SurveyData;
      const newSurvey = await surveyService.createSurvey(surveyData);
      if (newSurvey.isFailure()) {
        throw newSurvey.error;
      }
      return NextResponse.json(newSurvey.data, { status: 201 });
    }
  } catch (error: any) {
    console.error('[API /surveys POST] Error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Survey ID is required' }, { status: 400 });
    }
    const updates = (await request.json()) as Partial<SurveyData>;
    const updatedSurvey = await surveyService.updateSurvey(id, updates);
    if (updatedSurvey.isFailure()) {
      if (updatedSurvey.error instanceof NotFoundError) {
        return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
      }
      throw updatedSurvey.error;
    }
    return NextResponse.json(updatedSurvey.data);
  } catch (error: any) {
    console.error('Error in PUT /api/surveys:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Survey ID is required' }, { status: 400 });
    }
    const deleted = await surveyService.deleteSurvey(id);
    if (deleted.isFailure()) {
      if (deleted.error instanceof NotFoundError) {
        return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
      }
      throw deleted.error;
    }
    return NextResponse.json({ message: 'Survey deleted successfully' });
  } catch (error: any) {
    console.error('Error in DELETE /api/surveys:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
