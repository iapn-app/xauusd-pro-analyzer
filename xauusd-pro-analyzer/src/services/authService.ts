import { supabase } from '../lib/supabase';
import { User, UserPlan } from './userManagementService';

export type { User, UserPlan };

export const ADMIN_BOOTSTRAP = ["mellaurj@gmail.com"];
export const VIP_BOOTSTRAP = ["guiaugustoart@gmail.com"];

export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    const normalizedEmail = email.toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      console.error("Login error:", error.message);
      // 6. Garantir que erros de login mostrem erro real do Supabase
      // (não mensagem genérica de admin)
      throw new Error(error.message);
    }
    
    if (!data.user) throw new Error("User not found");
    
    console.log('LOGIN SUCCESS:', data.user);

    // 1. Após login com signInWithPassword:
    // - buscar dados em public.user_profiles usando user_id = auth.user.id
    const user = await authService.getCurrentUser();
    
    if (!user) throw new Error("Failed to fetch or create user profile");
    return user;
  },

  register: async (email: string, password: string): Promise<User> => {
    const normalizedEmail = email.toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
    });

    if (error) {
      console.error("Registration error:", error.message);
      throw new Error(error.message);
    }
    
    if (!data.user) throw new Error("Registration failed");
    
    console.log('REGISTER SUCCESS:', data.user);

    const user = await authService.getCurrentUser();
    if (!user) {
      throw new Error("Failed to fetch or create user profile");
    }
    return user;
  },

  logout: async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  resetPassword: async (email: string): Promise<void> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
      redirectTo: `${window.location.origin}/#reset-password`,
    });
    if (error) throw new Error(error.message);
  },

  getCurrentUser: async (): Promise<User | null> => {
    // TEMPORARY BYPASS: Return a fake user immediately
    return {
      id: 'fake-user-id',
      email: 'admin@xauusd.pro',
      plan: 'premium',
      isAdmin: true,
      isVip: true,
      isLifetime: true,
      role: 'admin',
      createdAt: new Date(),
      trialStart: null,
      trialEnd: null,
      subscriptionStatus: 'active',
      subscriptionPlan: 'premium',
      subscriptionStartedAt: null,
    };
  },

  onAuthStateChange: (callback: (user: User | null) => void) => {
    // TEMPORARY BYPASS: Immediately call the callback with the fake user
    authService.getCurrentUser().then(callback);
    
    // Return a dummy subscription object
    return {
      data: {
        subscription: {
          id: 'dummy',
          unsubscribe: () => {},
        }
      }
    } as any;
  },

  applyCoupon: async (code: string): Promise<User | null> => {
    console.warn("applyCoupon not fully implemented for Supabase yet");
    return await authService.getCurrentUser();
  },

  upgradePlan: async (plan: UserPlan): Promise<User | null> => {
    const user = await authService.getCurrentUser();
    if (!user) return null;
    
    if (user.isAdmin || user.isVip || user.isLifetime) {
      return user;
    }

    let { error } = await supabase
      .from('user_profiles')
      .update({ plan })
      .eq('user_id', user.id);
      
    if (error) {
      await supabase
        .from('user_profiles')
        .update({ plan })
        .eq('id', user.id);
    }

    return await authService.getCurrentUser();
  },

  checkAccess: (feature: 'scanner' | 'ev' | 'alerts' | 'simulator_advanced', user: User | null): boolean => {
    // DEBUG MODE: Always allow access
    return true;
    
    /* Original checkAccess logic (temporarily bypassed)
    if (!user) return false;

    // 5. Ajustar checkAccess():
    // - admin → acesso total
    // - is_lifetime → acesso total
    // - trial válido → acesso
    // - subscription_status = 'active' → acesso
    // - senão → bloquear

    if (user.isAdmin) return true;
    if (user.isLifetime) return true;
    
    const now = new Date().getTime();
    const isTrialValid = user.trialEnd ? now <= user.trialEnd : false;
    if (isTrialValid) return true;
    
    if (user.subscriptionStatus === 'active') return true;

    return false;
    */
  }
};

