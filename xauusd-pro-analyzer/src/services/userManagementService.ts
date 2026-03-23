import { supabase } from '../lib/supabase';

export type UserPlan = 'free' | 'pro' | 'premium' | 'trial';

export interface User {
  id: string;
  email: string;
  password?: string;
  plan: UserPlan;
  role?: 'admin' | 'vip' | 'user';
  isAdmin?: boolean;
  createdAt: Date;
  isVip?: boolean;
  isLifetime?: boolean;
  trialStart?: number | null;
  trialEnd?: number | null;
  couponCode?: string;
  couponExpire?: number;
  badge?: string;
  subscriptionStatus?: 'inactive' | 'active' | 'trial' | 'lifetime';
  subscriptionPlan?: 'free' | 'pro' | 'premium';
  subscriptionStartedAt?: string | null;
}

const mapProfileToUser = (profile: any): User => ({
  id: profile.user_id || profile.id,
  email: profile.email,
  plan: profile.subscription_plan || profile.plan || 'free',
  role: profile.role,
  isAdmin: profile.is_admin || false,
  isVip: profile.is_vip || false,
  isLifetime: profile.is_lifetime || false,
  createdAt: profile.created_at ? new Date(profile.created_at) : new Date(),
  trialStart: profile.trial_start ? new Date(profile.trial_start).getTime() : null,
  trialEnd: profile.trial_end ? new Date(profile.trial_end).getTime() : null,
  subscriptionStatus: profile.subscription_status,
  subscriptionPlan: profile.subscription_plan,
  subscriptionStartedAt: profile.subscription_started_at,
});

export const userManagementService = {
  getAllUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      return [];
    }

    return data.map(mapProfileToUser);
  },

  getUserByEmail: async (email: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !data) return null;
    return mapProfileToUser(data);
  },

  updateUser: async (email: string, updates: Partial<User>): Promise<User | null> => {
    const dbUpdates: any = {};
    
    if (updates.plan !== undefined) dbUpdates.plan = updates.plan;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.isAdmin !== undefined) dbUpdates.is_admin = updates.isAdmin;
    if (updates.isVip !== undefined) dbUpdates.is_vip = updates.isVip;
    if (updates.isLifetime !== undefined) dbUpdates.is_lifetime = updates.isLifetime;
    if (updates.subscriptionStatus !== undefined) dbUpdates.subscription_status = updates.subscriptionStatus;
    if (updates.subscriptionPlan !== undefined) dbUpdates.subscription_plan = updates.subscriptionPlan;
    if (updates.subscriptionStartedAt !== undefined) dbUpdates.subscription_started_at = updates.subscriptionStartedAt;
    if (updates.trialStart !== undefined) dbUpdates.trial_start = updates.trialStart ? new Date(updates.trialStart).toISOString() : null;
    if (updates.trialEnd !== undefined) dbUpdates.trial_end = updates.trialEnd ? new Date(updates.trialEnd).toISOString() : null;

    // Enforce business rules
    if (dbUpdates.is_admin) {
      dbUpdates.role = 'admin';
      dbUpdates.is_vip = true;
      dbUpdates.is_lifetime = true;
      dbUpdates.plan = 'premium';
      dbUpdates.subscription_status = 'lifetime';
      dbUpdates.subscription_plan = 'premium';
    } else if (dbUpdates.is_vip) {
      dbUpdates.role = 'vip';
      dbUpdates.is_lifetime = true;
      dbUpdates.plan = 'premium';
      dbUpdates.subscription_status = 'lifetime';
      dbUpdates.subscription_plan = 'premium';
    } else if (dbUpdates.is_admin === false && dbUpdates.is_vip === false) {
      dbUpdates.role = 'user';
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update(dbUpdates)
      .eq('email', email.toLowerCase())
      .select()
      .single();

    if (error || !data) {
      console.error("Error updating user:", error);
      return null;
    }

    return mapProfileToUser(data);
  },

  promoteToAdmin: async (email: string) => {
    return await userManagementService.updateUser(email, { isAdmin: true });
  },

  promoteToVip: async (email: string) => {
    return await userManagementService.updateUser(email, { isVip: true, isAdmin: false });
  },

  removeAdmin: async (email: string) => {
    return await userManagementService.updateUser(email, { isAdmin: false });
  },

  removeVip: async (email: string) => {
    return await userManagementService.updateUser(email, { isVip: false, isLifetime: false, plan: 'free', subscriptionStatus: 'inactive' });
  },

  removePrivileges: async (email: string) => {
    return await userManagementService.updateUser(email, { 
      isAdmin: false, 
      isVip: false, 
      isLifetime: false, 
      role: 'user', 
      plan: 'free',
      subscriptionStatus: 'inactive'
    });
  },

  setPlan: async (email: string, plan: UserPlan) => {
    return await userManagementService.updateUser(email, { plan });
  },

  deleteUser: async (email: string) => {
    // In Supabase, deleting a user from auth.users cascades to user_profiles.
    // However, only service_role key can delete from auth.users.
    // For this client-side implementation, we'll just delete the profile, 
    // which might violate FK if not careful, or we just mark them inactive.
    // Let's just delete the profile for now (assuming RLS allows it for admins).
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('email', email.toLowerCase());
      
    if (error) console.error("Error deleting user:", error);
  },
  
  // Kept for compatibility, but shouldn't be used directly for creating auth users
  createUser: (userData: Partial<User>): User => {
    throw new Error("Use authService.register to create users in Supabase");
  }
};
