import type { AdminPaymentConfig } from './types-store';

export const automaticPaymentIds = ['moncash_auto', 'natcash_auto'];
export const isAutomaticPayment = (id: string) => automaticPaymentIds.includes(id);
export const automaticPayments: AdminPaymentConfig[] = automaticPaymentIds.map((id) => ({
  id, name: id === 'moncash_auto' ? 'MonCash automatique' : 'NatCash automatique',
  is_enabled: false, is_visible: false, availability: 'maintenance',
  instructions: '', require_proof: true, fee_percentage: 0, fee_fixed_usd: 0,
}));
export function mergePaymentConfigs(configs: AdminPaymentConfig[]): AdminPaymentConfig[] {
  return [...configs, ...automaticPayments.filter(p => !configs.some(c => c.id === p.id))];
}
export function paymentSelectable(p: { id: string; is_enabled?: boolean; is_visible?: boolean; availability?: string }): boolean {
  // A personal-phone SMS is not a provider-authenticated confirmation.
  return !!p.is_enabled && p.is_visible !== false && p.availability !== 'maintenance' && !isAutomaticPayment(p.id);
}
export function paymentState(p: { id: string; is_enabled?: boolean; availability?: string }): string {
  if (p.availability === 'maintenance' || isAutomaticPayment(p.id)) return 'En maintenance';
  return p.is_enabled ? 'Disponible' : 'Indisponible';
}