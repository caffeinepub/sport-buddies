/**
 * Block 74 — Live Athlete Map Markers
 * A simulated map canvas rendered with CSS. No third-party map library.
 * Block 74 (tap-to-select): markers are clickable; selected marker shows
 * a gold ring, name label, and persistent tooltip. Click canvas to deselect.
 *
 * Block 82 — Game Session Markers
 * Added support for rendering game session markers as rounded squares,
 * distinct from circular athlete markers. Game markers show sport emoji
 * and a participant count badge.
 *
 * Block 104 — Heat Level Visual Layer
 * HIGH heat: animated orange/red pulse ring + 🔥 label below pin
 * MEDIUM heat: static amber glow box-shadow on marker body
 * LOW heat: no change
 */
import { useState } from "react";
import type { GameMarker } from "../hooks/useGameSessions";
import {
  type MapMarker,
  SPORT_COLOR,
  SPORT_EMOJI,
} from "../hooks/useMapMarkers";

interface Props {
  markers: MapMarker[];
  selectedMarkerId?: string | null;
  onSelectMarker?: (id: string | null) => void;
  gameMarkers?: GameMarker[];
  selectedGameId?: string | null;
  onSelectGame?: (id: string | null) => void;
}

/** Derive the unique sports present in the current marker set */
function getLegendEntries(markers: MapMarker[]) {
  const seen = new Set<string>();
  const entries: { sport: string; emoji: string; color: string }[] = [];
  for (const m of markers) {
    const key = m.sport.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      entries.push({
        sport: m.sport,
        emoji: SPORT_EMOJI[key] ?? SPORT_EMOJI.default,
        color: SPORT_COLOR[key] ?? SPORT_COLOR.default,
      });
    }
  }
  return entries;
}

interface MarkerTooltipProps {
  marker: MapMarker;
}

function MarkerTooltip({ marker }: MarkerTooltipProps) {
  return (
    <div
      className="absolute bottom-full left-1/2 mb-2 pointer-events-none z-20"
      style={{ transform: "translateX(-50%)" }}
    >
      <div
        className="rounded-lg px-2.5 py-1.5 text-xs whitespace-nowrap shadow-lg"
        style={{
          backgroundColor: "#1a1a20",
          border: "1px solid rgba(212,175,55,0.4)",
          color: "rgba(255,255,255,0.92)",
        }}
      >
        <p className="font-semibold">{marker.displayName}</p>
        <p style={{ color: marker.markerColor }} className="capitalize">
          {marker.sport}
        </p>
        {marker.distanceLabel && (
          <p style={{ color: "rgba(255,255,255,0.5)" }}>
            {marker.distanceLabel}
          </p>
        )}
        {/* small triangle pointer */}
        <div
          className="absolute top-full left-1/2"
          style={{
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: "5px solid rgba(212,175,55,0.4)",
          }}
        />
      </div>
    </div>
  );
}

