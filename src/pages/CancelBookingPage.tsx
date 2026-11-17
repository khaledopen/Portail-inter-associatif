import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ActionForm, panel } from '../components/PortalForms';
import { rpc } from '../data/portal';
import { usePortal } from '../context/PortalContext';

export function CancelBookingPage() {
  const { hash } = useLocation();
  const { reloadDirectory } = usePortal();
  const [done, setDone] = useState(false);
  const params = new URLSearchParams(hash.slice(1));
  const id = params.get('id');
  const token = params.get('token');
  return <div className="max-w-xl mx-auto p-6">
    <div className={panel}>
      <h1 className="text-2xl font-bold">Annuler mon rendez-vous</h1>
      {done ? <p role="status">Le rendez-vous a été annulé.</p> : id && token ?
        <ActionForm label="Annuler le rendez-vous" onSubmit={async () => {
          const cancelled = await rpc<boolean>('portal_cancel_link', { p_id: id, p_token: token });
          if (!cancelled) throw new Error('Ce rendez-vous a déjà été annulé, est passé ou le lien est invalide.');
          setDone(true);
          void reloadDirectory();
        }} /> : <p>Ce lien d’annulation est incomplet.</p>}
    </div>
  </div>;
}
