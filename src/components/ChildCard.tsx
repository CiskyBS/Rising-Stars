import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, CheckCircle2, LogOut } from "lucide-react";

interface ChildCardProps {
  name: string;
  onCheckIn: () => void;
  onCheckOut: () => void;
  locationId?: string;
}

const ChildCard = ({ name, onCheckIn, onCheckOut, locationId }: ChildCardProps) => {
  return (
    <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow bg-white rounded-2xl">
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
            <User className="text-indigo-600 w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-800">{name}</h3>
            <p className="text-sm text-slate-500">
              {locationId ? `📍 Presso: ${locationId}` : "Nessuna posizione rilevata"}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={onCheckIn}
            disabled={!locationId}
            className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl flex gap-2"
          >
            <CheckCircle2 size={18} />
            Check-in
          </Button>
          <Button 
            onClick={onCheckOut}
            variant="outline"
            disabled={!locationId}
            className="border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl flex gap-2"
          >
            <LogOut size={18} />
            Check-out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChildCard;