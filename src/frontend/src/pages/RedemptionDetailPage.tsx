import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRedemptions } from "@/hooks/useRedemptions";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Coins, Copy, Package } from "lucide-react";
import { toast } from "sonner";

export default function RedemptionDetailPage() {
  const navigate = useNavigate();
  // Use strict: false to avoid route-id mismatch with nested layout routes
  const { id } = useParams({ strict: false });
  const { getRedemptionById } = useRedemptions();

  const redemption = id ? getRedemptionById(id) : null;

  const handleCopyCode = () => {
    if (redemption) {
      navigator.clipboard.writeText(redemption.code);
      toast.success("Code copied to clipboard");
    }
  };

  const handleBackToStore = () => {
    navigate({ to: "/store" });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!redemption) {
    return (
      <main
        style={{ marginTop: "56px", marginBottom: "72px", padding: "16px" }}
      >
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={handleBackToStore}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Store
        </Button>

        <Card>
          <CardContent className="p-8 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Redemption not found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This redemption doesn't exist or has been removed.
            </p>
            <Button onClick={handleBackToStore}>Go to Store</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main style={{ marginTop: "56px", marginBottom: "72px", padding: "16px" }}>
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={handleBackToStore}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Store
      </Button>

      <h2 className="text-2xl font-bold mb-6">Redemption Details</h2>

      {/* Item Info Card */}
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-xl">{redemption.item}</CardTitle>
            <Badge variant="secondary">{redemption.status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-accent font-bold mb-4">
            <Coins className="w-5 h-5" />
            <span>{redemption.cost} coins</span>
          </div>

          <div className="text-sm text-muted-foreground">
            Redeemed on {formatDate(redemption.createdAt)}
          </div>
        </CardContent>
      </Card>

      {/* Redemption Code Card */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg">Redemption Code</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-4 bg-muted rounded-lg mb-4">
            <code className="flex-1 font-mono font-bold text-xl text-accent">
              {redemption.code}
            </code>
            <Button size="sm" variant="outline" onClick={handleCopyCode}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Use this code to claim your item. Keep it safe and don't share it
            with others.
          </p>
        </CardContent>
      </Card>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How to Claim</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Save or copy your redemption code</li>
            <li>Contact Sport Buddies support with your code</li>
            <li>Provide shipping information if required</li>
            <li>Wait for confirmation and delivery</li>
          </ol>
        </CardContent>
      </Card>
    </main>
  );
}
