import type { 
  User, 
  AuthResponse, 
  FileItem, 
  FolderItem, 
  StorageStats, 
  ActivityLog, 
  DeveloperStatus 
} from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('cloudvault_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = 'An error occurred';
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (Array.isArray(errorData.detail) && errorData.detail[0]?.msg) {
          errorMessage = errorData.detail[0].msg;
        }
      }
    } catch {
      errorMessage = response.statusText || 'Server request failed';
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

export const api = {
  // Auth
  register: async (data: { username: string; email: string; password: string }): Promise<User> => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<User>(res);
  },

  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<AuthResponse>(res);
  },

  // Users
  getMe: async (): Promise<User> => {
    const res = await fetch(`${BASE_URL}/users/me`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse<User>(res);
  },

  updateMe: async (data: { username?: string; email?: string }): Promise<User> => {
    const res = await fetch(`${BASE_URL}/users/me`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse<User>(res);
  },

  // Files
  getFiles: async (params?: { search?: string; is_deleted?: boolean; folder_id?: number | null; sort_by?: string }): Promise<FileItem[]> => {
    const url = new URL(`${BASE_URL}/files`);
    if (params?.search) url.searchParams.append('search', params.search);
    if (params?.is_deleted !== undefined) url.searchParams.append('is_deleted', String(params.is_deleted));
    if (params?.folder_id !== undefined && params.folder_id !== null) url.searchParams.append('folder_id', String(params.folder_id));
    if (params?.sort_by) url.searchParams.append('sort_by', params.sort_by);

    const res = await fetch(url.toString(), {
      headers: { ...getAuthHeader() },
    });
    return handleResponse<FileItem[]>(res);
  },

  uploadFile: async (file: File, folder_id?: number | null): Promise<FileItem> => {
    const formData = new FormData();
    formData.append('file', file);
    if (folder_id) {
      formData.append('folder_id', String(folder_id));
    }

    const res = await fetch(`${BASE_URL}/files/upload`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: formData,
    });
    return handleResponse<FileItem>(res);
  },

  downloadFile: async (fileId: number, filename: string): Promise<void> => {
    const res = await fetch(`${BASE_URL}/files/${fileId}/download`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) {
      const err = await handleResponse(res).catch(e => e) as any;
      throw new Error(err?.message || 'Download failed');
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  updateFile: async (fileId: number, data: { filename?: string; folder_id?: number | null }): Promise<FileItem> => {
    const res = await fetch(`${BASE_URL}/files/${fileId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    return handleResponse<FileItem>(res);
  },

  deleteFile: async (fileId: number): Promise<{ message: string; file_id: number }> => {
    const res = await fetch(`${BASE_URL}/files/${fileId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    return handleResponse<{ message: string; file_id: number }>(res);
  },

  deleteFilePermanent: async (fileId: number): Promise<{ message: string; file_id: number }> => {
    const res = await fetch(`${BASE_URL}/files/${fileId}/permanent`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    return handleResponse<{ message: string; file_id: number }>(res);
  },

  restoreFile: async (fileId: number): Promise<FileItem> => {
    const res = await fetch(`${BASE_URL}/files/${fileId}/restore`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
    });
    return handleResponse<FileItem>(res);
  },

  // Folders
  getFolders: async (): Promise<FolderItem[]> => {
    const res = await fetch(`${BASE_URL}/folders`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse<FolderItem[]>(res);
  },

  createFolder: async (name: string): Promise<FolderItem> => {
    const res = await fetch(`${BASE_URL}/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ name }),
    });
    return handleResponse<FolderItem>(res);
  },

  updateFolder: async (folderId: number, name: string): Promise<FolderItem> => {
    const res = await fetch(`${BASE_URL}/folders/${folderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ name }),
    });
    return handleResponse<FolderItem>(res);
  },

  deleteFolder: async (folderId: number): Promise<{ message: string }> => {
    const res = await fetch(`${BASE_URL}/folders/${folderId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    return handleResponse<{ message: string }>(res);
  },

  // Storage
  getStorageStats: async (): Promise<StorageStats> => {
    const res = await fetch(`${BASE_URL}/storage`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse<StorageStats>(res);
  },

  // Activity
  getActivity: async (limit = 20): Promise<ActivityLog[]> => {
    const res = await fetch(`${BASE_URL}/activity?limit=${limit}`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse<ActivityLog[]>(res);
  },

  // Developer Status (Restricted)
  getDeveloperStatus: async (): Promise<DeveloperStatus> => {
    const res = await fetch(`${BASE_URL}/developer/status`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse<DeveloperStatus>(res);
  }
};
