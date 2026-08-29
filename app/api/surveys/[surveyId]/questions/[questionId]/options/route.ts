import { NextResponse, type NextRequest } from 'next/server';
import { createSurveyService } from '@/services';
import { QuestionOptionData } from '@/lib/types/surveys';
import { NotFoundError } from '@/domain';
import { requireAuth, isAuthError } from '@/lib/auth';

const surveyService = createSurveyService();

export async function POST(
  request: NextRequest,
  { params }: { params: { surveyId: string; questionId: string } }
) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const { questionId } = params;
    const optionData = (await request.json()) as QuestionOptionData;
    if (!questionId) {
      return NextResponse.json({ error: 'Question ID is required in path' }, { status: 400 });
    }
    const newOption = await surveyService.addOptionToQuestion(questionId, optionData);
    if (newOption.isFailure()) {
      if (newOption.error instanceof NotFoundError) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 });
      }
      throw newOption.error;
    }
    return NextResponse.json(newOption.data, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/surveys/.../options:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
