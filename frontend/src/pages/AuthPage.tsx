import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useEffect, useState } from 'react';
import { useActor } from '../hooks/useActor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthPage() {
  const { login, loginStatus, identity } = useInternetIdentity();
  const { actor } = useActor();
  const navigate = useNavigate();
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);

  useEffect(() => {
    async function checkProfileAndRedirect() {
      if (identity && actor && !isCheckingProfile) {
        setIsCheckingProfile(true);
        try {
          const isComplete = await actor.isProfileComplete();
          if (isComplete) {
            navigate({ to: '/' });
          } else {
            navigate({ to: '/profile-setup' });
          }
        } catch (error) {
          console.error('Error checking profile:', error);
          navigate({ to: '/profile-setup' });
        } finally {
          setIsCheckingProfile(false);
        }
      }
    }

    checkProfileAndRedirect();
  }, [identity, actor, navigate, isCheckingProfile]);

  const handleLogin = async () => {
    await login();
  };

  const isLoading = loginStatus === 'logging-in' || isCheckingProfile;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Sport Buddies</CardTitle>
          <CardDescription className="text-lg">
            Connect with athletes, join sessions, and level up your game
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? 'Connecting...' : 'Sign In'}
            </Button>
            <Button
              onClick={handleLogin}
              disabled={isLoading}
              variant="outline"
              className="w-full"
              size="lg"
            >
              {isLoading ? 'Connecting...' : 'Sign Up'}
            </Button>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Both options use secure Internet Identity authentication
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
