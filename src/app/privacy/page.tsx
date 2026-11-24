import type { Metadata } from "next";
import { EmailLink, LegalPage } from "@/components/site/LegalPage";
import { COMPANY } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Privacy policy | Abondhu",
  description: "What Abondhu collects, why, and how we keep it safe.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage eyebrow="Last updated 24 November 2026" title="Privacy policy">
      <section>
        <p>
          Abondhu connects people across India with verified scrap dealers near them. It is run by {COMPANY}, Jorhat,
          Assam. This page explains, in plain words, what we collect when you use abondhu.com, why we need it, and how we
          keep it safe.
        </p>
      </section>

      <section>
        <h2>What we collect</h2>
        <ul>
          <li><b>Login details:</b> your phone number or email address. If you log in with Google, we receive your name, email address and Google account ID from Google. We never see your Google password.</li>
          <li><b>Pickup details:</b> your name, mobile number, pickup address, pincode, the kind of scrap, an optional photo of it, your chosen day and time, and any note you add.</li>
          <li><b>For dealers only:</b> shop or area, the pincodes they cover, photos, payout details and Aadhaar card photos for identity checks.</li>
        </ul>
      </section>

      <section>
        <h2>Why we use it</h2>
        <ul>
          <li>To log you in and keep your account secure.</li>
          <li>To find a dealer near you for your pickup, and to help if anything goes wrong.</li>
          <li>To check that dealers are who they say they are.</li>
          <li>To handle complaints and keep records the law asks us to keep.</li>
        </ul>
        <p className="mt-3">We do not sell your data, and we do not use it for advertising.</p>
      </section>

      <section>
        <h2>Who can see it</h2>
        <ul>
          <li>Dealers who cover your pincode see that a pickup is waiting, without your phone number or address. Only the dealer who accepts your pickup sees your name, phone number and address, and only for that pickup.</li>
          <li>A small Abondhu admin team, to run the service.</li>
          <li>Services that run the site for us: Supabase (database and login, servers in Mumbai, India), Hostinger (website hosting and email) and Google (only if you choose Google login).</li>
          <li>Government authorities, only when the law requires it.</li>
        </ul>
      </section>

      <section>
        <h2>How we keep it safe</h2>
        <ul>
          <li>Each person can only see their own account and pickups, apart from what dealers and admins need, as set out above. Photos and documents are kept in private storage.</li>
          <li>A dealer&apos;s Aadhaar number is stored encrypted, and their Aadhaar card photos are kept in private storage. Only admins can open them, and every view of the number is logged.</li>
          <li>Connections to the site are encrypted (HTTPS).</li>
        </ul>
      </section>

      <section>
        <h2>How long we keep it</h2>
        <p>
          We keep your account while you use Abondhu. Pickup records are kept as long as tax and accounting rules require.
          Ask us and we will delete your account and the data we are not required to keep.
        </p>
      </section>

      <section>
        <h2>Your choices</h2>
        <p>You can ask to see, correct or delete your data at any time by emailing <EmailLink />. We reply within 30 days.</p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          {COMPANY}, Jorhat, Assam, India. Email <EmailLink />. If we change this policy, we will update the date at the top
          of this page.
        </p>
      </section>
    </LegalPage>
  );
}
