export interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'developer';
  storage_quota: number;
  storage_used: number;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface FileItem {
  id: number;
  user_id: number;
  folder_id: number | null;
  filename: string;
  s3_key: string;
  mime_type: string;
  size: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface FolderItem {
  id: number;
  user_id: number;
  name: string;
  created_at: string;
  updated_at: string;
  file_count?: number;
}

export interface StorageStats {
  total_storage: number;
  used_storage: number;
  remaining_storage: number;
  file_count: number;
}

export interface ActivityLog {
  id: number;
  user_id: number;
  action: string;
  details: string | null;
  created_at: string;
}

export interface DeveloperStatus {
  api_status: string;
  database_status: string;
  storage_provider: string;
  api_version: string;
  total_users: number;
  total_files: number;
  total_storage_used: number;
}
