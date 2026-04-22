import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import BottomNav from "@/components/BottomNav";
import DatabaseSetupCard from "@/components/DatabaseSetupCard";
import Logo from "@/components/Logo";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type AssociationDocumentRow,
  type AssociationProfileRow,
  REQUIRED_DOCUMENTS,
  createDocumentHash,
  createInviteCode,
  createQrValue,
  ensureAdminContext,
  getQrCodeImageUrl,
  getUserProfile,
  isSupabaseConfigured,
  logAuditEvent,
  readFileAsDataUrl,
  supabase,
} from "@/lib/supabase";
import { showError, showSuccess } from "@/utils/toast";
import {
  ArrowLeft,
  Copy,
  KeyRound,
  LoaderCircle,
  LogOut,
  Mail,
  Palette,
  QrCode,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
  Share2,
  Upload,
} from "lucide-react";

const Settings = () => {
  const navigate = useNavigate();
  const [association, setAssociation] = useState<AssociationProfileRow | null>(null);
  const [documents, setDocuments] = useState<AssociationDocumentRow[]>([]);
  const [email, setEmail] = useState("");
  const [nextEmail, setNextEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [associationName, setAssociationName] = useState("");
  const [appTitle, setAppTitle] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#0f766e");
  const [secondaryColor, setSecondaryColor] = useState("#f59e0b");
  const [accentColor, setAccentColor] = useState("#7c3aed");
  const [logoPreview, setLogoPreview] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingBrand, setSavingBrand] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [regeneratingInvite, setRegeneratingInvite] = useState(false);
  const [regeneratingQr, setRegeneratingQr] = useState(false);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [dbError, setDbError] = useState("");
  const [inviteOrigin, setInviteOrigin] = useState("");
  const [documentDrafts, setDocumentDrafts] = useState<Record<string, { title: string; file: File | null; language: string }>>({});

  const loadDocuments = useCallback(async (associationId: string) => {
    if (!supabase) {
      return;
    }

    const { data, error } = await supabase
      .from("association_documents")
      .select("*")
      .eq("association_id", associationId)
      .order("uploaded_at", { ascending: false });

    if (error) {
      setDbError(error.message);
      return;
    }

    setDocuments((data ?? []) as AssociationDocumentRow[]);
  }, []);

  useEffect(() => {
    setInviteOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!supabase) {
      setDbError("Supabase non è configurato.");
      setLoading(false);
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

      const existingProfile = await getUserProfile(data.user.id);
      if (existingProfile?.role === "parent") {
        navigate("/family", { replace: true });
        return;
      }

      const adminContext = await ensureAdminContext(data.user);
      if (!adminContext) {
        setLoading(false);
        return;
      }

      setAssociation(adminContext.association);
      setAssociationName(adminContext.association.association_name);
      setAppTitle(adminContext.association.app_title);
      setPrimaryColor(adminContext.association.primary_color);
      setSecondaryColor(adminContext.association.secondary_color);
      setAccentColor(adminContext.association.accent_color);
      setLogoPreview(adminContext.association.logo_data_url);
      setEmail(data.user.email ?? "");
      setNextEmail(data.user.email ?? "");
      await loadDocuments(adminContext.association.id);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [loadDocuments, navigate]);

  const inviteLink = useMemo(() => {
    if (!association) {
      return "";
    }

    return `${inviteOrigin}/join/${association.invite_code}`;
  }, [association, inviteOrigin]);

  const qrCodeImageUrl = useMemo(() => (association ? getQrCodeImageUrl(association.qr_code_value) : ""), [association]);

  const handleBrandSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!association || !supabase) {
      return;
    }

    setSavingBrand(true);
    let nextLogoData = logoPreview;

    if (logoFile) {
      nextLogoData = await readFileAsDataUrl(logoFile);
    }

    const { data, error } = await supabase
      .from("association_profiles")
      .update({
        association_name: associationName.trim() || association.association_name,
        app_title: appTitle.trim() || association.app_title,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        accent_color: accentColor,
        logo_data_url: nextLogoData,
      })
      .eq("id", association.id)
      .select("*")
      .single();

    setSavingBrand(false);

    if (error) {
      setDbError(error.message);
      showError(error.message);
      return;
    }

    const nextAssociation = data as AssociationProfileRow;
    setAssociation(nextAssociation);
    setLogoPreview(nextAssociation.logo_data_url);
    setLogoFile(null);
    await logAuditEvent({
      associationId: nextAssociation.id,
      actorRole: "admin",
      entityType: "association_profile",
      entityId: nextAssociation.id,
      action: "branding_updated",
      details: {
        association_name: nextAssociation.association_name,
        app_title: nextAssociation.app_title,
      },
    });
    showSuccess("Branding e dati associazione salvati");
  };

  const handleUploadDocument = async (documentType: string) => {
    if (!association || !supabase) {
      return;
    }

    const draft = documentDrafts[documentType];
    if (!draft?.file) {
      showError("Seleziona prima un file");
      return;
    }

    setUploadingType(documentType);
    const fileData = await readFileAsDataUrl(draft.file);
    const fileHash = await createDocumentHash(fileData);
    const versionsForType = documents.filter((item) => item.document_type === documentType);
    const currentVersion = versionsForType.reduce((max, item) => Math.max(max, item.version || 1), 0);

    const { error: supersedeError } = await supabase
      .from("association_documents")
      .update({ superseded_at: new Date().toISOString() })
      .eq("association_id", association.id)
      .eq("document_type", documentType)
      .is("superseded_at", null);

    if (supersedeError) {
      setUploadingType(null);
      showError(supersedeError.message);
      return;
    }

    const { error } = await supabase.from("association_documents").insert({
      association_id: association.id,
      document_type: documentType,
      title: draft.title.trim() || REQUIRED_DOCUMENTS.find((item) => item.type === documentType)?.label || "Documento",
      file_name: draft.file.name,
      file_data: fileData,
      required: true,
      language: draft.language || "it",
      version: currentVersion + 1,
      file_hash: fileHash,
    });
    setUploadingType(null);

    if (error) {
      setDbError(error.message);
      showError(error.message);
      return;
    }

    await loadDocuments(association.id);
    await logAuditEvent({
      associationId: association.id,
      actorRole: "admin",
      entityType: "association_document",
      action: "document_uploaded",
      details: { document_type: documentType, file_name: draft.file.name, version: currentVersion + 1, file_hash: fileHash },
    });
    showSuccess(`Nuova versione documento caricata: v${currentVersion + 1}`);
  };

  const handleUpdateEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || !association) {
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
    await logAuditEvent({
      associationId: association.id,
      actorRole: "admin",
      entityType: "account",
      action: "email_update_requested",
      details: { new_email: trimmedEmail },
    });
    showSuccess("Richiesta di cambio email inviata. Controlla la posta.");
  };

  const handleUpdatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || !association) {
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
    await logAuditEvent({
      associationId: association.id,
      actorRole: "admin",
      entityType: "account",
      action: "password_updated",
    });
    showSuccess("Password aggiornata correttamente");
  };

  const handleRegenerateInvite = async () => {
    if (!association || !supabase) {
      return;
    }

    setRegeneratingInvite(true);
    const { data, error } = await supabase
      .from("association_profiles")
      .update({ invite_code: createInviteCode() })
      .eq("id", association.id)
      .select("*")
      .single();
    setRegeneratingInvite(false);

    if (error) {
      setDbError(error.message);
      showError(error.message);
      return;
    }

    const nextAssociation = data as AssociationProfileRow;
    setAssociation(nextAssociation);
    await logAuditEvent({
      associationId: nextAssociation.id,
      actorRole: "admin",
      entityType: "association_profile",
      entityId: nextAssociation.id,
      action: "invite_link_regenerated",
    });
    showSuccess("Codice invito rigenerato");
  };

  const handleRegenerateQr = async () => {
    if (!association || !supabase) {
      return;
    }

    setRegeneratingQr(true);
    const { data, error } = await supabase
      .from("association_profiles")
      .update({ qr_code_value: createQrValue(association.id) })
      .eq("id", association.id)
      .select("*")
      .single();
    setRegeneratingQr(false);

    if (error) {
      setDbError(error.message);
      showError(error.message);
      return;
    }

    const nextAssociation = data as AssociationProfileRow;
    setAssociation(nextAssociation);
    await logAuditEvent({
      associationId: nextAssociation.id,
      actorRole: "admin",
      entityType: "association_profile",
      entityId: nextAssociation.id,
      action: "association_qr_regenerated",
    });
    showSuccess("QR personale rigenerato");
  };

  const copyText = async (value: string, message: string) => {
    await navigator.clipboard.writeText(value);
    showSuccess(message);
  };

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }

    navigate("/login", { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
        <Card className="mx-auto max-w-4xl rounded-[2rem] border-none bg-white shadow-lg shadow-slate-200/60">
          <CardContent className="flex items-center justify-center gap-3 p-10 text-slate-500">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            Caricamento configurazione admin...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <header className="sticky top-0 z-20 border-b border-white/60 bg-slate-50/95 px-4 py-4 backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-full bg-white shadow-sm hover:bg-slate-100">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Logo variant="header" />
          </div>

          <Button variant="ghost" size="icon" onClick={handleSignOut} className="rounded-full bg-white text-slate-500 shadow-sm hover:bg-slate-100">
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
                Control room admin
              </div>
              <h1 className="mt-5 text-3xl font-black leading-tight sm:text-4xl">Personalizza l’app e governa la compliance.</h1>
              <p className="mt-3 text-sm font-medium text-white/80 sm:text-base">
                Branding, documenti versionati, QR personale e link di onboarding convivono qui con tracciamento completo.
              </p>
            </div>

            <div className="rounded-[1.75rem] bg-white/10 p-5 backdrop-blur-sm lg:min-w-[280px]">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/70">Account admin</p>
              <p className="mt-2 text-sm font-black text-white">{email || "—"}</p>
              <p className="mt-3 text-[11px] font-medium text-white/75">
                {isSupabaseConfigured ? "Supabase collegato" : "Configurazione Supabase mancante"}
              </p>
            </div>
          </div>
        </section>

        {dbError && <DatabaseSetupCard message={`Per usare tutte le nuove funzioni devi eseguire lo SQL aggiornato in Supabase. Errore: ${dbError}`} />}

        <Tabs defaultValue="brand" className="space-y-4">
          <TabsList className="h-auto w-full flex-wrap rounded-[1.5rem] bg-white p-2 shadow-sm shadow-slate-200/60">
            <TabsTrigger value="brand" className="rounded-[1rem] px-4 py-2 font-black">Brand</TabsTrigger>
            <TabsTrigger value="invite" className="rounded-[1rem] px-4 py-2 font-black">Invito & QR</TabsTrigger>
            <TabsTrigger value="documents" className="rounded-[1rem] px-4 py-2 font-black">Documenti</TabsTrigger>
            <TabsTrigger value="security" className="rounded-[1rem] px-4 py-2 font-black">Accesso</TabsTrigger>
          </TabsList>

          <TabsContent value="brand">
            <Card className="rounded-[2rem] border-none bg-white shadow-xl shadow-slate-200/70">
              <CardContent className="p-6 sm:p-7">
                <form onSubmit={handleBrandSave} className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                  <div className="space-y-5">
                    <div className="flex items-start gap-4">
                      <div className="rounded-[1.5rem] bg-sky-100 p-3 text-sky-700">
                        <Palette className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Skin personalizzata</p>
                        <h2 className="mt-1 text-2xl font-black text-slate-900">Identità visiva</h2>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-black text-slate-700">Nome associazione</label>
                      <Input value={associationName} onChange={(event) => setAssociationName(event.target.value)} className="h-12 rounded-2xl border-slate-200 bg-slate-50" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-black text-slate-700">Titolo app famiglie</label>
                      <Input value={appTitle} onChange={(event) => setAppTitle(event.target.value)} className="h-12 rounded-2xl border-slate-200 bg-slate-50" />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <label className="text-sm font-black text-slate-700">Colore primario</label>
                        <Input type="color" value={primaryColor} onChange={(event) => setPrimaryColor(event.target.value)} className="h-12 rounded-2xl border-slate-200 bg-slate-50 p-2" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-black text-slate-700">Colore secondario</label>
                        <Input type="color" value={secondaryColor} onChange={(event) => setSecondaryColor(event.target.value)} className="h-12 rounded-2xl border-slate-200 bg-slate-50 p-2" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-black text-slate-700">Colore accento</label>
                        <Input type="color" value={accentColor} onChange={(event) => setAccentColor(event.target.value)} className="h-12 rounded-2xl border-slate-200 bg-slate-50 p-2" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-black text-slate-700">Logo associazione</label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)}
                        className="h-12 rounded-2xl border-slate-200 bg-slate-50 file:mr-4 file:rounded-full file:border-0 file:bg-sky-700 file:px-4 file:py-2 file:text-sm file:font-black file:text-white"
                      />
                    </div>

                    <Button type="submit" disabled={savingBrand} className="rounded-2xl bg-sky-700 text-white hover:bg-sky-800">
                      {savingBrand ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Salva skin e branding
                    </Button>
                  </div>

                  <div className="rounded-[2rem] p-6 text-white shadow-xl" style={{ backgroundColor: primaryColor }}>
                    <div className="w-fit rounded-full bg-white/15 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em]">Anteprima famiglie</div>
                    <div className="mt-6 flex items-center gap-4">
                      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.75rem] bg-white/20">
                        {logoPreview ? <img src={logoPreview} alt="Logo associazione" className="h-full w-full object-cover" /> : <Logo variant="header" className="text-white [&_span]:text-white" />}
                      </div>
                      <div>
                        <h3 className="text-2xl font-black">{associationName || "La tua associazione"}</h3>
                        <p className="mt-2 text-sm font-medium text-white/80">{appTitle || "Family Portal"}</p>
                      </div>
                    </div>
                    <div className="mt-6 flex gap-3">
                      <div className="h-10 flex-1 rounded-2xl" style={{ backgroundColor: secondaryColor }} />
                      <div className="h-10 flex-1 rounded-2xl" style={{ backgroundColor: accentColor }} />
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invite">
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <Card className="rounded-[2rem] border-none bg-white shadow-xl shadow-slate-200/70">
                <CardContent className="space-y-5 p-6 sm:p-7">
                  <div className="flex items-start gap-4">
                    <div className="rounded-[1.5rem] bg-sky-100 p-3 text-sky-700">
                      <Share2 className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Onboarding genitori</p>
                      <h2 className="mt-1 text-2xl font-black text-slate-900">Link di invito</h2>
                      <p className="mt-2 text-sm font-medium text-slate-500">
                        Questo link apre la registrazione guidata, mostra i documenti obbligatori e applica la skin scelta per la tua associazione.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] bg-slate-50 p-4 text-sm font-medium break-all text-slate-700">{inviteLink || "Link non disponibile"}</div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button onClick={() => void copyText(inviteLink, "Link copiato negli appunti")} className="rounded-2xl bg-slate-900 text-white hover:bg-slate-800">
                      <Copy className="mr-2 h-4 w-4" />
                      Copia link
                    </Button>
                    <Button asChild variant="outline" className="rounded-2xl border-slate-200">
                      <a href={`mailto:?subject=Registrazione famiglie&body=${encodeURIComponent(`Apri questo link per registrarti: ${inviteLink}`)}`}>
                        <Mail className="mr-2 h-4 w-4" />
                        Invia via email
                      </a>
                    </Button>
                    <Button asChild variant="outline" className="rounded-2xl border-slate-200">
                      <a href={`https://wa.me/?text=${encodeURIComponent(`Registrati qui: ${inviteLink}`)}`} target="_blank" rel="noreferrer">
                        <Send className="mr-2 h-4 w-4" />
                        Invia via WhatsApp
                      </a>
                    </Button>
                    <Button asChild variant="outline" className="rounded-2xl border-slate-200">
                      <a href={`sms:?body=${encodeURIComponent(`Registrati qui: ${inviteLink}`)}`}>
                        <Send className="mr-2 h-4 w-4" />
                        Invia via SMS
                      </a>
                    </Button>
                  </div>

                  <Button type="button" variant="outline" onClick={handleRegenerateInvite} disabled={regeneratingInvite} className="rounded-2xl border-slate-200">
                    {regeneratingInvite ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Rigenera link
                  </Button>
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] border-none bg-white shadow-xl shadow-slate-200/70">
                <CardContent className="space-y-5 p-6 sm:p-7">
                  <div className="flex items-start gap-4">
                    <div className="rounded-[1.5rem] bg-sky-100 p-3 text-sky-700">
                      <QrCode className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">QR associazione</p>
                      <h2 className="mt-1 text-2xl font-black text-slate-900">Centro / posizione</h2>
                    </div>
                  </div>

                  {association && (
                    <>
                      <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-4">
                        <img src={qrCodeImageUrl} alt="QR personale associazione" className="mx-auto w-full max-w-[300px] rounded-[1.5rem] bg-white p-4 shadow-inner" />
                      </div>
                      <div className="rounded-[1.5rem] bg-slate-50 p-4 text-sm font-medium break-all text-slate-700">{association.qr_code_value}</div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Button onClick={() => void copyText(association.qr_code_value, "Codice QR copiato")} className="rounded-2xl bg-slate-900 text-white hover:bg-slate-800">
                          <Copy className="mr-2 h-4 w-4" />
                          Copia codice
                        </Button>
                        <Button type="button" variant="outline" onClick={handleRegenerateQr} disabled={regeneratingQr} className="rounded-2xl border-slate-200">
                          {regeneratingQr ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                          Rigenera QR
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <Card className="rounded-[2rem] border-none bg-white shadow-xl shadow-slate-200/70">
              <CardContent className="p-6 sm:p-7">
                <div className="mb-6 flex items-start gap-4">
                  <div className="rounded-[1.5rem] bg-sky-100 p-3 text-sky-700">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Firma digitale guidata</p>
                    <h2 className="mt-1 text-2xl font-black text-slate-900">Documenti obbligatori versionati</h2>
                    <p className="mt-2 text-sm font-medium text-slate-500">
                      Ogni nuova sostituzione crea una nuova versione, mantiene hash del file e non perde la prova delle accettazioni precedenti.
                    </p>
                  </div>
                </div>

                <Accordion type="single" collapsible className="rounded-[1.5rem] border border-slate-200 px-4">
                  {REQUIRED_DOCUMENTS.map((document) => {
                    const versions = documents.filter((item) => item.document_type === document.type).sort((a, b) => b.version - a.version);
                    const currentDocument = versions.find((item) => item.superseded_at === null) ?? versions[0];
                    const draft = documentDrafts[document.type] ?? { title: currentDocument?.title ?? document.label, file: null, language: currentDocument?.language ?? "it" };

                    return (
                      <AccordionItem key={document.type} value={document.type} className="border-slate-200">
                        <AccordionTrigger className="text-left text-base font-black text-slate-900 hover:no-underline">
                          <div>
                            <p>{document.label}</p>
                            <p className="mt-1 text-sm font-medium text-slate-500">
                              {currentDocument ? `Versione corrente: v${currentDocument.version} · ${currentDocument.file_name}` : document.description}
                            </p>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 pb-2">
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <label className="text-sm font-black text-slate-700">Titolo</label>
                                <Input
                                  value={draft.title}
                                  onChange={(event) =>
                                    setDocumentDrafts((current) => ({
                                      ...current,
                                      [document.type]: { ...draft, title: event.target.value },
                                    }))
                                  }
                                  className="h-12 rounded-2xl border-slate-200 bg-slate-50"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-black text-slate-700">Lingua</label>
                                <Input
                                  value={draft.language}
                                  onChange={(event) =>
                                    setDocumentDrafts((current) => ({
                                      ...current,
                                      [document.type]: { ...draft, language: event.target.value || "it" },
                                    }))
                                  }
                                  placeholder="it"
                                  className="h-12 rounded-2xl border-slate-200 bg-slate-50"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-black text-slate-700">File</label>
                              <Input
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                                onChange={(event) =>
                                  setDocumentDrafts((current) => ({
                                    ...current,
                                    [document.type]: { ...draft, file: event.target.files?.[0] ?? null },
                                  }))
                                }
                                className="h-12 rounded-2xl border-slate-200 bg-slate-50 file:mr-4 file:rounded-full file:border-0 file:bg-sky-700 file:px-4 file:py-2 file:text-sm file:font-black file:text-white"
                              />
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row">
                              <Button type="button" onClick={() => void handleUploadDocument(document.type)} disabled={uploadingType === document.type} className="rounded-2xl bg-sky-700 text-white hover:bg-sky-800">
                                {uploadingType === document.type ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                {currentDocument ? `Carica nuova versione (v${(currentDocument.version ?? 0) + 1})` : "Carica documento"}
                              </Button>
                              {currentDocument && (
                                <Button asChild variant="outline" className="rounded-2xl border-slate-200">
                                  <a href={currentDocument.file_data} download={currentDocument.file_name}>
                                    Scarica versione corrente
                                  </a>
                                </Button>
                              )}
                            </div>

                            {versions.length > 0 && (
                              <div className="rounded-[1.5rem] bg-slate-50 p-4">
                                <p className="text-sm font-black text-slate-800">Storico versioni</p>
                                <div className="mt-3 space-y-2">
                                  {versions.map((version) => (
                                    <div key={version.id} className="rounded-[1rem] bg-white p-3 text-sm font-medium text-slate-600">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-black text-slate-900">v{version.version}</span>
                                        <span>{version.file_name}</span>
                                        {version.superseded_at === null && (
                                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
                                            Corrente
                                          </span>
                                        )}
                                      </div>
                                      <p className="mt-1 break-all text-xs text-slate-500">Hash: {version.file_hash}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <div className="grid gap-6 lg:grid-cols-2">
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
                    <Input value={nextEmail} onChange={(event) => setNextEmail(event.target.value)} type="email" className="h-12 rounded-2xl border-slate-200 bg-slate-50" />
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
                    <Input value={newPassword} onChange={(event) => setNewPassword(event.target.value)} type="password" placeholder="Nuova password" className="h-12 rounded-2xl border-slate-200 bg-slate-50" />
                    <Button type="submit" disabled={savingPassword} className="w-full rounded-2xl bg-amber-500 text-white hover:bg-amber-600">
                      {savingPassword ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                      Aggiorna password
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
};

export default Settings;
