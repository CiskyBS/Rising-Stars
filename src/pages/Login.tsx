import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { showSuccess, showError } from "@/utils/toast";
import Logo from "@/components/Logo";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      showSuccess("Accesso effettuato con successo!");
      navigate("/");
    } else {
      showError("Inserisci email e password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md border-none shadow-2xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="space-y-6 text-center pb-2">
          <Logo variant="login" />
          <CardDescription className="text-slate-500 font-medium">
            Accedi per gestire i check-in dei bambini
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-2xl border-slate-200 h-12 focus:ring-navy"
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-2xl border-slate-200 h-12 focus:ring-navy"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-navy hover:bg-navy/90 text-white rounded-2xl h-14 text-lg font-bold shadow-lg shadow-navy/20 transition-all active:scale-[0.98]"
            >
              Accedi
            </Button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">
              Powered by Rising Stars
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;