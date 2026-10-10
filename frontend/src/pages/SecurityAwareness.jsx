import React, { useState } from 'react';
import { 
  GraduationCap, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle, 
  Lock, 
  AlertTriangle, 
  Smartphone, 
  Mail, 
  Globe, 
  QrCode, 
  FileText, 
  Info,
  ChevronRight
} from 'lucide-react';

const AWARENESS_TOPICS = [
  {
    id: 'email',
    title: 'How to Recognize Phishing Emails',
    icon: Mail,
    summary: 'Phishing emails rely on psychological urgency, authority impersonation, and spoofed senders.',
    points: [
      'Artificial Panic: Threats of account suspension within 12–24 hours compel hasty action before rational evaluation.',
      'Header Discrepancies: Check the actual sender email address domain (@...), not just the friendly display name.',
      'Generic Greetings: "Dear Customer" or "Valued Member" rather than your real registered name.',
      'Dangerous Attachment Combinations: Be wary of .zip, .iso, .html, or double extension files (e.g. invoice.pdf.exe).'
    ]
  },
  {
    id: 'sms',
    title: 'How SMS Smishing Scams Operate',
    icon: Smartphone,
    summary: 'Smishing attacks exploit SMS trust to harvest payment cards or intercept 2FA passcodes.',
    points: [
      'Postal Redelivery Traps: Fake notifications from USPS, FedEx, or DHL demanding a $1.99 redelivery fee.',
      '2FA Interception: Fraudsters call or text claiming fraudulent charges, prompting you to send an SMS OTP code.',
      'Obfuscated Links: Text messages almost universally use URL shorteners to prevent destination domain inspection.',
      'Carrier Reporting: Forward scam text messages immediately to 7726 (SPAM) to help telecom providers block sender routes.'
    ]
  },
  {
    id: 'url',
    title: 'How to Inspect URLs Before Clicking',
    icon: Globe,
    summary: 'Deconstruct link anatomy: authority, subdomains, paths, and character homoglyphs.',
    points: [
      'Find the Root Domain: In "paypal.com.verification-center.net", the actual server is "verification-center.net", NOT PayPal.',
      'Userinfo "@" Trick: In "http://google.com@attacker.com", browsers ignore everything before "@" and visit attacker.com.',
      'Punycode Attacks: Cyrillic lookalike letters ("а" vs "a") appear identical to humans but encode to "xn--" in real DNS.',
      'Raw IP Addresses: Legitimate financial and tech organizations never host customer login portals on raw numerical IP addresses.'
    ]
  },
  {
    id: 'https',
    title: 'Why HTTPS Does NOT Guarantee Safety',
    icon: Lock,
    summary: 'HTTPS means traffic in transit is encrypted, not that the website owner is benevolent or authentic.',
    points: [
      'Free TLS Certificates: Threat actors routinely obtain legitimate Let\'s Encrypt or Cloudflare SSL certs for phishing kits.',
      'Over 90% of Phishing Sites Use HTTPS: The padlock icon only proves your password is being encrypted on its way to the attacker.',
      'Always Verify Identity: Encryption is meaningless if the destination receiving your data is an imposter.'
    ]
  },
  {
    id: 'otp',
    title: 'The Golden Rule: Never Share OTPs or Passwords',
    icon: AlertTriangle,
    summary: 'One-Time Passcodes are the final perimeter protecting your multi-factor authenticated accounts.',
    points: [
      'Legitimate Staff Never Ask: Bank employees, tech support, and government officials have no internal need for your OTP.',
      'Read the OTP SMS Carefully: The SMS usually explicitly says: "Do NOT share this code with anyone, including staff."',
      'Man-in-the-Middle Relays: Reverse proxies relay OTPs within seconds to complete unauthorized logins in real-time.'
    ]
  },
  {
    id: 'qr',
    title: 'Quishing: How QR Codes Conceal Malicious Links',
    icon: QrCode,
    summary: 'QR codes obscure the destination URL, preventing visual hover inspection on mobile devices.',
    points: [
      'Physical Sticker Tampering: Criminals paste fraudulent QR code stickers over authentic parking meter or restaurant codes.',
      'Email QR Bypasses: Phishers put QR codes in emails to bypass corporate text filters that scan plain link text.',
      'Inspect Before Confirming: Modern phone cameras show the decoded URL preview before opening—scrutinize the domain first.'
    ]
  },
  {
    id: 'incident',
    title: 'What to Do After Clicking a Suspicious Link',
    icon: ShieldAlert,
    summary: 'Immediate containment steps if you clicked a suspicious link or entered credentials.',
    points: [
      'Change Passwords Immediately: If you entered a password, change it from a separate known-secure device.',
      'Terminate Active Sessions: Log into the real account and select "Sign out of all other sessions / devices".',
      'Notify Your Bank / IT: If card details or corporate credentials were submitted, inform security teams immediately.',
      'Scan Your Device: Run an updated anti-malware scan if any file was downloaded or executed.'
    ]
  },
  {
    id: 'reporting',
    title: 'How to Report Suspected Cyber Attacks',
    icon: FileText,
    summary: 'Reporting feeds global threat intelligence feeds that protect millions of other users.',
    points: [
      'CISA (US-CERT): Report phishing and ransomware attacks to the Cybersecurity and Infrastructure Security Agency.',
      'APWG (Anti-Phishing Working Group): Forward phishing emails to reportphishing@apwg.org.',
      'Google Safe Browsing: Submit malicious URLs to safebrowsing.google.com/safebrowsing/report_phish.',
      'FTC Report Fraud: Report financial scams and identity theft to reportfraud.ftc.gov.'
    ]
  }
];

