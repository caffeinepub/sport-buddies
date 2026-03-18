import { useLocation, useNavigate } from "@tanstack/react-router";
import { Gamepad2, MapPin, RadarIcon, Users, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { AthleteProfileCard } from "../components/AthleteProfileCard";
import { CreateGameModal } from "../components/CreateGameModal";
import { GameDetailCard } from "../components/GameDetailCard";
import { MapMarkerLayer } from "../components/MapMarkerLayer";
import { QuickJoinPrompt } from "../components/QuickJoinPrompt";
import ScreenBanner from "../components/ScreenBanner";
import { SportChatPanel } from "../components/SportChatPanel";
import { useSport } from "../context/SportContext";
import { useDemoChatSeed } from "../hooks/useDemoChatSeed";
import { useDemoPresenceSeed } from "../hooks/useDemoPresenceSeed";
import { useGameSessions } from "../hooks/useGameSessions";
import {
  SPORT_COLOR,
  SPORT_EMOJI,
  useMapMarkers,
} from "../hooks/useMapMarkers";
import { useUnreadChatCount } from "../hooks/useUnreadChatCount";
import { useWhoIsOut } from "../hooks/useWhoIsOut";

const SPORTS = [
  { id: "all", label: "All" },
  { id: "soccer", label: "⚽ Soccer" },
  { id: "basketball", label: "🏀 Basketball" },
  { id: "tennis", label: "🎾 Tennis" },
  { id: "running", label: "🏃 Running" },
  { id: "swimming", label: "🏊 Swimming" },
  { id: "cycling", label: "🚴 Cycling" },
  { id: "yoga", label: "🧘 Yoga" },
];

const MOCK_BUDDIES = [
  {
    id: "1",
    name: "Alex R.",
    sport: "soccer",
    distance: "0.3 mi",
    status: "out_now",
  },
  {
    id: "2",
    name: "Jordan M.",
    sport: "basketball",
    distance: "0.5 mi",
    status: "planned",
  },
  {
    id: "3",
    name: "Sam K.",
    sport: "tennis",
    distance: "0.8 mi",
    status: "out_now",
  },
  {
    id: "4",
    name: "Taylor B.",
    sport: "running",
    distance: "1.1 mi",
    status: "planned",
  },
  {
    id: "5",
    name: "Casey L.",
    sport: "yoga",
    distance: "1.4 mi",
    status: "out_now",
  },
  {
    id: "6",
    name: "Morgan P.",
    sport: "cycling",
    distance: "1.7 mi",
    status: "planned",
  },
];

function getStatusDot(status: string) {
  if (status === "out_now") return "bg-green-400";
  if (status === "on_my_way") return "bg-blue-400";
  return "bg-gray-400";
}

function getStatusLabel(status: string) {
  if (status === "out_now") return "Out Now";
  if (status === "on_my_way") return "On My Way";
  return "Planned";
}

/** Format minutes remaining from an epoch timestamp */
function minutesRemaining(expiresAt: number): string {
  const ms = expiresAt - Date.now();
  if (ms <= 0) return "expired";
  const mins = Math.ceil(ms / 60_000);
  return `${mins}m left`;
}

export default function MapPage() {
  const navigate = useNavigate();
  const _location = useLocation();

  // Block 71 — seed demo athletes into the Who's Out Now layer
  useDemoPresenceSeed();
  // Block 80 — seed demo chat messages for each sport (only if chat is empty)
  useDemoChatSeed();

  const {
    sportStatus,
    currentSport,
    locationEnabled,
    userMode,
    myPresence,
    isPresenceActive,
  } = useSport();

  // Block 81 — Chat Activity Badge: markAsRead clears the unread badge when chat opens
  const { markAsRead } = useUnreadChatCount(currentSport);

  const [showCreateGame, setShowCreateGame] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  // Block 99 — modalSport tracks which sport to pre-fill in CreateGameModal
  const [modalSport, setModalSport] = useState<string | null>(null);

  const [selectedFilter, setSelectedFilter] = useState("all");
  const [myStatus, setMyStatus] = useState<string>(() => {
    try {
      return localStorage.getItem("sb_status") || "offline";
    } catch {
      return "offline";
    }
  });

  // Auto-sync filter with active sport from context
  useEffect(() => {
    if (sportStatus === "active" && currentSport) {
      setSelectedFilter(currentSport.toLowerCase());
    } else {
      setSelectedFilter("all");
    }
  }, [sportStatus, currentSport]);

  useEffect(() => {
    const handler = () => {
      try {
        setMyStatus(localStorage.getItem("sb_status") || "offline");
      } catch {
        // ignore
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // Block 70 — Who's Out Now layer (reads live presence feed)
  const { liveRecords, refresh: refreshWhoIsOut } = useWhoIsOut(selectedFilter);

  // Block 74 — Live Athlete Map Markers
  const { markers, selectedMarkerId, selectMarker } =
    useMapMarkers(selectedFilter);

  // Block 82 — Game Session Markers
  const { gameMarkers, sessions, joinSession, leaveSession } =
    useGameSessions(selectedFilter);

  // Block 75 — Derive selected athlete for the profile card.
  // Falls back to liveRecords if the marker isn't on the canvas (e.g. tapped from Who's Out Now list).
  const selectedAthlete = (() => {
    if (!selectedMarkerId || selectedMarkerId === "me") return null;
    const fromMarker = markers.find((m) => m.id === selectedMarkerId);
    if (fromMarker) return fromMarker;
    // Fallback: look up from the live presence feed
    const fromRecord = liveRecords.find((r) => r.id === selectedMarkerId);
    if (!fromRecord) return null;
    const sportKey = fromRecord.sport.toLowerCase();
    return {
      id: fromRecord.id,
      displayName: fromRecord.displayName,
      sport: fromRecord.sport,
      sportEmoji: SPORT_EMOJI[sportKey] ?? SPORT_EMOJI.default,
      markerColor: SPORT_COLOR[sportKey] ?? SPORT_COLOR.default,
      distanceLabel: fromRecord.distanceLabel,
      expiresAt: fromRecord.expiresAt,
    };
  })();

  // Refresh the who's-out list whenever filter changes
  useEffect(() => {
    refreshWhoIsOut();
  }, [refreshWhoIsOut]);

  const handleGoLive = () => {
    localStorage.setItem("sb_status", "out_now");
    setMyStatus("out_now");
  };

  const filteredBuddies =
    selectedFilter === "all"
      ? MOCK_BUDDIES
      : MOCK_BUDDIES.filter((b) => b.sport === selectedFilter);

  const isLive = myStatus === "out_now" || isPresenceActive;
  const isBuddyFinder = userMode === "buddy_finder";

  // Block 99 — helper to open the modal pre-filled with the best available sport
  const openCreateGame = (sport: string | null) => {
    const resolved = sport || currentSport;
    if (!resolved) return;
    setModalSport(resolved);
    setShowCreateGame(true);
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      <ScreenBanner screenName="MapScreen" routeName="Map" />

      <div className="p-4 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pt-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">
              Nearby Buddies
            </h1>
            {isBuddyFinder && (
              <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/40">
                <RadarIcon className="w-3 h-3" />
                Finder
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${isLive ? "bg-green-400" : myStatus === "on_my_way" ? "bg-blue-400" : "bg-gray-500"}`}
            />
            <span className="text-xs text-muted-foreground font-medium">
              {isLive
                ? "Live"
                : myStatus === "on_my_way"
                  ? "On My Way"
                  : "Offline"}
            </span>
          </div>
        </div>

        {/* Buddy Finder banner */}
        {isBuddyFinder && (
          <div className="w-full mb-4 flex items-center gap-2 bg-gold/10 border border-gold/30 text-gold rounded-xl px-4 py-3">
            <RadarIcon className="w-4 h-4 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold">Buddy Finder Active</p>
              <p className="text-xs text-gold/70">
                Enhanced matching — showing best sport partners near you
              </p>
            </div>
          </div>
        )}

        {/* Location disabled notice */}
        {!locationEnabled && (
          <div className="w-full mb-4 flex items-center gap-2 bg-white/5 border border-white/10 text-muted-foreground rounded-xl px-4 py-3">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-foreground">
                Location is disabled
              </p>
              <p className="text-xs">
                Enable location in your Profile to go live and see nearby
                buddies.
              </p>
            </div>
          </div>
        )}

        {/* Go Live button — only shown when location is enabled */}
        {locationEnabled && !isLive && (
          <button
            type="button"
            onClick={handleGoLive}
            className="w-full mb-4 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-3 font-semibold text-sm active:scale-95 transition-transform"
          >
            <Zap className="w-4 h-4" />
            Go Live
          </button>
        )}
        {locationEnabled && isLive && (
          <div
            data-ocid="map.live_status.panel"
            className="w-full mb-4 flex items-center justify-center gap-2 bg-green-900/30 border border-green-500/30 text-green-400 rounded-xl py-3 font-semibold text-sm"
          >
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            You are Live
            {myPresence && (
              <span className="text-xs text-green-300/70 ml-1">
                · {myPresence.sport} · {minutesRemaining(myPresence.expiresAt)}
              </span>
            )}
          </div>
        )}

        {/* Block 82 — Create Game button (only shown when presence is active) */}
        {isPresenceActive && currentSport && (
          <button
            type="button"
            data-ocid="map.create_game.button"
            onClick={() => openCreateGame(currentSport)}
            className="w-full mb-4 flex items-center justify-center gap-2 bg-charcoal border border-white/10 text-foreground rounded-xl py-2.5 font-semibold text-sm active:scale-95 transition-transform hover:bg-white/5"
          >
            <Gamepad2 className="w-4 h-4 text-gold" />
            Create Game
          </button>
        )}

        {/* Block 74 — Live Athlete Map Markers */}
        <div className="mb-4">
          <MapMarkerLayer
            markers={markers}
            selectedMarkerId={selectedMarkerId}
            onSelectMarker={selectMarker}
            gameMarkers={gameMarkers}
            selectedGameId={selectedGameId}
            onSelectGame={setSelectedGameId}
          />
        </div>

        {/* Sport filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {SPORTS.map((sport) => (
            <button
              type="button"
              key={sport.id}
              data-ocid={`map.filter.${sport.id}.tab`}
              onClick={() => setSelectedFilter(sport.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                selectedFilter === sport.id
                  ? "bg-gold text-black"
                  : "bg-charcoal text-muted-foreground hover:text-foreground"
              }`}
            >
              {sport.label}
            </button>
          ))}
        </div>

        {/* ─── Block 70: WHO'S OUT NOW LAYER ─── */}
        {locationEnabled && liveRecords.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">
                Who's Out Now
              </h2>
              <span className="text-xs text-muted-foreground ml-auto">
                {liveRecords.length} active
              </span>
            </div>
            <div className="space-y-2">
              {liveRecords.map((record) => (
                <button
                  type="button"
                  key={record.id}
                  data-ocid={`map.whos_out.item.${record.id}`}
                  onClick={() => record.id !== "me" && selectMarker(record.id)}
                  disabled={record.id === "me"}
                  className="w-full bg-green-950/40 border border-green-500/25 rounded-xl p-3 flex items-center gap-3 text-left transition-all disabled:cursor-default cursor-pointer hover:bg-green-950/60 active:scale-[0.99]"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-green-900/60 border border-green-500/40">
                    <span className="text-base leading-none">
                      {record.id === "me" ? "🧑" : "👤"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">
                      {record.id === "me" ? "You" : record.displayName}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {record.sport}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      <span className="text-xs text-green-400 font-medium">
                        Out Now
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {minutesRemaining(record.expiresAt)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty who's-out state when sport is active but feed is empty */}
        {locationEnabled && isPresenceActive && liveRecords.length === 0 && (
          <div
            data-ocid="map.whos_out.empty_state"
            className="mb-5 w-full bg-green-950/20 border border-green-500/15 rounded-xl p-4 text-center"
          >
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block mb-2" />
            <p className="text-xs text-green-400 font-semibold">You're live</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              No other players out right now for this sport.
            </p>
          </div>
        )}
        {/* ─── End Block 70 ─── */}

        {/* ─── Block 100: QUICK JOIN PROMPT ─── */}
        <QuickJoinPrompt
          games={sessions}
          currentSport={currentSport}
          joinSession={joinSession}
          leaveSession={leaveSession}
          onViewLobby={setSelectedGameId}
        />
        {/* ─── End Block 100 ─── */}

        {/* ─── Block 83: ACTIVE GAMES LIST ─── */}
        {locationEnabled && (gameMarkers.length > 0 || isPresenceActive) && (
          <div data-ocid="map.active_games.section" className="mb-5">
            {/* Section header */}
            <div className="flex items-center gap-2 mb-3">
              <Gamepad2 className="w-3.5 h-3.5 text-gold flex-shrink-0" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">
                Active Games
              </h2>
              {gameMarkers.length > 0 && (
                <span className="text-xs text-muted-foreground ml-auto">
                  {gameMarkers.length} game{gameMarkers.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {gameMarkers.length === 0 ? (
              <div
                data-ocid="map.active_games.empty_state"
                className="w-full bg-charcoal border border-white/8 rounded-xl p-4 text-center"
              >
                <span className="text-xl block mb-1">🎮</span>
                <p className="text-xs text-muted-foreground">
                  No active games —{" "}
                  <button
                    type="button"
                    data-ocid="map.active_games.start_one.button"
                    onClick={() => {
                      const sport =
                        selectedFilter !== "all"
                          ? selectedFilter
                          : currentSport;
                      openCreateGame(sport ?? null);
                    }}
                    className="text-gold underline underline-offset-2 font-semibold hover:text-gold/80 transition-colors"
                  >
                    start one
                  </button>
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {gameMarkers.map((marker, idx) => (
                  <button
                    type="button"
                    key={marker.id}
                    data-ocid={`map.active_games.item.${idx + 1}`}
                    onClick={() => setSelectedGameId(marker.id)}
                    className="w-full bg-charcoal border border-white/8 rounded-xl p-3 flex items-center gap-3 text-left transition-all hover:bg-white/5 active:scale-[0.99] cursor-pointer"
                  >
                    {/* Sport emoji icon */}
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border border-white/10"
                      style={{ backgroundColor: `${marker.markerColor}22` }}
                    >
                      <span className="text-lg leading-none">
                        {marker.sportEmoji}
                      </span>
                    </div>

                    {/* Center column */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground leading-tight">
                        {marker.sport}
                      </p>
                      <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
                        📍 {marker.locationLabel}
                      </p>
                      <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                        🕐{" "}
                        {new Date(marker.startTime).toLocaleTimeString(
                          "en-US",
                          {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          },
                        )}{" "}
                        ·{" "}
                        {new Date(marker.startTime).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </p>
                    </div>

                    {/* Player count badge */}
                    <div className="flex-shrink-0 flex flex-col items-end gap-1">
                      <span
                        className="text-xs font-semibold px-2 py-1 rounded-full border"
                        style={{
                          color: marker.markerColor,
                          backgroundColor: `${marker.markerColor}18`,
                          borderColor: `${marker.markerColor}44`,
                        }}
                      >
                        👥 {marker.participantCount}/{marker.maxPlayers}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {/* ─── End Block 83 ─── */}

        {/* ─── Block 79: LIVE SPORT CHAT PANEL ─── */}
        {currentSport && (
          <div className="mb-5">
            <SportChatPanel
              sport={currentSport}
              isActive={isPresenceActive}
              authorId="me"
              authorName="You"
              onOpen={markAsRead}
            />
          </div>
        )}
        {/* ─── End Block 79 ─── */}

        {/* Buddies list */}
        <div className="space-y-3">
          {!locationEnabled ? (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Enable location to see nearby buddies.</p>
            </div>
          ) : filteredBuddies.length === 0 ? (
            <div
              data-ocid="map.buddies.empty_state"
              className="text-center py-12 text-muted-foreground"
            >
              <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No buddies nearby for this sport.</p>
            </div>
          ) : (
            filteredBuddies.map((buddy) => (
              <button
                type="button"
                key={buddy.id}
                data-ocid={`map.buddy.item.${buddy.id}`}
                onClick={() =>
                  navigate({
                    to: "/presence-detail/$id",
                    params: { id: buddy.id },
                  })
                }
                className={`w-full bg-charcoal rounded-xl p-4 flex items-center gap-4 text-left hover:opacity-90 active:scale-[0.99] transition-all border ${
                  isBuddyFinder ? "border-gold/20" : "border-white/5"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isBuddyFinder
                      ? "bg-gold/30 border border-gold/50"
                      : "bg-gold/20 border border-gold/30"
                  }`}
                >
                  <Users className="w-5 h-5 text-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">
                    {buddy.name}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {buddy.sport}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${getStatusDot(buddy.status)}`}
                    />
                    <span className="text-xs text-muted-foreground">
                      {getStatusLabel(buddy.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    {buddy.distance}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Block 75 — Athlete Profile Card (bottom sheet) */}
      <AthleteProfileCard
        open={!!selectedAthlete}
        onClose={() => selectMarker(null)}
        athlete={
          selectedAthlete
            ? {
                id: selectedAthlete.id,
                displayName: selectedAthlete.displayName,
                sport: selectedAthlete.sport,
                sportEmoji: selectedAthlete.sportEmoji,
                markerColor: selectedAthlete.markerColor,
                distanceLabel: selectedAthlete.distanceLabel || undefined,
                expiresAt: selectedAthlete.expiresAt,
              }
            : null
        }
      />

      {/* Block 99 — Create Game Modal (pre-filled with modalSport) */}
      {modalSport && (
        <CreateGameModal
          open={showCreateGame}
          onClose={() => {
            setShowCreateGame(false);
            setModalSport(null);
          }}
          defaultSport={modalSport}
        />
      )}

      {/* Block 82 — Game Detail Card */}
      <GameDetailCard
        open={!!selectedGameId}
        onClose={() => setSelectedGameId(null)}
        gameId={selectedGameId}
      />
    </div>
  );
}
