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
    <Card className="overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-300 bg-white rounded-[2rem] group">
      <CardContent className="p-8">
        <div className="flex items-center gap-5 mb-8">
          <div className="w-14 h-14 bg-navy/5 rounded-2xl flex items-center justify-center group-hover:bg-navy group-hover:text-white transition-colors duration-300">
            <User className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-xl text-navy">{name}</h3>
            <p className="text-sm text-slate-400 font-medium">
              {locationId ? `📍 ${locationId}` : "In attesa di posizione..."}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Button 
            onClick={onCheckIn}
            disabled={!locationId}
            className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl h-12 font-bold shadow-lg shadow-emerald-100 flex gap-2"
          >
            <CheckCircle2 size={18} />
            Check-in
          </Button>
          <Button 
            onClick={onCheckOut}
            variant="outline"
            disabled={!locationId}
            className="border-slate-100 text-rose-500 hover:bg-rose-50 hover:border-rose-100 rounded-2xl h-12 font-bold flex gap-2"
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