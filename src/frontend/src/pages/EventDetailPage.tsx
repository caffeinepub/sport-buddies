import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  MapPin,
  QrCode,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useSport } from "../context/SportContext";

export default function EventDetailPage() {
  const navigate = useNavigate();
  // Support both param names for backward compat
  const params = useParams({ strict: false }) as {
    eventId?: string;
    id?: string;
  };
  const eventId = params.eventId || params.id;

  const {
    events,
    currentUser,
    joinEvent,
    leaveEvent,
    completeEvent,
    cancelEvent,
    hasAttended,
    markAttended,
    emergencyLevel,
  } = useSport();

  const event = events.find((e) => e.id === eventId);

  if (!event) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Event not found
        </h2>
        <p className="text-muted-foreground mb-6">
          The event you're looking for doesn't exist or has been removed.
        </p>
        <Button
          onClick={() => navigate({ to: "/events" })}
          className="bg-gold hover:bg-gold-dark text-black font-semibold"
        >
          Back to Events
        </Button>
      </div>
    );
  }

  const isJoined = event.participants.some((p) => p.id === currentUser.id);
  const isHost = currentUser.id === event.hostId;
  const attended = hasAttended(event.id);
  const isFull = event.participants.length >= event.capacity;

  const handleJoin = () => {
    if (isFull) {
      toast.error("This event is full.");
      return;
    }
    joinEvent(event.id);
    toast.success("You joined the event!");
  };

  const handleLeave = () => {
    leaveEvent(event.id);
    toast.info("You left the event.");
  };

  const handleComplete = () => {
    completeEvent(event.id);
    toast.success("Event marked as completed.");
  };

  const handleCancel = () => {
    cancelEvent(event.id);
    toast.warning("Event has been canceled.");
  };

  const handleMarkAttended = () => {
    if (attended) return;
    markAttended(event.id);
    toast.success("+5 coins awarded for attendance! 🪙");
  };

  // Status chip styling
  const statusConfig = {
    active: {
      label: "Active",
      className: "bg-green-900/40 text-green-400 border-green-500/30",
    },
    completed: {
      label: "Completed",
      className: "bg-blue-900/40 text-blue-400 border-blue-500/30",
    },
    canceled: {
      label: "Canceled",
      className: "bg-red-900/40 text-red-400 border-red-500/30",
    },
  };
  const statusInfo = statusConfig[event.status];

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-8">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate({ to: "/events" })}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-5 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Events</span>
      </button>

      {/* ── HEADER BLOCK ── */}
      <div className="bg-charcoal border border-white/10 rounded-xl p-5 mb-4">
        {/* Title + Host badge */}
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-2xl font-bold text-foreground leading-tight flex-1 mr-3">
            {event.title}
          </h1>
          {isHost && (
            <Badge className="bg-gold/20 text-gold border-gold/30 text-xs flex-shrink-0">
              Host
            </Badge>
          )}
        </div>

        {/* Sport badge */}
        <span className="inline-block px-2.5 py-0.5 text-xs font-semibold bg-gold/20 text-gold rounded mb-3">
          {event.sport}
        </span>

        {/* Meta info */}
        <div className="space-y-2 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gold/60 flex-shrink-0" />
            <span>{event.datetimeLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gold/60 flex-shrink-0" />
            <span>{event.locationLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gold/60 flex-shrink-0" />
            <span>Host: {event.hostName}</span>
          </div>
        </div>

        {/* Status chip */}
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusInfo.className}`}
        >
          {statusInfo.label}
        </span>
      </div>

      {/* ── PARTICIPANTS SECTION ── */}
      <div className="bg-charcoal border border-white/10 rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gold" />
            <h2 className="text-base font-semibold text-foreground">
              Participants
            </h2>
          </div>
          <span className="text-sm text-muted-foreground font-medium">
            {event.participants.length}/{event.capacity}
          </span>
        </div>
        <div className="space-y-1.5">
          {event.participants.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No participants yet.
            </p>
          ) : (
            event.participants.map((p) => (
              <div
                key={p.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                  p.id === currentUser.id
                    ? "bg-gold/10 text-gold border border-gold/20"
                    : "bg-white/5 text-muted-foreground"
                }`}
              >
                <User className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{p.name}</span>
                {p.id === currentUser.id && (
                  <span className="ml-auto text-xs text-gold/70">(you)</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── JOIN / LEAVE BUTTONS ── */}
      <div className="mb-4">
        {event.status !== "active" ? (
          <div className="bg-charcoal border border-white/10 rounded-xl p-4 text-center">
            <p className="text-muted-foreground text-sm">
              Event is{" "}
              <span
                className={`font-semibold ${
                  event.status === "completed"
                    ? "text-blue-400"
                    : "text-red-400"
                }`}
              >
                {event.status}
              </span>
              . No further actions available.
            </p>
          </div>
        ) : isJoined ? (
          <Button
            data-ocid="event_detail.leave.button"
            onClick={emergencyLevel > 0 ? undefined : handleLeave}
            disabled={emergencyLevel > 0}
            variant="outline"
            className="w-full border-gold text-gold hover:bg-gold/10 font-bold text-base py-5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Leave Event
          </Button>
        ) : (
          <Button
            data-ocid="event_detail.join.button"
            onClick={handleJoin}
            disabled={isFull || emergencyLevel > 0}
            className="w-full bg-gold hover:bg-gold-dark text-black font-bold text-base py-5 disabled:opacity-50"
          >
            {isFull ? "Event Full" : "Join Event"}
          </Button>
        )}
        {emergencyLevel > 0 && (
          <p
            className="text-xs text-center mt-2"
            style={{ color: "rgba(255,100,100,0.8)" }}
          >
            Event actions locked during emergency.
          </p>
        )}
      </div>

      {/* ── HOST-ONLY BUTTONS ── */}
      {isHost && event.status === "active" && (
        <div className="bg-charcoal border border-white/10 rounded-xl p-5 mb-4">
          <h3 className="text-base font-semibold text-foreground mb-3">
            Host Controls
          </h3>
          <div className="flex gap-3">
            <Button
              onClick={handleComplete}
              className="flex-1 bg-green-700 hover:bg-green-600 text-white font-semibold"
              size="sm"
            >
              Complete
            </Button>
            <Button
              onClick={handleCancel}
              variant="destructive"
              className="flex-1 font-semibold"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* ── ATTENDANCE VALIDATION ── */}
      <Card className="bg-charcoal border-white/10 mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-foreground flex items-center gap-2">
            <QrCode className="w-4 h-4 text-gold" />
            Attendance Validation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <span className="text-gold/60">📷</span>
            QR validation coming soon
          </p>
          {attended ? (
            <Button
              disabled
              className="w-full bg-green-900/40 text-green-400 border border-green-500/30 font-semibold cursor-not-allowed opacity-80"
              variant="outline"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Attended ✅
            </Button>
          ) : (
            <Button
              onClick={handleMarkAttended}
              className="w-full bg-gold hover:bg-gold-dark text-black font-semibold"
            >
              Mark Attended (MVP) &nbsp;+5 coins
            </Button>
          )}
        </CardContent>
      </Card>

      {/* ── RULES SECTION ── */}
      <div className="px-1 pb-2 space-y-1">
        <p className="text-xs text-muted-foreground/60">• No private chat.</p>
        <p className="text-xs text-muted-foreground/60">
          • Public Billboard later, not now.
        </p>
      </div>
    </div>
  );
}
