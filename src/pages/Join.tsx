import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import ChildProfileForm from "@/components/ChildProfileForm";
import DatabaseSetupCard from "@/components/DatabaseSetupCard";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
import {
  type AssociationDocumentRow,
  type AssociationProfileRow,
  type ChildFormValues,
  type DocumentType,
  type ParentRegistrationForm,
  REQUIRED_DOCUMENTS,
  buildChildFullName,
  getEmptyChildForm,
  logAuditEvent,
  supabase,
} from "@/lib/supabase";
import { showError, showSuccess } from "@/utils/toast";
import { Globe, LoaderCircle, ShieldCheck, UserPlus } from "lucide-react";

const translations = {
  it: {
    badge: "Registrazione famiglie",
    title: "Completa l’iscrizione una sola volta",
    subtitle:
      "Scegli la lingua, inserisci i tuoi dati, accetta i documenti dell’associazione e crea il primo profilo bambino.",
    parentSection: "Dati del genitore / tutore",
    childSection: "Primo bambino",
    documentsSection: "Documenti da accettare",
    submit: "Crea account famiglia",
    login: "Hai già un account? Accedi",
  },
  en: {
    badge: "Family registration",
    title: "Complete your registration only once",
    subtitle:
      "Choose your language, add your details, accept the association documents and create the first child profile.",
    parentSection: "Parent / legal guardian details",
    childSection: "First child",
    documentsSection: "Documents to accept",
    submit: "Create family account",
    login: "Already registered? Sign in",
  },
} as const;

const defaultParentForm: ParentRegistrationForm = {
  locale: "it",
  first_name: "",
  last_name: "",
  phone: "",
  alternate_phone: "",
  legal_role: "mother",
  street_address: "",
  city: "",
  postal_code: "",
  country: "Italia",
  email: "",
  password: "",
};

