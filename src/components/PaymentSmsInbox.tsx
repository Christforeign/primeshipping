import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function PaymentSmsInbox() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['payment-sms-receipts'], queryFn: async () => {
    const { data, error } = await supabase.from('payment_sms_receipts').select('id,provider,transaction_id,amount_htg,sender_phone,content_code,created_at').eq('status', 'needs_review').order('created_at', { ascending: false }).limit(100);
    if (error) throw error; return data;
  } });
  const dismiss = async (id: string) => {
    const { error } = await supabase.from('payment_sms_receipts').update({ status: 'dismissed' }).eq('id', id);
    if (error) { toast.error('Classement impossible'); return; }
    await qc.invalidateQueries({ queryKey: ['payment-sms-receipts'] });
  };
  return <section className="space-y-3 border-t pt-6">
    <h3 className="font-bold">SMS reçus — À vérifier</h3>
    <p className="text-sm text-muted-foreground">Confirmation sur le compte MonCash ou NatCash requise avant validation de la commande ou de la recharge. Aucun crédit automatique.</p>
    {query.isPending && <p>Chargement…</p>}
    {query.isError && <p role="alert" className="text-destructive">Les notifications n’ont pas pu être chargées.</p>}
    {query.data?.length === 0 && <p className="text-sm text-muted-foreground">Aucun SMS en attente.</p>}
    <div className="divide-y">{query.data?.map(row => <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="min-w-0 space-y-1 text-sm"><p className="font-semibold">{row.provider === 'moncash' ? 'MonCash' : 'NatCash'} · {Number(row.amount_htg).toLocaleString('fr-FR')} GDS</p>
        <p className="break-all">Transaction : {row.transaction_id} · Téléphone : {row.sender_phone}</p>
        {row.content_code && <p>Contenu : {row.content_code}</p>}
        <p className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString('fr-FR')}</p>
      </div><Button variant="outline" size="sm" onClick={() => dismiss(row.id)}>Classer</Button>
    </div>)}</div>
  </section>;
}