import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { ArrowLeft, QrCode, RefreshCw } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

const Scanner = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        scanner.clear().then(() => {
          showSuccess(`Posizione rilevata: ${decodedText}`);
          navigate("/", { state: { locationId: decodedText } });
        }).catch(err => {
          console.error("Errore durante la chiusura dello scanner:", err);
          navigate("/", { state: { locationId: decodedText } });
        });
      },
      (errorMessage) => {
        // Errori di scansione continui (normale durante la ricerca del QR)
      }
    );

    return () => {
      scanner.clear().catch(err => console.error("Cleanup scanner error:", err));
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center p-6">
      <div className="w-full max-w-md flex items-center justify-between mb-8">
        <Button 
          variant="ghost" 
          className="text-white hover:bg-white/10"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="mr-2" /> Indietro
        </Button>
        <h1 className="text-white font-bold text-xl">Scansiona QR</h1>
        <div className="w-10" />
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl relative">
        <div id="reader" className="w-full"></div>
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 text-white p-6 text-center">
            <p className="mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="secondary">
              <RefreshCw className="mr-2 h-4 w-4" /> Riprova
            </Button>
          </div>
        )}
      </div>

      <div className="mt-8 text-center text-slate-400 max-w-xs">
        <QrCode className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <p className="text-sm">Inquadra il codice QR del centro. Assicurati di aver concesso i permessi per la fotocamera.</p>
      </div>
    </div>
  );
};

export default Scanner;