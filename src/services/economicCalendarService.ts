import { EconomicEvent } from '../types/events';

export const getEconomicEvents = async (): Promise<EconomicEvent[]> => {
  // Estrutura pronta para integração com API real de calendário econômico
  return [
    { id: '1', name: 'Non-Farm Payrolls', impact: 'HIGH', time: '09:30', remainingSeconds: 3600 },
    { id: '2', name: 'Fed Interest Rate Decision', impact: 'HIGH', time: '14:00', remainingSeconds: 18000 },
  ];
};