const Join = () => {
  const navigate = useNavigate();
  const { inviteCode = "" } = useParams();
  const [association, setAssociation] = useState<AssociationProfileRow | null>(null);
  const [documents, setDocuments] = useState<AssociationDocumentRow[]>([]);
  const [parentForm, setParentForm] = useState<ParentRegistrationForm>(defaultParentForm);
  const [childForm, setChildForm] = useState<ChildFormValues>(getEmptyChildForm());
  const [acceptances, setAcceptances] = useState<Record<DocumentType, boolean>>({
    terms_conditions: false,
    data_policy: false,
    data_deletion: false,
    privacy_policy: false,
    image_policy: false,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dbError, setDbError] = useState("");

  useEffect(() => {
    if (!supabase) {
      setDbError("Supabase non è configurato.");
      setLoading(false);
      return;
    }

    const loadAssociation = async () => {
      const { data: associationData, error: associationError } = await supabase
        .from("association_profiles")
        .select("*")
        .eq("invite_code", inviteCode)
        .maybeSingle();

      if (associationError || !associationData) {
        setDbError("Invito non valido o associazione non trovata.");
        setLoading(false);
        return;
      }

      const { data: documentsData, error: documentsError } = await supabase
        .from("association_documents")
        .select("*")
        .eq("association_id", associationData.id)
        .order("uploaded_at", { ascending: false });

      if (documentsError) {
        setDbError(documentsError.message);
        setLoading(false);
        return;
      }

      setAssociation(associationData as AssociationProfileRow);
      setDocuments((documentsData ?? []) as AssociationDocumentRow[]);
      setLoading(false);
    };

    void loadAssociation();
  }, [inviteCode]);

  const currentTranslation = translations[parentForm.locale as keyof typeof translations] ?? translations.it;
  const uploadedRequiredTypes = documents.map((document) => document.document_type);
  const missingRequiredDocs = REQUIRED_DOCUMENTS.filter((document) => !uploadedRequiredTypes.includes(document.type));

  const heroStyle = useMemo(
    () => ({
      backgroundColor: association?.primary_color || "#0f766e",
      color: "white",
    }),
    [association],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!association || !supabase) {

      return;
    }

    if (missingRequiredDocs.length > 0) {
      showError("L’associazione deve caricare tutti i documenti obbligatori prima di invitare le famiglie.");
      return;
    }

    if (!parentForm.first_name || !parentForm.last_name || !parentForm.phone || !parentForm.email || !parentForm.password) {
      showError("Compila tutti i dati essenziali del genitore");
      return;
    }

    if (!childForm.first_name || !childForm.last_name || !childForm.birth_date) {
      showError("Compila almeno nome, cognome e data di nascita del bambino");
      return;
    }

    const allAccepted = REQUIRED_DOCUMENTS.every((document) => acceptances[document.type]);
    if (!allAccepted) {
      showError("Per continuare devi accettare tutti i documenti obbligatori");
      return;
    }

    setSubmitting(true);

    const { data, error } = await supabase.auth.signUp({
      email: parentForm.email,
      password: parentForm.password,
    });

    if (error || !data.user || !data.session) {
      setSubmitting(false);
      showError(error?.message || "Registrazione non completata. Verifica le impostazioni di Supabase Auth.");
      return;
    }

    const parentUserId = data.user.id;

    const { error: profileError } = await supabase.from("user_profiles").insert({
      owner_id: parentUserId,
      association_id: association.id,
      role: "parent",
      email: parentForm.email,
      first_name: parentForm.first_name,
      last_name: parentForm.last_name,
      phone: parentForm.phone,
      alternate_phone: parentForm.alternate_phone,
      legal_role: parentForm.legal_role,
      locale: parentForm.locale,
      street_address: parentForm.street_address,
      city: parentForm.city,
      postal_code: parentForm.postal_code,
      country: parentForm.country,
    });

    if (profileError) {
      setSubmitting(false);
      showError(profileError.message);
      return;
    }

    const firstChildFullName = buildChildFullName(childForm);
    const { data: childData, error: childError } = await supabase
      .from("children")
      .insert({
        association_id: association.id,
        parent_user_id: parentUserId,
        full_name: firstChildFullName,
        ...childForm,
      })
      .select("id")
      .single();

    if (childError) {
      setSubmitting(false);
      showError(childError.message);
      return;
    }

    const acceptancePayload = REQUIRED_DOCUMENTS.map((document) => {
      const uploadedDocument = documents.find((item) => item.document_type === document.type);
      return {
        association_id: association.id,
        document_id: uploadedDocument!.id,
        parent_user_id: parentUserId,
        accepted: true,
      };
    });

    const { error: acceptanceError } = await supabase.from("document_acceptances").insert(acceptancePayload);
    if (acceptanceError) {
      setSubmitting(false);
      showError(acceptanceError.message);
      return;
    }

    await logAuditEvent({
      associationId: association.id,
      actorRole: "parent",
      entityType: "parent_registration",
      entityId: parentUserId,
      action: "parent_registered_from_invite",
      details: { invite_code: inviteCode, locale: parentForm.locale },
    });

    await logAuditEvent({
      associationId: association.id,
      actorRole: "parent",
      entityType: "child",
      entityId: childData.id,
      action: "child_created_during_registration",
      details: { full_name: firstChildFullName },
    });

    setSubmitting(false);
    showSuccess("Registrazione completata con successo");
    navigate("/family", { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
        <Card className="mx-auto max-w-4xl rounded-[2rem] border-none bg-white shadow-lg shadow-slate-200/60">
          <CardContent className="flex items-center justify-center gap-3 p-10 text-slate-500">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            Caricamento invito famiglia...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="rounded-[2.75rem] p-8 shadow-2xl shadow-slate-200/70 sm:p-10" style={heroStyle}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-white/90">
                <Globe className="h-4 w-4" />
                {currentTranslation.badge}
              </div>
              <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">{currentTranslation.title}</h1>
              <p className="mt-4 max-w-2xl text-base font-medium text-white/80">{currentTranslation.subtitle}</p>
            </div>
            <div className="rounded-[2rem] bg-white/10 p-5 backdrop-blur-sm lg:min-w-[280px]">
              {association?.logo_data_url ? (
                <img src={association.logo_data_url} alt={association.association_name} className="mb-4 h-16 w-16 rounded-[1.25rem] object-cover" />
              ) : (
                <div className="mb-4 inline-flex rounded-[1.25rem] bg-white/15 p-4">
                  <ShieldCheck className="h-8 w-8 text-white" />
                </div>
              )}
              <p className="text-sm font-black uppercase tracking-[0.22em] text-white/70">Associazione</p>
              <p className="mt-2 text-xl font-black text-white">{association?.association_name}</p>
              <p className="mt-2 text-sm font-medium text-white/80">{association?.app_title}</p>
            </div>
          </div>
        </section>

        {dbError && <DatabaseSetupCard message={dbError} />}

        {missingRequiredDocs.length > 0 && (
          <DatabaseSetupCard message="L’associazione non ha ancora caricato tutti i documenti obbligatori. Contatta l’amministratore prima di completare l’iscrizione." />
        )}

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="rounded-[2rem] border-none bg-white shadow-xl shadow-slate-200/70">
            <CardContent className="space-y-6 p-6 sm:p-7">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Lingua</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Button type="button" variant={parentForm.locale === "it" ? "default" : "outline"} onClick={() => setParentForm((current) => ({ ...current, locale: "it" }))} className="rounded-2xl">
                    Italiano
                  </Button>
                  <Button type="button" variant={parentForm.locale === "en" ? "default" : "outline"} onClick={() => setParentForm((current) => ({ ...current, locale: "en" }))} className="rounded-2xl">
                    English
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">{currentTranslation.parentSection}</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Input value={parentForm.first_name} onChange={(event) => setParentForm((current) => ({ ...current, first_name: event.target.value }))} placeholder="Nome" className="h-12 rounded-2xl border-slate-200 bg-slate-50" />
                  <Input value={parentForm.last_name} onChange={(event) => setParentForm((current) => ({ ...current, last_name: event.target.value }))} placeholder="Cognome" className="h-12 rounded-2xl border-slate-200 bg-slate-50" />
                  <Input value={parentForm.phone} onChange={(event) => setParentForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Telefono principale" className="h-12 rounded-2xl border-slate-200 bg-slate-50" />
                  <Input value={parentForm.alternate_phone} onChange={(event) => setParentForm((current) => ({ ...current, alternate_phone: event.target.value }))} placeholder="Telefono secondario" className="h-12 rounded-2xl border-slate-200 bg-slate-50" />
                  <Input value={parentForm.email} onChange={(event) => setParentForm((current) => ({ ...current, email: event.target.value }))} type="email" placeholder="Email" className="h-12 rounded-2xl border-slate-200 bg-slate-50" />
                  <Input value={parentForm.password} onChange={(event) => setParentForm((current) => ({ ...current, password: event.target.value }))} type="password" placeholder="Password" className="h-12 rounded-2xl border-slate-200 bg-slate-50" />

                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-700">Ruolo</label>
                    <Select value={parentForm.legal_role} onValueChange={(value) => setParentForm((current) => ({ ...current, legal_role: value as ParentRegistrationForm["legal_role"] }))}>
                      <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50">
                        <SelectValue placeholder="Seleziona ruolo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mother">Madre</SelectItem>
                        <SelectItem value="father">Padre</SelectItem>
                        <SelectItem value="legal_guardian">Tutore legale</SelectItem>
                        <SelectItem value="other">Altro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Input value={parentForm.country} onChange={(event) => setParentForm((current) => ({ ...current, country: event.target.value }))} placeholder="Paese" className="h-12 rounded-2xl border-slate-200 bg-slate-50" />
                  <Input value={parentForm.street_address} onChange={(event) => setParentForm((current) => ({ ...current, street_address: event.target.value }))} placeholder="Indirizzo" className="h-12 rounded-2xl border-slate-200 bg-slate-50 md:col-span-2" />
                  <Input value={parentForm.city} onChange={(event) => setParentForm((current) => ({ ...current, city: event.target.value }))} placeholder="Città" className="h-12 rounded-2xl border-slate-200 bg-slate-50" />
                  <Input value={parentForm.postal_code} onChange={(event) => setParentForm((current) => ({ ...current, postal_code: event.target.value }))} placeholder="CAP" className="h-12 rounded-2xl border-slate-200 bg-slate-50" />
                </div>
              </div>

              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">{currentTranslation.documentsSection}</p>
                <Accordion type="single" collapsible className="mt-4 rounded-[1.5rem] border border-slate-200 px-4">
                  {REQUIRED_DOCUMENTS.map((document) => {
                    const uploadedDocument = documents.find((item) => item.document_type === document.type);
                    return (
                      <AccordionItem key={document.type} value={document.type} className="border-slate-200">
                        <AccordionTrigger className="text-left font-black text-slate-900 hover:no-underline">
                          <div>
                            <p>{uploadedDocument?.title || document.label}</p>
                            <p className="mt-1 text-sm font-medium text-slate-500">{document.description}</p>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          {uploadedDocument ? (
                            <div className="space-y-3">
                              <Button asChild variant="outline" className="rounded-2xl border-slate-200">
                                <a href={uploadedDocument.file_data} download={uploadedDocument.file_name}>
                                  Apri / scarica documento
                                </a>
                              </Button>
                              <div className="flex items-center gap-3 rounded-[1.25rem] bg-slate-50 px-4 py-3">
                                <Checkbox
                                  checked={acceptances[document.type]}
                                  onCheckedChange={(checked) =>
                                    setAcceptances((current) => ({ ...current, [document.type]: Boolean(checked) }))
                                  }
                                  className="h-5 w-5 rounded-md border-sky-400 data-[state=checked]:bg-sky-600"
                                />
                                <p className="text-sm font-black text-slate-700">Accetto questo documento</p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm font-medium text-amber-700">Documento non ancora caricato dall’associazione.</p>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-none bg-white shadow-xl shadow-slate-200/70">
            <CardContent className="p-6 sm:p-7">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">{currentTranslation.childSection}</p>
              <div className="mt-4">
                <ChildProfileForm
                  values={childForm}
                  onChange={setChildForm}
                  onSubmit={handleSubmit}
                  submitLabel={currentTranslation.submit}
                  loading={submitting}
                />
              </div>

              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate("/login")}
                className="mt-4 h-11 w-full rounded-2xl text-sm font-black text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                {currentTranslation.login}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Join;
