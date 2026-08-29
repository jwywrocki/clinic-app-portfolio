import bcrypt from 'bcryptjs';
import type { User } from '@/lib/types/users';
import type { RoleRepository, UserRepository, UserRoleRepository } from '@/repositories';
import { failure, success, type Result } from '@/domain';

export interface AuthenticatedUser {
  user: User;
  role: string;
}

export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private roleRepository: RoleRepository,
    private userRoleRepository: UserRoleRepository
  ) {}

  async authenticateCredentials(
    username: string,
    password: string,
    pepper: string
  ): Promise<Result<AuthenticatedUser | null>> {
    const userResult = await this.userRepository.findByUsername(username);
    if (userResult.isFailure()) {
      return failure(userResult.error);
    }

    const user = userResult.data;
    if (!user || !user.is_active || !user.password_hash) {
      return success(null);
    }

    const isPasswordValid = await bcrypt.compare(password + pepper, user.password_hash);
    if (!isPasswordValid) {
      return success(null);
    }

    let roleName = '';
    const linksResult = await this.userRoleRepository.listByUserId(user.id);
    if (!linksResult.isFailure() && linksResult.data.length > 0) {
      const firstLink = linksResult.data[0];
      if (firstLink) {
        const roleResult = await this.roleRepository.findById(firstLink.role_id);
        if (!roleResult.isFailure() && roleResult.data) {
          roleName = roleResult.data.name;
        }
      }
    }

    const updateResult = await this.userRepository.update(user.id, {
      last_login: new Date().toISOString(),
    });
    if (updateResult.isFailure()) {
      // Ignore last_login update errors to avoid blocking login.
    }

    return success({ user, role: roleName });
  }
}
