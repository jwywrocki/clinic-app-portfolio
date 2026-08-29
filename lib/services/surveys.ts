import crypto from 'crypto';
import type {
  Question,
  QuestionOption,
  Survey,
  SurveyAnswer,
  SurveyData,
  SurveyResponseRow,
  SurveySubmission,
  QuestionData,
  QuestionOptionData,
} from '@/lib/types/surveys';
import type {
  SurveyAnswerRepository,
  SurveyOptionRepository,
  SurveyQuestionRepository,
  SurveyRepository,
} from '@/repositories';
import { failure, success, type Result, NotFoundError } from '@/domain';

export interface SurveyStats {
  total_surveys: number;
  published_surveys: number;
  draft_surveys: number;
  total_responses: number;
  recent_responses: number;
  most_active_survey: { title: string; responses: number } | null;
}

export class SurveyService {
  constructor(
    private surveyRepository: SurveyRepository,
    private questionRepository: SurveyQuestionRepository,
    private optionRepository: SurveyOptionRepository,
    private answerRepository: SurveyAnswerRepository
  ) {}

  async getSurveyById(id: string): Promise<Result<Survey>> {
    const surveyResult = await this.surveyRepository.findById(id);
    if (surveyResult.isFailure()) {
      return failure(surveyResult.error);
    }
    if (!surveyResult.data) {
      return failure(new NotFoundError('Survey', id));
    }

    const questionsResult = await this.questionRepository.listBySurveyId(id);
    if (questionsResult.isFailure()) {
      return failure(questionsResult.error);
    }

    const questionsResultWithOptions = await this.attachOptions(questionsResult.data);
    if (questionsResultWithOptions.isFailure()) {
      return failure(questionsResultWithOptions.error);
    }

    return success({
      ...surveyResult.data,
      questions: questionsResultWithOptions.data,
    });
  }

  async getAllSurveys(): Promise<Result<Survey[]>> {
    return this.surveyRepository.listOrdered();
  }

  async createSurvey(data: SurveyData): Promise<Result<Survey>> {
    return this.surveyRepository.create(data);
  }

  async updateSurvey(id: string, updates: Partial<SurveyData>): Promise<Result<Survey>> {
    const existsResult = await this.surveyRepository.exists(id);
    if (existsResult.isFailure()) {
      return failure(existsResult.error);
    }
    if (!existsResult.data) {
      return failure(new NotFoundError('Survey', id));
    }

    return this.surveyRepository.update(id, updates);
  }

  async deleteSurvey(id: string): Promise<Result<void>> {
    const existsResult = await this.surveyRepository.exists(id);
    if (existsResult.isFailure()) {
      return failure(existsResult.error);
    }
    if (!existsResult.data) {
      return failure(new NotFoundError('Survey', id));
    }

    return this.surveyRepository.delete(id);
  }

  async addQuestionToSurvey(surveyId: string, data: QuestionData): Promise<Result<Question>> {
    const surveyExists = await this.surveyRepository.exists(surveyId);
    if (surveyExists.isFailure()) {
      return failure(surveyExists.error);
    }
    if (!surveyExists.data) {
      return failure(new NotFoundError('Survey', surveyId));
    }

    return this.questionRepository.create({ ...data, survey_id: surveyId });
  }

  async updateQuestion(id: string, updates: Partial<QuestionData>): Promise<Result<Question>> {
    const existsResult = await this.questionRepository.exists(id);
    if (existsResult.isFailure()) {
      return failure(existsResult.error);
    }
    if (!existsResult.data) {
      return failure(new NotFoundError('Question', id));
    }

    return this.questionRepository.update(id, updates);
  }

  async deleteQuestion(id: string): Promise<Result<void>> {
    const existsResult = await this.questionRepository.exists(id);
    if (existsResult.isFailure()) {
      return failure(existsResult.error);
    }
    if (!existsResult.data) {
      return failure(new NotFoundError('Question', id));
    }

    return this.questionRepository.delete(id);
  }

