import { getUserSettings } from "@/lib/actions/settings";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "@/components/settings/settings-form";
import { SignOutButton } from "@/components/settings/sign-out-button";
import { SubscriptionCard } from "@/components/settings/subscription-card";
import { DocumentUpload } from "@/components/settings/document-upload";
import { DocumentList } from "@/components/settings/document-list";
import { PersonalityAssessments } from "@/components/settings/personality-assessments";
import { getDocuments } from "@/lib/actions/documents";
import { getPersonalityAssessments } from "@/lib/actions/personality";
import { MAX_DOCUMENTS_PER_USER } from "@/lib/validators/documents";

export default async function SettingsPage() {
  const [settings, documents, assessments] = await Promise.all([
    getUserSettings(),
    getDocuments(),
    getPersonalityAssessments(),
  ]);

  if (!settings) {
    return (
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Please sign in to view your settings.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your account and coaching profile.
        </p>
      </div>

      <SubscriptionCard
        tier={settings.subscriptionTier}
        status={settings.subscriptionStatus}
      />

      <Separator className="my-8" />

      <SettingsForm settings={settings} />

      <Separator className="my-8" />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Documents</CardTitle>
          <CardDescription>
            Upload documents to give your coach more context about you.
            Personality assessments, resumes, performance reviews, and notes
            help the coach personalize your experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <DocumentUpload
            currentCount={documents.length}
            maxDocuments={MAX_DOCUMENTS_PER_USER}
          />
          <Separator />
          <div>
            <h3 className="text-sm font-medium mb-3">
              Uploaded Documents ({documents.length}/{MAX_DOCUMENTS_PER_USER})
            </h3>
            <DocumentList documents={documents} />
          </div>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Personality Profile</CardTitle>
          <CardDescription>
            Structured personality data extracted from your uploaded assessments.
            The coach uses this to tailor strategies to your wiring.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PersonalityAssessments
            assessments={assessments}
            documents={documents}
          />
        </CardContent>
      </Card>

      <Separator className="my-8" />

      <div className="flex justify-end">
        <SignOutButton />
      </div>
    </div>
  );
}
