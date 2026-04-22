import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  type AuthorizedContactRow,
  type AuthorizedContactValues,
  getEmptyAuthorizedContact,
  getQrCodeImageUrl,
} from "@/lib/supabase";
import { showSuccess } from "@/utils/toast";
import { Copy, LoaderCircle, Pencil, Plus, QrCode, RefreshCw, Save, Trash2, Users } from "lucide-react";

interface AuthorizedContactsEditorProps {
  contacts: AuthorizedContactRow[];
  loading?: boolean;
  onCreate: (values: AuthorizedContactValues) => Promise<void>;
  onUpdate: (contactId: string, values: AuthorizedContactValues) => Promise<void>;
  onDelete: (contactId: string) => Promise<void>;
  onToggleActive: (contactId: string, nextActive: boolean) => Promise<void>;
  onRegenerateQr: (contactId: string) => Promise<void>;
}

const AuthorizedContactsEditor = ({
  contacts,
  loading = false,
  onCreate,
  onUpdate,
  onDelete,
  onToggleActive,
  onRegenerateQr,
}: AuthorizedContactsEditorProps) => {
  const [draft, setDraft] = useState<AuthorizedContactValues>(getEmptyAuthorizedContact());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [busyContactId, setBusyContactId] = useState<string | null>(null);

  const resetDraft = () => {
    setDraft(getEmptyAuthorizedContact());
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    if (editingId) {
      await onUpdate(editingId, draft);
    } else {
      await onCreate(draft);
    }

    setSubmitting(false);
    resetDraft();
  };

  const startEditing = (contact: AuthorizedContactRow) => {
    setEditingId(contact.id);
    setDraft({
      full_name: contact.full_name,
      relationship: contact.relationship,
      phone: contact.phone,
      email: contact.email,
      can_drop_off: contact.can_drop_off,
      can_pick_up: contact.can_pick_up,
      document_number: contact.document_number,
      verification_note: contact.verification_note,
      is_active: contact.is_active,
    });
  };

  const handleDelete = async (contactId: string) => {
    setDeletingId(contactId);
    await onDelete(contactId);
    setDeletingId(null);
    if (editingId === contactId) {
      resetDraft();
    }
  };

  const handleToggleActive = async (contact: AuthorizedContactRow) => {
    setBusyContactId(contact.id);
    await onToggleActive(contact.id, !contact.is_active);
    setBusyContactId(null);
  };

  const handleRegenerateQr = async (contactId: string) => {
    setBusyContactId(contactId);
    await onRegenerateQr(contactId);
    setBusyContactId(null);
  };

  const setField = <K extends keyof AuthorizedContactValues>(field: K, value: AuthorizedContactValues[K]) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const copyText = async (value: string, message: string) => {
    await navigator.clipboard.writeText(value);
    showSuccess(message);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-[1rem] bg-sky-100 p-3 text-sky-700">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Persone autorizzate</h3>
            <p className="text-sm font-medium text-slate-500">
              Ogni persona autorizzata riceve un QR dedicato per verificare pick-up e drop-off in modo tracciabile.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-black text-slate-700">Nome completo</label>
            <Input
              value={draft.full_name}
              onChange={(event) => setField("full_name", event.target.value)}
              placeholder="Nome e cognome"
              className="h-12 rounded-2xl border-slate-200 bg-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-black text-slate-700">Relazione</label>
            <Input
              value={draft.relationship}
              onChange={(event) => setField("relationship", event.target.value)}
              placeholder="Nonna, zio, babysitter..."
              className="h-12 rounded-2xl border-slate-200 bg-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-black text-slate-700">Telefono</label>
            <Input
              value={draft.phone}
              onChange={(event) => setField("phone", event.target.value)}
              placeholder="Numero di telefono"
              className="h-12 rounded-2xl border-slate-200 bg-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-black text-slate-700">Email</label>
            <Input
              value={draft.email}
              onChange={(event) => setField("email", event.target.value)}
              placeholder="Email facoltativa"
              className="h-12 rounded-2xl border-slate-200 bg-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-black text-slate-700">Documento identificativo</label>
            <Input
              value={draft.document_number}
              onChange={(event) => setField("document_number", event.target.value)}
              placeholder="Numero documento"
              className="h-12 rounded-2xl border-slate-200 bg-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-black text-slate-700">Nota di verifica</label>
            <Input
              value={draft.verification_note}
              onChange={(event) => setField("verification_note", event.target.value)}
              placeholder="Parola chiave o nota utile"
              className="h-12 rounded-2xl border-slate-200 bg-white"
            />
          </div>

          <div className="md:col-span-2 grid gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <Checkbox checked={draft.can_drop_off} onCheckedChange={(checked) => setField("can_drop_off", Boolean(checked))} />
              <span className="text-sm font-black text-slate-700">Può fare drop-off</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <Checkbox checked={draft.can_pick_up} onCheckedChange={(checked) => setField("can_pick_up", Boolean(checked))} />
              <span className="text-sm font-black text-slate-700">Può fare pick-up</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <Checkbox checked={draft.is_active} onCheckedChange={(checked) => setField("is_active", Boolean(checked))} />
              <span className="text-sm font-black text-slate-700">Contatto attivo</span>
            </div>
          </div>

          <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
            {editingId && (
              <Button type="button" variant="outline" onClick={resetDraft} className="rounded-2xl border-slate-200">
                Annulla modifica
              </Button>
            )}
            <Button type="submit" disabled={submitting || loading} className="rounded-2xl bg-sky-700 text-white hover:bg-sky-800">
              {submitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : editingId ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
              {editingId ? "Salva contatto" : "Aggiungi contatto"}
            </Button>
          </div>
        </form>
      </div>

      <div className="space-y-3">
        {contacts.map((contact) => (
          <article key={contact.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-base font-black text-slate-900">{contact.full_name}</h4>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${contact.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                    {contact.is_active ? "Attivo" : "Disattivato"}
                  </span>
                  {contact.verified_by_admin && (
                    <span className="rounded-full bg-violet-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-violet-700">
                      Verificato
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm font-medium text-slate-500">{contact.relationship || "Persona autorizzata"}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                  {contact.can_drop_off && <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">Drop-off</span>}
                  {contact.can_pick_up && <span className="rounded-full bg-sky-50 px-3 py-1 text-sky-700">Pick-up</span>}
                </div>
                <p className="mt-3 text-sm font-medium text-slate-500">Telefono: {contact.phone || "—"}</p>
                <p className="text-sm font-medium text-slate-500">Documento: {contact.document_number || "—"}</p>
                {contact.verification_note && <p className="text-sm font-medium text-slate-500">Verifica: {contact.verification_note}</p>}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => startEditing(contact)} className="rounded-2xl border-slate-200">
                    <Pencil className="mr-2 h-4 w-4" />
                    Modifica
                  </Button>
                  <Button type="button" variant="outline" onClick={() => void handleToggleActive(contact)} disabled={busyContactId === contact.id} className="rounded-2xl border-slate-200">
                    {busyContactId === contact.id ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    {contact.is_active ? "Disattiva" : "Riattiva"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => void handleRegenerateQr(contact.id)} disabled={busyContactId === contact.id} className="rounded-2xl border-slate-200">
                    <QrCode className="mr-2 h-4 w-4" />
                    Rigenera QR
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={deletingId === contact.id}
                    onClick={() => void handleDelete(contact.id)}
                    className="rounded-2xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  >
                    {deletingId === contact.id ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    Rimuovi
                  </Button>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <img src={getQrCodeImageUrl(contact.pickup_qr_token)} alt={`QR ${contact.full_name}`} className="mx-auto w-full max-w-[180px] rounded-[1.25rem] bg-white p-3 shadow-inner" />
                <div className="mt-3 rounded-[1rem] bg-white p-3 text-xs font-medium text-slate-500 break-all">
                  {contact.pickup_qr_token}
                </div>
                <Button type="button" onClick={() => void copyText(contact.pickup_qr_token, "Token QR copiato")} className="mt-3 w-full rounded-2xl bg-slate-900 text-white hover:bg-slate-800">
                  <Copy className="mr-2 h-4 w-4" />
                  Copia token QR
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default AuthorizedContactsEditor;
