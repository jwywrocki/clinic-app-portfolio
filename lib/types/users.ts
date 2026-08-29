export interface User {
  id: string;
  username: string;
  password_hash?: string;
  is_active: boolean;
  last_login?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  role?: string;
  user_has_roles?: Array<{ role: { id: string; name: string } }>;
}

export interface Role {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRoleLink {
  id: string;
  user_id: string;
  role_id: string;
  created_at: string;
  updated_at: string;
}

export interface AdminContextType {
  currentUser: User | null;
  hasPermission: (permission: string) => boolean;
  loading: boolean;
  fetchData: () => Promise<void>;
}
