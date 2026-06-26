import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Shield, Globe, ChevronRight, Menu, Search, Lock, CreditCard,
  Wallet, Smartphone, Building2, TrendingUp, Users, BadgeCheck,
  ArrowRight, Phone, Mail, MapPin, Facebook, Twitter, Instagram, Youtube,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Reguflow Bank — Trusted Banking & Compliance" },
      { name: "description", content: "Reguflow Bank: secure digital banking, intelligent compliance, and regulatory automation for the modern enterprise." },
      { property: "og:title", content: "Reguflow Bank" },
      { property: "og:description", content: "Secure digital banking with intelligent compliance automation." },
    ],
  }),
  component: Index,
});

function Index() {
  const [langOpen, setLangOpen] = useState(false);
  const [lang, setLang] = useState<"en" | "hi">("en");

  useEffect(() => {
    const seen = typeof window !== "undefined" && localStorage.getItem("rf_lang");
    if (!seen) setLangOpen(true);
    else setLang(seen as "en" | "hi");
  }, []);

  const pickLang = (l: "en" | "hi") => {
    setLang(l);
    localStorage.setItem("rf_lang", l);
    setLangOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <LanguagePopup open={langOpen} onPick={pickLang} />
      <TopBar />
      <Navbar lang={lang} />
      <Hero />
      <QuickServices />
      <InstantLoans />
      <DigitalBanking />
      <ExclusiveOffers />
      <CyberSecurity />
      <Footer />
    </div>
  );
}

