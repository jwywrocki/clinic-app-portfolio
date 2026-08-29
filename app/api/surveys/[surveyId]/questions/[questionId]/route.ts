import { NextResponse, type NextRequest } from 'next/server';
import { createSurveyService } from '@/services';
import { QuestionData } from '@/lib/types/surveys';
import { NotFoundError } from '@/domain';
import { requireAuth, isAuthError } from '@/lib/auth';

const surveyService = createSurveyService();

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
