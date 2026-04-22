import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { ArrowLeft, QrCode } from "lucide-react";
import { showSuccess } from "@/utils/toast";

const Scanner = () => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        scanner.clear();
        setScanning(false);
        showSuccess(`Posizione rilevata: ${decodedText}`);
        navigate("/", { state: { locationId: decodedText } });
      },
      (error) => {
        // Silenzioso per gli errori di scansione continui
      }
    );

    return () => {
      scanner.clear().catch(console.error);
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

      <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl">
        <div id="reader" className="w-full"></div>
      </div>

      <div className="mt-8 text-center text-slate-400">
        <QrCode className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <p>Inquadra il codice QR del centro per attivare le funzioni di check-in</p>
      </div>
    </div>
  );
};

export default Scanner;