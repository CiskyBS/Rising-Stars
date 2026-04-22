import { useEffect, useId, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Camera, LoaderCircle, RefreshCw } from "lucide-react";

interface QrTokenScannerProps {
  title: string;
  description: string;
  onScan: (decodedText: string) => void;
}

const QrTokenScanner = ({ title, description, onScan }: QrTokenScannerProps) => {
  const scannerId = useId().replace(/:/g, "");
  const onScanRef = useRef(onScan);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    let mounted = true;

    try {
      const scanner = new Html5QrcodeScanner(
        scannerId,
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1,
        },
        false,
      );

      scanner.render(
        (decodedText) => {
          scanner
            .clear()
            .then(() => onScanRef.current(decodedText))
            .catch(() => onScanRef.current(decodedText));
        },
        () => undefined,
      );

      setReady(true);

      return () => {
        mounted = false;
        scanner.clear().catch(() => undefined);
      };
    } catch {
      if (mounted) {
        setError("Fotocamera non disponibile. Inserisci o incolla il token manualmente.");
      }
    }

    return () => {
      mounted = false;
    };
  }, [scannerId]);

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-[1rem] bg-sky-100 p-3 text-sky-700">
          <Camera className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-900">{title}</h3>
          <p className="text-sm font-medium text-slate-500">{description}</p>
        </div>
      </div>

      <div id={scannerId} className="overflow-hidden rounded-[1.5rem] bg-white"></div>

      {!ready && !error && (
        <div className="mt-3 flex items-center gap-2 text-sm font-medium text-slate-500">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Avvio fotocamera...
        </div>
      )}

      {error && (
        <div className="mt-3 flex flex-col gap-3 rounded-[1.25rem] bg-amber-50 p-4 text-sm font-medium text-amber-800">
          <span>{error}</span>
          <Button type="button" variant="outline" onClick={() => window.location.reload()} className="w-full rounded-2xl border-amber-200">
            <RefreshCw className="mr-2 h-4 w-4" />
            Riprova scanner
          </Button>
        </div>
      )}
    </div>
  );
};

export default QrTokenScanner;