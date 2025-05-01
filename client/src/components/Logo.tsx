import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { ImageIcon } from "lucide-react";

interface LogoProps {
  className?: string;
  variant?: "light" | "dark";
}

export default function Logo({ className, variant = "dark" }: LogoProps) {
  // Fetch settings
  const { data: settings } = useQuery({
    queryKey: ['/api/settings'],
  });
  
  const companyName = settings?.companyName || "LOGO EMPRESA";
  const logoUrl = settings?.logoUrl;
  
  // If we have a logo image, display it, otherwise display the company name
  return (
    <div 
      className={cn(
        "bg-accent rounded flex items-center justify-center overflow-hidden",
        variant === "light" ? "bg-white/20 text-white" : "text-primary",
        className
      )}
    >
      {logoUrl ? (
        <img 
          src={logoUrl} 
          alt={companyName}
          className="max-h-full max-w-full object-contain"
        />
      ) : (
        <div className="font-bold flex items-center">
          <ImageIcon className="h-5 w-5 mr-1" />
          {companyName}
        </div>
      )}
    </div>
  );
}
