import { NextResponse, type NextRequest } from 'next/server';
import { createSurveyService } from '@/services';
import { QuestionData } from '@/lib/types/surveys';
import { NotFoundError } from '@/domain';
import { requireAuth, isAuthError } from '@/lib/auth';

const surveyService = createSurveyService();

export async function POST(request: NextRequest, { params }: { params: { surveyId: string } }) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const { surveyId } = params;
    const questionData = (await request.json()) as QuestionData;
    if (!surveyId) {
      return NextResponse.json({ error: 'Survey ID is required in path' }, { status: 400 });
    }
    const newQuestion = await surveyService.addQuestionToSurvey(surveyId, questionData);
    if (newQuestion.isFailure()) {
      if (newQuestion.error instanceof NotFoundError) {
        return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
      }
      throw newQuestion.error;
    }
    return NextResponse.json(newQuestion.data, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/surveys/[surveyId]/questions:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { surveyId: string; questionId: string } }
) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const { questionId } = params;
    const updates = (await request.json()) as Partial<QuestionData>;
    if (typeof updates.order_no === 'number') {
      const updatedQuestionOrder = await surveyService.updateQuestionOrder(
        questionId,
        updates.order_no
      );
      if (updatedQuestionOrder.isFailure()) {
        if (updatedQuestionOrder.error instanceof NotFoundError) {
          return NextResponse.json({ error: 'Question not found' }, { status: 404 });
        }
        throw updatedQuestionOrder.error;
      }
      return NextResponse.json(updatedQuestionOrder.data);
    }
    const updatedQuestion = await surveyService.updateQuestion(questionId, updates);
    if (updatedQuestion.isFailure()) {
      if (updatedQuestion.error instanceof NotFoundError) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 });
      }
      throw updatedQuestion.error;
    }
    return NextResponse.json(updatedQuestion.data);
  } catch (error: any) {
    console.error('Error in PUT /api/surveys/[surveyId]/questions/[questionId]:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { surveyId: string; questionId: string } }
) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const { questionId } = params;
    const deleted = await surveyService.deleteQuestion(questionId);
    if (deleted.isFailure()) {
      if (deleted.error instanceof NotFoundError) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 });
      }
      throw deleted.error;
    }
    return NextResponse.json({ message: 'Question deleted successfully' });
  } catch (error: any) {
    console.error('Error in DELETE /api/surveys/[surveyId]/questions/[questionId]:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
