import { useLocation } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIsProfileComplete } from '../hooks/useQueries';
import { Badge } from '@/components/ui/badge';

export default function DebugBanner() {
  const location = useLocation();
  const { identity } = useInternetIdentity();
  const { data: profileComplete } = useIsProfileComplete();

  const isLoggedIn = !!identity;

  return (
    <div className="bg-muted/50 border-b border-border px-4 py-2 flex flex-wrap gap-2 items-center justify-center">
      <Badge variant="outline" className="text-xs">
        Route: {location.pathname}
      </Badge>
      <Badge variant="outline" className="text-xs">
        Auth: {isLoggedIn ? 'yes' : 'no'}
      </Badge>
      <Badge variant="outline" className="text-xs">
        ProfileComplete: {profileComplete ? 'yes' : 'no'}
      </Badge>
    </div>
  );
}
