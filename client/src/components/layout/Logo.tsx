export function Logo({
  className = "",
  imgClassName = "h-9 w-auto object-contain",
}: {
  className?: string;
  imgClassName?: string;
}) {
  return (
    <div className={`flex items-center ${className}`}>
      <img src="/logo.png" alt="Aik Kadam" className={imgClassName} />
    </div>
  );
}