  async updateQuestionOrder(id: string, orderNo: number): Promise<Result<Question>> {
    const existsResult = await this.questionRepository.exists(id);
    if (existsResult.isFailure()) {
      return failure(existsResult.error);
    }
    if (!existsResult.data) {
      return failure(new NotFoundError('Question', id));
    }

    return this.questionRepository.updateOrder(id, orderNo);
  }

  async addOptionToQuestion(
    questionId: string,
    data: QuestionOptionData
  ): Promise<Result<QuestionOption>> {
    const questionExists = await this.questionRepository.exists(questionId);
    if (questionExists.isFailure()) {
      return failure(questionExists.error);
    }
    if (!questionExists.data) {
      return failure(new NotFoundError('Question', questionId));
    }

    return this.optionRepository.create({ ...data, question_id: questionId });
  }

  async updateQuestionOption(
    id: string,
    updates: Partial<QuestionOptionData>
  ): Promise<Result<QuestionOption>> {
    const existsResult = await this.optionRepository.exists(id);
    if (existsResult.isFailure()) {
      return failure(existsResult.error);
    }
    if (!existsResult.data) {
      return failure(new NotFoundError('Question option', id));
    }

    return this.optionRepository.update(id, updates);
  }

  async deleteQuestionOption(id: string): Promise<Result<void>> {
    const existsResult = await this.optionRepository.exists(id);
    if (existsResult.isFailure()) {
      return failure(existsResult.error);
    }
    if (!existsResult.data) {
      return failure(new NotFoundError('Question option', id));
    }

    return this.optionRepository.delete(id);
  }

  async updateOptionOrder(id: string, orderNo: number): Promise<Result<QuestionOption>> {
    const existsResult = await this.optionRepository.exists(id);
    if (existsResult.isFailure()) {
      return failure(existsResult.error);
    }
    if (!existsResult.data) {
      return failure(new NotFoundError('Question option', id));
    }

    return this.optionRepository.updateOrder(id, orderNo);
  }

  async submitSurveyResponse(submission: SurveySubmission): Promise<Result<string>> {
    const responseId = crypto.randomUUID();
    const answers = submission.answers.map(answer => ({
      survey_id: submission.survey_id,
      question_id: answer.question_id,
      option_id: answer.option_id ?? null,
      answer_text: answer.answer_text ?? null,
      response_id: responseId,
      submitted_at: new Date().toISOString(),
    }));

    const insertResult = await this.answerRepository.insertMany(answers);
    if (insertResult.isFailure()) {
      return failure(insertResult.error);
    }

    return success(responseId);
  }

  async getPublishedSurveyForPage(surveyId: string): Promise<Result<Survey>> {
    const surveyResult = await this.surveyRepository.findPublishedById(surveyId);
    if (surveyResult.isFailure()) {
      return failure(surveyResult.error);
    }
    if (!surveyResult.data) {
      return failure(new NotFoundError('Survey', surveyId));
    }

    const questionsResult = await this.questionRepository.listBySurveyId(surveyId);
    if (questionsResult.isFailure()) {
      return failure(questionsResult.error);
    }

    const questionsWithOptions = await this.attachOptions(questionsResult.data);
    if (questionsWithOptions.isFailure()) {
      return failure(questionsWithOptions.error);
    }

    return success({
      ...surveyResult.data,
      questions: questionsWithOptions.data,
    });
  }

