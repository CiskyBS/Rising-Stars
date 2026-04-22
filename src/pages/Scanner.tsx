import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { showError, showSuccess } from "@/utils/toast";
import { ArrowLeft, PencilLine, QrCode, RefreshCw } from "lucide-react";

const LOCATION_STORAGE_KEY = "rising-stars-location";

const Scanner = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [manualLocation, setManualLocation] = useState("");

  useEffect(() => {
    let isMounted = true;

    const resolveLocationName = async (value: string) => {
      const nextValue = value.trim();

      if (!nextValue) {
        return "";
      }

      if (!supabase) {
        return nextValue;
      }

      const { data } = await supabase
        .from("association_profiles")
        .select("association_name")
        .eq("qr_code_value", nextValue)
        .maybeSingle();

      return data?.association_name?.trim() || nextValue;
    };

    const applyLocation = async (value: string) => {
      const nextLocation = await resolveLocationName(value);

      if (!nextLocation) {
        return;
      }

      localStorage.setItem(LOCATION_STORAGE_KEY, nextLocation);
      showSuccess(`Posizione rilevata: ${nextLocation}`);
      navigate("/", { state: { locationId: nextLocation } });
    };

    try {
      const scanner = new Html5QrcodeScanner(
        "reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        false,
      );

      scanner.render(
        (decodedText) => {
          scanner
            .clear()
            .then(() => {
              void applyLocation(decodedText);
            })
            .catch(() => {
              void applyLocation(decodedText);
            });
        },
        () => {},
      );

      return () => {
        isMounted = false;
        scanner.clear().catch(() => undefined);
      };
    } catch {
      if (isMounted) {
        setError("La fotocamera non è disponibile in questo browser. Inserisci il centro manualmente.");
      }
    }

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleManualSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextLocation = manualLocation.trim();

    if (!nextLocation) {
      showError("Inserisci il nome del centro");
      return;
    }

    localStorage.setItem(LOCATION_STORAGE_KEY, nextLocation);
    showSuccess(`Posizione impostata: ${nextLocation}`);
    navigate("/", { state: { locationId: nextLocation } });
  };

  return (
    <div className="min-h-screen bg-slate-900 px-4 py-6 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="rounded-full text-white hover:bg-white/10 hover:text-white"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Indietro
          </Button>
          <div className="rounded-full bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-white/80">
            Scanner centro
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="overflow-hidden rounded-[2.5rem] bg-white shadow-2xl shadow-slate-950/30">
            <div className="border-b border-slate-100 px-6 py-5">
              <h1 className="text-2xl font-black text-slate-900">Scansiona il QR del centro</h1>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Se il QR appartiene alla tua associazione, verrà riconosciuto automaticamente e mostrerà il nome impostato nel profilo.
              </p>
            </div>

            <div className="relative p-4 sm:p-6">
              <div id="reader" className="overflow-hidden rounded-[1.75rem]"></div>

              {error && (
                <div className="absolute inset-4 flex flex-col items-center justify-center rounded-[1.75rem] bg-slate-900 px-6 text-center text-white sm:inset-6">
                  <p className="max-w-sm text-sm font-medium text-white/85">{error}</p>
                  <Button onClick={() => window.location.reload()} className="mt-5 rounded-2xl bg-white text-slate-900 hover:bg-slate-100">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Riprova
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Card className="rounded-[2.5rem] border-none bg-sky-700 text-white shadow-2xl shadow-sky-950/20">
            <CardContent className="p-6 sm:p-8">
              <div className="w-fit rounded-full bg-white/15 p-3 text-white">
                <QrCode className="h-6 w-6" />
              </div>
              <h2 className="mt-6 text-3xl font-black leading-tight">Funziona anche senza fotocamera.</h2>
              <p className="mt-3 text-sm font-medium text-white/80">
                Se stai provando l’app da un browser esterno e la camera non parte, puoi inserire manualmente il nome del centro per continuare il test.
              </p>

              <form onSubmit={handleManualSubmit} className="mt-8 space-y-3">
                <label className="text-sm font-black text-white">Centro</label>
                <Input
                  value={manualLocation}
                  onChange={(event) => setManualLocation(event.target.value)}
                  placeholder="Es. Centro Estivo Milano Nord"
                  className="h-12 rounded-2xl border-white/20 bg-white text-slate-900 placeholder:text-slate-400"
                />
                <Button type="submit" className="h-12 w-full rounded-2xl bg-slate-900 font-black text-white hover:bg-slate-950">
                  <PencilLine className="mr-2 h-4 w-4" />
                  Imposta manualmente
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default Scanner;
