import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, LoaderCircle, LogOut, MapPin, User } from "lucide-react";

interface ChildCardProps {
  name: string;
  onCheckIn: () => void;
  onCheckOut: () => void;
  locationId?: string;
  isBusy?: boolean;
}

const ChildCard = ({ name, onCheckIn, onCheckOut, locationId, isBusy = false }: ChildCardProps) => {
  return (
    <Card className="overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white shadow-lg shadow-slate-200/60 transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
      <CardContent className="p-6 sm:p-7">
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-sky-100 text-sky-700">
            <User className="h-7 w-7" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-black text-slate-900 sm:text-xl">{name}</h3>
              <span className="rounded-full bg-sky-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-sky-700">
                Attivo
              </span>
            </div>

            <p className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-500">
              <MapPin className="h-4 w-4 text-sky-600" />
              {locationId ? locationId : "Scansiona un QR prima di registrare la presenza"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            onClick={onCheckIn}
            disabled={!locationId || isBusy}
            className="h-12 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-100 hover:bg-emerald-600"
          >
            {isBusy ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Check-in
          </Button>
          <Button
            onClick={onCheckOut}
            variant="outline"
            disabled={!locationId || isBusy}
            className="h-12 rounded-2xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          >
            {isBusy ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
            Check-out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChildCard;
