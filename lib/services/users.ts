import bcrypt from 'bcryptjs';
import type { Role, User, UserRoleLink } from '@/lib/types/users';
import type { RoleRepository, UserRepository, UserRoleRepository } from '@/repositories';
import {
  ConflictError,
  ValidationError,
  NotFoundError,
  failure,
  success,
  type Result,
} from '@/domain';

function getPepper(): string {
  const pepper = process.env.BCRYPT_SECRET_KEY;
  if (!pepper) {
    throw new Error('BCRYPT_SECRET_KEY environment variable is required');
  }
  return pepper;
}

const SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;

export interface CreateUserRequest {
  username: string;
  password?: string;
  is_active?: boolean;
  role?: string;
}

export interface UpdateUserRequest {
  username?: string;
  password?: string;
  is_active?: boolean;
  role?: string;
}

export class UserService {
  constructor(
    private userRepository: UserRepository,
    private roleRepository: RoleRepository,
    private userRoleRepository: UserRoleRepository
  ) {}

  async getAllUsersWithRoles(): Promise<Result<User[]>> {
    const usersResult = await this.userRepository.findAll();
    if (usersResult.isFailure()) {
      return failure(usersResult.error);
    }

    const rolesResult = await this.roleRepository.findAll();
    if (rolesResult.isFailure()) {
      return failure(rolesResult.error);
    }

    const roleLinksResult = await this.userRoleRepository.findAll();
    if (roleLinksResult.isFailure()) {
      return failure(roleLinksResult.error);
    }

    const rolesById = new Map(rolesResult.data.map(role => [role.id, role]));
    const linksByUserId = roleLinksResult.data.reduce<Record<string, UserRoleLink[]>>(
      (acc, link) => {
        acc[link.user_id] = acc[link.user_id] || [];
        acc[link.user_id]?.push(link);
        return acc;
      },
      {}
    );

    const users = usersResult.data.map(user =>
      this.buildUserWithRole(user, linksByUserId[user.id] || [], rolesById)
    );

    return success(users);
  }

  async getAllRoles(): Promise<Result<Role[]>> {
    return this.roleRepository.findAll();
  }

  async getUserWithRole(userId: string): Promise<Result<User>> {
    const userResult = await this.userRepository.findById(userId);
    if (userResult.isFailure()) {
      return failure(userResult.error);
    }
    if (!userResult.data) {
      return failure(new NotFoundError('User', userId));
    }

    const roleLinksResult = await this.userRoleRepository.listByUserId(userId);
    if (roleLinksResult.isFailure()) {
      return failure(roleLinksResult.error);
    }

    const rolesResult = await this.roleRepository.findAll();
    if (rolesResult.isFailure()) {
      return failure(rolesResult.error);
    }

    const rolesById = new Map(rolesResult.data.map(role => [role.id, role]));
    return success(this.buildUserWithRole(userResult.data, roleLinksResult.data, rolesById));
  }

  async createUser(data: CreateUserRequest): Promise<Result<User>> {
    const validationError = this.validateNewUser(data);
    if (validationError) {
      return failure(validationError);
    }

    const existingResult = await this.userRepository.findByUsername(data.username);
    if (existingResult.isFailure()) {
      return failure(existingResult.error);
    }
    if (existingResult.data) {
      return failure(new ConflictError('Użytkownik o tej nazwie już istnieje'));
    }

    const hashedPassword = await bcrypt.hash(data.password + getPepper(), SALT_ROUNDS);

    const createdResult = await this.userRepository.create({
      username: data.username,
      password_hash: hashedPassword,
      is_active: data.is_active ?? true,
    });

    if (createdResult.isFailure()) {
      return failure(createdResult.error);
    }

    if (data.role) {
      const roleResult = await this.roleRepository.findByName(data.role);
      if (roleResult.isFailure()) {
        return failure(roleResult.error);
      }
      if (!roleResult.data) {
        return failure(new NotFoundError('Role', data.role));
      }

      const assignResult = await this.userRoleRepository.replaceRole(
        createdResult.data.id,
        roleResult.data.id
      );
      if (assignResult.isFailure()) {
        return failure(assignResult.error);
      }
    }

    return this.getUserWithRole(createdResult.data.id);
  }

