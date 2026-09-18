import { Hero } from "@/components/marketing/hero";
import {
  FinalCta,
  Features,
  Numbers,
  ProviderStrip,
  SecuritySection,
  SiteFooter,
} from "@/components/marketing/sections";
import { SiteHeader } from "@/components/marketing/site-header";
import { Story } from "@/components/marketing/story";
import { Ambient } from "@/components/shell/ambient";
import { getSession } from "@/lib/session";

export default async function LandingPage() {
  const signedIn = (await getSession()) !== null;

  return (
    <div className="relative overflow-x-clip">
      <Ambient />
      <SiteHeader signedIn={signedIn} />
      <main>
        <Hero signedIn={signedIn} />
        <ProviderStrip />
        <Story />
        <Numbers />
        <Features />
        <SecuritySection />
        <FinalCta signedIn={signedIn} />
      </main>
      <SiteFooter />
    </div>
  );
}
