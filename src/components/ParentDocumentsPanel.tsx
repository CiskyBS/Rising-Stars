import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  type AssociationDocumentRow,
  type DocumentAcceptanceRow,
  REQUIRED_DOCUMENTS,
} from "@/lib/supabase";
import { CheckCircle2, FileBadge2, LoaderCircle, ShieldCheck } from "lucide-react";

interface ParentDocumentsPanelProps {
  documents: AssociationDocumentRow[];
  acceptances: DocumentAcceptanceRow[];
  acceptingType: string | null;
  onAccept: (document: AssociationDocumentRow) => Promise<void>;
}

const ParentDocumentsPanel = ({
  documents,
  acceptances,
  acceptingType,
  onAccept,
}: ParentDocumentsPanelProps) => {
  return (
    <Card className="rounded-[2rem] border-none bg-white shadow-xl shadow-slate-200/70">
      <CardContent className="p-6 sm:p-7">
        <div className="mb-5 flex items-start gap-4">
          <div className="rounded-[1.5rem] bg-emerald-100 p-3 text-emerald-700">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Compliance famiglia</p>
            <h2 className="mt-1 text-2xl font-black text-slate-900">Documenti e consensi</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Ogni accettazione salva versione, hash del file, nome del firmatario e data/ora dell’azione.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {REQUIRED_DOCUMENTS.map((requiredDocument) => {
            const document = documents.find((item) => item.document_type === requiredDocument.type);
            const acceptance = document
              ? acceptances.find((item) => item.document_id === document.id && item.accepted)
              : null;

            return (
              <article key={requiredDocument.type} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-black text-slate-900">{document?.title || requiredDocument.label}</h3>
                      {document && (
                        <span className="rounded-full bg-sky-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-sky-700">
                          v{document.version}
                        </span>
                      )}
                      {acceptance ? (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
                          Accettato
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">
                          Da accettare
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-500">{requiredDocument.description}</p>
                    {document && (
                      <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold text-slate-500">
                        <span>File: {document.file_name}</span>
                        <span>Hash: {document.file_hash.slice(0, 16)}…</span>
                      </div>
                    )}
                    {acceptance && (
                      <p className="mt-3 text-sm font-medium text-emerald-700">
                        Firmato da {acceptance.signed_full_name || "genitore registrato"} il {new Date(acceptance.accepted_at).toLocaleString("it-IT")}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 sm:min-w-[230px]">
                    {document ? (
                      <>
                        <Button asChild variant="outline" className="rounded-2xl border-slate-200">
                          <a href={document.file_data} download={document.file_name}>
                            <FileBadge2 className="mr-2 h-4 w-4" />
                            Apri documento
                          </a>
                        </Button>
                        {!acceptance && (
                          <Button
                            type="button"
                            onClick={() => void onAccept(document)}
                            disabled={acceptingType === requiredDocument.type}
                            className="rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700"
                          >
                            {acceptingType === requiredDocument.type ? (
                              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                            )}
                            Accetta versione corrente
                          </Button>
                        )}
                      </>
                    ) : (
                      <p className="text-sm font-medium text-amber-700">Documento non ancora pubblicato dall’associazione.</p>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ParentDocumentsPanel;
