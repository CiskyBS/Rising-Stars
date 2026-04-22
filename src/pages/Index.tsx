import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ChildCard from "@/components/ChildCard";
import DatabaseSetupCard from "@/components/DatabaseSetupCard";
import Logo from "@/components/Logo";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { type AttendanceAction, type ChildRow, isSupabaseConfigured, supabase } from "@/lib/supabase";
import { showError, showSuccess } from "@/utils/toast";
import { Cloud, LoaderCircle, LogOut, MapPin, Plus, QrCode, Sparkles, Users } from "lucide-react";

const LOCATION_STORAGE_KEY = "rising-stars-location";

const Index = () => {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const [children, setChildren] = useState<ChildRow[]>([]);
  const [newChildName, setNewChildName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [authChecked, setAuthChecked] = useState(false);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [savingChild, setSavingChild] = useState(false);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [dbError, setDbError] = useState("");
  const [locationId, setLocationId] = useState(() => localStorage.getItem(LOCATION_STORAGE_KEY) ?? "");

  useEffect(() => {
    if (!supabase) {
      setAuthChecked(true);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) {
        return;
      }

      if (!data.session) {
        navigate("/login", { replace: true });
        setAuthChecked(true);
        return;
      }

      setUserEmail(data.session.user.email ?? "Operatore");
      setAuthChecked(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) {
        return;
      }

      if (!session) {
        navigate("/login", { replace: true });
        return;
      }

      setUserEmail(session.user.email ?? "Operatore");
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

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

  const loadChildren = useCallback(async () => {
    if (!supabase) {
      setDbError("Supabase non è configurato. Completa l'integrazione prima di usare il database online.");
      setLoadingChildren(false);
      return;
    }

    setLoadingChildren(true);

    const { data, error } = await supabase
      .from("children")
      .select("id, full_name, created_at")
      .order("full_name", { ascending: true });

    if (error) {
      setDbError(error.message);
      setChildren([]);
      setLoadingChildren(false);
      return;
    }

    setDbError("");
    setChildren((data ?? []) as ChildRow[]);
    setLoadingChildren(false);
  }, []);

  useEffect(() => {
    if (!authChecked) {
      return;
    }

    void loadChildren();
  }, [authChecked, loadChildren]);

  const hasLocation = Boolean(locationId);

  const subtitle = useMemo(() => {
    if (hasLocation) {
      return "Puoi registrare le presenze in tempo reale sul database online.";
    }

    return "Scansiona il QR del centro per attivare check-in e check-out.";
  }, [hasLocation]);

  const handleAddChild = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = newChildName.trim();

    if (!name) {
      showError("Inserisci il nome del bambino");
      return;
    }

    if (!supabase) {
      showError("Supabase non è configurato");
      return;
    }

    setSavingChild(true);

    const { data, error } = await supabase
      .from("children")
      .insert({ full_name: name })
      .select("id, full_name, created_at")
      .single();

    setSavingChild(false);

    if (error) {
      setDbError(error.message);
      showError(error.message);
      return;
    }

    setDbError("");
    setChildren((currentChildren) => [...currentChildren, data as ChildRow].sort((a, b) => a.full_name.localeCompare(b.full_name)));
    setNewChildName("");
    showSuccess(`${name} aggiunto al database`);
  };

  const handleAttendance = async (child: ChildRow, action: AttendanceAction) => {
    if (!locationId) {
      showError("Scansiona prima il QR del centro");
      return;
    }

    if (!supabase) {
      showError("Supabase non è configurato");
      return;
    }

    setActiveChildId(child.id);

    const { error } = await supabase.from("attendance_events").insert({
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

  const clearLocation = () => {
    localStorage.removeItem(LOCATION_STORAGE_KEY);
    setLocationId("");
    showSuccess("Posizione rimossa");
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <header className="sticky top-0 z-20 border-b border-white/60 bg-slate-50/95 px-4 py-4 backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Logo variant="header" />

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-500 shadow-sm sm:block">
              {userEmail || "Sessione demo"}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="rounded-full bg-white text-slate-500 shadow-sm hover:bg-slate-100"
            >
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
                <Cloud className="h-4 w-4" />
                {isSupabaseConfigured ? "Database online" : "Configurazione richiesta"}
              </div>
              <h1 className="mt-5 text-3xl font-black leading-tight sm:text-4xl">
                Dashboard presenze live per i tuoi bambini.
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium text-white/80 sm:text-base">
                Aggiungi i profili, scansiona il QR del centro e salva ogni passaggio direttamente su Supabase.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px]">
              <div className="rounded-[1.75rem] bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/70">Bambini</p>
                <p className="mt-2 text-3xl font-black text-white">{children.length}</p>
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
                    <h2 className="mt-1 text-2xl font-black text-slate-900">
                      {hasLocation ? locationId : "Nessuna posizione rilevata"}
                    </h2>
                    <p className="mt-2 text-sm font-medium text-slate-500">{subtitle}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:min-w-[220px]">
                  <Button
                    onClick={() => navigate("/scanner")}
                    className={`h-12 rounded-2xl font-black text-white ${hasLocation ? "bg-emerald-600 hover:bg-emerald-700" : "bg-sky-700 hover:bg-sky-800"}`}
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    {hasLocation ? "Cambia posizione" : "Scansiona QR"}
                  </Button>
                  {hasLocation && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearLocation}
                      className="h-11 rounded-2xl border-slate-200 font-black text-slate-600"
                    >
                      Rimuovi posizione
                    </Button>
                  )}
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
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Nuovo profilo</p>
                  <h2 className="mt-1 text-2xl font-black text-slate-900">Aggiungi un bambino</h2>
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    Il nome viene salvato online e sarà visibile subito anche da altri browser collegati allo stesso account.
                  </p>
                </div>
              </div>

              <form onSubmit={handleAddChild} className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Input
                  value={newChildName}
                  onChange={(event) => setNewChildName(event.target.value)}
                  placeholder="Es. Giulia Rossi"
                  className="h-12 rounded-2xl border-slate-200 bg-slate-50"
                />
                <Button
                  type="submit"
                  disabled={savingChild}
                  className="h-12 rounded-2xl bg-slate-900 px-6 font-black text-white hover:bg-slate-800"
                >
                  {savingChild ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Aggiungi
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>

        {dbError && (
          <DatabaseSetupCard message={`Supabase ha risposto con questo errore: ${dbError}`} />
        )}

        <section>
          <div className="mb-4 flex items-center justify-between px-1">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Elenco autorizzati</p>
              <h2 className="mt-1 text-2xl font-black text-slate-900">Bambini collegati al tuo account</h2>
            </div>
            <div className="hidden items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-500 shadow-sm sm:flex">
              <Users className="h-4 w-4 text-sky-600" />
              {children.length} totali
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
                  onCheckIn={() => handleAttendance(child, "check_in")}
                  onCheckOut={() => handleAttendance(child, "check_out")}
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
                  Inserisci il primo profilo qui sopra per iniziare subito a testare il database online.
                </p>
              </CardContent>
            </Card>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
