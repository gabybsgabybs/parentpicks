import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchProviders from "./tools/search-providers";
import getProvider from "./tools/get-provider";
import listCategories from "./tools/list-categories";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "parentpicks",
  title: "Parentpicks",
  version: "0.1.0",
  instructions: "Parent-recommended local places (doctors, schools, activities, brands) from your neighborhood parents' group. Comments are anonymous ('A parent'); only places recommended by 2+ parents are included. Start with list_categories or search_recommendations.",
  auth: auth.oauth.issuer({ issuer: `https://${projectRef}.supabase.co/auth/v1`, acceptedAudiences: "authenticated" }),
  tools: [searchProviders, getProvider, listCategories],
});
