import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface EvaluationPayload {
  supervisor_name: string;
  nurse_name: string;
  final_score: number;
  scores: Record<string, number>;
  evaluation_id: string;
}

const SLACK_WEBHOOK_URL = Deno.env.get("SLACK_WEBHOOK_URL");

serve(async (req) => {
  if (!SLACK_WEBHOOK_URL) {
    return new Response("Slack Webhook URL not configured.", { status: 500 });
  }

  try {
    const payload: EvaluationPayload = await req.json();

    const { supervisor_name, nurse_name, final_score, scores, evaluation_id } = payload;

    const scoreDetails = Object.entries(scores)
      .map(([key, value]) => `• ${key}: ${value}`)
      .join("\n");

    const message = {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "New Evaluation Submitted 📝",
          },
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Supervisor:*\n${supervisor_name}` },
            { type: "mrkdwn", text: `*Nurse:*\n${nurse_name}` },
            { type: "mrkdwn", text: `*Final Score:*\n${final_score}` },
          ],
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Score Details:*\n${scoreDetails}`,
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "View Full Evaluation",
              },
              // Note: You need to replace this with your actual app URL
              url: `https://yourapp.com/evaluations/${evaluation_id}`,
              style: "primary",
            },
          ],
        },
      ],
    };

    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.statusText}`);
    }

    return new Response("Notification sent.", { status: 200 });
  } catch (error) {
    console.error("Error sending Slack notification:", error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
});
