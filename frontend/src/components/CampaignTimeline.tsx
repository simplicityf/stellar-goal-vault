import { History } from "lucide-react";
import { CampaignEvent } from "../types/campaign";
import { EmptyState } from "./EmptyState";

interface CampaignTimelineProps {
  history: CampaignEvent[];
  isLoading?: boolean;
}

function formatTimestamp(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleString();
}

function describeEvent(event: CampaignEvent): string {
  switch (event.eventType) {
    case "created":
      return "Campaign created";
    case "pledged":
      return "New pledge received";
    case "claimed":
      return "Creator claimed vault";
    case "refunded":
      return "Contributor refunded";
    default:
      return event.eventType;
  }
}

export function CampaignTimeline({ history }: CampaignTimelineProps) {
  if (history.length === 0) {
    return (
      <EmptyState
        variant="card"
        icon={History}
        title="Timeline"
        message="No activity yet. Events will appear here as campaigns are created and pledged."
      />
    );
  }

  return (
    <section className="card">
      <div className="section-heading">
        <h2>Timeline</h2>
        <p className="muted">
          Each action is stored locally so contributors can follow campaign activity.
        </p>
      </div>

      <div className="timeline">
        {history.map((event: CampaignEvent) => {
          const isPending = event.metadata?.pending === true;
          return (
            <article
              key={event.id}
              className={`timeline-item ${isPending ? "pending" : ""}`}
            >
              <div className="timeline-dot" aria-hidden />
              <div className="timeline-copy">
                <strong>
                  {describeEvent(event)}
                  {isPending ? " (pending...)" : ""}
                </strong>
                <span className="muted">{formatTimestamp(event.timestamp)}</span>
                <span className="muted">
                  {event.actor
                    ? `Actor: ${event.actor.slice(0, 10)}...`
                    : "System event"}
                  {typeof event.amount === "number"
                    ? ` | Amount: ${event.amount}`
                    : ""}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}