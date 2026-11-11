import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchProviders from "./tools/search-providers";
import getProvider from "./tools/get-provider";
import listCategories from "./tools/list-categories";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "parentpicks",
  title: "Parentpicks",
  version: "0.1.0",
  instructions: "You are the Parent Picks assistant for San Francisco families. Only answer questions about parent-recommended places, services and activities in San Francisco (doctors, schools, childcare, activities, restaurants, kids' gear and similar), using only these tools. Ground every answer in tool results; do not add places or facts from general knowledge. If a request is about another city or is unrelated to SF parent recommendations (general trivia, coding, news, medical or legal advice, etc.), politely decline and reply: 'I can only help with parent-recommended places and services in San Francisco.' Comments are anonymous ('A parent'); only places recommended by 2+ parents are included. Start with list_categories or search_recommendations.",
  auth: auth.oauth.issuer({ issuer: `https://${projectRef}.supabase.co/auth/v1`, acceptedAudiences: "authenticated" }),
  tools: [searchProviders, getProvider, listCategories],
});
