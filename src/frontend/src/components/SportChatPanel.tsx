/**
 * Block 79 — Live Sport Chat Panel
 * Collapsible inline chat panel per sport.
 * Only active users (isActive=true) can post messages; others can read.
 * Auto-scrolls to newest message.
 */
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronUp, MessageSquare, Send } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ChatMessage } from "../hooks/useSportChat";
import { useSportChat } from "../hooks/useSportChat";

interface SportChatPanelProps {
  sport: string;
  isActive: boolean;
  authorId: string;
  authorName: string;
  /** Called when the panel becomes visible (on mount if open, or when toggled open). */
  onOpen?: () => void;
}

/** Compact relative timestamp: "just now", "2m", "1h", "3d" */
function formatShortTime(ts: number): string {
  const diffSec = Math.floor((Date.now() - ts) / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  return `${Math.floor(diffHr / 24)}d`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function MessageRow({
  msg,
  isMe,
}: {
  msg: ChatMessage;
  isMe: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-2 py-1.5 ${isMe ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar circle */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
          isMe
            ? "bg-gold/30 text-gold border border-gold/40"
            : "bg-white/10 text-foreground/70 border border-white/10"
        }`}
      >
        {getInitials(msg.authorName)}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[72%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-0.5`}
      >
        {!isMe && (
          <span className="text-[10px] font-semibold text-gold/80 leading-none ml-0.5">
            {msg.authorName}
          </span>
        )}
        <div
          className={`rounded-2xl px-3 py-1.5 text-sm leading-snug ${
            isMe
              ? "bg-gold/20 text-foreground rounded-tr-sm"
              : "bg-white/8 text-foreground/90 rounded-tl-sm"
          }`}
          style={!isMe ? { background: "rgba(255,255,255,0.06)" } : undefined}
        >
          {msg.text}
        </div>
        <span className="text-[10px] text-muted-foreground/60 leading-none mx-0.5">
          {formatShortTime(msg.sentAt)}
        </span>
      </div>
    </div>
  );
}

export function SportChatPanel({
  sport,
  isActive,
  authorId,
  authorName,
  onOpen,
}: SportChatPanelProps) {
  const { messages, postMessage } = useSportChat(sport);
  const [open, setOpen] = useState(true);
  const [inputText, setInputText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Track last known count to detect new messages without putting derived
  // values in the deps array (avoids biome lint/correctness/useExhaustiveDependencies)
  const lastCountRef = useRef(0);

  // Block 81 — Call onOpen on mount when panel starts open (marks messages as read)
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally runs only on mount
  useEffect(() => {
    if (open) onOpen?.();
  }, []); // only on mount

  // Scroll when panel opens
  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [open]);

  // Scroll when new messages arrive (compare via ref to avoid derived deps)
  useLayoutEffect(() => {
    if (open && messages.length !== lastCountRef.current) {
      lastCountRef.current = messages.length;
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || !isActive) return;
    postMessage(trimmed, authorId, authorName);
    setInputText("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const sportLabel = sport.charAt(0).toUpperCase() + sport.slice(1);

  return (
    <div
      data-ocid="sport_chat.panel"
      className="w-full rounded-2xl border border-gold/20 bg-charcoal overflow-hidden"
      style={{ background: "#141418" }}
    >
      {/* Panel header */}
      <button
        type="button"
        data-ocid="sport_chat.toggle"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) onOpen?.();
        }}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <MessageSquare className="w-4 h-4 text-gold flex-shrink-0" />
        <span className="flex-1 text-left text-sm font-bold text-foreground">
          {sportLabel} Chat
        </span>
        {messages.length > 0 && (
          <span className="text-xs text-muted-foreground mr-2">
            {messages.length}
          </span>
        )}
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <>
          {/* Message list */}
          <div className="border-t border-white/6">
            <ScrollArea className="h-56 px-3">
              {messages.length === 0 ? (
                <div
                  data-ocid="sport_chat.empty_state"
                  className="h-56 flex flex-col items-center justify-center gap-2 text-center"
                >
                  <MessageSquare className="w-7 h-7 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">
                    No messages yet.
                    {isActive
                      ? " Be the first to say something!"
                      : " Activate your sport to join the chat."}
                  </p>
                </div>
              ) : (
                <div
                  data-ocid="sport_chat.message_list"
                  className="py-2 space-y-0.5"
                >
                  {messages.map((msg) => (
                    <MessageRow
                      key={msg.id}
                      msg={msg}
                      isMe={msg.authorId === authorId}
                    />
                  ))}
                  <div ref={bottomRef} />
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Input area */}
          <div className="border-t border-white/6 px-3 py-2 flex items-center gap-2">
            <input
              ref={inputRef}
              data-ocid="sport_chat.input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!isActive}
              placeholder={
                isActive
                  ? `Message ${sportLabel} chat…`
                  : "Activate your sport to chat"
              }
              maxLength={300}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-gold/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            />
            <button
              type="button"
              data-ocid="sport_chat.send_button"
              onClick={handleSend}
              disabled={!isActive || !inputText.trim()}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gold/20 text-gold border border-gold/30 hover:bg-gold/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0 active:scale-95"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Not-active hint */}
          {!isActive && (
            <p className="text-center text-[11px] text-muted-foreground/50 pb-2 -mt-1">
              Activate a sport to post messages
            </p>
          )}
        </>
      )}
    </div>
  );
}
