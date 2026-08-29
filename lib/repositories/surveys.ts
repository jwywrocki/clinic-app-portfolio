import type { DBClient } from '@/lib/db/types';
import type { Question, QuestionOption, Survey, SurveyAnswer } from '@/lib/types/surveys';
import { BaseRepository } from './base';
import type {
  SurveyAnswerRepository,
  SurveyOptionRepository,
  SurveyQuestionRepository,
  SurveyRepository,
} from './interfaces';
import { DomainError, failure, success, type Result } from '@/domain';

export class SurveyRepositoryImpl extends BaseRepository<Survey> implements SurveyRepository {
  constructor(db: DBClient) {
    super(db, 'surveys');
  }

  async listOrdered(): Promise<Result<Survey[]>> {
    return this.findAll({ orderBy: { column: 'created_at', ascending: false } });
  }

  async findPublishedById(id: string): Promise<Result<Survey | null>> {
    try {
      const survey = await this.db.findOne<Survey>('surveys', { id, is_published: true });
      return success(survey);
    } catch (error) {
      return failure(new DomainError('Failed to find published survey', 'DATABASE_ERROR', error));
    }
  }

  async countAll(): Promise<Result<number>> {
    try {
      const total = await this.db.count('surveys');
      return success(total);
    } catch (error) {
      return failure(new DomainError('Failed to count surveys', 'DATABASE_ERROR', error));
    }
  }

  async countPublished(): Promise<Result<number>> {
    try {
      const total = await this.db.count('surveys', { is_published: true });
      return success(total);
    } catch (error) {
      return failure(new DomainError('Failed to count published surveys', 'DATABASE_ERROR', error));
    }
  }
}

export class SurveyQuestionRepositoryImpl implements SurveyQuestionRepository {
  private tableName = 'question_has_survey';

  constructor(private db: DBClient) {}

  async findById(id: string): Promise<Result<Question | null>> {
    try {
      const question = await this.db.getById<Question>(this.tableName, id);
      return success(question);
    } catch (error) {
      return failure(new DomainError('Failed to load question', 'DATABASE_ERROR', error));
    }
  }

  async findAll(): Promise<Result<Question[]>> {
    try {
      const questions = await this.db.list<Question>(this.tableName);
      return success(questions);
    } catch (error) {
      return failure(new DomainError('Failed to list questions', 'DATABASE_ERROR', error));
    }
  }

  async create(data: Omit<Question, 'id'>): Promise<Result<Question>> {
    try {
      const question = await this.db.insert<Question>(this.tableName, data);
      return success(question);
    } catch (error) {
      return failure(new DomainError('Failed to create question', 'DATABASE_ERROR', error));
    }
  }

  async update(id: string, updates: Partial<Omit<Question, 'id'>>): Promise<Result<Question>> {
    try {
      const question = await this.db.updateById<Question>(this.tableName, id, updates);
      return success(question);
    } catch (error) {
      return failure(new DomainError('Failed to update question', 'DATABASE_ERROR', error));
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      await this.db.deleteById(this.tableName, id);
      return success(undefined);
    } catch (error) {
      return failure(new DomainError('Failed to delete question', 'DATABASE_ERROR', error));
    }
  }

  async exists(id: string): Promise<Result<boolean>> {
    const result = await this.findById(id);
    if (result.isFailure()) {
      return failure(result.error);
    }
    return success(!!result.data);
  }

  async listBySurveyId(surveyId: string): Promise<Result<Question[]>> {
    try {
      const questions = await this.db.findWhere<Question>(
        this.tableName,
        { survey_id: surveyId },
        { orderBy: { column: 'order_no', ascending: true } }
      );
      return success(questions);
    } catch (error) {
      return failure(new DomainError('Failed to load survey questions', 'DATABASE_ERROR', error));
    }
  }

  async updateOrder(questionId: string, orderNo: number): Promise<Result<Question>> {
    return this.update(questionId, { order_no: orderNo });
  }
}

export class SurveyOptionRepositoryImpl implements SurveyOptionRepository {
  private tableName = 'option_has_question';

  constructor(private db: DBClient) {}

  async findById(id: string): Promise<Result<QuestionOption | null>> {
    try {
      const option = await this.db.getById<QuestionOption>(this.tableName, id);
      return success(option);
    } catch (error) {
      return failure(new DomainError('Failed to load question option', 'DATABASE_ERROR', error));
    }
  }

  async findAll(): Promise<Result<QuestionOption[]>> {
    try {
      const options = await this.db.list<QuestionOption>(this.tableName);
      return success(options);
    } catch (error) {
      return failure(new DomainError('Failed to list question options', 'DATABASE_ERROR', error));
    }
  }

