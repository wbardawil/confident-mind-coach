/**
 * Escalation message shown when crisis content is detected.
 *
 * Per CLAUDE.md product boundaries:
 *   - Stop normal coaching
 *   - Show a supportive escalation message
 *   - Encourage human / professional support
 */

export const ESCALATION_MESSAGE = {
  heading: "We care about your wellbeing",
  body: "It sounds like you may be going through something really difficult right now. This tool is designed for mental performance coaching and is not a substitute for professional support.",
  action: "Please reach out to someone who can help:",
  resources: [
    {
      name: "988 Suicide & Crisis Lifeline",
      detail: "Call or text 988 (US)",
    },
    {
      name: "Crisis Text Line",
      detail: "Text HOME to 741741",
    },
    {
      name: "International Association for Suicide Prevention",
      detail: "https://www.iasp.info/resources/Crisis_Centres/",
    },
  ],
} as const;
