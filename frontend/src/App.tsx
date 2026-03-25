import { useEffect, useMemo, useState } from "react";
import { CampaignDetailPanel } from "./components/CampaignDetailPanel";
import { CampaignsTable } from "./components/CampaignsTable";
import { CampaignTimeline } from "./components/CampaignTimeline";
import { CreateCampaignForm } from "./components/CreateCampaignForm";
import { IssueBacklog } from "./components/IssueBacklog";
import {
  addPledge,
  claimCampaign,
  createCampaign,
  getCampaignHistory,
  listCampaigns,
  listOpenIssues,
  refundCampaign,
} from "./services/api";
import { Campaign, CampaignEvent, OpenIssue } from "./types/campaign";

function App() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [issues, setIssues] = useState<OpenIssue[]>([]);
  const [history, setHistory] = useState<CampaignEvent[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  async function refreshCampaigns(nextSelectedId?: string | null) {
    const data = await listCampaigns();
    setCampaigns(data);

    const candidateId =
      nextSelectedId ?? selectedCampaignId ?? (data.length > 0 ? data[0].id : null);
    const exists = data.some((campaign) => campaign.id === candidateId);
    setSelectedCampaignId(exists ? candidateId : data[0]?.id ?? null);
  }

  async function refreshHistory(campaignId: string | null) {
    if (!campaignId) {
      setHistory([]);
      return;
    }

    const data = await getCampaignHistory(campaignId);
    setHistory(data);
  }

  useEffect(() => {
    async function bootstrap() {
      const [campaignData, issueData] = await Promise.all([
        listCampaigns(),
        listOpenIssues(),
      ]);

      setCampaigns(campaignData);
      setIssues(issueData);
      setSelectedCampaignId(campaignData[0]?.id ?? null);
    }

    void bootstrap();
  }, []);

  useEffect(() => {
    void refreshHistory(selectedCampaignId);
  }, [selectedCampaignId]);

  const selectedCampaign =
    campaigns.find((campaign) => campaign.id === selectedCampaignId) ?? null;

  const metrics = useMemo(() => {
    const open = campaigns.filter((campaign) => campaign.progress.status === "open").length;
    const funded = campaigns.filter((campaign) => campaign.progress.status === "funded").length;
    const pledged = campaigns.reduce((sum, campaign) => sum + campaign.pledgedAmount, 0);

    return {
      total: campaigns.length,
      open,
      funded,
      pledged: Number(pledged.toFixed(2)),
    };
  }, [campaigns]);

  async function handleCreate(payload: Parameters<typeof createCampaign>[0]) {
    setCreateError(null);
    setActionError(null);
    setActionMessage(null);

    try {
      const campaign = await createCampaign(payload);
      await refreshCampaigns(campaign.id);
      await refreshHistory(campaign.id);
      setActionMessage(`Campaign #${campaign.id} is live and ready for pledges.`);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Failed to create campaign.");
    }
  }

  async function handlePledge(campaignId: string, contributor: string, amount: number) {
    setActionError(null);
    setActionMessage(null);

    try {
      await addPledge(campaignId, { contributor, amount });
      await refreshCampaigns(campaignId);
      await refreshHistory(campaignId);
      setActionMessage("Pledge recorded in the local goal vault.");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to add pledge.");
    }
  }

  async function handleClaim(campaign: Campaign) {
    setActionError(null);
    setActionMessage(null);

    try {
      await claimCampaign(campaign.id, campaign.creator);
      await refreshCampaigns(campaign.id);
      await refreshHistory(campaign.id);
      setActionMessage("Campaign claimed successfully.");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to claim campaign.");
    }
  }

  async function handleRefund(campaignId: string, contributor: string) {
    setActionError(null);
    setActionMessage(null);

    try {
      await refundCampaign(campaignId, contributor);
      await refreshCampaigns(campaignId);
      await refreshHistory(campaignId);
      setActionMessage("Refund recorded for the selected contributor.");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to refund contributor.");
    }
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <p className="eyebrow">Soroban crowdfunding MVP</p>
        <h1>Stellar Goal Vault</h1>
        <p className="hero-copy">
          Create funding goals, collect pledges, and model claim or refund flows before
          wiring the full Soroban transaction path.
        </p>
      </header>

      <section className="metric-grid animate-fade-in" style={{ animationDelay: "0.1s" }}>
        <article className="metric-card">
          <span>Total campaigns</span>
          <strong>{metrics.total}</strong>
        </article>
        <article className="metric-card">
          <span>Open campaigns</span>
          <strong>{metrics.open}</strong>
        </article>
        <article className="metric-card">
          <span>Funded campaigns</span>
          <strong>{metrics.funded}</strong>
        </article>
        <article className="metric-card">
          <span>Total pledged</span>
          <strong>{metrics.pledged}</strong>
        </article>
      </section>

      <section className="layout-grid animate-fade-in" style={{ animationDelay: "0.2s" }}>
        <CreateCampaignForm onCreate={handleCreate} apiError={createError} />
        <CampaignDetailPanel
          campaign={selectedCampaign}
          actionError={actionError}
          actionMessage={actionMessage}
          onPledge={handlePledge}
          onClaim={handleClaim}
          onRefund={handleRefund}
        />
      </section>

      <section className="section-margin animate-fade-in" style={{ animationDelay: "0.3s" }}>
        <CampaignsTable
          campaigns={campaigns}
          selectedCampaignId={selectedCampaignId}
          onSelect={setSelectedCampaignId}
        />
      </section>

      <section className="secondary-grid section-margin animate-fade-in" style={{ animationDelay: "0.4s" }}>
        <CampaignTimeline history={history} />
        <IssueBacklog issues={issues} />
      </section>
    </div>
  );
}

export default App;
