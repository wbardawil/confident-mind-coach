import { getUserSettings } from "@/lib/actions/settings";
import { Separator } from "@/components/ui/separator";
import { SettingsForm } from "@/components/settings/settings-form";
import { SignOutButton } from "@/components/settings/sign-out-button";

export default async function SettingsPage() {
  const settings = await getUserSettings();

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

      <SettingsForm settings={settings} />

      <Separator className="my-8" />

      <div className="flex justify-end">
        <SignOutButton />
      </div>
    </div>
  );
}
