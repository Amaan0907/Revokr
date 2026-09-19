import { redirect } from "next/navigation";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { FinalCta, Features, Numbers, ProviderStrip, SiteFooter } from "@/components/marketing/sections";
import { PageGradient } from "@/components/marketing/page-gradient";
import { SecuritySection } from "@/components/marketing/security-stack";
import { SiteHeader } from "@/components/marketing/site-header";
import { getSession } from "@/lib/session";

export default async function LandingPage() {
  // This page is for visitors; someone who is signed in has the dashboard as their home.
  if (await getSession()) redirect("/dashboard");

  return (
    <div className="relative overflow-x-clip">
      <PageGradient />
      <SiteHeader />
      <main>
        <Hero />
        <ProviderStrip />
        <Numbers />
        <HowItWorks />
        <Features />
        <SecuritySection />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
