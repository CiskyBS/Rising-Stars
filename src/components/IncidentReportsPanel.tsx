import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  type ChildRow,
  type IncidentReportRow,
  type IncidentSeverity,
  logAuditEvent,
  supabase,
} from "@/lib/supabase";
import { showError, showSuccess } from "@/utils/toast";
import { AlertTriangle, CheckCircle2, LoaderCircle } from "lucide-react";

interface IncidentReportsPanelProps {
  associationId: string;
  children: ChildRow[];
}

const IncidentReportsPanel = ({ associationId, children }: IncidentReportsPanelProps) => {
  const [reports, setReports] = useState<IncidentReportRow[]>([]);
  const [childId, setChildId] = useState("");
  const [severity, setSeverity] = useState<IncidentSeverity>("medium");
  const [incidentType, setIncidentType] = useState("general");
  const [description, setDescription] = useState("");
  const [actionsTaken, setActionsTaken] = useState("");
  const [ambulanceCalled, setAmbulanceCalled] = useState(false);
  const [parentContacted, setParentContacted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const loadReports = async () => {
    if (!supabase) {
      return;
    }

    const { data, error } = await supabase
      .from("incident_reports")
      .select("*")
      .eq("association_id", associationId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      showError(error.message);
      return;
    }

    setReports((data ?? []) as IncidentReportRow[]);
  };

  useEffect(() => {
    void loadReports();
  }, [associationId]);

  const resetForm = () => {
    setChildId("");
    setSeverity("medium");
    setIncidentType("general");
    setDescription("");
    setActionsTaken("");
    setAmbulanceCalled(false);
    setParentContacted(false);
  };

  const handleCreate = async () => {
    if (!supabase) {
      return;
    }

    if (!childId || !description.trim()) {
      showError("Seleziona il bambino e descrivi l’incidente");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("incident_reports")
      .insert({
        association_id: associationId,
        child_id: childId,
        severity,
        incident_type: incidentType.trim() || "general",
        description: description.trim(),
        actions_taken: actionsTaken.trim(),
        ambulance_called: ambulanceCalled,
        parent_contacted: parentContacted,
        parent_contacted_at: parentContacted ? new Date().toISOString() : null,
      })
      .select("*")
      .single();
    setLoading(false);

    if (error) {
      showError(error.message);
      return;
    }

    const created = data as IncidentReportRow;
    setReports((current) => [created, ...current]);
    await logAuditEvent({
      associationId,
      actorRole: "admin",
      entityType: "incident_report",
      entityId: created.id,
      action: "incident_report_created",
      details: { child_id: childId, severity },
    });
    showSuccess("Incidente registrato nel database");
    resetForm();
  };

  const handleResolve = async (report: IncidentReportRow) => {
    if (!supabase) {
      return;
    }

    setResolvingId(report.id);
    const { data, error } = await supabase
      .from("incident_reports")
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq("id", report.id)
      .select("*")
      .single();
    setResolvingId(null);

    if (error) {
      showError(error.message);
      return;
    }

    const updated = data as IncidentReportRow;
    setReports((current) => current.map((item) => (item.id === report.id ? updated : item)));
    await logAuditEvent({
      associationId,
      actorRole: "admin",
      entityType: "incident_report",
      entityId: report.id,
      action: "incident_report_resolved",
    });
    showSuccess("Incidente segnato come risolto");
  };

  return (
    <Card className="rounded-[2rem] border-none bg-white shadow-xl shadow-slate-200/70">
      <CardContent className="space-y-6 p-6 sm:p-7">
        <div className="flex items-start gap-4">
          <div className="rounded-[1.5rem] bg-rose-100 p-3 text-rose-700">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Sicurezza operativa</p>
            <h2 className="mt-1 text-2xl font-black text-slate-900">Registro incidenti</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Tutto ciò che succede viene salvato: gravità, descrizione, azioni intraprese, ambulanza e contatto genitore.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-black text-slate-700">Bambino</label>
            <Select value={childId} onValueChange={setChildId}>
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50">
                <SelectValue placeholder="Seleziona bambino" />
              </SelectTrigger>
              <SelectContent>
                {children.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-black text-slate-700">Gravità</label>
            <Select value={severity} onValueChange={(value) => setSeverity(value as IncidentSeverity)}>
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50">
                <SelectValue placeholder="Seleziona gravità" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Bassa</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="critical">Critica</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-black text-slate-700">Tipo incidente</label>
            <Input
              value={incidentType}
              onChange={(event) => setIncidentType(event.target.value)}
              placeholder="Es. caduta, urto, reazione allergica"
              className="h-12 rounded-2xl border-slate-200 bg-slate-50"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-black text-slate-700">Descrizione</label>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Descrivi con precisione cosa è successo"
              className="min-h-[120px] rounded-[1.5rem] border-slate-200 bg-slate-50"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-black text-slate-700">Azioni intraprese</label>
            <Textarea
              value={actionsTaken}
              onChange={(event) => setActionsTaken(event.target.value)}
              placeholder="Primo soccorso, ghiaccio, chiamata genitore, osservazione, ecc."
              className="min-h-[120px] rounded-[1.5rem] border-slate-200 bg-slate-50"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Checkbox checked={ambulanceCalled} onCheckedChange={(checked) => setAmbulanceCalled(Boolean(checked))} />
            <span className="text-sm font-black text-slate-700">Ambulanza chiamata</span>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Checkbox checked={parentContacted} onCheckedChange={(checked) => setParentContacted(Boolean(checked))} />
            <span className="text-sm font-black text-slate-700">Genitore contattato</span>
          </div>
        </div>

        <Button type="button" onClick={() => void handleCreate()} disabled={loading} className="rounded-2xl bg-rose-600 text-white hover:bg-rose-700">
          {loading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
          Registra incidente
        </Button>

        <div className="space-y-3">
          {reports.map((report) => {
            const child = children.find((item) => item.id === report.child_id);
            return (
              <article key={report.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-black text-slate-900">{child?.full_name || "Bambino non trovato"}</h3>
                      <span className="rounded-full bg-rose-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-rose-700">
                        {report.severity}
                      </span>
                      {report.resolved && (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
                          Risolto
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-500">Tipo: {report.incident_type}</p>
                    <p className="mt-3 text-sm font-medium text-slate-700">{report.description}</p>
                    {report.actions_taken && <p className="mt-2 text-sm font-medium text-slate-500">Azioni: {report.actions_taken}</p>}
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                      {new Date(report.created_at).toLocaleString("it-IT")}
                    </p>
                  </div>
                  {!report.resolved && (
                    <Button type="button" variant="outline" onClick={() => void handleResolve(report)} disabled={resolvingId === report.id} className="rounded-2xl border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                      {resolvingId === report.id ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                      Segna risolto
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default IncidentReportsPanel;