/* ---------------- Language Popup ---------------- */
function LanguagePopup({ open, onPick }: { open: boolean; onPick: (l: "en" | "hi") => void }) {
  return (
    <Dialog open={open}>
      <DialogContent className="max-w-lg border-0 p-0 overflow-hidden [&>button]:hidden">
        <div className="bg-hero p-8 text-primary-foreground text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gold text-primary-deep font-bold text-2xl mb-3 shadow-[var(--shadow-glow)]">
            ₹
          </div>
          <h2 className="text-2xl font-bold">रेग्यूफ़्लो बैंक</h2>
          <h3 className="text-xl font-semibold opacity-90">Reguflow Bank</h3>
          <p className="mt-3 text-sm opacity-80">रेग्यूफ़्लो बैंक मे‚ आपका स्वागत है</p>
          <p className="text-sm opacity-80">Welcome to Reguflow Bank</p>
        </div>
        <div className="p-8 text-center">
          <p className="text-sm font-medium text-foreground">Select your Preferred Language</p>
          <p className="text-sm text-muted-foreground mb-6">अपनी पसंदीदा भाषा का चयन करें</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => onPick("hi")}
              className="flex-1 max-w-[160px] rounded-lg border-2 border-primary bg-background px-6 py-3 font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
            >
              हिंदी
            </button>
            <button
              onClick={() => onPick("en")}
              className="flex-1 max-w-[160px] rounded-lg border-2 border-primary bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:bg-primary-deep"
            >
              English
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Top utility bar ---------------- */
function TopBar() {
  return (
    <div className="bg-primary-deep text-primary-foreground text-xs">
      <div className="container mx-auto flex items-center justify-between px-4 py-2">
        <div className="hidden md:flex items-center gap-4 opacity-90">
          <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> 1800-123-4567</span>
          <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> care@reguflow.in</span>
        </div>
        <div className="flex items-center gap-4">
          <a className="hover:text-gold cursor-pointer">Investor Relations</a>
          <a className="hover:text-gold cursor-pointer">Careers</a>
          <a className="hover:text-gold cursor-pointer">NRI Banking</a>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Navbar ---------------- */
function Navbar({ lang }: { lang: "en" | "hi" }) {
  const items = [
    { en: "Personal", hi: "व्यक्तिगत" },
    { en: "Business", hi: "व्यवसाय" },
    { en: "Loans", hi: "ऋण" },
    { en: "Cards", hi: "कार्ड" },
    { en: "Investments", hi: "निवेश" },
    { en: "About Us", hi: "हमारे बारे में" },
  ];
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b shadow-sm">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-hero text-primary-foreground font-bold shadow-[var(--shadow-card)]">
            R
          </div>
          <div className="leading-tight">
            <p className="font-bold text-primary-deep tracking-tight">Reguflow Bank</p>
            <p className="text-[10px] text-muted-foreground">रेग्यूफ़्लो बैंक · Together we can</p>
          </div>
        </div>
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
          {items.map((it) => (
            <a key={it.en} className="text-foreground/80 hover:text-primary cursor-pointer">
              {lang === "hi" ? it.hi : it.en}
            </a>
          ))}
          <Link
            to="/admin"
            className="inline-flex items-center gap-1 rounded-full bg-gold-grad px-4 py-1.5 text-primary-deep font-semibold shadow-sm hover:shadow-md transition"
          >
            <Shield className="h-3.5 w-3.5" /> Admin Panel
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <button className="rounded-full border px-3 py-1.5 text-xs font-medium flex items-center gap-1">
            <Globe className="h-3 w-3" /> {lang === "hi" ? "हिंदी" : "EN"}
          </button>
          <Button className="hidden sm:inline-flex bg-primary text-primary-foreground hover:bg-primary-deep">Login</Button>
          <button className="lg:hidden p-2"><Menu className="h-5 w-5" /></button>
        </div>
      </div>
    </header>
  );
}

/* ---------------- Hero ---------------- */
function Hero() {
  return (
    <section className="relative overflow-hidden bg-hero text-primary-foreground">
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: "radial-gradient(circle at 20% 50%, oklch(0.6 0.18 245 / 0.6) 0%, transparent 50%), radial-gradient(circle at 80% 80%, oklch(0.86 0.18 90 / 0.4) 0%, transparent 50%)",
      }} />
      <div className="container mx-auto grid lg:grid-cols-2 gap-10 items-center px-4 py-20 relative">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur border border-white/20 px-3 py-1 text-xs">
            <BadgeCheck className="h-3.5 w-3.5 text-gold" /> RBI Licensed · Compliant by Design
          </div>
          <h1 className="mt-5 text-4xl md:text-6xl font-bold leading-tight tracking-tight">
            Don't miss this opportunity to <span className="text-gold">grow your global savings.</span>
          </h1>
          <p className="mt-4 text-base md:text-lg opacity-85 max-w-xl">
            Special FCNR (B) Deposit Scheme. Earn up to <span className="text-gold font-bold">6.50%</span> p.a.* for USD with the trust of Reguflow.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button size="lg" className="bg-gold-grad text-primary-deep font-semibold hover:opacity-90">
              Open an Account <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white/40 text-primary-foreground hover:bg-white/10">
              Explore Schemes
            </Button>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-6 max-w-md">
            {[
              { k: "₹4.2L Cr", v: "Total Business" },
              { k: "10K+", v: "Branches" },
              { k: "120M+", v: "Customers" },
            ].map((s) => (
              <div key={s.v}>
                <p className="text-2xl font-bold text-gold">{s.k}</p>
                <p className="text-xs opacity-75">{s.v}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative hidden lg:block">
          <div className="relative aspect-square max-w-md ml-auto">
            <div className="absolute inset-8 rounded-full bg-white/5 backdrop-blur border border-white/20" />
            <div className="absolute inset-16 rounded-full bg-gold/10 border border-gold/30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                {[
                  { i: <Wallet className="h-6 w-6" />, t: "Savings" },
                  { i: <CreditCard className="h-6 w-6" />, t: "Cards" },
                  { i: <Building2 className="h-6 w-6" />, t: "Loans" },
                  { i: <TrendingUp className="h-6 w-6" />, t: "Invest" },
                ].map((c) => (
                  <div key={c.t} className="rounded-xl bg-white/10 backdrop-blur border border-white/20 p-4 hover:bg-white/15 transition">
                    <div className="text-gold">{c.i}</div>
                    <p className="mt-2 text-sm font-semibold">{c.t}</p>
                    <p className="text-[10px] opacity-70">Manage instantly</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Quick services strip ---------------- */
function QuickServices() {
  const items = [
    "Account Activation", "Pre-Approved Credit Card", "Priority Portal", "E-Auction",
    "Loan Application Tracker", "Lodge a Complaint", "RBI Kehta Hai", "Forex Rates",
  ];
  return (
    <section className="border-b bg-secondary/40">
      <div className="container mx-auto flex gap-2 overflow-x-auto px-4 py-3 text-xs">
        {items.map((i) => (
          <a key={i} className="whitespace-nowrap rounded-full border border-primary/20 bg-background px-3 py-1.5 font-medium text-primary hover:bg-primary hover:text-primary-foreground transition cursor-pointer">
            {i}
          </a>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Instant Loans ---------------- */
function InstantLoans() {
  const loans = [
    { name: "Canara Vehicle Loan", rate: "8.25%", icon: <Wallet className="h-7 w-7" /> },
    { name: "Canara e-GST", rate: "9.65%", icon: <Building2 className="h-7 w-7" /> },
    { name: "Canara Home Loan", rate: "8.10%", icon: <Building2 className="h-7 w-7" /> },
    { name: "Personal Loan", rate: "10.95%", icon: <Users className="h-7 w-7" /> },
  ];
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-sm font-semibold text-primary-glow uppercase tracking-wider">Instant Loan Approvals</p>
          <h2 className="text-3xl md:text-4xl font-bold text-primary-deep">Borrow with confidence</h2>
        </div>
        <a className="hidden sm:inline-flex items-center gap-1 rounded-full bg-gold-grad px-4 py-2 text-sm font-semibold text-primary-deep cursor-pointer">
          Know more <ChevronRight className="h-4 w-4" />
        </a>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {loans.map((l) => (
          <div key={l.name} className="group rounded-2xl border bg-card p-6 shadow-sm hover:shadow-[var(--shadow-card)] hover:-translate-y-1 transition">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-hero text-primary-foreground">
              {l.icon}
            </div>
            <h3 className="mt-5 font-semibold text-foreground">{l.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">Starting at</p>
            <p className="text-2xl font-bold text-primary-deep">{l.rate}<span className="text-sm font-normal text-muted-foreground"> p.a.</span></p>
            <button className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:text-primary-glow">
              Apply Now <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Digital Banking ---------------- */
function DigitalBanking() {
  const items = [
    { i: <Smartphone className="h-5 w-5" />, t: "Mobile Banking" },
    { i: <Globe className="h-5 w-5" />, t: "Net Banking" },
    { i: <CreditCard className="h-5 w-5" />, t: "Card Services" },
    { i: <Wallet className="h-5 w-5" />, t: "Credit Card Bill Payment" },
  ];
  return (
    <section className="bg-secondary/40 py-16">
      <div className="container mx-auto grid lg:grid-cols-2 gap-10 items-center px-4">
        <div className="relative">
          <div className="aspect-[4/3] rounded-3xl bg-hero p-8 shadow-[var(--shadow-card)] relative overflow-hidden">
            <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-gold/30 blur-3xl" />
            <div className="relative h-full flex flex-col justify-between">
              <div>
                <p className="text-primary-foreground/70 text-sm">Banking, simplified.</p>
                <p className="text-primary-foreground text-3xl font-bold mt-2">One app.<br />All your money.</p>
              </div>
              <div className="flex gap-3">
                <div className="rounded-xl bg-white/10 backdrop-blur border border-white/20 px-4 py-2 text-primary-foreground text-xs">
                  <p className="opacity-70">Download</p>
                  <p className="font-bold">Reguflow ai1</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-primary-glow uppercase tracking-wider">Digital Banking</p>
          <h2 className="text-3xl md:text-4xl font-bold text-primary-deep">Everything you need, anytime.</h2>
          <p className="mt-3 text-muted-foreground">Bank in seconds with our seamless digital ecosystem—built on bank-grade encryption and continuously audited for compliance.</p>
          <div className="mt-6 grid sm:grid-cols-2 gap-3">
            {items.map((it) => (
              <button key={it.t} className="flex items-center gap-3 rounded-xl border bg-card p-4 text-left hover:border-primary hover:shadow-md transition">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">{it.i}</span>
                <span className="font-medium">{it.t}</span>
                <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Exclusive offers ---------------- */
function ExclusiveOffers() {
  const offers = ["ai1 Mobile App Offers", "Debit Card Offers", "Credit Card Offers", "UPI App Offers"];
  return (
    <section className="container mx-auto px-4 py-16">
      <h2 className="text-3xl md:text-4xl font-bold text-primary-deep border-b-4 border-gold inline-block pb-1">EXCLUSIVE OFFERS</h2>
      <div className="mt-8 grid lg:grid-cols-2 gap-8 items-center">
        <div className="grid gap-3">
          {offers.map((o) => (
            <button key={o} className="group flex items-center justify-between rounded-full bg-card border-2 border-primary px-6 py-3 font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition">
              <span>{o}</span>
              <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </button>
          ))}
        </div>
        <div className="relative aspect-square rounded-3xl bg-gold-grad p-10 overflow-hidden">
          <div className="absolute top-6 right-6 rounded-full bg-primary text-primary-foreground text-xs px-3 py-1 font-bold rotate-12">You're the Best!</div>
          <div className="h-full flex flex-col justify-end">
            <p className="text-primary-deep/80 text-sm">For our valued</p>
            <p className="text-primary-deep text-4xl font-bold">Customers</p>
            <p className="mt-2 text-primary-deep/80 text-sm max-w-xs">Curated rewards on shopping, travel and dining—just for being a Reguflow member.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Cyber security ---------------- */
function CyberSecurity() {
  return (
    <section className="bg-hero text-primary-foreground py-16">
      <div className="container mx-auto grid md:grid-cols-2 gap-8 items-center px-4">
        <div>
          <Lock className="h-10 w-10 text-gold" />
          <h2 className="mt-4 text-3xl md:text-4xl font-bold">Cyber Security Awareness</h2>
          <p className="mt-3 opacity-85 max-w-lg">Stay alert. Stay secure. Learn how Reguflow protects your money with real-time fraud detection, multi-factor authentication and 24×7 SOC monitoring.</p>
          <Button className="mt-5 bg-gold-grad text-primary-deep font-semibold">Know More</Button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { t: "256-bit Encryption", d: "End-to-end transit security" },
            { t: "AI Fraud Shield", d: "ML-driven anomaly engine" },
            { t: "RBI Compliant", d: "Audited every quarter" },
            { t: "24×7 SOC", d: "Always-on threat watch" },
          ].map((c) => (
            <div key={c.t} className="rounded-xl bg-white/10 backdrop-blur border border-white/20 p-5">
              <p className="font-semibold">{c.t}</p>
              <p className="text-xs opacity-75 mt-1">{c.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Footer ---------------- */
function Footer() {
  const cols = [
    { h: "Quick Access", l: ["Account", "Cards", "Loans", "Deposits", "NRI Banking"] },
    { h: "Customer Services", l: ["Branch Locator", "Forms Centre", "Interest Rates", "Service Charges", "Lodge Complaint"] },
    { h: "Compliance", l: ["RBI Sachet", "BCSBI", "Banking Ombudsman", "Citizens Charter", "Disclosures"] },
    { h: "Online Services", l: ["Net Banking", "Mobile Banking", "UPI", "BHIM ai1", "Card Services"] },
  ];
  return (
    <footer className="bg-primary-deep text-primary-foreground/85">
      <div className="container mx-auto grid md:grid-cols-4 gap-8 px-4 py-14">
        {cols.map((c) => (
          <div key={c.h}>
            <p className="font-bold text-gold mb-3 text-sm tracking-wide">{c.h.toUpperCase()}</p>
            <ul className="space-y-2 text-sm">
              {c.l.map((x) => <li key={x} className="hover:text-gold cursor-pointer">{x}</li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between px-4 py-5 text-xs gap-4">
          <p className="opacity-70">© {new Date().getFullYear()} Reguflow Bank. All rights reserved. RBI Licensed Scheduled Commercial Bank.</p>
          <div className="flex items-center gap-3">
            {[Facebook, Twitter, Instagram, Youtube].map((I, i) => (
              <a key={i} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-gold hover:text-primary-deep transition cursor-pointer"><I className="h-4 w-4" /></a>
            ))}
          </div>
          <p className="opacity-70 flex items-center gap-1"><MapPin className="h-3 w-3" /> HQ: Bengaluru, India</p>
        </div>
      </div>
    </footer>
  );
}
