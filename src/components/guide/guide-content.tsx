"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sun,
  MessageCircle,
  Zap,
  Crosshair,
  RotateCcw,
  ClipboardList,
  Trophy,
  Target,
  Flame,
  BookOpen,
  Brain,
  Calendar,
  Lightbulb,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import { ROUTES } from "@/lib/utils/constants";
import { cn } from "@/lib/utils";

/* ── Section navigation ─────────────────────────── */

const sections = [
  { id: "method", label: "The Method" },
  { id: "routine", label: "Daily Routine" },
  { id: "tools", label: "Tool Guide" },
  { id: "first-week", label: "Your First Week" },
  { id: "faq", label: "FAQ" },
];

/* ── Tool definitions ───────────────────────────── */

const tools = [
  {
    name: "Daily ESP",
    icon: Sun,
    href: ROUTES.DAILY_ESP,
    frequency: "Daily",
    frequencyColor: "bg-green-500/10 text-green-700",
    what: "Reflect on your Effort, Success, and Progress from the past 24 hours. Your coach responds with a personalized reflection and adds a confidence deposit to your ledger.",
    when: "Every morning or evening — pick a consistent time that becomes your routine.",
    tip: "Don't overthink it. Even \"I showed up and tried\" counts as effort. The act of noticing builds the habit of seeing evidence.",
  },
  {
    name: "Coach",
    icon: MessageCircle,
    href: ROUTES.COACH,
    frequency: "Daily / As needed",
    frequencyColor: "bg-blue-500/10 text-blue-700",
    what: "Free-form conversation with your AI confidence coach. It remembers your history, goals, challenges, and past sessions — so it gets sharper over time.",
    when: "After your ESP to go deeper, before a big moment for encouragement, or anytime you need to think out loud.",
    tip: "Talk to it like a real coach. Be honest about what you're feeling. The more context you give, the more personal the coaching becomes.",
  },
  {
    name: "Instant Reset",
    icon: Zap,
    href: ROUTES.INSTANT_RESET,
    frequency: "As needed",
    frequencyColor: "bg-red-500/10 text-red-700",
    what: "A panic button. When confidence crashes — before a call, after a rejection, in a spiral — hit this for an immediate, personalized intervention grounded in YOUR evidence.",
    when: "The moment you feel your confidence drop. Don't wait. The faster you reset, the less damage the withdrawal does.",
    tip: "Bookmark this on your phone's home screen. In a crisis, you won't want to navigate menus.",
  },
  {
    name: "Pregame",
    icon: Crosshair,
    href: ROUTES.PREGAME,
    frequency: "Before events",
    frequencyColor: "bg-purple-500/10 text-purple-700",
    what: "Mental preparation routine for upcoming performances — pitches, meetings, presentations, competitions. Builds a mental game plan using your strengths and evidence.",
    when: "15-30 minutes before any event where you want to perform at your best.",
    tip: "Name your fear. The Pregame works best when you're honest about what scares you — the coach turns that into fuel.",
  },
  {
    name: "Reset",
    icon: RotateCcw,
    href: ROUTES.RESET,
    frequency: "After setbacks",
    frequencyColor: "bg-orange-500/10 text-orange-700",
    what: "Structured recovery after a confidence-shaking event. Acknowledges the hit, assesses the real damage (usually less than it feels), and rebuilds with a recovery deposit.",
    when: "After something went wrong — a failed pitch, a bad meeting, a missed deadline. Before the negative story calcifies.",
    tip: "The withdrawal is usually smaller than you think. The Reset helps you see the real score, not the emotional one.",
  },
  {
    name: "After Action Review",
    icon: ClipboardList,
    href: ROUTES.AAR,
    frequency: "After events",
    frequencyColor: "bg-teal-500/10 text-teal-700",
    what: "Military-style debrief: What happened? So what? Now what? Extracts lessons and deposits from any performance — good or bad.",
    when: "Within 24 hours of any significant event. Works for wins AND losses.",
    tip: "AARs after wins are just as important as after losses. They help you understand WHY you succeeded so you can repeat it.",
  },
  {
    name: "Top Ten",
    icon: Trophy,
    href: ROUTES.TOP_TEN,
    frequency: "Set up once, update over time",
    frequencyColor: "bg-yellow-500/10 text-yellow-700",
    what: "Your 10 most powerful confidence memories — moments where you proved to yourself what you're capable of. This is the foundation your coach draws from.",
    when: "Fill these during onboarding. Update them as you create new peak experiences.",
    tip: "Include specific details — the date, what you felt, what someone said. Vividness makes memories more powerful as evidence.",
  },
  {
    name: "Goals",
    icon: Target,
    href: ROUTES.GOALS,
    frequency: "Weekly check-in",
    frequencyColor: "bg-indigo-500/10 text-indigo-700",
    what: "1-5 specific outcomes you're working toward. Each goal tracks self-efficacy over time and links to your coaching deposits.",
    when: "Set them when you start. Update efficacy scores weekly. Link your daily ESP and coaching sessions to specific goals.",
    tip: "The self-efficacy score is the real metric. Watch it climb as you accumulate evidence — that's confidence becoming belief.",
  },
  {
    name: "Challenges",
    icon: Flame,
    href: ROUTES.CHALLENGES,
    frequency: "Periodic",
    frequencyColor: "bg-pink-500/10 text-pink-700",
    what: "Structured multi-day programs that build specific confidence skills through daily guided exercises.",
    when: "When you want focused growth. Start one challenge at a time and commit to completing it.",
    tip: "Don't break the streak. Consistency compounds — day 7 hits different than day 1.",
  },
  {
    name: "Confidence Ledger",
    icon: BookOpen,
    href: ROUTES.LEDGER,
    frequency: "View anytime",
    frequencyColor: "bg-gray-500/10 text-gray-700",
    what: "Your confidence accounting system. Every ESP, Pregame, Reset, and AAR creates deposits or withdrawals. The ledger tracks your running score and 14-day trend.",
    when: "Check it when you need a reminder of how far you've come. The trend matters more than any single day.",
    tip: "A negative day doesn't erase positive ones. Confidence compounds. Focus on the trend line, not individual entries.",
  },
];

