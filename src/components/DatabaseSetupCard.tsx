import { Button } from "@/components/ui/button";
import { DATABASE_SETUP_SQL } from "@/lib/supabase";
import { showSuccess } from "@/utils/toast";
import { Copy, DatabaseZap } from "lucide-react";

interface DatabaseSetupCardProps {
  message: string;
}

const DatabaseSetupCard = ({ message }: DatabaseSetupCardProps) => {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(DATABASE_SETUP_SQL);
    showSuccess("SQL copiato negli appunti");
  };

  return (
    <section className="rounded-[2rem] border border-amber-200 bg-amber-50/90 p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
            <DatabaseZap className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-amber-950">Database online da inizializzare</h2>
            <p className="mt-1 text-sm font-medium text-amber-900/80">{message}</p>
          </div>
        </div>
        <Button
          type="button"
          onClick={handleCopy}
          className="rounded-2xl bg-amber-600 px-4 text-white hover:bg-amber-700"
        >
          <Copy className="mr-2 h-4 w-4" />
          Copia SQL
        </Button>
      </div>

      <div className="rounded-[1.5rem] bg-slate-950 p-4 text-left text-xs text-slate-100 shadow-inner sm:p-5">
        <pre className="overflow-x-auto whitespace-pre-wrap leading-6">
          <code>{DATABASE_SETUP_SQL}</code>
        </pre>
      </div>
    </section>
  );
};

export default DatabaseSetupCard;
