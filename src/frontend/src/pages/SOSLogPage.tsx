import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Clock, Shield, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface SOSLog {
  startedAt: string;
  endedAt?: string;
  actionsTaken: Array<{ action: string; timestamp: string }>;
}

export default function SOSLogPage() {
  const [logs, setLogs] = useState<SOSLog[]>([]);
  const [showClearModal, setShowClearModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = () => {
    const storedLogs = localStorage.getItem("sosLogs");
    if (storedLogs) {
      try {
        const parsedLogs: SOSLog[] = JSON.parse(storedLogs);
        // Sort by most recent first
        const sortedLogs = parsedLogs.sort(
          (a, b) =>
            new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
        );
        setLogs(sortedLogs);
      } catch (error) {
        console.error("Error parsing SOS logs:", error);
        setLogs([]);
      }
    }
  };

  const handleClearLog = () => {
    setShowClearModal(true);
  };

  const confirmClearLog = () => {
    localStorage.removeItem("sosLogs");
    setLogs([]);
    setShowClearModal(false);
    toast.success("Emergency log cleared");
  };

  const cancelClearLog = () => {
    setShowClearModal(false);
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const calculateDuration = (start: string, end?: string) => {
    if (!end) return "Ongoing";
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const durationMs = endTime - startTime;
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <main
      style={{
        marginTop: "56px",
        padding: "16px",
        minHeight: "calc(100vh - 56px)",
        paddingBottom: "32px",
      }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Link to="/sos">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">
                Emergency Log
              </h1>
              <p className="text-sm text-muted-foreground">
                Private device log
              </p>
            </div>
          </div>
        </div>

        {/* Logs */}
        {logs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Shield className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-center">
                No emergency events logged.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 mb-6">
            {logs.map((log, index) => (
              <Card key={log.startedAt} className="border-primary/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" />
                      <CardTitle className="text-lg">
                        Emergency #{logs.length - index}
                      </CardTitle>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-foreground">
                        {formatDateTime(log.startedAt)}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end mt-1">
                        <Clock className="w-3 h-3" />
                        {calculateDuration(log.startedAt, log.endedAt)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground mb-1">
                          Started
                        </div>
                        <div className="font-medium">
                          {formatTime(log.startedAt)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Ended</div>
                        <div className="font-medium">
                          {log.endedAt ? formatTime(log.endedAt) : "Ongoing"}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <div className="text-sm font-semibold text-foreground mb-2">
                        Actions Taken
                      </div>
                      {log.actionsTaken.length > 0 ? (
                        <div className="space-y-2">
                          {log.actionsTaken.map((action) => (
                            <div
                              key={action.action}
                              className="flex items-start justify-between text-sm bg-muted/50 rounded-lg p-2"
                            >
                              <span className="font-medium">
                                {action.action}
                              </span>
                              <span className="text-muted-foreground text-xs">
                                {formatTime(action.timestamp)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No actions taken
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <Button
            onClick={() => navigate({ to: "/sos" })}
            variant="outline"
            className="flex-1"
          >
            Back
          </Button>
          {logs.length > 0 && (
            <Button
              onClick={handleClearLog}
              variant="destructive"
              className="flex-1 gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear Log
            </Button>
          )}
        </div>
      </div>

      {/* Clear Log Confirmation Modal */}
      <AlertDialog open={showClearModal} onOpenChange={setShowClearModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Emergency Log?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all emergency event records from this
              device. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelClearLog}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClearLog}
              className="bg-destructive hover:bg-destructive/90"
            >
              Clear Log
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
