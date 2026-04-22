import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import AuthorizedContactsEditor from "@/components/AuthorizedContactsEditor";
import ChildProfileForm from "@/components/ChildProfileForm";
import DatabaseSetupCard from "@/components/DatabaseSetupCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  type AssociationProfileRow,
  type AuthorizedContactRow,
  type AuthorizedContactValues,
  type ChildFormValues,
  type ChildRow,
  type UserProfileRow,
  buildChildFullName,
  getEmptyChildForm,
  getUserProfile,
  logAuditEvent,
  supabase,
} from "@/lib/supabase";
import { showError, showSuccess } from "@/utils/toast";
import { LoaderCircle, LogOut, Pencil, Plus, Save, ShieldCheck, Trash2, Users } from "lucide-react";

const childRowToForm = (child: ChildRow): ChildFormValues => ({
  first_name: child.first_name || "",
  last_name: child.last_name || "",
  birth_date: child.birth_date || "",
  gender: child.gender || "",
  place_of_birth: child.place_of_birth || "",
  fiscal_code: child.fiscal_code || "",
  street_address: child.street_address || "",
  city: child.city || "",
  postal_code: child.postal_code || "",
  country: child.country || "Italia",
  allergies: child.allergies || "",
  medical_conditions: child.medical_conditions || "",
  medications: child.medications || "",
  dietary_notes: child.dietary_notes || "",
  epi_pen_required: child.epi_pen_required || false,
  epi_pen_notes: child.epi_pen_notes || "",
  emergency_action_plan: child.emergency_action_plan,
  doctor_name: child.doctor_name || "",
  doctor_phone: child.doctor_phone || "",
  image_usage_consent: child.image_usage_consent,
  additional_notes: child.additional_notes || "",
});