const QUIZ_QUESTIONS = [
  {
    question: 'A website URL starts with "https://" and displays a green padlock. Does this prove the website is legitimate and safe?',
    options: [
      'Yes, the padlock proves the company identity was verified by your web browser.',
      'No, HTTPS only encrypts communication; over 90% of modern phishing sites also use HTTPS certificates.',
      'Yes, only certified banks and registered corporations can obtain HTTPS encryption.'
    ],
    answer: 1,
    explanation: 'Correct! HTTPS only encrypts the connection between your browser and the server. Attackers obtain free automated SSL certificates for phishing sites every day.'
  },
  {
    question: 'You receive an urgent text: "Your bank card is suspended. Reply with your 6-digit SMS OTP to unlock." What should you do?',
    options: [
      'Reply with the OTP immediately so you don\'t lose access to your funds.',
      'Forward the message to your friends to see if they got it.',
      'Never reply or share the code; call your bank using the phone number printed on the back of your physical card.'
    ],
    answer: 2,
    explanation: 'Correct! Banks never request OTP passcodes via SMS or phone. Fraudsters ask for OTPs to authorize unauthorized transactions or account takeovers.'
  },
  {
    question: 'In the URL "http://paypal.com@verify-account-portal.xyz/login", which domain will your browser actually open?',
    options: [
      'paypal.com',
      'verify-account-portal.xyz',
      'It will split and load both in parallel'
    ],
    answer: 1,
    explanation: 'Correct! Everything before the "@" symbol is interpreted by RFC specifications as user credentials, and the browser navigates to the hostname after "@".'
  }
];

export const SecurityAwareness = () => {
  const [selectedTopic, setSelectedTopic] = useState(AWARENESS_TOPICS[0]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState({});

  const handleSelectOption = (qIdx, optIdx) => {
    setQuizAnswers({ ...quizAnswers, [qIdx]: optIdx });
    setQuizSubmitted({ ...quizSubmitted, [qIdx]: true });
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-white font-['Outfit'] flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-cyan-400" />
          Cybersecurity Threat Awareness & Training
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Essential operational knowledge and defensive principles to recognize, resist, and report sophisticated social engineering campaigns.
        </p>
      </div>

      {/* Main Educational Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Topic Selector List */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Defense Modules (8 Guides)
          </h3>
          {AWARENESS_TOPICS.map((topic) => {
            const Icon = topic.icon;
            const isSelected = selectedTopic.id === topic.id;
            return (
              <button
                key={topic.id}
                onClick={() => setSelectedTopic(topic)}
                className={`w-full text-left p-3 rounded-xl transition flex items-center justify-between ${
                  isSelected
                    ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 font-semibold shadow-sm'
                    : 'bg-slate-900/60 border border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span className="text-xs truncate">{topic.title}</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-600'}`} />
              </button>
            );
          })}
        </div>

        {/* Selected Topic Content Card */}
        <div className="md:col-span-2 cyber-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <selectedTopic.icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-['Outfit']">
                {selectedTopic.title}
              </h3>
              <p className="text-xs text-slate-400">
                {selectedTopic.summary}
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {selectedTopic.points.map((pt, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed">
                  {pt}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Spot-the-Phish Challenge */}
      <div className="cyber-card p-6 rounded-2xl border border-slate-800 space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-2">
            <HelpCircle className="w-3.5 h-3.5" />
            Interactive Hackathon Evaluation
          </div>
          <h3 className="text-lg font-bold text-white font-['Outfit']">
            Spot-the-Phish Mini Quiz
          </h3>
          <p className="text-xs text-slate-400">
            Test your instinct against real-world social engineering scenarios.
          </p>
        </div>

        <div className="space-y-6">
          {QUIZ_QUESTIONS.map((q, qIdx) => {
            const answered = quizSubmitted[qIdx];
            const chosen = quizAnswers[qIdx];
            const isCorrect = chosen === q.answer;

            return (
              <div key={qIdx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <p className="text-xs font-bold text-slate-200">
                  {qIdx + 1}. {q.question}
                </p>

                <div className="space-y-2">
                  {q.options.map((opt, optIdx) => (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(qIdx, optIdx)}
                      className={`w-full text-left p-3 rounded-lg text-xs transition border ${
                        answered && optIdx === q.answer
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-semibold'
                          : answered && chosen === optIdx && !isCorrect
                          ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                          : chosen === optIdx
                          ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {answered && (
                  <div className={`p-3 rounded-lg text-xs leading-relaxed border ${
                    isCorrect ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                  }`}>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Security Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3 text-xs text-slate-400">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-200 block mb-0.5">Application Tool Disclaimer:</strong>
          PhishGuard AI is an automated educational assistance and heuristic analysis platform. It is not an enterprise substitute for verified threat intelligence feeds, security operations centers (SOC), or digital forensics investigations.
        </div>
      </div>
    </div>
  );
};