/* ── First week plan ────────────────────────────── */

const firstWeek = [
  {
    day: "Day 1",
    title: "Build your foundation",
    tasks: ["Fill in your Top Ten confidence memories", "Complete your first Daily ESP", "Set 1-3 confidence goals"],
  },
  {
    day: "Day 2",
    title: "Start the conversation",
    tasks: ["Daily ESP (morning)", "Talk to your Coach about what you're working on", "Explore the Confidence Ledger"],
  },
  {
    day: "Day 3",
    title: "Prepare for something",
    tasks: ["Daily ESP", "Run a Pregame for an upcoming event", "Notice your confidence score growing"],
  },
  {
    day: "Day 4",
    title: "Review and learn",
    tasks: ["Daily ESP", "Complete an After Action Review for a recent event", "Check your 14-day trend"],
  },
  {
    day: "Day 5",
    title: "Build momentum",
    tasks: ["Daily ESP", "Start a Challenge", "Talk to your Coach about patterns you're noticing"],
  },
  {
    day: "Day 6-7",
    title: "Make it yours",
    tasks: ["Daily ESP (keep the streak)", "Continue your Challenge", "Use Instant Reset if you need it — it's always there"],
  },
];

/* ── FAQ ────────────────────────────────────────── */

const faqs = [
  {
    q: "Is this therapy?",
    a: "No. This is mental performance coaching — the same approach used by elite athletes, military leaders, and high performers. It builds confidence as a skill through evidence and repetition. If you're experiencing a mental health crisis, please reach out to a professional.",
  },
  {
    q: "What if I miss a day?",
    a: "Pick up where you left off. Confidence is a skill, not a streak. Missing a day doesn't erase your progress — your ledger and evidence are still there. The most important thing is coming back.",
  },
  {
    q: "How is this different from affirmation apps?",
    a: "Affirmation apps give you generic positive statements. This system builds confidence from YOUR evidence — real things you've done, real strengths you've demonstrated. Your coach knows your history and ties every session back to proof, not platitudes.",
  },
  {
    q: "How long until I see results?",
    a: "Most users notice a shift in how they talk to themselves within the first week. The confidence score trend becomes meaningful after 2 weeks. Deep, lasting change in self-efficacy builds over 30-90 days of consistent practice.",
  },
  {
    q: "Can I use this for my team?",
    a: "Right now it's designed for individual use. Team and organization features are on the roadmap.",
  },
  {
    q: "What methodology is this based on?",
    a: "The Confident Mind Coach is built on Dr. Nate Zinsser's methodology from West Point's Performance Psychology Program. His book \"The Confident Mind\" is the foundation — this app operationalizes his system into daily practice.",
  },
];

/* ── Main component ─────────────────────────────── */

