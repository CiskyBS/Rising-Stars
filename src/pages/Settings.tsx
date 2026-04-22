import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import DatabaseSetupCard from "@/components/DatabaseSetupCard";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  type AssociationProfileRow,
  getQrCodeImageUrl,
  isSupabaseConfigured,
  supabase,
} from "@/lib/supabase";
import { showError, showSuccess } from "@/utils/toast";
import { ArrowLeft, Copy, KeyRound, LoaderCircle, LogOut, Mail, QrCode, RefreshCw, Save, ShieldCheck } from "lucide-react";

const createQrValue = (userId: string) => `rising-stars:${userId}:${crypto.randomUUID()}`;

const Settings = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [nextEmail, setNextEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [associationName, setAssociationName] = useState("");
  const [profile, setProfile] = useState<AssociationProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [regeneratingQr, setRegeneratingQr] = useState(false);
  const [dbError, setDbError] = useState("");

  const loadProfile = useCallback(async (currentUserId: string, currentEmail: string) => {
    if (!supabase) {
      setDbError("Supabase non è configurato.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("association_profiles")
      .select("id, owner_id, association_name, qr_code_value, created_at")
      .maybeSingle();

    if (error) {
      setDbError(error.message);
      setLoading(false);
      return;
    }

    if (data) {
      const typedProfile = data as AssociationProfileRow;
      setProfile(typedProfile);
      setAssociationName(typedProfile.association_name);
      setDbError("");
      setLoading(false);
      return;
    }

    const defaultName = currentEmail.split("@")[0]?.replace(/[._-]+/g, " ").trim() || "La tua associazione";
    const { data: insertedProfile, error: insertError } = await supabase
      .from("association_profiles")
      .insert({
        owner_id: currentUserId,
        association_name: defaultName,
        qr_code_value: createQrValue(currentUserId),
      })
      .select("id, owner_id, association_name, qr_code_value, created_at")
      .single();

    if (insertError) {
      setDbError(insertError.message);
      setLoading(false);
      return;
    }

    const typedProfile = insertedProfile as AssociationProfileRow;
    setProfile(typedProfile);
    setAssociationName(typedProfile.association_name);
    setDbError("");
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!supabase) {
      setDbError("Supabase non è configurato.");
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted) {
        return;
      }

      if (error || !data.user) {
        navigate("/login", { replace: true });
        return;
      }

      const currentEmail = data.user.email ?? "";
      setUserId(data.user.id);
      setEmail(currentEmail);
      setNextEmail(currentEmail);
      void loadProfile(data.user.id, currentEmail);
    });

    return () => {
      mounted = false;
    };
  }, [loadProfile, navigate]);

  const qrCodeImageUrl = useMemo(() => (profile ? getQrCodeImageUrl(profile.qr_code_value) : ""), [profile]);

  const handleSaveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!profile || !supabase) {
      return;
    }

    const trimmedName = associationName.trim();

    if (!trimmedName) {
      showError("Inserisci il nome dell'associazione");
      return;
    }

    setSavingProfile(true);

    const { data, error } = await supabase
      .from("association_profiles")
      .update({ association_name: trimmedName })
      .eq("id", profile.id)
      .select("id, owner_id, association_name, qr_code_value, created_at")
      .single();

    setSavingProfile(false);

    if (error) {
      setDbError(error.message);
      showError(error.message);
      return;
    }

    setProfile(data as AssociationProfileRow);
    setDbError("");
    showSuccess("Profilo associazione aggiornato");
  };

  const handleRegenerateQr = async () => {
    if (!profile || !supabase || !userId) {
      return;
    }

    setRegeneratingQr(true);

    const { data, error } = await supabase
      .from("association_profiles")
      .update({ qr_code_value: createQrValue(userId) })
      .eq("id", profile.id)
      .select("id, owner_id, association_name, qr_code_value, created_at")
      .single();

    setRegeneratingQr(false);

    if (error) {
      setDbError(error.message);
      showError(error.message);
      return;
    }

    setProfile(data as AssociationProfileRow);
    setDbError("");
    showSuccess("QR personale rigenerato");
  };

  const handleCopyQrValue = async () => {
    if (!profile) {
      return;
    }

    await navigator.clipboard.writeText(profile.qr_code_value);
    showSuccess("Codice QR copiato");
  };

  const handleUpdateEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabase) {
      return;
    }

    const trimmedEmail = nextEmail.trim();

    if (!trimmedEmail) {
      showError("Inserisci una email valida");
      return;
    }

    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: trimmedEmail });
    setSavingEmail(false);

    if (error) {
      showError(error.message);
      return;
    }

    setEmail(trimmedEmail);
    showSuccess("Richiesta di cambio email inviata. Controlla la casella di posta.");
  };

  const handleUpdatePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabase) {
      return;
    }

    if (newPassword.trim().length < 6) {
      showError("La password deve avere almeno 6 caratteri");
      return;
    }

    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword.trim() });
    setSavingPassword(false);

    if (error) {
      showError(error.message);
      return;
    }

    setNewPassword("");
    showSuccess("Password aggiornata correttamente");
  };

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

          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="rounded-full bg-white text-slate-500 shadow-sm hover:bg-slate-100"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
        <section className="rounded-[2.5rem] bg-sky-700 p-6 text-white shadow-2xl shadow-sky-200 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-white/90">
                <ShieldCheck className="h-4 w-4" />
                Profilo associazione
              </div>
              <h1 className="mt-5 text-3xl font-black leading-tight sm:text-4xl">
                Gestisci accesso, QR personale e impostazioni dell'associazione.
              </h1>
              <p className="mt-3 text-sm font-medium text-white/80 sm:text-base">
                Qui puoi aggiornare nome associazione, email, password e scaricare il QR da usare per i check-in.
              </p>
            </div>

            <div className="rounded-[1.75rem] bg-white/10 p-5 backdrop-blur-sm lg:min-w-[260px]">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/70">Account</p>
              <p className="mt-2 text-sm font-black text-white">{email || "In caricamento..."}</p>
              <p className="mt-3 text-[11px] font-medium text-white/75">
                {isSupabaseConfigured ? "Collegato a Supabase" : "Configurazione Supabase mancante"}
              </p>
            </div>
          </div>
        </section>

        {dbError && <DatabaseSetupCard message={`Per usare QR e profilo associazione devi rieseguire questo SQL su Supabase. Errore: ${dbError}`} />}

        {loading ? (
          <Card className="rounded-[2rem] border-none bg-white shadow-lg shadow-slate-200/60">
            <CardContent className="flex items-center justify-center gap-3 p-10 text-slate-500">
              <LoaderCircle className="h-5 w-5 animate-spin" />
              Caricamento profilo associazione...
            </CardContent>
          </Card>
        ) : (
          <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <Card className="rounded-[2rem] border-none bg-white shadow-xl shadow-slate-200/70">
              <CardContent className="p-6 sm:p-7">
                <div className="mb-6 flex items-start gap-4">
                  <div className="rounded-[1.5rem] bg-sky-100 p-3 text-sky-700">
                    <QrCode className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">QR personale</p>
                    <h2 className="mt-1 text-2xl font-black text-slate-900">Il QR della tua associazione</h2>
                    <p className="mt-2 text-sm font-medium text-slate-500">
                      Questo QR viene generato per il tuo account. Puoi salvarlo o mostrarlo agli operatori per impostare il centro con una scansione.
                    </p>
                  </div>
                </div>

                {profile && (
                  <div className="space-y-4">
                    <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50 p-4">
                      <img
                        src={qrCodeImageUrl}
                        alt="QR personale associazione"
                        className="mx-auto w-full max-w-[280px] rounded-[1.5rem] bg-white p-4 shadow-inner"
                      />
                    </div>

                    <div className="rounded-[1.5rem] bg-slate-50 p-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Contenuto del QR</p>
                      <p className="mt-2 break-all text-sm font-medium text-slate-700">{profile.qr_code_value}</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <Button onClick={handleCopyQrValue} className="rounded-2xl bg-slate-900 text-white hover:bg-slate-800">
                        <Copy className="mr-2 h-4 w-4" />
                        Copia codice
                      </Button>
                      <Button asChild variant="outline" className="rounded-2xl border-slate-200">
                        <a href={qrCodeImageUrl} target="_blank" rel="noreferrer">
                          Scarica / Apri QR
                        </a>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleRegenerateQr}
                        disabled={regeneratingQr}
                        className="rounded-2xl border-slate-200"
                      >
                        {regeneratingQr ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Rigenera QR
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6">
              <Card className="rounded-[2rem] border-none bg-white shadow-xl shadow-slate-200/70">
                <CardContent className="p-6 sm:p-7">
                  <div className="mb-5 flex items-start gap-4">
                    <div className="rounded-[1.5rem] bg-emerald-100 p-3 text-emerald-700">
                      <Save className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Dati associazione</p>
                      <h2 className="mt-1 text-2xl font-black text-slate-900">Nome visibile</h2>
                    </div>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-3">
                    <Input
                      value={associationName}
                      onChange={(event) => setAssociationName(event.target.value)}
                      placeholder="Es. Associazione Sportiva Aurora"
                      className="h-12 rounded-2xl border-slate-200 bg-slate-50"
                    />
                    <Button type="submit" disabled={savingProfile} className="w-full rounded-2xl bg-sky-700 text-white hover:bg-sky-800">
                      {savingProfile ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Salva nome associazione
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] border-none bg-white shadow-xl shadow-slate-200/70">
                <CardContent className="p-6 sm:p-7">
                  <div className="mb-5 flex items-start gap-4">
                    <div className="rounded-[1.5rem] bg-violet-100 p-3 text-violet-700">
                      <Mail className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Accesso</p>
                      <h2 className="mt-1 text-2xl font-black text-slate-900">Cambia email</h2>
                    </div>
                  </div>

                  <form onSubmit={handleUpdateEmail} className="space-y-3">
                    <Input
                      value={nextEmail}
                      onChange={(event) => setNextEmail(event.target.value)}
                      type="email"
                      placeholder="nuova-email@associazione.it"
                      className="h-12 rounded-2xl border-slate-200 bg-slate-50"
                    />
                    <Button type="submit" disabled={savingEmail} className="w-full rounded-2xl bg-slate-900 text-white hover:bg-slate-800">
                      {savingEmail ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                      Aggiorna email
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] border-none bg-white shadow-xl shadow-slate-200/70">
                <CardContent className="p-6 sm:p-7">
                  <div className="mb-5 flex items-start gap-4">
                    <div className="rounded-[1.5rem] bg-amber-100 p-3 text-amber-700">
                      <KeyRound className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Sicurezza</p>
                      <h2 className="mt-1 text-2xl font-black text-slate-900">Cambia password</h2>
                    </div>
                  </div>

                  <form onSubmit={handleUpdatePassword} className="space-y-3">
                    <Input
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      type="password"
                      placeholder="Nuova password"
                      className="h-12 rounded-2xl border-slate-200 bg-slate-50"
                    />
                    <Button type="submit" disabled={savingPassword} className="w-full rounded-2xl bg-amber-500 text-white hover:bg-amber-600">
                      {savingPassword ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                      Aggiorna password
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Settings;
