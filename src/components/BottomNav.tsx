"use client";

import { useNavigate, useLocation } from "react-router-dom";
import { Home, History, QrCode, User } from "lucide-react";
import { cn } from "@/lib/utils";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: QrCode, label: "Scanner", path: "/scanner" },
    { icon: History, label: "Storico", path: "/history" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 flex justify-around items-center z-50 pb-safe">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              "flex flex-col items-center gap-1 transition-all duration-300",
              isActive ? "text-navy scale-110" : "text-slate-400 hover:text-navy/60"
            )}
          >
            <item.icon className={cn("w-6 h-6", isActive && "fill-navy/10")} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
            {isActive && (
              <span className="w-1 h-1 bg-navy rounded-full mt-0.5" />
            )}
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;