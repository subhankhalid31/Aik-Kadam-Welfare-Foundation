export function Logo({
  className = "",
  imgClassName = "h-9 w-auto object-contain",
  variant = "dark",
}: {
  className?: string;
  imgClassName?: string;
  variant?: "dark" | "light";
}) {
  return (
    <div className={`flex items-center ${className}`}>
      <img
        src={variant === "light" ? "/logo-white.png" : "/logo.png"}
        alt="Aik Kadam"
        className={imgClassName}
      />
    </div>
  );
}
