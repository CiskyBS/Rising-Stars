import { useMemo, useState } from "react";
import QrTokenScanner from "@/components/QrTokenScanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type AuthorizedContactActionType,
  type AuthorizedContactRow,
  type ChildRow,
  logAuditEvent,
  supabase,
} from "@/lib/supabase";
import { showError, showSuccess } from "@/utils/toast";
import { CheckCircle2, QrCode, ShieldCheck, UserRoundCheck } from "lucide-react";

interface AuthorizedContactVerificationPanelProps {
  associationId: string;
  contacts: AuthorizedContactRow[];
  children: ChildRow[];
}

const AuthorizedContactVerificationPanel = ({
  associationId,
  contacts,
  children,
}: AuthorizedContactVerificationPanelProps) => {
  const [token, setToken] = useState("");
  const [actionType, setActionType] = useState<AuthorizedContactActionType>("pick_up");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const normalizedToken = token.trim();
  const matchedContact = useMemo(
    () => contacts.find((contact) => contact.pickup_qr_token === normalizedToken && contact.is_active) ?? null,
    [contacts, normalizedToken],
  );
  const relatedChild = useMemo(
    () => children.find((child) => child.id === matchedContact?.child_id) ?? null,
    [children, matchedContact?.child_id],
  );

  const handleRegister = async (verificationMethod: "manual" | "qr") => {
    if (!supabase) {
      return;
    }

    if (!matchedContact || !relatedChild) {
      showError("QR non riconosciuto o persona non più attiva");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("authorized_contact_access_logs").insert({
      association_id: associationId,
      child_id: relatedChild.id,
      authorized_contact_id: matchedContact.id,
      action_type: actionType,
      verification_method: verificationMethod,
      success: true,
      note: note.trim(),
    });

    if (error) {
      setSaving(false);
      showError(error.message);
      return;
    }

    if (!matchedContact.verified_by_admin) {
      await supabase
        .from("authorized_contacts")
        .update({ verified_by_admin: true, verified_at: new Date().toISOString() })
        .eq("id", matchedContact.id);
    }

    setSaving(false);

    await logAuditEvent({
      associationId,
      actorRole: "admin",
      entityType: "authorized_contact",
      entityId: matchedContact.id,
      action: `authorized_contact_${actionType}_registered`,
      details: {
        child_id: relatedChild.id,
        verification_method: verificationMethod,
        full_name: matchedContact.full_name,
      },
    });

    showSuccess(`${actionType === "pick_up" ? "Pick-up" : actionType === "drop_off" ? "Drop-off" : "Verifica"} registrato per ${matchedContact.full_name}`);
    setNote("");
  };

  return (
    <Card className="rounded-[2rem] border-none bg-white shadow-xl shadow-slate-200/70">
      <CardContent className="p-6 sm:p-7">
        <div className="mb-5 flex items-start gap-4">
          <div className="rounded-[1.5rem] bg-violet-100 p-3 text-violet-700">
            <QrCode className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Verifica persone autorizzate</p>
            <h2 className="mt-1 text-2xl font-black text-slate-900">Scanner QR pick-up / drop-off</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Il genitore genera un QR per ciascuna persona autorizzata. L’operatore lo scansiona e registra tutto nel database.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-black text-slate-700">Token QR</label>
                <Input
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  placeholder="Scansiona o incolla il token QR"
                  className="h-12 rounded-2xl border-slate-200 bg-slate-50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-700">Tipo di evento</label>
                <Select value={actionType} onValueChange={(value) => setActionType(value as AuthorizedContactActionType)}>
                  <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50">
                    <SelectValue placeholder="Seleziona azione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pick_up">Pick-up</SelectItem>
                    <SelectItem value="drop_off">Drop-off</SelectItem>
                    <SelectItem value="verification">Solo verifica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-700">Nota operatore</label>
                <Input
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Es. documento controllato"
                  className="h-12 rounded-2xl border-slate-200 bg-slate-50"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="button" onClick={() => setShowScanner((current) => !current)} className="rounded-2xl bg-violet-700 text-white hover:bg-violet-800">
                <QrCode className="mr-2 h-4 w-4" />
                {showScanner ? "Nascondi scanner" : "Apri scanner QR"}
              </Button>
              <Button type="button" variant="outline" onClick={() => void handleRegister(showScanner ? "qr" : "manual")} disabled={!matchedContact || saving} className="rounded-2xl border-slate-200">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Registra evento
              </Button>
            </div>

            {showScanner && (
              <QrTokenScanner
                title="Scansiona QR persona autorizzata"
                description="Al primo scan valido il token viene compilato automaticamente."
                onScan={(decodedText) => {
                  setToken(decodedText);
                  setShowScanner(false);
                  showSuccess("QR letto correttamente");
                }}
              />
            )}
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
            {matchedContact && relatedChild ? (
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
                  <UserRoundCheck className="h-4 w-4" />
                  QR valido
                </div>
                <h3 className="mt-4 text-xl font-black text-slate-900">{matchedContact.full_name}</h3>
                <p className="mt-1 text-sm font-medium text-slate-500">{matchedContact.relationship || "Persona autorizzata"}</p>
                <div className="mt-4 space-y-2 text-sm font-medium text-slate-600">
                  <p>Bambino: <span className="font-black text-slate-900">{relatedChild.full_name}</span></p>
                  <p>Telefono: {matchedContact.phone || "—"}</p>
                  <p>Documento: {matchedContact.document_number || "—"}</p>
                  <p>Contatto attivo: {matchedContact.is_active ? "Sì" : "No"}</p>
                  <p>Identità verificata: {matchedContact.verified_by_admin ? "Sì" : "Non ancora"}</p>
                </div>
                {matchedContact.verification_note && (
                  <div className="mt-4 rounded-[1.25rem] bg-white p-3 text-sm font-medium text-slate-600">
                    Nota verifica: {matchedContact.verification_note}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center">
                <div className="rounded-full bg-white p-4 text-slate-400 shadow-sm">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <h3 className="mt-4 text-xl font-black text-slate-900">In attesa di QR</h3>
                <p className="mt-2 max-w-sm text-sm font-medium text-slate-500">
                  Quando il token corrisponde a una persona autorizzata attiva, qui vedrai tutti i dati utili per confermare il ritiro o la consegna.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuthorizedContactVerificationPanel;
