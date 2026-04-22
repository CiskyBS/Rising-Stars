import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import AuthorizedContactVerificationPanel from "@/components/AuthorizedContactVerificationPanel";
import BottomNav from "@/components/BottomNav";
import ChildCard from "@/components/ChildCard";
import DatabaseSetupCard from "@/components/DatabaseSetupCard";
import IncidentReportsPanel from "@/components/IncidentReportsPanel";
import Logo from "@/components/Logo";
import PrivacyRequestsPanel from "@/components/PrivacyRequestsPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  type AssociationProfileRow,
  type AttendanceAction,
  type AuthorizedContactRow,
  type ChildRow,
  type UserProfileRow,
  ensureAdminContext,
  getUserProfile,
  isSupabaseConfigured,
  logAuditEvent,
  supabase,
} from "@/lib/supabase";
import { showError, showSuccess } from "@/utils/toast";
import { Cloud, LoaderCircle, LogOut, MapPin, Plus, QrCode, Settings, Sparkles, Users, WandSparkles } from "lucide-react";

const LOCATION_STORAGE_KEY = "rising-stars-location";

const splitFullName = (value: string) => {
  const cleaned = value.trim().replace(/\s+/g, " ");
  const [firstName = "", ...rest] = cleaned.split(" ");
  return {
    full_name: cleaned,
    first_name: firstName,
    last_name: rest.join(" "),
  };
};

const Index = () => {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const [association, setAssociation] = useState<AssociationProfileRow | null>(null);
  const [profile, setProfile] = useState<UserProfileRow | null>(null);
  const [children, setChildren] = useState<ChildRow[]>([]);
  const [authorizedContacts, setAuthorizedContacts] = useState<AuthorizedContactRow[]>([]);
  const [newChildName, setNewChildName] = useState("");
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [savingChild, setSavingChild] = useState(false);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [deletingChildId, setDeletingChildId] = useState<string | null>(null);
  const [dbError, setDbError] = useState("");
  const [locationId, setLocationId] = useState(() => localStorage.getItem(LOCATION_STORAGE_KEY) ?? "");

  useEffect(() => {
    const scannedLocation = routerLocation.state?.locationId;

    if (typeof scannedLocation !== "string" || !scannedLocation.trim()) {
      return;
    }

    const nextLocation = scannedLocation.trim();
    localStorage.setItem(LOCATION_STORAGE_KEY, nextLocation);
    setLocationId(nextLocation);
    navigate(routerLocation.pathname, { replace: true, state: null });
  }, [navigate, routerLocation.pathname, routerLocation.state]);

  const loadAuthorizedContacts = useCallback(async (childIds: string[]) => {
    if (!supabase || childIds.length === 0) {
      setAuthorizedContacts([]);
      return;
    }

    const { data, error } = await supabase.from("authorized_contacts").select("*").in("child_id", childIds).order("created_at", { ascending: false });
    if (error) {
      setDbError(error.message);
      return;
    }

    setAuthorizedContacts((data ?? []) as AuthorizedContactRow[]);
  }, []);

  const loadChildren = useCallback(async (associationId: string) => {
    if (!supabase) {
      setDbError("Supabase non è configurato.");
      setLoadingChildren(false);
      return;
    }

    setLoadingChildren(true);
    const { data, error } = await supabase
      .from("children")
      .select("*")
      .eq("association_id", associationId)
      .order("full_name", { ascending: true });

    if (error) {
      setDbError(error.message);
      setChildren([]);
      setLoadingChildren(false);
      return;
    }

    const typedChildren = (data ?? []) as ChildRow[];
    setDbError("");
    setChildren(typedChildren);
    await loadAuthorizedContacts(typedChildren.map((child) => child.id));
    setLoadingChildren(false);
  }, [loadAuthorizedContacts]);

  useEffect(() => {
    if (!supabase) {
      setDbError("Supabase non è configurato.");
      setLoadingPage(false);
      return;
    }

    let mounted = true;

    supabase.auth.getUser().then(async ({ data, error }) => {
      if (!mounted) {
        return;
      }

      if (error || !data.user) {
        navigate("/login", { replace: true });
        return;
      }

      let currentProfile = await getUserProfile(data.user.id);

      if (!currentProfile) {
        const adminContext = await ensureAdminContext(data.user);
        if (!adminContext) {
          setLoadingPage(false);
          return;
        }
        currentProfile = adminContext.profile;
        setAssociation(adminContext.association);
      }

      if (currentProfile.role === "parent") {
        navigate("/family", { replace: true });
        return;
      }

      setProfile(currentProfile);

      if (!association) {
        const adminContext = await ensureAdminContext(data.user);
        if (adminContext) {
          setAssociation(adminContext.association);
          void loadChildren(adminContext.association.id);
        }
      } else {
        void loadChildren(association.id);
      }

      setLoadingPage(false);
    });

    return () => {
      mounted = false;
    };
  }, [association, loadChildren, navigate]);

  const hasLocation = Boolean(locationId);
  const subtitle = useMemo(() => {
    if (hasLocation) {
      return "Il centro è attivo: ora puoi registrare check-in e check-out sul database online.";
    }

    return "Scansiona il QR dell'associazione o imposta il centro manualmente per attivare le presenze.";
  }, [hasLocation]);

  const handleAddChild = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!association || !supabase) {
      showError("Associazione non pronta");
      return;
    }

    const trimmed = newChildName.trim();
    if (!trimmed) {
      showError("Inserisci il nome del bambino");
      return;
    }

    const nameParts = splitFullName(trimmed);
    setSavingChild(true);
    const { data, error } = await supabase
      .from("children")
      .insert({
        association_id: association.id,
        full_name: nameParts.full_name,
        first_name: nameParts.first_name,
        last_name: nameParts.last_name,
      })
      .select("*")
      .single();
    setSavingChild(false);

    if (error) {
      setDbError(error.message);
      showError(error.message);
      return;
    }

    const nextChild = data as ChildRow;
    const nextChildren = [...children, nextChild].sort((a, b) => a.full_name.localeCompare(b.full_name));
    setChildren(nextChildren);
    setNewChildName("");
    await loadAuthorizedContacts(nextChildren.map((child) => child.id));
    await logAuditEvent({
      associationId: association.id,
      actorRole: "admin",
      entityType: "child",
      entityId: nextChild.id,
      action: "admin_child_created",
      details: { full_name: nextChild.full_name },
    });
    showSuccess(`${nextChild.full_name} aggiunto all'associazione`);
  };

  const handleDeleteChild = async (child: ChildRow) => {
    if (!association || !supabase) {
      return;
    }

    setDeletingChildId(child.id);
    const { error } = await supabase.from("children").delete().eq("id", child.id);
    setDeletingChildId(null);

    if (error) {
      setDbError(error.message);
      showError(error.message);
      return;
    }

    const nextChildren = children.filter((currentChild) => currentChild.id !== child.id);
    setChildren(nextChildren);
    await loadAuthorizedContacts(nextChildren.map((item) => item.id));
    await logAuditEvent({
      associationId: association.id,
      actorRole: "admin",
      entityType: "child",
      entityId: child.id,
      action: "admin_child_removed",
      details: { full_name: child.full_name },
    });
    showSuccess(`${child.full_name} rimosso dall'associazione`);
  };

  const handleAttendance = async (child: ChildRow, action: AttendanceAction) => {
    if (!association || !supabase) {
      return;
    }

    if (!locationId) {
      showError("Scansiona prima il QR del centro");
      return;
    }

    setActiveChildId(child.id);
    const { error } = await supabase.from("attendance_events").insert({
      association_id: association.id,
      child_id: child.id,
      action,
      location_name: locationId,
    });
    setActiveChildId(null);

    if (error) {
      setDbError(error.message);
      showError(error.message);
      return;
    }

    await logAuditEvent({
      associationId: association.id,
      actorRole: "admin",
      entityType: "attendance_event",
      entityId: child.id,
      action: action === "check_in" ? "manual_check_in" : "manual_check_out",
      details: { child_name: child.full_name, location_name: locationId },
    });
    showSuccess(`${action === "check_in" ? "Check-in" : "Check-out"} salvato per ${child.full_name}`);
  };

  const handleSignOut = async () => {
    localStorage.removeItem(LOCATION_STORAGE_KEY);
    setLocationId("");

    if (!supabase) {
      navigate("/login", { replace: true });
      return;
    }

    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  if (loadingPage) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
        <Card className="mx-auto max-w-4xl rounded-[2rem] border-none bg-white shadow-lg shadow-slate-200/60">
          <CardContent className="flex items-center justify-center gap-3 p-10 text-slate-500">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            Caricamento pannello amministratore...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <header className="sticky top-0 z-20 border-b border-white/60 bg-slate-50/95 px-4 py-4 backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Logo variant="header" />

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-500 shadow-sm sm:block">
              {profile?.email || "Admin"}
            </div>
            <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} className="rounded-full bg-white text-slate-500 shadow-sm hover:bg-slate-100">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="rounded-full bg-white text-slate-500 shadow-sm hover:bg-slate-100">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
        <section className="overflow-hidden rounded-[2.5rem] bg-sky-700 p-6 text-white shadow-2xl shadow-sky-200 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-white/90">
                <WandSparkles className="h-4 w-4" />
                Admin association builder
              </div>
              <h1 className="mt-5 text-3xl font-black leading-tight sm:text-4xl">{association?.association_name || "La tua associazione"}</h1>
              <p className="mt-3 max-w-2xl text-sm font-medium text-white/80 sm:text-base">
                Qui gestisci branding, famiglie, QR, documenti, incidenti, workflow privacy e presenze. Tutto è tracciato sul database.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
              <div className="rounded-[1.75rem] bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/70">Bambini</p>
                <p className="mt-2 text-3xl font-black text-white">{children.length}</p>
              </div>
              <div className="rounded-[1.75rem] bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/70">Autorizzati</p>
                <p className="mt-2 text-3xl font-black text-white">{authorizedContacts.length}</p>
              </div>
              <div className="rounded-[1.75rem] bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/70">Posizione</p>
                <p className="mt-2 text-sm font-black text-white">{hasLocation ? locationId : "Non attiva"}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="rounded-[2rem] border-none bg-white shadow-xl shadow-slate-200/70">
            <CardContent className="p-6 sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className={`rounded-[1.5rem] p-3 ${hasLocation ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Centro attivo</p>
                    <h2 className="mt-1 text-2xl font-black text-slate-900">{hasLocation ? locationId : "Nessuna posizione rilevata"}</h2>
                    <p className="mt-2 text-sm font-medium text-slate-500">{subtitle}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:min-w-[230px]">
                  <Button onClick={() => navigate("/scanner")} className={`h-12 rounded-2xl font-black text-white ${hasLocation ? "bg-emerald-600 hover:bg-emerald-700" : "bg-sky-700 hover:bg-sky-800"}`}>
                    <QrCode className="mr-2 h-4 w-4" />
                    {hasLocation ? "Cambia posizione" : "Scansiona QR"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate("/settings")} className="h-11 rounded-2xl border-slate-200 font-black text-slate-600">
                    <Settings className="mr-2 h-4 w-4" />
                    Branding, link e documenti
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-none bg-white shadow-xl shadow-slate-200/70">
            <CardContent className="p-6 sm:p-7">
              <div className="flex items-start gap-4">
                <div className="rounded-[1.5rem] bg-sky-100 p-3 text-sky-700">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Inserimento rapido</p>
                  <h2 className="mt-1 text-2xl font-black text-slate-900">Aggiungi un bambino</h2>
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    Puoi aggiungere un profilo rapido anche lato admin. I genitori poi completeranno tutti i dati di dettaglio dal loro portale.
                  </p>
                </div>
              </div>

              <form onSubmit={handleAddChild} className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Input value={newChildName} onChange={(event) => setNewChildName(event.target.value)} placeholder="Es. Giulia Rossi" className="h-12 rounded-2xl border-slate-200 bg-slate-50" />
                <Button type="submit" disabled={savingChild} className="h-12 rounded-2xl bg-slate-900 px-6 font-black text-white hover:bg-slate-800">
                  {savingChild ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Aggiungi
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>

        {dbError && <DatabaseSetupCard message={`Supabase ha risposto con questo errore: ${dbError}`} />}

        <section>
          <div className="mb-4 flex items-center justify-between px-1">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Anagrafica associazione</p>
              <h2 className="mt-1 text-2xl font-black text-slate-900">Bambini registrati</h2>
            </div>
            <div className="hidden items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-500 shadow-sm sm:flex">
              <Cloud className="h-4 w-4 text-sky-600" />
              {isSupabaseConfigured ? "Database online" : "Configurazione mancante"}
            </div>
          </div>

          {loadingChildren ? (
            <Card className="rounded-[2rem] border-none bg-white shadow-lg shadow-slate-200/60">
              <CardContent className="flex items-center justify-center gap-3 p-10 text-slate-500">
                <LoaderCircle className="h-5 w-5 animate-spin" />
                Caricamento bambini dal database...
              </CardContent>
            </Card>
          ) : children.length > 0 ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {children.map((child) => (
                <ChildCard
                  key={child.id}
                  name={child.full_name}
                  locationId={locationId}
                  isBusy={activeChildId === child.id}
                  isDeleting={deletingChildId === child.id}
                  onCheckIn={() => void handleAttendance(child, "check_in")}
                  onCheckOut={() => void handleAttendance(child, "check_out")}
                  onDelete={() => void handleDeleteChild(child)}
                />
              ))}
            </div>
          ) : (
            <Card className="rounded-[2rem] border-none bg-white shadow-lg shadow-slate-200/60">
              <CardContent className="flex flex-col items-center justify-center px-6 py-12 text-center">
                <div className="rounded-full bg-sky-100 p-4 text-sky-700">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="mt-5 text-2xl font-black text-slate-900">Nessun bambino registrato</h3>
                <p className="mt-2 max-w-md text-sm font-medium text-slate-500">
                  Dopo aver creato il link d’invito, i genitori potranno aggiungere i loro figli con tutti i dati anagrafici e sanitari dal portale dedicato.
                </p>
              </CardContent>
            </Card>
          )}
        </section>

        {association && (
          <>
            <AuthorizedContactVerificationPanel associationId={association.id} contacts={authorizedContacts} children={children} />
            <div className="grid gap-6 xl:grid-cols-2">
              <IncidentReportsPanel associationId={association.id} children={children} />
              <PrivacyRequestsPanel mode="admin" associationId={association.id} />
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
