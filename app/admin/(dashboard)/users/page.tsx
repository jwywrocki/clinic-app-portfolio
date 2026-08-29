import { createUserService } from '@/services';
import { UsersManagement } from '../../components/UsersManagement';
import { saveUserAction, deleteUserAction } from '../../actions/users';

export default async function AdminUsersPage() {
  const userService = createUserService();
  const usersResult = await userService.getAllUsersWithRoles();
  if (usersResult.isFailure()) {
    throw usersResult.error;
  }
  const rolesResult = await userService.getAllRoles();
  if (rolesResult.isFailure()) {
    throw rolesResult.error;
  }

  return (
    <UsersManagement
      users={usersResult.data}
      roles={rolesResult.data}
      onSave={saveUserAction}
      onDelete={deleteUserAction}
      currentUser={null}
    />
  );
}
