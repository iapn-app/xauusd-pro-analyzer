export interface EconomicEvent {
  id: string;
  name: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  time: string;
  remainingSeconds: number;
}
