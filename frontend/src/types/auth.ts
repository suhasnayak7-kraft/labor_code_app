export type UserRole = 'user' | 'admin';

export interface Profile {
    id: string;
    email: string | null;
    full_name: string | null;
    role: UserRole;
    is_approved: boolean;
    is_locked: boolean;
    is_deleted?: boolean;
    daily_audit_limit: number;
    plan: string;
    created_at: string;
}
