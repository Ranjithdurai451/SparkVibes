import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
    message?: string;
    variant?: "default" | "blur" | "gradient";
    size?: "sm" | "md" | "lg";
}

const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
};

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
    message = "",
    variant = "default",
    size = "md",
}) => {
    const overlayClasses = {
        default: "bg-black/50",
        blur: "bg-black/30 backdrop-blur-sm",
        gradient: "bg-gradient-to-t from-black/60 to-black/30 backdrop-blur-[2px]",
    };

    return (
        <div
            className={`absolute inset-0 ${overlayClasses[variant]} flex flex-col items-center justify-center rounded-lg z-10`}
        >
            <Loader2 className={`${sizeClasses[size]} animate-spin text-white mb-2`} />
            {message && (
                <span className="text-sm text-white/90 font-medium animate-pulse">
                    {message}
                </span>
            )}
        </div>
    );
};

export default LoadingOverlay;
