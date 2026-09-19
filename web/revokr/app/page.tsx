import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { FinalCta, Features, Numbers, ProviderStrip, SiteFooter } from "@/components/marketing/sections";
import { PageGradient } from "@/components/marketing/page-gradient";
import { SecuritySection } from "@/components/marketing/security-stack";
import { SiteHeader } from "@/components/marketing/site-header";
import { getSession } from "@/lib/session";

export default async function LandingPage() {
  const signedIn = (await getSession()) !== null;

  return (
    <div className="relative overflow-x-clip">
      <PageGradient />
      <SiteHeader signedIn={signedIn} />
      <main>
        <Hero signedIn={signedIn} />
        <ProviderStrip />
        <Numbers />
        <HowItWorks />
        <Features />
        <SecuritySection />
        <FinalCta signedIn={signedIn} />
      </main>
      <SiteFooter />
    </div>
  );
}
