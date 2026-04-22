import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import DatabaseSetupCard from "@/components/DatabaseSetupCard";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { type AttendanceRow, supabase } from "@/lib/supabase";
import { ArrowLeft, CalendarClock, LoaderCircle, LogOut, MapPin, ShieldCheck, User } from "lucide-react";

const HistoryPage = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const loadHistory = useCallback(async () => {
    if (!supabase) {
      setDbError("Supabase non è configurato.");
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("attendance_events")
      .select("id, child_id, action, location_name, created_at, children(full_name)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      setDbError(error.message);
      setLogs([]);
      setLoading(false);
      return;
    }

    setDbError("");
    setLogs((data ?? []) as AttendanceRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!supabase) {
      setDbError("Supabase non è configurato.");
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) {
        return;
      }

      if (!data.session) {
        navigate("/login", { replace: true });
        return;
      }

      setUserEmail(data.session.user.email ?? "Operatore");
      void loadHistory();
    });

    return () => {
      mounted = false;
    };
  }, [loadHistory, navigate]);

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }

    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <header className="sticky top-0 z-20 border-b border-white/60 bg-slate-50/95 px-4 py-4 backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="rounded-full bg-white shadow-sm hover:bg-slate-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Logo variant="header" />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-500 shadow-sm sm:block">
              {userEmail || "Storico"}
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
        <section className="rounded-[2.5rem] bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-sky-700">
                <ShieldCheck className="h-4 w-4" />
                Storico sincronizzato
              </div>
              <h1 className="mt-5 text-3xl font-black text-slate-900 sm:text-4xl">
                Ultimi check-in e check-out salvati online.
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium text-slate-500 sm:text-base">
                Qui trovi gli ultimi 50 movimenti registrati dal tuo account Supabase, visibili anche da browser esterni.
              </p>
            </div>

            <div className="rounded-[1.75rem] bg-slate-50 p-5 lg:min-w-[260px]">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Totale eventi</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{logs.length}</p>
            </div>
          </div>
        </section>

        {dbError && <DatabaseSetupCard message={`Supabase ha risposto con questo errore: ${dbError}`} />}

        {loading ? (
          <Card className="rounded-[2rem] border-none bg-white shadow-lg shadow-slate-200/60">
            <CardContent className="flex items-center justify-center gap-3 p-10 text-slate-500">
              <LoaderCircle className="h-5 w-5 animate-spin" />
              Caricamento storico dal database...
            </CardContent>
          </Card>
        ) : logs.length > 0 ? (
          <section className="grid gap-4">
            {logs.map((log) => {
              const createdAt = new Date(log.created_at);
              const actionLabel = log.action === "check_in" ? "Check-in" : "Check-out";
              const actionClasses =
                log.action === "check_in"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-rose-100 text-rose-700";

              return (
                <article
                  key={log.id}
                  className="flex flex-col gap-4 rounded-[2rem] border border-slate-200/70 bg-white p-5 shadow-lg shadow-slate-200/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-[1.25rem] ${actionClasses}`}>
                      <User className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-lg font-black text-slate-900">{log.children?.full_name ?? "Bambino"}</h2>
                      <div className="mt-2 flex flex-col gap-2 text-sm font-medium text-slate-500 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                        <span className="flex items-center gap-2">
                          <CalendarClock className="h-4 w-4 text-sky-600" />
                          {new Intl.DateTimeFormat("it-IT", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(createdAt)}
                        </span>
                        <span className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-sky-600" />
                          {log.location_name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={`inline-flex w-fit rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] ${actionClasses}`}>
                    {actionLabel}
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <Card className="rounded-[2rem] border-none bg-white shadow-lg shadow-slate-200/60">
            <CardContent className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <div className="rounded-full bg-sky-100 p-4 text-sky-700">
                <CalendarClock className="h-8 w-8" />
              </div>
              <h3 className="mt-5 text-2xl font-black text-slate-900">Nessuna attività registrata</h3>
              <p className="mt-2 max-w-md text-sm font-medium text-slate-500">
                Torna in dashboard, seleziona un centro e salva il primo check-in per vedere qui lo storico in tempo reale.
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default HistoryPage;
