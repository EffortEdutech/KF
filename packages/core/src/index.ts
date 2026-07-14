export const lifecycleStates = [
  "draft",
  "ai_generated",
  "under_review",
  "changes_requested",
  "expert_validated",
  "approved",
  "published",
  "deprecated",
  "archived",
  "rejected"
] as const;

export type LifecycleState = (typeof lifecycleStates)[number];

export const missionTypes = [
  "discovery",
  "acquisition",
  "manufacturing",
  "validation",
  "publishing",
  "intelligence",
  "maintenance"
] as const;

export type MissionType = (typeof missionTypes)[number];

export const missionStatuses = [
  "created",
  "queued",
  "assigned",
  "ready",
  "running",
  "paused",
  "completed",
  "verified",
  "closed",
  "failed",
  "cancelled",
  "retried",
  "expired"
] as const;

export type MissionStatus = (typeof missionStatuses)[number];

export const roles = [
  "platform_admin",
  "knowledge_architect",
  "knowledge_engineer",
  "domain_expert",
  "reviewer",
  "publisher",
  "runtime_consumer"
] as const;

export type Role = (typeof roles)[number];

export const relationshipTypes = [
  "requires",
  "explains",
  "supports",
  "contradicts",
  "derives_from",
  "applies_to",
  "belongs_to",
  "tested_by",
  "used_in",
  "replaces"
] as const;

export type RelationshipType = (typeof relationshipTypes)[number];
