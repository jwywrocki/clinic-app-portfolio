import type { DBClient } from '@/lib/db/types';
import type { Role, User, UserRoleLink } from '@/lib/types/users';
import { BaseRepository } from './base';
import type { RoleRepository, UserRepository, UserRoleRepository } from './interfaces';
import { DomainError, failure, success, type Result } from '@/domain';

export class UserRepositoryImpl extends BaseRepository<User> implements UserRepository {
  constructor(db: DBClient) {
    super(db, 'users');
  }

  async findByUsername(username: string): Promise<Result<User | null>> {
    try {
      const user = await this.db.findOne<User>('users', { username });
      return success(user);
    } catch (error) {
      return failure(new DomainError('Failed to find user by username', 'DATABASE_ERROR', error));
    }
  }
}

export class RoleRepositoryImpl extends BaseRepository<Role> implements RoleRepository {
  constructor(db: DBClient) {
    super(db, 'roles');
  }

  async findByName(name: string): Promise<Result<Role | null>> {
    try {
      const role = await this.db.findOne<Role>('roles', { name });
      return success(role);
    } catch (error) {
      return failure(new DomainError('Failed to find role by name', 'DATABASE_ERROR', error));
    }
  }
}

export class UserRoleRepositoryImpl
  extends BaseRepository<UserRoleLink>
  implements UserRoleRepository
{
  constructor(db: DBClient) {
    super(db, 'user_has_roles');
  }

  async listByUserId(userId: string): Promise<Result<UserRoleLink[]>> {
    return this.findByField('user_id', userId);
  }

  async deleteByUserId(userId: string): Promise<Result<void>> {
    try {
      await this.db.deleteWhere(this.tableName, { user_id: userId });
      return success(undefined);
    } catch (error) {
      return failure(new DomainError('Failed to delete user roles', 'DATABASE_ERROR', error));
    }
  }

  async replaceRole(userId: string, roleId: string): Promise<Result<void>> {
    try {
      await this.db.transaction(async tx => {
        await tx.deleteWhere(this.tableName, { user_id: userId });
        await tx.insert(this.tableName, { user_id: userId, role_id: roleId });
      });
      return success(undefined);
    } catch (error) {
      return failure(new DomainError('Failed to replace user role', 'DATABASE_ERROR', error));
    }
  }
}
