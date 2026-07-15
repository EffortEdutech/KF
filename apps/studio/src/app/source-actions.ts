"use server";

import { revalidatePath } from "next/cache";
import { createSource } from "./source-store";
import { sourceCategories } from "./studio-data";
import type { SourceSummary } from "./studio-data";

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

export async function createSourceAction(formData: FormData) {
  createSource({
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
  revalidatePath("/projects");
  revalidatePath("/sources");
}
