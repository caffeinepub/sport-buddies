import { useNavigate, useParams } from '@tanstack/react-router';
import { ArrowLeft, Calendar, MapPin, Users, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useEventJoinState } from '../hooks/useEventJoinState';
import { MOCK_EVENTS } from './EventsPage';

// The mock "current user" ID for host detection
const CURRENT_USER_ID = 'current-user-123';

export default function EventDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams({ strict: false });
  const { isJoined, getParticipantCount, joinEvent, leaveEvent } = useEventJoinState();

  const event = MOCK_EVENTS.find((e) => e.id === id);

  if (!event) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-4">Event not found</h2>
        <p className="text-muted-foreground mb-6">
          The event you're looking for doesn't exist or has been removed.
        </p>
        <Button
          onClick={() => navigate({ to: '/events' })}
          className="bg-gold hover:bg-gold-dark text-black font-semibold"
        >
          Back to Events
        </Button>
      </div>
    );
  }

  const joined = isJoined(event.id);
  const participantCount = getParticipantCount(event.id, event.baseParticipants);
  const isHost = event.hostId === CURRENT_USER_ID;

  const handleJoin = () => {
    joinEvent(event.id, participantCount);
  };

  const handleLeave = () => {
    leaveEvent(event.id, participantCount);
  };

  const handleComplete = () => {
    toast.info('Coming soon (MVP).');
  };

  const handleCancel = () => {
    toast.info('Coming soon (MVP).');
  };

  // Build display participants list
  const displayParticipants = [...event.participants];
  if (joined && !displayParticipants.includes('You')) {
    displayParticipants.push('You');
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-8">
      {/* Back Button */}
      <button
        onClick={() => navigate({ to: '/events' })}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-5 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Events</span>
      </button>

      {/* Event Header Card */}
      <div className="bg-charcoal border border-white/10 rounded-xl p-5 mb-4">
        <div className="flex items-start justify-between mb-3">
          <h1 className="text-2xl font-bold text-foreground leading-tight flex-1 mr-3">
            {event.title}
          </h1>
          {isHost && (
            <Badge className="bg-gold/20 text-gold border-gold/30 text-xs flex-shrink-0">
              Host
            </Badge>
          )}
        </div>

        <div className="inline-block px-2.5 py-0.5 text-xs font-semibold bg-gold/20 text-gold rounded mb-3">
          {event.sport}
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gold/60 flex-shrink-0" />
            <span>{event.date} at {event.time}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gold/60 flex-shrink-0" />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gold/60 flex-shrink-0" />
            <span>{participantCount}/{event.maxParticipants} joined</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-charcoal border border-white/10 rounded-xl p-5 mb-4">
        <h2 className="text-base font-semibold text-foreground mb-2">About this Event</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>
      </div>

      {/* Participants */}
      <div className="bg-charcoal border border-white/10 rounded-xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-gold" />
          <h2 className="text-base font-semibold text-foreground">
            Participants ({displayParticipants.length})
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {displayParticipants.map((name, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                name === 'You'
                  ? 'bg-gold/20 text-gold border border-gold/30'
                  : 'bg-white/5 text-muted-foreground border border-white/10'
              }`}
            >
              <User className="w-3 h-3" />
              {name}
            </div>
          ))}
        </div>
      </div>

      {/* Join / Leave Button */}
      <div className="mb-4">
        {!joined ? (
          <Button
            onClick={handleJoin}
            className="w-full bg-gold hover:bg-gold-dark text-black font-bold text-base py-5"
          >
            Join Event
          </Button>
        ) : (
          <Button
            onClick={handleLeave}
            variant="outline"
            className="w-full border-gold text-gold hover:bg-gold/10 font-bold text-base py-5"
          >
            Leave Event
          </Button>
        )}
      </div>

      {/* Host-only Actions */}
      {isHost && (
        <div className="bg-charcoal border border-white/10 rounded-xl p-5">
          <h3 className="text-base font-semibold text-foreground mb-3">Host Actions</h3>
          <div className="flex gap-3">
            <Button
              onClick={handleComplete}
              className="flex-1 bg-green-700 hover:bg-green-600 text-white font-semibold"
            >
              Complete
            </Button>
            <Button
              onClick={handleCancel}
              variant="destructive"
              className="flex-1 font-semibold"
            >
              Cancel
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Host-only controls — full functionality coming soon
          </p>
        </div>
      )}
    </div>
  );
}
