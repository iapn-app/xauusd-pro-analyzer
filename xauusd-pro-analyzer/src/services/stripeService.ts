import { User } from './userManagementService';
import { authService } from './authService';
import { STRIPE_PLANS } from '../config/stripe';

export type StripePlan = 'pro' | 'premium';

export const getPlanPrice = (plan: StripePlan) => {
  // Mock prices since they are not in the config
  const prices = { pro: 49, premium: 97 };
  return prices[plan] || 0;
};

export const getPlanLabel = (plan: StripePlan) => {
  const labels = { pro: "PRO Mensal", premium: "PREMIUM Mensal" };
  return labels[plan] || '';
};

/**
 * MOCK INICIAL COM FLUXO REALISTA
 * Enquanto não houver chave real do Stripe, simula o redirecionamento.
 */
export const createCheckout = async (plan: StripePlan) => {
  const user = await authService.getCurrentUser();
  if (!user) {
    throw new Error('Você precisa estar logado para realizar um upgrade.');
  }

  // Salvar plano pendente no localStorage
  localStorage.setItem("pendingCheckoutPlan", plan);
  
  try {
    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        plan,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao criar sessão de checkout');
    }

    const { url } = await response.json();
    
    // Redirecionar para o Stripe Checkout
    window.location.href = url;
  } catch (error) {
    console.error('Erro no checkout:', error);
    throw error;
  }
};

/**
 * Ao concluir checkout com sucesso
 */
export const handleCheckoutSuccess = async (user: User, planParam: string | null): Promise<User> => {
  const plan = (planParam || localStorage.getItem("pendingCheckoutPlan")) as StripePlan;
  
  if (!plan || !STRIPE_PLANS[plan]) {
    throw new Error("Plano inválido ou não encontrado.");
  }

  // Limpa o plano pendente
  localStorage.removeItem("pendingCheckoutPlan");

  // Poll Supabase to check if the webhook has updated the user's plan
  let updatedUser = user;
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const currentUser = await authService.getCurrentUser();
    if (currentUser && currentUser.plan === plan) {
      updatedUser = currentUser;
      break;
    }
    // Wait 2 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 2000));
    attempts++;
  }

  // If the webhook hasn't finished yet, we still return the user.
  // The UI will update eventually when the real-time listener or next fetch happens.
  return updatedUser;
};

export const handleCheckoutCancel = () => {
  localStorage.removeItem("pendingCheckoutPlan");
  window.location.hash = '#upgrade';
};
