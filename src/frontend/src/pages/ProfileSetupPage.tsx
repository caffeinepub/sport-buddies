import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SkillLevel, Sport } from "../backend";
import { useCompleteProfile } from "../hooks/useQueries";

export default function ProfileSetupPage() {
  const navigate = useNavigate();
  const completeProfile = useCompleteProfile();

  const [name, setName] = useState("");
  const [primarySport, setPrimarySport] = useState<Sport | "">("");
  const [skillLevel, setSkillLevel] = useState<SkillLevel | "">("");
  const [locationPermission, setLocationPermission] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!primarySport) {
      setError("Please select your primary sport");
      return;
    }

    if (!skillLevel) {
      setError("Please select your skill level");
      return;
    }

    try {
      await completeProfile.mutateAsync({
        name: name.trim(),
        sport: primarySport,
        level: skillLevel,
        locationPermission,
      });
      navigate({ to: "/" });
    } catch (err) {
      console.error("Error completing profile:", err);
      setError("Failed to save profile. Please try again.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4 pt-20 pb-4">
      <Card
        className="w-full max-w-md"
        style={{
          backgroundColor: "#141418",
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        <CardHeader>
          <CardTitle className="text-2xl" style={{ color: "#FFFFFF" }}>
            Complete Your Profile
          </CardTitle>
          <CardDescription style={{ color: "rgba(255,255,255,0.72)" }}>
            Tell us about yourself to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={completeProfile.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sport">Primary Sport</Label>
              <Select
                value={primarySport}
                onValueChange={(value) => setPrimarySport(value as Sport)}
                disabled={completeProfile.isPending}
              >
                <SelectTrigger id="sport">
                  <SelectValue placeholder="Select your primary sport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Sport.soccer}>Soccer</SelectItem>
                  <SelectItem value={Sport.basketball}>Basketball</SelectItem>
                  <SelectItem value={Sport.tennis}>Tennis</SelectItem>
                  <SelectItem value={Sport.running}>Running</SelectItem>
                  <SelectItem value={Sport.swimming}>Swimming</SelectItem>
                  <SelectItem value={Sport.cycling}>Cycling</SelectItem>
                  <SelectItem value={Sport.yoga}>Yoga</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skill">Skill Level</Label>
              <Select
                value={skillLevel}
                onValueChange={(value) => setSkillLevel(value as SkillLevel)}
                disabled={completeProfile.isPending}
              >
                <SelectTrigger id="skill">
                  <SelectValue placeholder="Select your skill level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SkillLevel.beginner}>Beginner</SelectItem>
                  <SelectItem value={SkillLevel.intermediate}>
                    Intermediate
                  </SelectItem>
                  <SelectItem value={SkillLevel.advanced}>Advanced</SelectItem>
                  <SelectItem value={SkillLevel.expert}>Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="location">Location Permission</Label>
                <p className="text-sm text-muted-foreground">
                  Allow us to find nearby sport buddies
                </p>
              </div>
              <Switch
                id="location"
                checked={locationPermission}
                onCheckedChange={setLocationPermission}
                disabled={completeProfile.isPending}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full hover:opacity-90 transition-opacity"
              size="lg"
              disabled={completeProfile.isPending}
              style={{
                backgroundColor: "#D4AF37",
                color: "#0B0B0D",
              }}
            >
              {completeProfile.isPending ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