const Family = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfileRow | null>(null);
  const [association, setAssociation] = useState<AssociationProfileRow | null>(null);
  const [children, setChildren] = useState<ChildRow[]>([]);
  const [contactsByChild, setContactsByChild] = useState<Record<string, AuthorizedContactRow[]>>({});
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [childForm, setChildForm] = useState<ChildFormValues>(getEmptyChildForm());
  const [loading, setLoading] = useState(true);
  const [savingChild, setSavingChild] = useState(false);
  const [dbError, setDbError] = useState("");

  const loadContacts = useCallback(async (childIds: string[]) => {
    if (!supabase || childIds.length === 0) {
      setContactsByChild({});
      return;
    }

    const { data, error } = await supabase.from("authorized_contacts").select("*").in("child_id", childIds);
    if (error) {
      setDbError(error.message);
      return;
    }

    const mappedContacts = (data ?? []).reduce<Record<string, AuthorizedContactRow[]>>((accumulator, item) => {
      const row = item as AuthorizedContactRow;
      accumulator[row.child_id] = [...(accumulator[row.child_id] ?? []), row];
      return accumulator;
    }, {});

    setContactsByChild(mappedContacts);
  }, []);

  const loadChildren = useCallback(async (userId: string) => {
    if (!supabase) {
      return;
    }

    const { data, error } = await supabase
      .from("children")
      .select("*")
      .eq("parent_user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      setDbError(error.message);
      return;
    }

    const typedChildren = (data ?? []) as ChildRow[];
    setChildren(typedChildren);
    if (typedChildren.length > 0) {
      setSelectedChildId((currentSelected) => currentSelected ?? typedChildren[0].id);
      await loadContacts(typedChildren.map((child) => child.id));
    }
  }, [loadContacts]);

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

      const currentProfile = await getUserProfile(data.user.id);
      if (!currentProfile) {
        navigate("/login", { replace: true });
        return;
      }

      if (currentProfile.role !== "parent") {
        navigate("/", { replace: true });
        return;
      }

      setProfile(currentProfile);

      const { data: associationData } = await supabase
        .from("association_profiles")
        .select("*")
        .eq("id", currentProfile.association_id)
        .maybeSingle();

      setAssociation((associationData ?? null) as AssociationProfileRow | null);
      await loadChildren(data.user.id);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [loadChildren, navigate]);

  const selectedChild = useMemo(() => children.find((child) => child.id === selectedChildId) ?? null, [children, selectedChildId]);

  const startNewChild = () => {
    setEditingChildId(null);
    setChildForm(getEmptyChildForm());
  };

  const startEditingChild = (child: ChildRow) => {
    setEditingChildId(child.id);
    setSelectedChildId(child.id);
    setChildForm(childRowToForm(child));
  };

  const handleSaveChild = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabase || !profile?.association_id) {

      return;
    }

    if (!childForm.first_name || !childForm.last_name || !childForm.birth_date) {
      showError("Compila almeno nome, cognome e data di nascita del bambino");
      return;
    }

    setSavingChild(true);
    const payload = {
      association_id: profile.association_id,
      parent_user_id: profile.owner_id,
      full_name: buildChildFullName(childForm),
      ...childForm,
    };

    if (editingChildId) {
      const { data, error } = await supabase.from("children").update(payload).eq("id", editingChildId).select("*").single();
      setSavingChild(false);

      if (error) {
        showError(error.message);
        return;
      }

      const updatedChild = data as ChildRow;
      setChildren((currentChildren) => currentChildren.map((child) => (child.id === updatedChild.id ? updatedChild : child)));
      await logAuditEvent({
        associationId: profile.association_id,
        actorRole: "parent",
        entityType: "child",
        entityId: updatedChild.id,
        action: "child_updated",
        details: { full_name: updatedChild.full_name },
      });
      showSuccess("Profilo bambino aggiornato");
      return;
    }

    const { data, error } = await supabase.from("children").insert(payload).select("*").single();
    setSavingChild(false);

    if (error) {
      showError(error.message);
      return;
    }

    const newChild = data as ChildRow;
    setChildren((currentChildren) => [...currentChildren, newChild]);
    setSelectedChildId(newChild.id);
    setEditingChildId(newChild.id);
    await logAuditEvent({
      associationId: profile.association_id,
      actorRole: "parent",
      entityType: "child",
      entityId: newChild.id,
      action: "child_created",
      details: { full_name: newChild.full_name },
    });
    showSuccess("Bambino aggiunto correttamente");
  };

  const handleDeleteChild = async (childId: string) => {
    if (!supabase || !profile?.association_id) {
      return;
    }

    const child = children.find((item) => item.id === childId);
    const { error } = await supabase.from("children").delete().eq("id", childId);
    if (error) {
      showError(error.message);
      return;
    }

    setChildren((currentChildren) => currentChildren.filter((currentChild) => currentChild.id !== childId));
    setContactsByChild((currentContacts) => {
      const nextContacts = { ...currentContacts };
      delete nextContacts[childId];
      return nextContacts;
    });
    if (selectedChildId === childId) {
      setSelectedChildId(null);
    }
    if (editingChildId === childId) {
      setEditingChildId(null);
      setChildForm(getEmptyChildForm());
    }
    await logAuditEvent({
      associationId: profile.association_id,
      actorRole: "parent",
      entityType: "child",
      entityId: childId,
      action: "child_deleted",
      details: { full_name: child?.full_name },
    });
    showSuccess("Bambino rimosso");
  };

  const handleCreateContact = async (values: AuthorizedContactValues) => {
    if (!supabase || !profile?.association_id || !selectedChildId) {
      return;
    }

    const { data, error } = await supabase.from("authorized_contacts").insert({ child_id: selectedChildId, ...values }).select("*").single();
    if (error) {
      showError(error.message);
      return;
    }

    const createdContact = data as AuthorizedContactRow;
    setContactsByChild((current) => ({
      ...current,
      [selectedChildId]: [...(current[selectedChildId] ?? []), createdContact],
    }));
    await logAuditEvent({
      associationId: profile.association_id,
      actorRole: "parent",
      entityType: "authorized_contact",
      entityId: createdContact.id,
      action: "authorized_contact_created",
      details: { child_id: selectedChildId, full_name: values.full_name },
    });
    showSuccess("Persona autorizzata aggiunta");
  };

  const handleUpdateContact = async (contactId: string, values: AuthorizedContactValues) => {
    if (!supabase || !profile?.association_id || !selectedChildId) {
      return;
    }

    const { data, error } = await supabase.from("authorized_contacts").update(values).eq("id", contactId).select("*").single();
    if (error) {
      showError(error.message);
      return;
    }

    const updatedContact = data as AuthorizedContactRow;
    setContactsByChild((current) => ({
      ...current,
      [selectedChildId]: (current[selectedChildId] ?? []).map((contact) => (contact.id === contactId ? updatedContact : contact)),
    }));
    await logAuditEvent({
      associationId: profile.association_id,
      actorRole: "parent",
      entityType: "authorized_contact",
      entityId: contactId,
      action: "authorized_contact_updated",
      details: { child_id: selectedChildId, full_name: values.full_name },
    });
    showSuccess("Persona autorizzata aggiornata");
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!supabase || !profile?.association_id || !selectedChildId) {
      return;
    }

    const { error } = await supabase.from("authorized_contacts").delete().eq("id", contactId);
    if (error) {
      showError(error.message);
      return;
    }

    setContactsByChild((current) => ({
      ...current,
      [selectedChildId]: (current[selectedChildId] ?? []).filter((contact) => contact.id !== contactId),
    }));
    await logAuditEvent({
      associationId: profile.association_id,
      actorRole: "parent",
      entityType: "authorized_contact",
      entityId: contactId,
      action: "authorized_contact_deleted",
      details: { child_id: selectedChildId },
    });
    showSuccess("Persona autorizzata rimossa");
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
            Caricamento portale famiglia...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 pb-12 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section
          className="rounded-[2.75rem] p-8 text-white shadow-2xl shadow-slate-200/70 sm:p-10"
          style={{ backgroundColor: association?.primary_color || "#0f766e" }}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-white/90">
                <ShieldCheck className="h-4 w-4" />
                Portale famiglia
              </div>
              <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">{association?.app_title || association?.association_name || "Portale famiglie"}</h1>
              <p className="mt-4 max-w-2xl text-base font-medium text-white/80">
                Il tuo account è registrato una sola volta. Da qui puoi creare, modificare o eliminare i profili dei bambini e gestire le persone autorizzate al drop-off e pick-up.
              </p>
            </div>
            <div className="rounded-[2rem] bg-white/10 p-5 backdrop-blur-sm lg:min-w-[280px]">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-white/70">Genitore / tutore</p>
              <p className="mt-2 text-xl font-black text-white">{profile?.first_name} {profile?.last_name}</p>
              <p className="mt-2 text-sm font-medium text-white/80">{profile?.email}</p>
              <Button onClick={handleSignOut} variant="secondary" className="mt-4 rounded-2xl bg-white text-slate-900 hover:bg-slate-100">
                <LogOut className="mr-2 h-4 w-4" />
                Esci
              </Button>
            </div>
          </div>
        </section>

        {dbError && <DatabaseSetupCard message={dbError} />}

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="rounded-[2rem] border-none bg-white shadow-xl shadow-slate-200/70">
            <CardContent className="p-6 sm:p-7">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Profili bambini</p>
                  <h2 className="mt-1 text-2xl font-black text-slate-900">I tuoi figli</h2>
                </div>
                <Button type="button" onClick={startNewChild} className="rounded-2xl bg-sky-700 text-white hover:bg-sky-800">
                  <Plus className="mr-2 h-4 w-4" />
                  Nuovo profilo
                </Button>
              </div>

              <div className="space-y-3">
                {children.map((child) => (
                  <article
                    key={child.id}
                    className={`rounded-[1.5rem] border p-4 transition-colors ${selectedChildId === child.id ? "border-sky-300 bg-sky-50" : "border-slate-200 bg-slate-50"}`}
                  >
                    <button type="button" onClick={() => setSelectedChildId(child.id)} className="w-full text-left">
                      <h3 className="text-lg font-black text-slate-900">{child.full_name}</h3>
                      <p className="mt-1 text-sm font-medium text-slate-500">Nato il {child.birth_date || "dato non inserito"}</p>
                      <p className="mt-2 text-sm font-medium text-slate-500">Allergie: {child.allergies || "nessuna indicazione"}</p>
                    </button>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <Button type="button" variant="outline" onClick={() => startEditingChild(child)} className="rounded-2xl border-slate-200">
                        <Pencil className="mr-2 h-4 w-4" />
                        Modifica
                      </Button>
                      <Button type="button" variant="outline" onClick={() => void handleDeleteChild(child.id)} className="rounded-2xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Elimina
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-[2rem] border-none bg-white shadow-xl shadow-slate-200/70">
              <CardContent className="p-6 sm:p-7">
                <div className="mb-5 flex items-start gap-4">
                  <div className="rounded-[1.5rem] bg-sky-100 p-3 text-sky-700">
                    {editingChildId ? <Save className="h-6 w-6" /> : <Users className="h-6 w-6" />}
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Scheda completa</p>
                    <h2 className="mt-1 text-2xl font-black text-slate-900">{editingChildId ? "Modifica bambino" : "Nuovo bambino"}</h2>
                  </div>
                </div>
                <ChildProfileForm
                  values={childForm}
                  onChange={setChildForm}
                  onSubmit={handleSaveChild}
                  submitLabel={editingChildId ? "Salva modifiche" : "Crea profilo bambino"}
                  loading={savingChild}
                  onCancel={editingChildId ? startNewChild : undefined}
                />
              </CardContent>
            </Card>

            {selectedChild && (
              <Card className="rounded-[2rem] border-none bg-white shadow-xl shadow-slate-200/70">
                <CardContent className="p-6 sm:p-7">
                  <AuthorizedContactsEditor
                    contacts={contactsByChild[selectedChild.id] ?? []}
                    onCreate={handleCreateContact}
                    onUpdate={handleUpdateContact}
                    onDelete={handleDeleteContact}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Family;
