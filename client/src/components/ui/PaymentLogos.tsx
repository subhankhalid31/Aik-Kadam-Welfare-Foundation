// Real brand logos for the payment methods shown on the donate page.
import jazzcashLogo from "@assets/payment-logos/jazzcash.png";
import easypaisaLogo from "@assets/payment-logos/easypaisa.png";
import hblLogo from "@assets/payment-logos/hbl.png";

export function JazzCashLogo({ className = "" }: { className?: string }) {
  return <img src={jazzcashLogo} alt="JazzCash" className={`object-contain ${className}`} />;
}

export function EasypaisaLogo({ className = "" }: { className?: string }) {
  return <img src={easypaisaLogo} alt="Easypaisa" className={`object-contain ${className}`} />;
}

export function HblLogo({ className = "" }: { className?: string }) {
  return <img src={hblLogo} alt="HBL" className={`object-contain ${className}`} />;
}
