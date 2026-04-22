import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "splash" | "login" | "header";
  className?: string;
}

const Logo = ({ variant = "login", className }: LogoProps) => {
  const isSplash = variant === "splash";
  const isHeader = variant === "header";

  const iconSize = isSplash ? "h-[60pt]" : isHeader ? "h-8" : "h-[40pt]";
  const textSize = isSplash ? "text-[36pt]" : isHeader ? "text-lg" : "text-[24pt]";

  return (
    <div className={cn("flex flex-col items-center gap-4", isHeader && "flex-row gap-2", className)}>
      <div className={cn("relative overflow-hidden rounded-2xl shadow-lg", iconSize, isHeader ? "w-8" : "aspect-square")}>
        <img 
          src="/placeholder.svg" 
          alt="Rising Stars Icon" 
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback if image is not found
            e.currentTarget.src = "https://raw.githubusercontent.com/lucide-react/lucide/main/icons/star.svg";
          }}
        />
      </div>
      <h1 className={cn(
        "font-montserrat italic font-semibold text-navy leading-tight",
        textSize
      )}>
        Rising Stars
      </h1>
    </div>
  );
};

export default Logo;