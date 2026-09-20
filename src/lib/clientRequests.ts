import { supabase } from "./supabase";
import type { ClientProjectType } from "./requestAnalysis";

export async function submitClientRequest(token: string, payload: {
  projectName: string; clientName: string; company: string; email: string; phone: string;
  type: ClientProjectType; description: string; features: string[]; deadline: string; budget: string; budgetCurrency: "GEL" | "USD" | "EUR";
  flags: string[]; notes: string; analysis: unknown;
}) {
  const { data, error } = await supabase.rpc("submit_client_request", { p_token: token, p_payload: payload });
  if (error) throw error;

  if (data) {
    try {
      await supabase.functions.invoke("send-request-email", {
        body: { requestId: data, requestToken: token },
      });
    } catch {
      // The request is already saved. Email delivery can be retried from the internal app.
    }
  }

  return data;
}