interface SingleMarkerProps {
  marker: MapMarker;
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function SingleMarker({
  marker,
  index,
  isSelected,
  onSelect,
}: SingleMarkerProps) {
  const [hovered, setHovered] = useState(false);
  const isMe = marker.id === "me";
  const size = isMe ? 36 : 32;

  const showTooltip = hovered || isSelected;

  return (
    <button
      type="button"
      data-ocid={`map.marker.item.${index + 1}`}
      className="absolute bg-transparent border-none p-0 m-0"
      style={{
        left: `${marker.posX}%`,
        top: `${marker.posY}%`,
        transform: `translate(-50%, -50%) ${isSelected ? "scale(1.2)" : "scale(1)"}`,
        transition: "transform 0.15s ease",
        zIndex: isSelected ? 20 : isMe ? 10 : 5,
        cursor: "pointer",
        outline: "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(marker.id);
      }}
      aria-label={`${marker.displayName} — ${marker.sport}`}
      aria-pressed={isSelected}
    >
      {/* Tooltip — on hover or when selected */}
      {showTooltip && <MarkerTooltip marker={marker} />}

      {/* Pulse ring — only for non-selected, non-"me" markers */}
      {!isMe && !isSelected && (
        <span
          className="absolute inset-0 rounded-full animate-ping"
          style={{
            backgroundColor: marker.markerColor,
            opacity: 0.35,
          }}
        />
      )}

      {/* Selected glow ring (no animation) */}
      {isSelected && (
        <span
          className="absolute inset-0 rounded-full"
          style={{
            border: "3px solid #D4AF37",
            boxShadow: "0 0 12px #D4AF3799",
            borderRadius: "50%",
          }}
        />
      )}

      {/* Marker circle */}
      <div
        className="relative flex items-center justify-center rounded-full select-none"
        style={{
          width: size,
          height: size,
          backgroundColor: isMe ? "#D4AF37" : "#1c1c22",
          border: isSelected
            ? "3px solid #D4AF37"
            : `2px solid ${marker.markerColor}`,
          boxShadow: isSelected
            ? "0 0 16px #D4AF3766"
            : `0 0 8px ${marker.markerColor}55`,
        }}
      >
        <span style={{ fontSize: isMe ? 16 : 14, lineHeight: 1 }}>
          {marker.sportEmoji}
        </span>
      </div>

      {/* Name label below circle — only when selected */}
      {isSelected && (
        <span
          style={{
            position: "absolute",
            top: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginTop: 4,
            fontSize: 10,
            color: "#D4AF37",
            fontWeight: 600,
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          {marker.displayName}
        </span>
      )}
    </button>
  );
}

// ── Game Marker Pin ────────────────────────────────────────────────────────────

interface GameTooltipProps {
  marker: GameMarker;
}

function GameTooltip({ marker }: GameTooltipProps) {
  function formatStartTime(iso: string): string {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return iso;
    }
  }

  return (
    <div
      className="absolute bottom-full left-1/2 mb-2 pointer-events-none z-20"
      style={{ transform: "translateX(-50%)" }}
    >
      <div
        className="rounded-lg px-2.5 py-1.5 text-xs whitespace-nowrap shadow-lg"
        style={{
          backgroundColor: "#1a1a20",
          border: "1px solid rgba(212,175,55,0.4)",
          color: "rgba(255,255,255,0.92)",
        }}
      >
        <p className="font-semibold">👑 {marker.hostName}</p>
        <p style={{ color: "rgba(255,255,255,0.65)" }}>
          📍 {marker.locationLabel}
        </p>
        <p style={{ color: "rgba(212,175,55,0.9)" }}>
          🕐 {formatStartTime(marker.startTime)}
        </p>
        {/* triangle pointer */}
        <div
          className="absolute top-full left-1/2"
          style={{
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: "5px solid rgba(212,175,55,0.4)",
          }}
        />
      </div>
    </div>
  );
}

interface GameMarkerPinProps {
  marker: GameMarker;
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function GameMarkerPin({
  marker,
  index,
  isSelected,
  onSelect,
}: GameMarkerPinProps) {
  const [hovered, setHovered] = useState(false);
  const showTooltip = hovered || isSelected;
  const SIZE = 34;

  const isHigh = marker.heatLevel === "high";
  const isMedium = marker.heatLevel === "medium";

  // Build box-shadow for the marker body
  const baseGlow = isSelected
    ? "0 0 16px #D4AF3766"
    : `0 0 8px ${marker.markerColor}55`;
  const heatGlow = isMedium ? ", 0 0 14px #f59e0b66" : "";
  const markerBodyShadow = `${baseGlow}${heatGlow}`;

  return (
    <button
      type="button"
      data-ocid={`map.game_marker.item.${index + 1}`}
      className="absolute bg-transparent border-none p-0 m-0"
      style={{
        left: `${marker.posX}%`,
        top: `${marker.posY}%`,
        transform: `translate(-50%, -50%) ${isSelected ? "scale(1.2)" : "scale(1)"}`,
        transition: "transform 0.15s ease",
        zIndex: isSelected ? 25 : isHigh ? 12 : 8,
        cursor: "pointer",
        outline: "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(marker.id);
      }}
      aria-label={`${marker.sport} game by ${marker.hostName} at ${marker.locationLabel}`}
      aria-pressed={isSelected}
    >
      {/* Tooltip */}
      {showTooltip && <GameTooltip marker={marker} />}

      {/* HIGH heat: animated orange/red pulsing ring */}
      {isHigh && !isSelected && (
        <span
          className="absolute animate-ping"
          style={{
            inset: -4,
            borderRadius: 12,
            backgroundColor: "#f97316",
            opacity: 0.4,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Selected gold ring */}
      {isSelected && (
        <span
          className="absolute inset-0"
          style={{
            border: "3px solid #D4AF37",
            boxShadow: "0 0 12px #D4AF3799",
            borderRadius: 10,
          }}
        />
      )}

      {/* Rounded square marker body */}
      <div
        className="relative flex items-center justify-center select-none"
        style={{
          width: SIZE,
          height: SIZE,
          borderRadius: 8,
          backgroundColor: "#1c1c22",
          border: isSelected
            ? "3px solid #D4AF37"
            : isHigh
              ? "2px solid #f97316"
              : `2px solid ${marker.markerColor}`,
          boxShadow: markerBodyShadow,
        }}
      >
        <span style={{ fontSize: 15, lineHeight: 1 }}>{marker.sportEmoji}</span>

        {/* Participant count badge — top right */}
        <div
          className="absolute flex items-center justify-center font-bold"
          style={{
            top: -6,
            right: -6,
            minWidth: 18,
            height: 16,
            paddingLeft: 3,
            paddingRight: 3,
            borderRadius: 8,
            backgroundColor: isHigh ? "#f97316" : "#D4AF37",
            color: "#0B0B0D",
            fontSize: 9,
            lineHeight: 1,
            border: "1.5px solid #141418",
          }}
        >
          {marker.participantCount}/{marker.maxPlayers}
        </div>
      </div>

      {/* HIGH heat: 🔥 label below the pin */}
      {isHigh && (
        <span
          style={{
            position: "absolute",
            top: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginTop: 2,
            fontSize: 11,
            lineHeight: 1,
            pointerEvents: "none",
          }}
        >
          🔥
        </span>
      )}

      {/* Label below — only when selected */}
      {isSelected && (
        <span
          style={{
            position: "absolute",
            top: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginTop: isHigh ? 18 : 4,
            fontSize: 10,
            color: "#D4AF37",
            fontWeight: 600,
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          🎮 {marker.sport}
        </span>
      )}
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function MapMarkerLayer({
  markers,
  selectedMarkerId,
  onSelectMarker,
  gameMarkers = [],
  selectedGameId,
  onSelectGame,
}: Props) {
  const legendEntries = getLegendEntries(markers);
  const hasGameMarkers = gameMarkers.length > 0;
  const hasHighHeat = gameMarkers.some((gm) => gm.heatLevel === "high");

  return (
    <div data-ocid="map.marker_layer.panel" className="w-full">
      {/* ── Canvas ── */}
      <div
        data-ocid="map.marker_layer.canvas_target"
        role="presentation"
        className="relative w-full rounded-2xl overflow-hidden"
        style={{
          aspectRatio: "2 / 1",
          backgroundColor: "#141418",
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 39px,
              rgba(255,255,255,0.04) 39px,
              rgba(255,255,255,0.04) 40px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 39px,
              rgba(255,255,255,0.04) 39px,
              rgba(255,255,255,0.04) 40px
            )
          `,
          cursor: "default",
        }}
        onClick={() => {
          onSelectMarker?.(null);
          onSelectGame?.(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            onSelectMarker?.(null);
            onSelectGame?.(null);
          }
        }}
      >
        {/* Corner compass label */}
        <span
          className="absolute top-2 right-3 text-xs font-mono select-none"
          style={{ color: "rgba(212,175,55,0.4)" }}
        >
          LIVE MAP
        </span>

        {markers.length === 0 && gameMarkers.length === 0 ? (
          <div
            data-ocid="map.marker_layer.empty_state"
            className="absolute inset-0 flex items-center justify-center"
          >
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              No active athletes nearby
            </p>
          </div>
        ) : (
          <>
            {/* Athlete markers (rendered first / lower z-index) */}
            {markers.map((marker, index) => (
              <SingleMarker
                key={marker.id}
                marker={marker}
                index={index}
                isSelected={selectedMarkerId === marker.id}
                onSelect={(id) => onSelectMarker?.(id)}
              />
            ))}

            {/* Game markers (rendered after athletes — appear on top if overlapping) */}
            {gameMarkers.map((gm, index) => (
              <GameMarkerPin
                key={gm.id}
                marker={gm}
                index={index}
                isSelected={selectedGameId === gm.id}
                onSelect={(id) => onSelectGame?.(id)}
              />
            ))}
          </>
        )}
      </div>

      {/* ── Legend strip ── */}
      {(legendEntries.length > 0 || hasGameMarkers) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 px-1">
          {legendEntries.map((entry) => (
            <div key={entry.sport} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span
                className="text-xs capitalize"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                {entry.emoji} {entry.sport}
              </span>
            </div>
          ))}
          {hasGameMarkers && (
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 flex-shrink-0"
                style={{
                  backgroundColor: "#D4AF37",
                  borderRadius: 2,
                }}
              />
              <span
                className="text-xs"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                🎮 Games
              </span>
            </div>
          )}
          {/* Heat legend — only shown when at least one HIGH heat game is visible */}
          {hasHighHeat && (
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 flex-shrink-0 rounded-full"
                style={{ backgroundColor: "#f97316" }}
              />
              <span
                className="text-xs"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                🔥 Hot
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