  async updateUser(id: string, data: UpdateUserRequest): Promise<Result<User>> {
    const existingResult = await this.userRepository.findById(id);
    if (existingResult.isFailure()) {
      return failure(existingResult.error);
    }
    if (!existingResult.data) {
      return failure(new NotFoundError('User', id));
    }

    if (data.username) {
      const usernameResult = await this.userRepository.findByUsername(data.username);
      if (usernameResult.isFailure()) {
        return failure(usernameResult.error);
      }
      if (usernameResult.data && usernameResult.data.id !== id) {
        return failure(new ConflictError('Użytkownik o tej nazwie już istnieje'));
      }
    }

    const updatePayload: Partial<Omit<User, 'id' | 'created_at'>> = {};
    if (data.username !== undefined) updatePayload.username = data.username;
    if (data.is_active !== undefined) updatePayload.is_active = data.is_active;

    if (data.password?.trim()) {
      if (data.password.length < MIN_PASSWORD_LENGTH) {
        return failure(
          new ValidationError(
            `Hasło musi mieć co najmniej ${MIN_PASSWORD_LENGTH} znaków`,
            'password'
          )
        );
      }
      updatePayload.password_hash = await bcrypt.hash(data.password + getPepper(), SALT_ROUNDS);
    }

    const updatedUser = await this.userRepository.update(id, updatePayload);
    if (updatedUser.isFailure()) {
      return failure(updatedUser.error);
    }

    if (data.role !== undefined) {
      if (data.role) {
        const roleResult = await this.roleRepository.findByName(data.role);
        if (roleResult.isFailure()) {
          return failure(roleResult.error);
        }
        if (!roleResult.data) {
          return failure(new NotFoundError('Role', data.role));
        }

        const assignResult = await this.userRoleRepository.replaceRole(id, roleResult.data.id);
        if (assignResult.isFailure()) {
          return failure(assignResult.error);
        }
      } else {
        const deleteResult = await this.userRoleRepository.deleteByUserId(id);
        if (deleteResult.isFailure()) {
          return failure(deleteResult.error);
        }
      }
    }

    return this.getUserWithRole(id);
  }

  async deleteUser(id: string): Promise<Result<User>> {
    const existingResult = await this.userRepository.findById(id);
    if (existingResult.isFailure()) {
      return failure(existingResult.error);
    }
    if (!existingResult.data) {
      return failure(new NotFoundError('User', id));
    }

    const rolesDelete = await this.userRoleRepository.deleteByUserId(id);
    if (rolesDelete.isFailure()) {
      return failure(rolesDelete.error);
    }

    const deleteResult = await this.userRepository.delete(id);
    if (deleteResult.isFailure()) {
      return failure(deleteResult.error);
    }

    return success(existingResult.data);
  }

  private validateNewUser(data: CreateUserRequest): ValidationError | null {
    if (!data.username) {
      return new ValidationError('Username is required', 'username');
    }

    if (!data.password) {
      return new ValidationError('Password is required', 'password');
    }

    if (data.password.length < MIN_PASSWORD_LENGTH) {
      return new ValidationError(
        `Hasło musi mieć co najmniej ${MIN_PASSWORD_LENGTH} znaków`,
        'password'
      );
    }

    return null;
  }

  private buildUserWithRole(
    user: User,
    roleLinks: UserRoleLink[],
    rolesById: Map<string, Role>
  ): User {
    const { password_hash, ...safeUser } = user;
    const roles = roleLinks
      .map(link => rolesById.get(link.role_id))
      .filter((role): role is Role => Boolean(role));
    const primaryRole = roles[0];

    return {
      ...safeUser,
      role: primaryRole?.name || '',
      user_has_roles: roles.map(role => ({ role: { id: role.id, name: role.name } })),
    };
  }
}
