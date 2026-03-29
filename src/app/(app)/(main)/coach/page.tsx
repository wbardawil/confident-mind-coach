import { ChatContainer } from "@/components/coach/chat-container";

export default function CoachPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Coach</h1>
        <p className="mt-2 text-muted-foreground">
          Talk through what&apos;s on your mind with your confidence coach.
        </p>
      </div>
      <ChatContainer />
    </div>
  );
}
