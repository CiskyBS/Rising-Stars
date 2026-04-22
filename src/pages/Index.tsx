import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { QrCode, LogOut, MapPin } from "lucide-react";
import ChildCard from "@/components/ChildCard";
import { showSuccess } from "@/utils/toast";
import { MadeWithDyad } from "@/components/made-with-dyad";
import Logo from "@/components/Logo";

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const locationId = location.state?.locationId;

  const children = [
    { id: "1", name: "Luca Rossi" },
    { id: "2", name: "Sofia Bianchi" },
  ];

  const handleAction = (childName: string, action: string) => {
    showSuccess(`${action} effettuato per ${childName} presso ${locationId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b px-6 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Logo variant="header" />
          <Button variant="ghost" size="icon" onClick={() => navigate("/login")} className="rounded-full hover:bg-slate-100">
            <LogOut className="text-slate-500 w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <div className={`mb-8 p-6 rounded-[2rem] border-none shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-500 ${locationId ? 'bg-emerald-50' : 'bg-goldenrod/10'}`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl ${locationId ? 'bg-emerald-100 text-emerald-600' : 'bg-goldenrod/20 text-goldenrod'}`}>
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h2 className={`font-bold text-lg ${locationId ? 'text-emerald-900' : 'text-navy'}`}>
                {locationId ? `Sei presso: ${locationId}` : "Nessuna posizione rilevata"}
              </h2>
              <p className={`text-sm ${locationId ? 'text-emerald-700' : 'text-slate-600'} opacity-80`}>
                {locationId 
                  ? "Le funzioni di check-in e check-out sono ora attive." 
                  : "Scansiona il QR del centro per abilitare le azioni."}
              </p>
            </div>
          </div>
          <Button 
            onClick={() => navigate("/scanner")}
            className={`${locationId ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-navy hover:bg-navy/90'} text-white rounded-2xl px-8 h-14 shadow-lg transition-all active:scale-95 font-bold`}
          >
            <QrCode className="mr-2 w-5 h-5" />
            {locationId ? "Cambia Posizione" : "Scansiona QR"}
          </Button>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold text-navy/40 uppercase tracking-widest text-[10px]">I tuoi bambini autorizzati</h3>
            <span className="bg-navy/5 text-navy text-[10px] font-bold px-3 py-1 rounded-full">
              {children.length} REGISTRATI
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {children.map((child) => (
              <ChildCard
                key={child.id}
                name={child.name}
                locationId={locationId}
                onCheckIn={() => handleAction(child.name, "Check-in")}
                onCheckOut={() => handleAction(child.name, "Check-out")}
              />
            ))}
          </div>
        </div>
      </main>

      <MadeWithDyad />
    </div>
  );
};

export default Index;