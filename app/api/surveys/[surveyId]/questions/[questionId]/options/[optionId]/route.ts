import { NextResponse, type NextRequest } from 'next/server';
import { createSurveyService } from '@/services';
import { QuestionOptionData } from '@/lib/types/surveys';
import { NotFoundError } from '@/domain';
import { requireAuth, isAuthError } from '@/lib/auth';

const surveyService = createSurveyService();

export async function PUT(
  request: NextRequest,
  { params }: { params: { surveyId: string; questionId: string; optionId: string } }
) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const { optionId } = params;
    const updates = (await request.json()) as Partial<QuestionOptionData>;
    if (typeof updates.order_no === 'number') {
      const updatedOptionOrder = await surveyService.updateOptionOrder(optionId, updates.order_no);
      if (updatedOptionOrder.isFailure()) {
        if (updatedOptionOrder.error instanceof NotFoundError) {
          return NextResponse.json({ error: 'Option not found' }, { status: 404 });
        }
        throw updatedOptionOrder.error;
      }
      return NextResponse.json(updatedOptionOrder.data);
    }
    const updatedOption = await surveyService.updateQuestionOption(optionId, updates);
    if (updatedOption.isFailure()) {
      if (updatedOption.error instanceof NotFoundError) {
        return NextResponse.json({ error: 'Option not found' }, { status: 404 });
      }
      throw updatedOption.error;
    }
    return NextResponse.json(updatedOption.data);
  } catch (error: any) {
    console.error('Error in PUT /api/surveys/.../options/[optionId]:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { surveyId: string; questionId: string; optionId: string } }
) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const { optionId } = params;
    const deleted = await surveyService.deleteQuestionOption(optionId);
    if (deleted.isFailure()) {
      if (deleted.error instanceof NotFoundError) {
        return NextResponse.json({ error: 'Option not found' }, { status: 404 });
      }
      throw deleted.error;
    }
    return NextResponse.json({ message: 'Option deleted successfully' });
  } catch (error: any) {
    console.error('Error in DELETE /api/surveys/.../options/[optionId]:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
