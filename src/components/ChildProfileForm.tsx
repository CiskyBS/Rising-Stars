import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
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
import { type ChildFormValues } from "@/lib/supabase";
import { LoaderCircle, Save } from "lucide-react";

interface ChildProfileFormProps {
  values: ChildFormValues;
  onChange: (nextValues: ChildFormValues) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitLabel: string;

  loading?: boolean;
  onCancel?: () => void;
}

const ChildProfileForm = ({
  values,
  onChange,
  onSubmit,
  submitLabel,
  loading = false,
  onCancel,
}: ChildProfileFormProps) => {
  const updateField = <K extends keyof ChildFormValues>(field: K, value: ChildFormValues[K]) => {
    onChange({ ...values, [field]: value });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-black text-slate-700">Nome</label>
          <Input
            value={values.first_name}
            onChange={(event) => updateField("first_name", event.target.value)}
            placeholder="Nome del bambino"
            className="h-12 rounded-2xl border-slate-200 bg-slate-50"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-black text-slate-700">Cognome</label>
          <Input
            value={values.last_name}
            onChange={(event) => updateField("last_name", event.target.value)}
            placeholder="Cognome del bambino"
            className="h-12 rounded-2xl border-slate-200 bg-slate-50"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-black text-slate-700">Data di nascita</label>
          <Input
            type="date"
            value={values.birth_date}
            onChange={(event) => updateField("birth_date", event.target.value)}
            className="h-12 rounded-2xl border-slate-200 bg-slate-50"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-black text-slate-700">Genere</label>
          <Input
            value={values.gender}
            onChange={(event) => updateField("gender", event.target.value)}
            placeholder="Es. Femmina / Maschio / Altro"
            className="h-12 rounded-2xl border-slate-200 bg-slate-50"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-black text-slate-700">Luogo di nascita</label>
          <Input
            value={values.place_of_birth}
            onChange={(event) => updateField("place_of_birth", event.target.value)}
            placeholder="Comune o città"
            className="h-12 rounded-2xl border-slate-200 bg-slate-50"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-black text-slate-700">Codice fiscale</label>
          <Input
            value={values.fiscal_code}
            onChange={(event) => updateField("fiscal_code", event.target.value.toUpperCase())}
            placeholder="Codice fiscale"
            className="h-12 rounded-2xl border-slate-200 bg-slate-50 uppercase"
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-black text-slate-700">Indirizzo</label>
          <Input
            value={values.street_address}
            onChange={(event) => updateField("street_address", event.target.value)}
            placeholder="Via, numero civico"
            className="h-12 rounded-2xl border-slate-200 bg-slate-50"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-black text-slate-700">Città</label>
          <Input
            value={values.city}
            onChange={(event) => updateField("city", event.target.value)}
            placeholder="Città"
            className="h-12 rounded-2xl border-slate-200 bg-slate-50"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-black text-slate-700">CAP</label>
          <Input
            value={values.postal_code}
            onChange={(event) => updateField("postal_code", event.target.value)}
            placeholder="CAP"
            className="h-12 rounded-2xl border-slate-200 bg-slate-50"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-black text-slate-700">Paese</label>
          <Input
            value={values.country}
            onChange={(event) => updateField("country", event.target.value)}
            placeholder="Paese"
            className="h-12 rounded-2xl border-slate-200 bg-slate-50"
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-black text-slate-700">Allergie</label>
          <Textarea
            value={values.allergies}
            onChange={(event) => updateField("allergies", event.target.value)}
            placeholder="Indica allergie alimentari, ambientali o farmacologiche"
            className="min-h-[110px] rounded-[1.5rem] border-slate-200 bg-slate-50"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-black text-slate-700">Patologie o condizioni mediche</label>
          <Textarea
            value={values.medical_conditions}
            onChange={(event) => updateField("medical_conditions", event.target.value)}
            placeholder="Asma, diabete, epilessia, intolleranze, altre condizioni rilevanti"
            className="min-h-[110px] rounded-[1.5rem] border-slate-200 bg-slate-50"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-black text-slate-700">Farmaci in uso</label>
          <Textarea
            value={values.medications}
            onChange={(event) => updateField("medications", event.target.value)}
            placeholder="Indica medicine, dosaggi e orari se servono"
            className="min-h-[110px] rounded-[1.5rem] border-slate-200 bg-slate-50"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-black text-slate-700">Note alimentari</label>
          <Textarea
            value={values.dietary_notes}
            onChange={(event) => updateField("dietary_notes", event.target.value)}
            placeholder="Restrizioni, preferenze, alimenti da evitare"
            className="min-h-[90px] rounded-[1.5rem] border-slate-200 bg-slate-50"
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 md:col-span-2">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={values.epi_pen_required}
              onCheckedChange={(checked) => updateField("epi_pen_required", Boolean(checked))}
              className="h-5 w-5 rounded-md border-sky-400 data-[state=checked]:bg-sky-600"
            />
            <div>
              <p className="text-sm font-black text-slate-800">Il bambino deve avere una EpiPen o dispositivo simile</p>
              <p className="text-xs font-medium text-slate-500">Attiva questo campo se l'associazione deve verificare la presenza del presidio medico.</p>
            </div>
          </div>
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-black text-slate-700">Dettagli EpiPen / presidio</label>
          <Textarea
            value={values.epi_pen_notes}
            onChange={(event) => updateField("epi_pen_notes", event.target.value)}
            placeholder="Dove si trova, quando usarla, istruzioni importanti"
            className="min-h-[90px] rounded-[1.5rem] border-slate-200 bg-slate-50"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-black text-slate-700">In caso di incidente</label>
          <Select
            value={values.emergency_action_plan}
            onValueChange={(value) => updateField("emergency_action_plan", value as ChildFormValues["emergency_action_plan"])}
          >
            <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50">
              <SelectValue placeholder="Scegli la procedura" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="call_parent_first">Chiamare prima il genitore</SelectItem>
              <SelectItem value="call_ambulance_if_needed">Chiamare subito l'ambulanza se necessario</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-black text-slate-700">Consenso immagini</label>
          <Select
            value={values.image_usage_consent}
            onValueChange={(value) => updateField("image_usage_consent", value as ChildFormValues["image_usage_consent"])}
          >
            <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50">
              <SelectValue placeholder="Seleziona utilizzo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nessun utilizzo</SelectItem>
              <SelectItem value="internal_only">Solo uso interno</SelectItem>
              <SelectItem value="public_allowed">Libero utilizzo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-black text-slate-700">Pediatra / medico</label>
          <Input
            value={values.doctor_name}
            onChange={(event) => updateField("doctor_name", event.target.value)}
            placeholder="Nome del medico"
            className="h-12 rounded-2xl border-slate-200 bg-slate-50"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-black text-slate-700">Telefono medico</label>
          <Input
            value={values.doctor_phone}
            onChange={(event) => updateField("doctor_phone", event.target.value)}
            placeholder="Numero di telefono"
            className="h-12 rounded-2xl border-slate-200 bg-slate-50"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-black text-slate-700">Note aggiuntive</label>
          <Textarea
            value={values.additional_notes}
            onChange={(event) => updateField("additional_notes", event.target.value)}
            placeholder="Qualsiasi informazione utile per la sicurezza del bambino"
            className="min-h-[110px] rounded-[1.5rem] border-slate-200 bg-slate-50"
          />
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="rounded-2xl border-slate-200">
            Annulla
          </Button>
        )}
        <Button type="submit" disabled={loading} className="rounded-2xl bg-sky-700 text-white hover:bg-sky-800">
          {loading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default ChildProfileForm;
