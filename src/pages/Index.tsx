import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { QrCode, LogOut, Baby } from "lucide-react";
import ChildCard from "@/components/ChildCard";
import { showSuccess } from "@/utils/toast";
import { MadeWithDyad } from "@/components/made-with-dyad";

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const locationId = location.state?.locationId;

  // Dati mock (verranno sostituiti da Supabase)
  const children = [
    { id: "1", name: "Luca Rossi" },
    { id: "2", name: "Sofia Bianchi" },
  ];

  const handleAction = (childName: string, action: string) => {
    showSuccess(`${action} effettuato per ${childName}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Baby className="text-white w-5 h-5" />
            </div>
            <h1 className="font-bold text-xl text-slate-800">QR Check-in</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigate("/login")}>
            <LogOut className="text-slate-500 w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        {/* Status Card */}
        <div className={`mb-8 p-6 rounded-3xl border-none shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 ${locationId ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900'}`}>
          <div>
            <h2 className="font-bold text-lg">
              {locationId ? `📍 Sei presso: ${locationId}` : "⚠️ Nessuna posizione rilevata"}
            </h2>
            <p className="text-sm opacity-80">
              {locationId 
                ? "Puoi procedere con il check-in/out dei bambini." 
                : "Scansiona il QR del centro per abilitare le azioni."}
            </p>
          </div>
          <Button 
            onClick={() => navigate("/scanner")}
            className={`${locationId ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'} text-white rounded-xl px-6`}
          >
            <QrCode className="mr-2 w-5 h-5" />
            {locationId ? "Cambia Posizione" : "Scansiona QR"}
          </Button>
        </div>

        {/* Children List */}
        <div className="space-y-6">
          <h3 className="font-bold text-slate-500 uppercase tracking-wider text-sm">I tuoi bambini</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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