import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  type PrivacyRequestRow,
  type PrivacyRequestStatus,
  type PrivacyRequestType,
  logAuditEvent,
  supabase,
} from "@/lib/supabase";
import { showError, showSuccess } from "@/utils/toast";
import { FileSpreadsheet, LoaderCircle, ShieldAlert } from "lucide-react";

interface PrivacyRequestsPanelProps {
  mode: "parent" | "admin";
  associationId: string;
  parentUserId?: string;
}

const requestTypeLabels: Record<PrivacyRequestType, string> = {
  export_data: "Export dati",
  delete_data: "Cancellazione dati",
  rectification: "Rettifica dati",
};

const statusLabels: Record<PrivacyRequestStatus, string> = {
  open: "Aperta",
  in_progress: "In lavorazione",
  completed: "Completata",
  rejected: "Rifiutata",
};

const PrivacyRequestsPanel = ({ mode, associationId, parentUserId }: PrivacyRequestsPanelProps) => {
  const [requests, setRequests] = useState<PrivacyRequestRow[]>([]);
  const [requestType, setRequestType] = useState<PrivacyRequestType>("export_data");
  const [requestNote, setRequestNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingStatus, setEditingStatus] = useState<Record<string, PrivacyRequestStatus>>({});
  const [editingNote, setEditingNote] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadRequests = async () => {
    if (!supabase) {
      return;
    }

    let query = supabase.from("privacy_requests").select("*").eq("association_id", associationId);
    if (mode === "parent" && parentUserId) {
      query = query.eq("parent_user_id", parentUserId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) {
      showError(error.message);
      return;
    }

    const typedRows = (data ?? []) as PrivacyRequestRow[];
    setRequests(typedRows);
    setEditingStatus(
      typedRows.reduce<Record<string, PrivacyRequestStatus>>((accumulator, item) => {
        accumulator[item.id] = item.status;
        return accumulator;
      }, {}),
    );
    setEditingNote(
      typedRows.reduce<Record<string, string>>((accumulator, item) => {
        accumulator[item.id] = item.admin_note || "";
        return accumulator;
      }, {}),
    );
  };

  useEffect(() => {
    void loadRequests();
  }, [associationId, mode, parentUserId]);

  const handleCreate = async () => {
    if (!supabase || !parentUserId) {
      return;
    }

    if (!requestNote.trim()) {
      showError("Descrivi la richiesta privacy");
      return;
    }

    setSaving(true);
    const { data, error } = await supabase
      .from("privacy_requests")
      .insert({
        association_id: associationId,
        parent_user_id: parentUserId,
        request_type: requestType,
        request_note: requestNote.trim(),
      })
      .select("*")
      .single();
    setSaving(false);

    if (error) {
      showError(error.message);
      return;
    }

    const created = data as PrivacyRequestRow;
    setRequests((current) => [created, ...current]);
    await logAuditEvent({
      associationId,
      actorRole: "parent",
      entityType: "privacy_request",
      entityId: created.id,
      action: "privacy_request_created",
      details: { request_type: requestType },
    });
    showSuccess("Richiesta privacy inviata");
    setRequestNote("");
    setRequestType("export_data");
  };

  const handleAdminSave = async (request: PrivacyRequestRow) => {
    if (!supabase) {
      return;
    }

    setUpdatingId(request.id);
    const nextStatus = editingStatus[request.id] ?? request.status;
    const nextNote = editingNote[request.id] ?? request.admin_note;
    const isResolved = nextStatus === "completed" || nextStatus === "rejected";

    const { data, error } = await supabase
      .from("privacy_requests")
      .update({
        status: nextStatus,
        admin_note: nextNote,
        resolved_at: isResolved ? new Date().toISOString() : null,
      })
      .eq("id", request.id)
      .select("*")
      .single();
    setUpdatingId(null);

    if (error) {
      showError(error.message);
      return;
    }

    const updated = data as PrivacyRequestRow;
    setRequests((current) => current.map((item) => (item.id === request.id ? updated : item)));
    await logAuditEvent({
      associationId,
      actorRole: "admin",
      entityType: "privacy_request",
      entityId: request.id,
      action: "privacy_request_updated",
      details: { status: nextStatus },
    });
    showSuccess("Richiesta privacy aggiornata");
  };

  return (
    <Card className="rounded-[2rem] border-none bg-white shadow-xl shadow-slate-200/70">
      <CardContent className="space-y-6 p-6 sm:p-7">
        <div className="flex items-start gap-4">
          <div className={`rounded-[1.5rem] p-3 ${mode === "admin" ? "bg-amber-100 text-amber-700" : "bg-sky-100 text-sky-700"}`}>
            {mode === "admin" ? <ShieldAlert className="h-6 w-6" /> : <FileSpreadsheet className="h-6 w-6" />}
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Privacy workflow</p>
            <h2 className="mt-1 text-2xl font-black text-slate-900">
              {mode === "admin" ? "Gestione richieste privacy" : "Export, rettifica e cancellazione"}
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Ogni richiesta viene salvata con stato operativo e storico, per non perdere nulla lato GDPR.
            </p>
          </div>
        </div>

        {mode === "parent" && (
          <div className="grid gap-4 md:grid-cols-[0.85fr_1.15fr]">
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700">Tipo richiesta</label>
              <Select value={requestType} onValueChange={(value) => setRequestType(value as PrivacyRequestType)}>
                <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50">
                  <SelectValue placeholder="Scegli richiesta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="export_data">Export dati</SelectItem>
                  <SelectItem value="rectification">Rettifica dati</SelectItem>
                  <SelectItem value="delete_data">Cancellazione dati</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700">Descrizione</label>
              <Textarea
                value={requestNote}
                onChange={(event) => setRequestNote(event.target.value)}
                placeholder="Descrivi la tua richiesta"
                className="min-h-[110px] rounded-[1.5rem] border-slate-200 bg-slate-50"
              />
            </div>
            <Button type="button" onClick={() => void handleCreate()} disabled={saving} className="w-full rounded-2xl bg-sky-700 text-white hover:bg-sky-800 md:col-span-2">
              {saving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
              Invia richiesta
            </Button>
          </div>
        )}

        <div className="space-y-3">
          {requests.map((request) => (
            <article key={request.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">{requestTypeLabels[request.request_type]}</h3>
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">
                      {statusLabels[request.status]}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-600">{request.request_note}</p>
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    {new Date(request.created_at).toLocaleString("it-IT")}
                  </p>
                </div>

                {mode === "admin" ? (
                  <div className="w-full max-w-sm space-y-3">
                    <Select value={editingStatus[request.id] ?? request.status} onValueChange={(value) => setEditingStatus((current) => ({ ...current, [request.id]: value as PrivacyRequestStatus }))}>
                      <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white">
                        <SelectValue placeholder="Stato" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Aperta</SelectItem>
                        <SelectItem value="in_progress">In lavorazione</SelectItem>
                        <SelectItem value="completed">Completata</SelectItem>
                        <SelectItem value="rejected">Rifiutata</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={editingNote[request.id] ?? ""}
                      onChange={(event) => setEditingNote((current) => ({ ...current, [request.id]: event.target.value }))}
                      placeholder="Nota admin"
                      className="h-12 rounded-2xl border-slate-200 bg-white"
                    />
                    <Button type="button" onClick={() => void handleAdminSave(request)} disabled={updatingId === request.id} className="w-full rounded-2xl bg-amber-500 text-white hover:bg-amber-600">
                      {updatingId === request.id ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <ShieldAlert className="mr-2 h-4 w-4" />}
                      Salva stato
                    </Button>
                  </div>
                ) : request.admin_note ? (
                  <div className="w-full max-w-sm rounded-[1.25rem] bg-white p-3 text-sm font-medium text-slate-600">
                    Risposta admin: {request.admin_note}
                  </div>
                ) : null}
              </div>
            </article>
          ))}

          {requests.length === 0 && (
            <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-medium text-slate-500">
              Nessuna richiesta presente.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PrivacyRequestsPanel;
