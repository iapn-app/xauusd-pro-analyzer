import { UserPlan, authService } from './authService';

/**
 * Payment Service - Stripe Integration (Mock/Production Ready)
 * 
 * This service handles the checkout flow for SaaS plans.
 * In a real production environment, 'createCheckoutSession' would call 
 * your backend (Express/Node) which then interacts with the Stripe API.
 */

const PLAN_PRICES = {
  pro: 'price_pro_monthly_mock',
  premium: 'price_premium_monthly_mock'
};

export const paymentService = {
  /**
   * Initiates the Stripe Checkout flow.
   * In mock mode, it simulates a redirect to Stripe and back.
   */
  createCheckoutSession: async (plan: UserPlan): Promise<{ url: string }> => {
    const user = await authService.getCurrentUser();
    if (!user) {
      throw new Error('Você precisa estar logado para realizar um upgrade.');
    }

    console.log(`[Stripe] Criando sessão de checkout para o plano: ${plan}`);
    
    // Simulação de chamada de API para o Backend
    return new Promise((resolve) => {
      setTimeout(() => {
        // Em produção, aqui você retornaria a URL real do Stripe Checkout
        // gerada pelo seu servidor: stripe.checkout.sessions.create(...)
        const mockStripeUrl = `${window.location.origin}/checkout-simulation?plan=${plan}&userId=${user.id}`;
        resolve({ url: mockStripeUrl });
      }, 1000);
    });
  },

  /**
   * Logic to handle the redirect to the checkout URL
   */
  goToCheckout: async (plan: UserPlan) => {
    try {
      const { url } = await paymentService.createCheckoutSession(plan);
      
      // Simulação de redirecionamento (em produção seria window.location.href = url)
      // Para o mock, vamos abrir um "confirm" para simular o sucesso do Stripe
      const confirmed = window.confirm(`[SIMULAÇÃO STRIPE]\n\nVocê está sendo redirecionado para o checkout do Plano ${plan.toUpperCase()}.\n\nDeseja simular um PAGAMENTO COM SUCESSO?`);
      
      if (confirmed) {
        await paymentService.handleSuccess(plan);
      } else {
        paymentService.handleCancel();
      }
    } catch (error: any) {
      alert(`Erro no checkout: ${error.message}`);
    }
  },

  /**
   * Handles the success callback from Stripe.
   * In production, this would be triggered by a webhook or a redirect to /success?session_id=...
   */
  handleSuccess: async (plan: UserPlan) => {
    console.log(`[Stripe] Pagamento confirmado para o plano: ${plan}`);
    
    // Atualiza o plano no serviço de autenticação
    const updatedUser = authService.upgradePlan(plan);
    
    if (updatedUser) {
      alert(`🎉 PARABÉNS! Seu upgrade para o plano ${plan.toUpperCase()} foi concluído com sucesso.`);
      // Forçar recarregamento da página ou atualizar estado global se necessário
      window.location.reload();
    }
  },

  /**
   * Handles the cancel callback from Stripe.
   */
  handleCancel: () => {
    console.log('[Stripe] Checkout cancelado pelo usuário.');
    alert('O processo de pagamento foi cancelado. Seus recursos atuais permanecem inalterados.');
  }
};
