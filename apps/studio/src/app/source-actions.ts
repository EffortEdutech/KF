"use server";

import { missionStatuses, missionTypes } from "@kf/core";
import { revalidatePath } from "next/cache";
import { createMission, createProject, createSource, updateMissionStatus } from "./workspace-store";
import { sourceCategories } from "./studio-data";
import type { MissionSummary, SourceSummary } from "./studio-data";
import type { MissionStatus, MissionType } from "@kf/core";

function readRequired(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${key} is required`);
  }
  return value.trim();
}

function readCategory(value: string): SourceSummary["category"] {
  if (sourceCategories.includes(value as SourceSummary["category"])) {
    return value as SourceSummary["category"];
  }
  return "company_document";
}

function readBoundary(value: string): SourceSummary["boundary"] {
  return value === "client_adaptation_input" ? "client_adaptation_input" : "base_pka_input";
}

function readMissionType(value: string): MissionType {
  if (missionTypes.includes(value as MissionType)) {
    return value as MissionType;
  }
  return "discovery";
}

function readMissionStatus(value: string): MissionStatus {
  if (missionStatuses.includes(value as MissionStatus)) {
    return value as MissionStatus;
  }
  return "created";
}

function readPriority(value: string): MissionSummary["priority"] {
  if (value === "low" || value === "high") {
    return value;
  }
  return "normal";
}

export async function createSourceAction(formData: FormData) {
  createSource({
    projectId: readRequired(formData, "projectId"),
    title: readRequired(formData, "title"),
    category: readCategory(readRequired(formData, "category")),
    domain: readRequired(formData, "domain"),
    owner: readRequired(formData, "owner"),
    version: readRequired(formData, "version"),
    reliability: readRequired(formData, "reliability"),
    usagePolicy: readRequired(formData, "usagePolicy"),
    boundary: readBoundary(readRequired(formData, "boundary")),
    storagePath: formData.get("storagePath")?.toString().trim()
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/missions");
  revalidatePath("/projects");
  revalidatePath("/sources");
}

export async function createProjectAction(formData: FormData) {
  createProject({
    name: readRequired(formData, "name"),
    domain: readRequired(formData, "domain"),
    owner: readRequired(formData, "owner"),
    objective: readRequired(formData, "objective")
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/missions");
  revalidatePath("/projects");
  revalidatePath("/sources");
}

export async function createMissionAction(formData: FormData) {
  createMission({
    type: readMissionType(readRequired(formData, "type")),
    title: readRequired(formData, "title"),
    projectId: readRequired(formData, "projectId"),
    assignedTo: readRequired(formData, "assignedTo"),
    stage: readRequired(formData, "stage"),
    priority: readPriority(readRequired(formData, "priority")),
    status: readMissionStatus(readRequired(formData, "status"))
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/missions");
}

export async function updateMissionStatusAction(formData: FormData) {
  updateMissionStatus(
    readRequired(formData, "missionId"),
    readMissionStatus(readRequired(formData, "status"))
  );

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/missions");
}
