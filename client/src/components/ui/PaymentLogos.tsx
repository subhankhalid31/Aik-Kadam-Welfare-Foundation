// Simple brand-colored wordmark badges used to visually identify local
// payment methods (JazzCash / Easypaisa) on the donate page. These are
// stylized badges (not the official trademarked artwork) sized to sit
// inline with the payment detail cards.

export function JazzCashLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 32"
      className={className}
      role="img"
      aria-label="JazzCash"
    >
      <rect width="120" height="32" rx="7" fill="#D8232A" />
      <text
        x="60"
        y="21.5"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fontSize="13"
        fill="#FFFFFF"
        letterSpacing="0.2"
      >
        JazzCash
      </text>
    </svg>
  );
}

export function EasypaisaLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 32"
      className={className}
      role="img"
      aria-label="Easypaisa"
    >
      <rect width="120" height="32" rx="7" fill="#0F9D45" />
      <text
        x="60"
        y="21.5"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="700"
        fontSize="12"
        fill="#FFFFFF"
        letterSpacing="0.1"
      >
        Easypaisa
      </text>
    </svg>
  );
}
