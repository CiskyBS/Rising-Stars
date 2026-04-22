"use client";

import { useNavigate, useLocation } from "react-router-dom";
import { Home, History, QrCode, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: QrCode, label: "Scanner", path: "/scanner" },
    { icon: History, label: "Storico", path: "/history" },
    { icon: Settings, label: "Profilo", path: "/settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-sm sm:px-6">
      <div className="mx-auto flex max-w-4xl items-center justify-around rounded-full bg-slate-50 px-2 py-2 shadow-lg shadow-slate-200/70">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex min-w-[68px] flex-col items-center gap-1 rounded-full px-3 py-2 transition-all duration-300",
                isActive ? "bg-sky-100 text-sky-700" : "text-slate-400 hover:text-sky-700",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
