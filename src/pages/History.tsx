"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, MapPin, User } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import Logo from "@/components/Logo";

interface LogEntry {
  id: string;
  childName: string;
  action: "Check-in" | "Check-out";
  time: string;
  location: string;
}

const HistoryPage = () => {
  const navigate = useNavigate();
  
  // Mock data per lo storico
  const [logs] = useState<LogEntry[]>([
    { id: "1", childName: "Luca Rossi", action: "Check-in", time: "08:30", location: "Centro Estivo A" },
    { id: "2", childName: "Sofia Bianchi", action: "Check-in", time: "08:45", location: "Centro Estivo A" },
    { id: "3", childName: "Luca Rossi", action: "Check-out", time: "16:30", location: "Centro Estivo A" },
  ]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-white border-b px-6 py-3 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Logo variant="header" />
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-navy">Storico Attività</h1>
        </div>

        <div className="space-y-4">
          {logs.length > 0 ? (
            logs.map((log) => (
              <div key={log.id} className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    log.action === "Check-in" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                  }`}>
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy">{log.childName}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        <Clock className="w-3 h-3 mr-1" /> {log.time}
                      </span>
                      <span className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        <MapPin className="w-3 h-3 mr-1" /> {log.location}
                      </span>
                    </div>
                  </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  log.action === "Check-in" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                }`}>
                  {log.action}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20">
              <Calendar className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">Nessuna attività registrata oggi.</p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default HistoryPage;