  async getSurveyResponsesForExport(surveyId: string): Promise<Result<SurveyResponseRow[]>> {
    const answersResult = await this.answerRepository.listBySurveyId(surveyId);
    if (answersResult.isFailure()) {
      return failure(answersResult.error);
    }
    if (!answersResult.data.length) {
      return success([]);
    }

    const questionIds = [...new Set(answersResult.data.map(answer => answer.question_id))];
    const optionIds = [
      ...new Set(
        answersResult.data
          .map(answer => answer.option_id)
          .filter((value): value is string => Boolean(value))
      ),
    ];

    const questionsMap = new Map<string, Question>();
    for (const questionId of questionIds) {
      const questionResult = await this.questionRepository.findById(questionId);
      if (questionResult.isFailure()) {
        return failure(questionResult.error);
      }
      if (questionResult.data) {
        questionsMap.set(questionId, questionResult.data);
      }
    }

    const optionsMap = new Map<string, QuestionOption>();
    for (const optionId of optionIds) {
      const optionResult = await this.optionRepository.findById(optionId);
      if (optionResult.isFailure()) {
        return failure(optionResult.error);
      }
      if (optionResult.data) {
        optionsMap.set(optionId, optionResult.data);
      }
    }

    const responsesMap = new Map<string, SurveyResponseRow>();
    for (const answer of answersResult.data) {
      if (!responsesMap.has(answer.response_id)) {
        responsesMap.set(answer.response_id, {
          response_id: answer.response_id,
          submitted_at: answer.submitted_at,
        });
      }

      const responseRow = responsesMap.get(answer.response_id)!;
      const question = questionsMap.get(answer.question_id);
      if (!question) continue;

      if (question.type === 'text') {
        responseRow[question.text] = answer.answer_text || '';
        continue;
      }

      if (!answer.option_id) continue;
      const option = optionsMap.get(answer.option_id);
      const optionText = option?.text || '';

      if (responseRow[question.text]) {
        responseRow[question.text] += ', ' + optionText;
      } else {
        responseRow[question.text] = optionText;
      }
    }

    return success(Array.from(responsesMap.values()));
  }

  async getStats(): Promise<Result<SurveyStats>> {
    const totalResult = await this.surveyRepository.countAll();
    if (totalResult.isFailure()) {
      return failure(totalResult.error);
    }

    const publishedResult = await this.surveyRepository.countPublished();
    if (publishedResult.isFailure()) {
      return failure(publishedResult.error);
    }

    const answersResult = await this.answerRepository.findAll();
    if (answersResult.isFailure()) {
      return failure(answersResult.error);
    }

    const totalSurveys = totalResult.data;
    const publishedSurveys = publishedResult.data;
    const draftSurveys = totalSurveys - publishedSurveys;

    const uniqueResponseIds = new Set(answersResult.data.map(answer => answer.response_id));
    const totalResponses = uniqueResponseIds.size;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentResponses = new Set(
      answersResult.data
        .filter(answer => new Date(answer.submitted_at) >= sevenDaysAgo)
        .map(answer => answer.response_id)
    ).size;

    let mostActiveSurvey: { title: string; responses: number } | null = null;
    if (totalResponses > 0) {
      const surveyResponseMap = new Map<string, Set<string>>();
      answersResult.data.forEach(answer => {
        if (!surveyResponseMap.has(answer.survey_id)) {
          surveyResponseMap.set(answer.survey_id, new Set());
        }
        surveyResponseMap.get(answer.survey_id)!.add(answer.response_id);
      });

      let maxResponses = 0;
      let mostActiveSurveyId: string | null = null;

      for (const [surveyId, responseIds] of surveyResponseMap) {
        if (responseIds.size > maxResponses) {
          maxResponses = responseIds.size;
          mostActiveSurveyId = surveyId;
        }
      }

      if (mostActiveSurveyId) {
        const surveyDetails = await this.surveyRepository.findById(mostActiveSurveyId);
        if (surveyDetails.isFailure()) {
          return failure(surveyDetails.error);
        }
        if (surveyDetails.data) {
          mostActiveSurvey = {
            title: surveyDetails.data.title,
            responses: maxResponses,
          };
        }
      }
    }

    return success({
      total_surveys: totalSurveys,
      published_surveys: publishedSurveys,
      draft_surveys: draftSurveys,
      total_responses: totalResponses,
      recent_responses: recentResponses,
      most_active_survey: mostActiveSurvey,
    });
  }

  private async attachOptions(questions: Question[]): Promise<Result<Question[]>> {
    const questionsWithOptions: Question[] = [];

    for (const question of questions) {
      const optionsResult = await this.optionRepository.listByQuestionId(question.id);
      if (optionsResult.isFailure()) {
        return failure(optionsResult.error);
      }
      questionsWithOptions.push({
        ...question,
        options: optionsResult.data,
      });
    }

    return success(questionsWithOptions);
  }
}
