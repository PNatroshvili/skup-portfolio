import { supabase } from "./supabase";
import type { ClientProjectType } from "./requestAnalysis";

export async function submitClientRequest(token: string, payload: {
  projectName: string; clientName: string; company: string; email: string; phone: string;
  type: ClientProjectType; description: string; features: string[]; deadline: string; budget: string;
  flags: string[]; notes: string; analysis: unknown;
}) {
  const { data, error } = await supabase.rpc("submit_client_request", { p_token: token, p_payload: payload });
  if (error) throw error;
  return data;
}
