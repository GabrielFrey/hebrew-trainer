import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy policy · Biti Hebrew",
  description: "Biti Hebrew stores progress on the device and does not track learners.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 px-6 py-12">
      <h1 className="text-3xl font-bold">Privacy policy</h1>
      <p className="text-sm text-ink-soft">Last updated: 2026-11-18</p>
      <p>Biti Hebrew works offline. There are no accounts, ads or tracking.</p>
      <p>
        Stored only on your device: the name you type, interface language, course, progress, XP, streak and review cards.
        Signing out or deleting the app erases them.
      </p>
      <p>The App Store build sends nothing over the network. Lessons, grading and progress run on the device.</p>
      <p>No analytics, crash reporting, advertising or third-party SDKs that collect data.</p>
      <p>Suitable for all ages (App Store rating 4+). We collect no personal data from anyone, including children.</p>
      <p>Questions? Use the support link on the App Store page.</p>
      <p className="text-sm text-ink-soft">The app shows this policy in the interface language.</p>
      <Link href="/" className="text-indigo underline">
        Back
      </Link>
    </main>
  );
}
