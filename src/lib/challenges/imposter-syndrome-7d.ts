import type { ChallengeConfig } from "./types";

export const imposterSyndrome7d: ChallengeConfig = {
  slug: "imposter-syndrome-7d",
  title: "7-Day Imposter Syndrome Killer",
  subtitle: "From 'I don't belong here' to 'I earned this'",
  description:
    "A structured 7-day program to dismantle imposter syndrome using evidence-based confidence techniques. Each day builds on the last — by day 7 you'll have concrete proof that you belong.",
  duration: 7,
  category: "confidence",
  icon: "Shield",
  days: [
    {
      day: 1,
      title: "Name the Imposter",
      theme: "Awareness",
      lesson:
        "Imposter syndrome isn't a diagnosis — it's a thinking pattern. It's the habit of dismissing evidence of your competence while amplifying evidence of your inadequacy. Today we make it visible.",
      prompt:
        "Describe a recent moment where you felt like a fraud or thought 'I don't really deserve this.' What triggered it? What were you telling yourself?",
      aiInstruction:
        "Validate their experience without pathologizing it. Help them see the imposter thought as a pattern, not a truth. Identify the specific cognitive distortion at play (dismissing evidence, mind-reading, fortune-telling). End with: 'Now that you've named it, you can start managing it.'",
    },
    {
      day: 2,
      title: "The Evidence File",
      theme: "Evidence Collection",
      lesson:
        "Imposter syndrome survives by ignoring evidence. Today you fight back with facts. Your Top Ten achievements aren't luck — they're proof of capability that your inner imposter wants you to forget.",
      prompt:
        "Pick one achievement you're proud of. Now write down THREE specific things YOU did to make it happen. Not luck, not timing, not other people — YOUR actions and decisions.",
      aiInstruction:
        "Push them to own their agency. If they deflect credit ('I was lucky', 'anyone could have done it'), gently challenge that. Reference their Top Ten if available. Build the case that their success has a pattern — and that pattern is them.",
    },
    {
      day: 3,
      title: "The Comparison Trap",
      theme: "Reframing",
      lesson:
        "Imposter syndrome feeds on comparison — but you're comparing your inside to everyone else's outside. You see their highlight reel and compare it to your raw footage. Today we break that habit.",
      prompt:
        "Who do you compare yourself to most? What do you assume about them that you don't know for sure? Now flip it: what would THEY see if they looked at your track record?",
      aiInstruction:
        "Help them see the asymmetry in their comparisons. They're comparing their doubts to others' confidence, their struggles to others' wins. Point out that the person they admire probably has their own version of this. Ground them in THEIR evidence, not the comparison.",
    },
    {
      day: 4,
      title: "Rewrite the Script",
      theme: "Constructive Thinking",
      lesson:
        "Your inner imposter has a script: 'I got lucky,' 'They'll find out,' 'I'm not as good as they think.' Today you write a new script — one grounded in evidence, not fear.",
      prompt:
        "Write down the #1 imposter thought you hear most often. Now rewrite it as a fact-based counter-statement. Example: 'I got lucky' → 'I prepared for 3 months and executed under pressure.'",
      aiInstruction:
        "Help them craft a powerful reframe that's specific and evidence-based — not generic affirmation. The reframe should reference their actual experience. If their counter-statement is too vague ('I'm good enough'), push them to make it concrete with specific evidence.",
    },
    {
      day: 5,
      title: "The Enough Statement",
      theme: "Identity",
      lesson:
        "Dr. Zinsser's 'Enough Statement' is a prepared declaration of sufficiency: 'I have done enough, I know enough, I AM enough for this moment.' Today you build yours — grounded in your specific evidence.",
      prompt:
        "Complete this statement with YOUR evidence: 'I am enough for [specific situation] because I have [specific evidence 1], [specific evidence 2], and [specific evidence 3].'",
      aiInstruction:
        "Help them build a powerful, specific Enough Statement. It should reference real achievements, real skills, real preparation. This isn't self-help fluff — it's a pre-performance weapon. If they're vague, push for specifics. The best Enough Statements read like closing arguments in a trial.",
    },
    {
      day: 6,
      title: "Teach What You Know",
      theme: "Embodiment",
      lesson:
        "The ultimate proof you're not a fraud: you can teach others what you know. Imposters can't do that. Today you prove to yourself that your knowledge is real by articulating it.",
      prompt:
        "Imagine someone junior asks you for the #1 lesson from your career. What would you tell them? Write it out as if you're mentoring them.",
      aiInstruction:
        "Reflect back to them how much expertise is embedded in their answer. Point out that a fraud couldn't articulate this. The specificity, the nuance, the hard-won wisdom — that's EARNED knowledge, not luck. This is powerful evidence against imposter syndrome.",
    },
    {
      day: 7,
      title: "The New Identity",
      theme: "Integration",
      lesson:
        "Over the past 6 days you've named the pattern, collected evidence, broken the comparison trap, rewritten the script, declared your sufficiency, and proven your expertise. Today you integrate it all into a new identity statement.",
      prompt:
        "Write your identity statement: 'I am [role] who [what you do well] because [your evidence]. When imposter thoughts arise, I remember [your strongest counter-evidence].'",
      aiInstruction:
        "This is the culmination. Help them craft an identity statement that's powerful, specific, and memorable. Reference their work from the previous 6 days if visible in coaching memory. Celebrate the transformation — they showed up for 7 days and did the work. That itself is evidence against being a fraud. End with a strong affirmation they can carry forward.",
    },
  ],
};