export function GuideContent() {
  const [activeSection, setActiveSection] = useState("method");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    for (const section of sections) {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">
          How to Use The Confident Mind Coach
        </h1>
        <p className="mt-2 text-muted-foreground">
          Everything you need to build, protect, and deploy confidence as a trainable skill.
        </p>
      </div>

      {/* Sticky section nav */}
      <div className="sticky top-0 z-10 -mx-1 mb-8 flex gap-1 overflow-x-auto bg-background/95 px-1 py-2 backdrop-blur">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={cn(
              "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              activeSection === s.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {s.label}
          </a>
        ))}
      </div>

      {/* ── THE METHOD ──────────────────────────── */}
      <section id="method" className="mb-12 scroll-mt-16">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">The Method</h2>
        </div>
        <Card>
          <CardContent className="prose prose-sm max-w-none pt-6 text-muted-foreground">
            <p>
              <strong className="text-foreground">Confidence is not a feeling you wait for. It&apos;s a skill you build.</strong>
            </p>
            <p>
              Most people treat confidence like the weather — something that happens to them. This app treats it like a bank account. Every day, you make deposits (evidence of your capability) and protect against withdrawals (self-doubt, setbacks, negative self-talk).
            </p>
            <p>
              The methodology comes from <strong className="text-foreground">Dr. Nate Zinsser</strong>, Director of West Point&apos;s Performance Psychology Program. For 30+ years, he&apos;s trained Army cadets, Olympic athletes, and NFL teams using the same system:
            </p>
            <ol className="space-y-2">
              <li><strong className="text-foreground">Collect evidence</strong> — Notice and record your effort, successes, and progress daily</li>
              <li><strong className="text-foreground">Protect your account</strong> — Catch withdrawals early and recover fast</li>
              <li><strong className="text-foreground">Deploy under pressure</strong> — Use mental routines before and during performances</li>
            </ol>
            <p>
              This app operationalizes that system. Your AI coach knows your history, your strengths, your goals, and your evidence. It gets smarter the more you use it — because it&apos;s building from YOUR data, not generic advice.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* ── DAILY ROUTINE ───────────────────────── */}
      <section id="routine" className="mb-12 scroll-mt-16">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">Your Daily Routine</h2>
        </div>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              The core loop takes 5 minutes. Do this every day and confidence compounds:
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge className="mt-0.5 shrink-0 bg-green-500/10 text-green-700">1</Badge>
                <div>
                  <p className="text-sm font-semibold">Daily ESP <span className="font-normal text-muted-foreground">(2 min)</span></p>
                  <p className="text-xs text-muted-foreground">What effort did I put in? What went well? What progress did I make?</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="mt-0.5 shrink-0 bg-blue-500/10 text-blue-700">2</Badge>
                <div>
                  <p className="text-sm font-semibold">Talk to your Coach <span className="font-normal text-muted-foreground">(2-3 min)</span></p>
                  <p className="text-xs text-muted-foreground">Go deeper on what came up. Ask questions. Think out loud.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="mt-0.5 shrink-0 bg-gray-500/10 text-gray-700">3</Badge>
                <div>
                  <p className="text-sm font-semibold">Check your Ledger <span className="font-normal text-muted-foreground">(30 sec)</span></p>
                  <p className="text-xs text-muted-foreground">Watch your score grow. The trend is your proof.</p>
                </div>
              </div>
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground italic">
              Add Pregame before events, Reset after setbacks, and AAR after performances. These are situational — the ESP + Coach combo is your daily foundation.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* ── TOOL GUIDE ──────────────────────────── */}
      <section id="tools" className="mb-12 scroll-mt-16">
        <div className="flex items-center gap-3 mb-4">
          <Lightbulb className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">Tool Guide</h2>
        </div>
        <div className="space-y-4">
          {tools.map((tool) => (
            <Card key={tool.name}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <tool.icon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">{tool.name}</CardTitle>
                  </div>
                  <Badge variant="secondary" className={cn("text-xs", tool.frequencyColor)}>
                    {tool.frequency}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-xs uppercase tracking-wider text-muted-foreground/60 mb-1">What it does</p>
                  <p className="text-muted-foreground">{tool.what}</p>
                </div>
                <div>
                  <p className="font-medium text-xs uppercase tracking-wider text-muted-foreground/60 mb-1">When to use it</p>
                  <p className="text-muted-foreground">{tool.when}</p>
                </div>
                <div className="rounded-md bg-primary/5 px-3 py-2">
                  <p className="text-xs">
                    <span className="font-semibold">Pro tip:</span>{" "}
                    <span className="text-muted-foreground">{tool.tip}</span>
                  </p>
                </div>
                <Link
                  href={tool.href}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Open {tool.name} <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── YOUR FIRST WEEK ─────────────────────── */}
      <section id="first-week" className="mb-12 scroll-mt-16">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">Your First Week</h2>
        </div>
        <div className="space-y-3">
          {firstWeek.map((day) => (
            <Card key={day.day}>
              <CardContent className="flex gap-4 py-4">
                <Badge variant="outline" className="mt-0.5 shrink-0 text-xs font-bold">
                  {day.day}
                </Badge>
                <div>
                  <p className="text-sm font-semibold">{day.title}</p>
                  <ul className="mt-1 space-y-0.5">
                    {day.tasks.map((task) => (
                      <li key={task} className="text-xs text-muted-foreground">
                        &bull; {task}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────── */}
      <section id="faq" className="mb-12 scroll-mt-16">
        <div className="flex items-center gap-3 mb-4">
          <HelpCircle className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <Card key={faq.q}>
              <CardContent className="py-4">
                <p className="text-sm font-semibold">{faq.q}</p>
                <p className="mt-1 text-sm text-muted-foreground">{faq.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
