import { describe, it, expect, beforeEach } from "vitest";
import { initCampaignStore, listCampaigns, createCampaign } from "./campaignStore";

describe("Campaign Search", () => {
  beforeEach(() => {
    // Initialize the database before each test
    initCampaignStore();
  });

  it("should return all campaigns when no search query is provided", () => {
    const campaigns = listCampaigns();
    expect(Array.isArray(campaigns)).toBe(true);
  });

  it("should return empty array when search query matches nothing", () => {
    const campaigns = listCampaigns({ searchQuery: "nonexistent-campaign-xyz-123" });
    expect(campaigns).toEqual([]);
  });

  it("should handle empty search query gracefully", () => {
    const allCampaigns = listCampaigns();
    const emptySearchCampaigns = listCampaigns({ searchQuery: "" });
    expect(emptySearchCampaigns.length).toBe(allCampaigns.length);
  });

  it("should handle whitespace-only search query gracefully", () => {
    const allCampaigns = listCampaigns();
    const whitespaceSearchCampaigns = listCampaigns({ searchQuery: "   " });
    expect(whitespaceSearchCampaigns.length).toBe(allCampaigns.length);
  });

  it("should search campaigns by title (case-insensitive)", () => {
    const futureDeadline = Math.floor(Date.now() / 1000) + 86400;
    
    createCampaign({
      creator: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
      title: "Build a Rocket Ship",
      description: "We need funding to build an amazing rocket ship for space exploration",
      assetCode: "USDC",
      targetAmount: 10000,
      deadline: futureDeadline,
    });

    const results = listCampaigns({ searchQuery: "rocket" });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title.toLowerCase()).toContain("rocket");
  });

  it("should search campaigns by creator (case-insensitive)", () => {
    const futureDeadline = Math.floor(Date.now() / 1000) + 86400;
    const creatorAddress = "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";
    
    createCampaign({
      creator: creatorAddress,
      title: "Test Campaign for Creator Search",
      description: "This campaign is created to test creator search functionality",
      assetCode: "XLM",
      targetAmount: 5000,
      deadline: futureDeadline,
    });

    const results = listCampaigns({ searchQuery: "GBBB" });
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(c => c.creator === creatorAddress)).toBe(true);
  });

  it("should search campaigns by ID", () => {
    const futureDeadline = Math.floor(Date.now() / 1000) + 86400;
    
    const campaign = createCampaign({
      creator: "GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
      title: "Campaign for ID Search",
      description: "This campaign is created to test ID search functionality",
      assetCode: "USDC",
      targetAmount: 3000,
      deadline: futureDeadline,
    });

    const results = listCampaigns({ searchQuery: campaign.id });
    expect(results.length).toBe(1);
    expect(results[0].id).toBe(campaign.id);
  });

  it("should perform case-insensitive search", () => {
    const futureDeadline = Math.floor(Date.now() / 1000) + 86400;
    
    createCampaign({
      creator: "GDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      title: "UPPERCASE TITLE",
      description: "Testing case insensitive search functionality for campaigns",
      assetCode: "XLM",
      targetAmount: 2000,
      deadline: futureDeadline,
    });

    const upperResults = listCampaigns({ searchQuery: "UPPERCASE" });
    const lowerResults = listCampaigns({ searchQuery: "uppercase" });
    const mixedResults = listCampaigns({ searchQuery: "UpPeRcAsE" });

    expect(upperResults.length).toBeGreaterThan(0);
    expect(lowerResults.length).toBe(upperResults.length);
    expect(mixedResults.length).toBe(upperResults.length);
  });
});
