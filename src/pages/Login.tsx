import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import DatabaseSetupCard from "@/components/DatabaseSetupCard";
import Logo from "@/components/Logo";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { showError, showSuccess } from "@/utils/toast";
import { ArrowRight, KeyRound, UserPlus } from "lucide-react";

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

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate("/", { replace: true });
      }
    });
  }, [navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      setLoading(false);

      if (error) {
        showError(error.message);
        return;
      }

      showSuccess("Accesso effettuato");
      navigate("/", { replace: true });
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) {
      showError(error.message);
      return;
    }

    if (data.session) {
      showSuccess("Account creato con successo");
      navigate("/", { replace: true });
      return;
    }

    showSuccess("Account creato. Controlla la tua email per confermare l'accesso.");
    setMode("login");
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col justify-center gap-6 lg:grid lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[2.5rem] bg-sky-700 p-8 text-white shadow-2xl shadow-sky-200 sm:p-10">
          <div className="max-w-xl">
            <div className="inline-flex rounded-full bg-white/15 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-white/90">
              Rising Stars Portal
            </div>
            <div className="mt-6">
              <Logo variant="login" className="text-white [&_span]:text-white" />
            </div>
            <h1 className="mt-8 text-4xl font-black leading-tight sm:text-5xl">
              Presenze online, sincronizzate su ogni browser.
            </h1>
            <p className="mt-4 max-w-lg text-base font-medium text-white/80 sm:text-lg">
              Accedi con Supabase per salvare bambini, check-in e check-out in un database reale e usarli anche da dispositivi esterni.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.75rem] bg-white/10 p-5 backdrop-blur-sm">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-white/70">Database live</p>
                <p className="mt-2 text-sm font-medium text-white/90">
                  Ogni presenza viene salvata online e compare subito nello storico.
                </p>
              </div>
              <div className="rounded-[1.75rem] bg-white/10 p-5 backdrop-blur-sm">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-white/70">Accesso sicuro</p>
                <p className="mt-2 text-sm font-medium text-white/90">
                  Ogni utente vede soltanto i propri dati grazie alle policy di Supabase.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <Card className="rounded-[2.5rem] border-none bg-white shadow-2xl shadow-slate-200/70">
            <CardHeader className="space-y-5 p-8 pb-4 text-center sm:p-10 sm:pb-4">
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
                  Crea account
                </button>
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  {mode === "login" ? "Bentornato" : "Crea il tuo spazio"}
                </h2>
                <CardDescription className="mt-2 text-sm font-medium text-slate-500">
                  {mode === "login"
                    ? "Usa email e password del tuo progetto Supabase."
                    : "Registrati per iniziare a usare il database online."}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-5 p-8 pt-4 sm:p-10 sm:pt-4">
              {!isSupabaseConfigured ? (
                <DatabaseSetupCard message="Collega prima le variabili VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY al progetto." />
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-700">Email</label>
                    <Input
                      type="email"
                      placeholder="nome@azienda.it"
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
                    {mode === "login" ? <KeyRound className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                    {loading ? "Attendi..." : mode === "login" ? "Accedi" : "Crea account"}
                  </Button>
                </form>
              )}

              <div className="rounded-[1.75rem] bg-slate-50 p-4 text-left">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Flusso consigliato</p>
                <ol className="mt-3 space-y-2 text-sm font-medium text-slate-600">
                  <li>1. Crea l’account o accedi.</li>
                  <li>2. Incolla lo script SQL nel pannello Supabase se le tabelle non esistono.</li>
                  <li>3. Aggiungi i bambini e prova check-in/check-out anche da un browser esterno.</li>
                </ol>
              </div>

              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate("/")}
                className="h-11 w-full rounded-2xl text-sm font-black text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                Continua alla dashboard
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
