import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import DatabaseSetupCard from "@/components/DatabaseSetupCard";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ensureAdminContext, getUserProfile, isSupabaseConfigured, logAuditEvent, supabase } from "@/lib/supabase";
import { showError, showSuccess } from "@/utils/toast";
import { ArrowRight, KeyRound, ShieldCheck, UserPlus, Users } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        return;
      }

      const existingProfile = await getUserProfile(data.user.id);
      if (existingProfile?.role === "parent") {
        navigate("/family", { replace: true });
        return;
      }

      navigate("/", { replace: true });
    });
  }, [navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email || !password) {

      showError("Inserisci email e password");
      return;
    }

    if (!supabase) {
      showError("Supabase non è configurato");
      return;
    }

    setLoading(true);

    if (mode === "login") {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);

      if (error) {
        showError(error.message);
        return;
      }

      const existingProfile = data.user ? await getUserProfile(data.user.id) : null;
      showSuccess("Accesso effettuato");
      navigate(existingProfile?.role === "parent" ? "/family" : "/", { replace: true });
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) {
      showError(error.message);
      return;
    }

    if (!data.user || !data.session) {
      showError("Per completare il setup admin in un solo passaggio, disattiva la conferma email in Supabase Auth.");
      return;
    }

    try {
      const adminContext = await ensureAdminContext(data.user);
      if (adminContext) {
        await logAuditEvent({
          associationId: adminContext.association.id,
          actorRole: "admin",
          entityType: "association",
          entityId: adminContext.association.id,
          action: "admin_account_created",
          details: { email },
        });
      }
    } catch (setupError) {
      console.error(setupError);
    }

    showSuccess("Account admin creato con successo");
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col justify-center gap-6 lg:grid lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[2.75rem] bg-sky-700 p-8 text-white shadow-2xl shadow-sky-200 sm:p-10 lg:p-12">
          <div className="max-w-2xl">
            <div className="inline-flex rounded-full bg-white/15 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-white/90">
              Portale amministrazione e famiglie
            </div>
            <div className="mt-6">
              <Logo variant="login" className="text-white [&_span]:text-white" />
            </div>
            <h1 className="mt-8 text-4xl font-black leading-tight sm:text-5xl">
              Un’unica piattaforma sicura per associazione, genitori e bambini.
            </h1>
            <p className="mt-4 max-w-xl text-base font-medium text-white/80 sm:text-lg">
              L’admin personalizza l’esperienza, carica i documenti, genera il QR e condivide il link d’invito. I genitori si registrano una sola volta e aggiornano in autonomia i profili dei figli.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.75rem] bg-white/10 p-5 backdrop-blur-sm">
                <ShieldCheck className="h-6 w-6 text-white" />
                <p className="mt-4 text-sm font-black uppercase tracking-[0.2em] text-white/70">Audit e sicurezza</p>
                <p className="mt-2 text-sm font-medium text-white/90">
                  Bambini, consensi, documenti e contatti autorizzati sono tracciati sul database online.
                </p>
              </div>
              <div className="rounded-[1.75rem] bg-white/10 p-5 backdrop-blur-sm">
                <Users className="h-6 w-6 text-white" />
                <p className="mt-4 text-sm font-black uppercase tracking-[0.2em] text-white/70">Flusso famiglie</p>
                <p className="mt-2 text-sm font-medium text-white/90">
                  Il genitore riceve il link, sceglie la lingua, firma i documenti e gestisce più bambini dallo stesso account.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <Card className="rounded-[2.75rem] border-none bg-white shadow-2xl shadow-slate-200/70">
            <CardHeader className="space-y-5 p-8 pb-4 text-center sm:p-10">
              <div className="mx-auto flex rounded-full bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={`rounded-full px-5 py-2 text-sm font-black transition-colors ${mode === "login" ? "bg-sky-700 text-white" : "text-slate-500"}`}
                >
                  Accedi
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className={`rounded-full px-5 py-2 text-sm font-black transition-colors ${mode === "signup" ? "bg-sky-700 text-white" : "text-slate-500"}`}
                >
                  Crea account admin
                </button>
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  {mode === "login" ? "Accedi al tuo portale" : "Crea il primo account amministratore"}
                </h2>
                <CardDescription className="mt-2 text-sm font-medium text-slate-500">
                  {mode === "login"
                    ? "Admin e genitori già registrati entrano da qui con email e password."
                    : "Usa questa opzione solo per creare l’account principale dell’associazione."}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-5 p-8 pt-2 sm:p-10 sm:pt-2">
              {!isSupabaseConfigured ? (
                <DatabaseSetupCard message="Collega prima le variabili VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY al progetto." />
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-700">Email</label>
                    <Input
                      type="email"
                      placeholder="nome@associazione.it"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="h-12 rounded-2xl border-slate-200 bg-slate-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-700">Password</label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="h-12 rounded-2xl border-slate-200 bg-slate-50"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-12 w-full rounded-2xl bg-sky-700 text-base font-black text-white shadow-lg shadow-sky-100 hover:bg-sky-800"
                  >
                    {loading ? (
                      "Attendi..."
                    ) : mode === "login" ? (
                      <>
                        <KeyRound className="mr-2 h-4 w-4" />
                        Accedi
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Crea account admin
                      </>
                    )}
                  </Button>
                </form>
              )}

              <div className="rounded-[1.75rem] bg-slate-50 p-4 text-left">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Per i genitori</p>
                <p className="mt-2 text-sm font-medium text-slate-600">
                  I genitori non devono creare account da questa schermata: ricevono un link personalizzato dall’amministratore via WhatsApp, email o SMS e completano la registrazione solo una volta.
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate("/")}
                className="h-11 w-full rounded-2xl text-sm font-black text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                Vai al portale
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default Login;