  async create(data: Omit<QuestionOption, 'id'>): Promise<Result<QuestionOption>> {
    try {
      const option = await this.db.insert<QuestionOption>(this.tableName, data);
      return success(option);
    } catch (error) {
      return failure(new DomainError('Failed to create question option', 'DATABASE_ERROR', error));
    }
  }

  async update(
    id: string,
    updates: Partial<Omit<QuestionOption, 'id'>>
  ): Promise<Result<QuestionOption>> {
    try {
      const option = await this.db.updateById<QuestionOption>(this.tableName, id, updates);
      return success(option);
    } catch (error) {
      return failure(new DomainError('Failed to update question option', 'DATABASE_ERROR', error));
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      await this.db.deleteById(this.tableName, id);
      return success(undefined);
    } catch (error) {
      return failure(new DomainError('Failed to delete question option', 'DATABASE_ERROR', error));
    }
  }

  async exists(id: string): Promise<Result<boolean>> {
    const result = await this.findById(id);
    if (result.isFailure()) {
      return failure(result.error);
    }
    return success(!!result.data);
  }

  async listByQuestionId(questionId: string): Promise<Result<QuestionOption[]>> {
    try {
      const options = await this.db.findWhere<QuestionOption>(
        this.tableName,
        { question_id: questionId },
        { orderBy: { column: 'order_no', ascending: true } }
      );
      return success(options);
    } catch (error) {
      return failure(new DomainError('Failed to load question options', 'DATABASE_ERROR', error));
    }
  }

  async updateOrder(optionId: string, orderNo: number): Promise<Result<QuestionOption>> {
    return this.update(optionId, { order_no: orderNo });
  }
}

export class SurveyAnswerRepositoryImpl implements SurveyAnswerRepository {
  private tableName = 'survey_answers';

  constructor(private db: DBClient) {}

  async findById(id: string): Promise<Result<SurveyAnswer | null>> {
    try {
      const answer = await this.db.getById<SurveyAnswer>(this.tableName, id);
      return success(answer);
    } catch (error) {
      return failure(new DomainError('Failed to load survey answer', 'DATABASE_ERROR', error));
    }
  }

  async findAll(): Promise<Result<SurveyAnswer[]>> {
    try {
      const answers = await this.db.list<SurveyAnswer>(this.tableName);
      return success(answers);
    } catch (error) {
      return failure(new DomainError('Failed to list survey answers', 'DATABASE_ERROR', error));
    }
  }

  async create(data: Omit<SurveyAnswer, 'id'>): Promise<Result<SurveyAnswer>> {
    try {
      const answer = await this.db.insert<SurveyAnswer>(this.tableName, data);
      return success(answer);
    } catch (error) {
      return failure(new DomainError('Failed to create survey answer', 'DATABASE_ERROR', error));
    }
  }

  async update(
    id: string,
    updates: Partial<Omit<SurveyAnswer, 'id'>>
  ): Promise<Result<SurveyAnswer>> {
    try {
      const answer = await this.db.updateById<SurveyAnswer>(this.tableName, id, updates);
      return success(answer);
    } catch (error) {
      return failure(new DomainError('Failed to update survey answer', 'DATABASE_ERROR', error));
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      await this.db.deleteById(this.tableName, id);
      return success(undefined);
    } catch (error) {
      return failure(new DomainError('Failed to delete survey answer', 'DATABASE_ERROR', error));
    }
  }

  async exists(id: string): Promise<Result<boolean>> {
    const result = await this.findById(id);
    if (result.isFailure()) {
      return failure(result.error);
    }
    return success(!!result.data);
  }

  async listBySurveyId(surveyId: string): Promise<Result<SurveyAnswer[]>> {
    try {
      const answers = await this.db.findWhere<SurveyAnswer>(
        this.tableName,
        { survey_id: surveyId },
        { orderBy: { column: 'submitted_at', ascending: false } }
      );
      return success(answers);
    } catch (error) {
      return failure(new DomainError('Failed to load survey answers', 'DATABASE_ERROR', error));
    }
  }

  async insertMany(rows: Omit<SurveyAnswer, 'id'>[]): Promise<Result<SurveyAnswer[]>> {
    try {
      const answers = await this.db.insertMany<SurveyAnswer>(this.tableName, rows);
      return success(answers);
    } catch (error) {
      return failure(new DomainError('Failed to save survey answers', 'DATABASE_ERROR', error));
    }
  }
}
