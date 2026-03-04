import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Calendar } from "lucide-react";

export default function CreateEventPage() {
  const navigate = useNavigate();
  // Read sport from URL search params without strict route matching
  const sport =
    new URLSearchParams(window.location.search).get("sport") ?? undefined;

  return (
    <main className="flex flex-col min-h-screen pb-24 pt-20 px-4">
      <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: "/map" })}
          className="self-start"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Create Event Card */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-accent" />
              <CardTitle className="text-3xl font-bold text-foreground">
                Create Event
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {sport && (
              <div className="p-4 bg-accent/10 rounded-lg border border-accent/30">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Prefilled Sport:
                </p>
                <p className="text-xl font-bold text-accent">{sport}</p>
              </div>
            )}

            <div className="p-6 bg-muted rounded-lg border-2 border-dashed border-border">
              <p className="text-lg text-center text-muted-foreground">
                Event creation functionality coming in a future phase.
              </p>
              <p className="text-sm text-center text-muted-foreground mt-2">
                You'll be able to create and invite buddies to events soon!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
