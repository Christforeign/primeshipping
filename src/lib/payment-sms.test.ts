import { describe, it, expect } from 'vitest';
import { parsePaymentSms } from './payment-sms';
import { automaticPayments, mergePaymentConfigs, paymentSelectable } from './payment-availability';
describe('Notifications SMS (non preuves fournisseur)', () => {
  it('extrait les 1470 gourdes MonCash et conserve les zéros de transaction', () => {
    expect(parsePaymentSms('moncash', 'Ou resevwa G1,470.00 pa MonCash de  50947580521. Txn ID: 003585323764.')).toEqual({ provider: 'moncash', amountHtg: 1470, senderPhone: '50947580521', transactionId: '003585323764', contentCode: null });
  });
  it('extrait le contenu NatCash sans confondre le solde avec les 800 gourdes', () => {
    expect(parsePaymentSms('natcash', 'Ou resevwa 800 HTG nan RICHE MIRLANDE 42628319 nan 13:42 17/10/2026, kontni: 123456. Balans ou: 818.2 HTG. Transcode: 26101747538468. Mesi')).toEqual({ provider: 'natcash', amountHtg: 800, senderPhone: '42628319', transactionId: '26101747538468', contentCode: '123456' });
  });
  it('refuse un débit et un montant nul', () => {
    expect(parsePaymentSms('moncash', 'Ou voye G1,470.00 pa MonCash de 50947580521. Txn ID: 003585323764.')).toBeNull();
    expect(parsePaymentSms('moncash', 'Ou resevwa G0.00 pa MonCash de 50947580521. Txn ID: 003585323764.')).toBeNull();
  });
});
describe('Disponibilité administrable', () => {
  it('masqué signifie non sélectionnable', () => expect(paymentSelectable({ id: 'moncash', is_enabled: true, is_visible: false })).toBe(false));
  it('désactivé signifie non sélectionnable', () => expect(paymentSelectable({ id: 'moncash', is_enabled: false })).toBe(false));
  it('maintenance signifie non sélectionnable', () => expect(paymentSelectable({ id: 'moncash', is_enabled: true, availability: 'maintenance' })).toBe(false));
  it('disponible autorise un paiement manuel', () => expect(paymentSelectable({ id: 'moncash', is_enabled: true, availability: 'available' })).toBe(true));
  it('un SMS ne débloque pas la confirmation automatique', () => expect(paymentSelectable({ id: 'moncash_auto', is_enabled: true, availability: 'available' })).toBe(false));
  it('ajoute les deux options une seule fois et masquées par défaut', () => {
    expect(mergePaymentConfigs(mergePaymentConfigs([]))).toHaveLength(2);
    expect(automaticPayments.every(p => !p.is_visible && !p.is_enabled)).toBe(true);
  });
});