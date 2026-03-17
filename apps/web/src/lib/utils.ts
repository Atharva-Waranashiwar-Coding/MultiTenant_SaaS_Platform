import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function getRoleBadgeColor(role: string): string {
  const colors: Record<string, string> = {
    OWNER: 'bg-purple-100 text-purple-800 border-purple-200',
    ADMIN: 'bg-blue-100 text-blue-800 border-blue-200',
    MANAGER: 'bg-green-100 text-green-800 border-green-200',
    MEMBER: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  return colors[role] ?? colors.MEMBER;
}

export function getInviteStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    EXPIRED: 'bg-gray-100 text-gray-600',
    REVOKED: 'bg-red-100 text-red-700',
  };
  return colors[status] ?? '';
}

export function getApiErrorMessage(error: unknown): string {
  const axiosError = error as any;
  const data = axiosError?.response?.data;
  if (!data) return 'Something went wrong';
  if (Array.isArray(data.message)) return data.message.join(', ');
  return data.message ?? 'Something went wrong';
}
