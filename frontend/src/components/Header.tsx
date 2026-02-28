import { useNavigate } from '@tanstack/react-router';
import { ScanLine } from 'lucide-react';
import { useCoinBalance } from '@/hooks/useCoinBalance';

export default function Header() {
  const navigate = useNavigate();
  const { balance } = useCoinBalance();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-3 py-2 bg-maroon shadow-md" style={{ height: '56px' }}>
      {/* LEFT: Sport Buddies wordmark + SB badge */}
      <button
        onClick={() => navigate({ to: '/' })}
        className="flex items-center gap-2 focus:outline-none"
        aria-label="Go to Home"
      >
        <img
          src="/assets/generated/sb-badge.dim_48x48.png"
          alt="SB Badge"
          className="w-8 h-8 object-contain"
        />
        <span className="font-bold text-gold text-base tracking-wide leading-tight">
          Sport<br />
          <span className="text-white text-xs font-semibold tracking-widest">BUDDIES</span>
        </span>
      </button>

      {/* RIGHT: Coin balance + UPC scan + Emergency */}
      <div className="flex items-center gap-2">
        {/* Coin balance pill — navigates to /coins */}
        <button
          onClick={() => navigate({ to: '/coins' })}
          className="flex items-center gap-1 bg-black/30 rounded-full px-2 py-1 hover:bg-black/50 transition-colors focus:outline-none"
          aria-label="View Coins"
        >
          <span className="text-gold text-xs font-bold">🪙</span>
          <span className="text-gold text-xs font-bold">{balance}</span>
        </button>

        {/* UPC / QR Scanner badge — navigates to /scan */}
        <button
          onClick={() => navigate({ to: '/scan' })}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-gold/20 border border-gold/40 hover:bg-gold/30 transition-colors focus:outline-none"
          aria-label="Scan UPC / QR Code"
        >
          <ScanLine className="w-5 h-5 text-gold" />
        </button>

        {/* Emergency Services shield badge — navigates to /emergency */}
        <button
          onClick={() => navigate({ to: '/emergency' })}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-red-900/40 border border-red-500/40 hover:bg-red-900/60 transition-colors focus:outline-none"
          aria-label="Emergency Services"
        >
          <img
            src="/assets/generated/emergency-shield.dim_48x48.png"
            alt="Emergency Shield"
            className="w-6 h-6 object-contain"
          />
        </button>
      </div>
    </header>
  );
}
