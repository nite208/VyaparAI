import type { UploadedFile } from "./store";
import type { AnalysisBlock } from "./groq";

export type DemoKind = "coaching" | "restaurant" | "default";

export function detectDemoKind(file?: UploadedFile | null): DemoKind {
  if (!file) return "default";
  if (/coach|fees|student|sharma/i.test(file.name)) return "coaching";
  if (/spice|restaurant|sales|biryani|paneer/i.test(file.name)) return "restaurant";
  return "default";
}

export const SUGGESTED_QUESTIONS: Record<DemoKind, string[]> = {
  coaching: [
    "Who hasn't paid fees yet?",
    "Which class brings the most revenue?",
    "Show monthly collection trend",
    "Where am I losing money?",
  ],
  restaurant: [
    "What's my best-selling item?",
    "Compare weekend vs weekday revenue",
    "Show revenue by category",
    "Which day brings the most sales?",
  ],
  default: [
    "Summarize this data",
    "What stands out?",
    "Show a trend chart",
    "Give me 3 recommendations",
  ],
};

const COACHING_ANSWERS: Array<{ match: RegExp; reply: string }> = [
  {
    match: /paid|pending|due|collect/i,
    reply: `**5 students still owe fees — ₹13,500 outstanding.**

- Anjali Singh — Class 11 Commerce — ₹4,000 (Jan)
- Pooja Joshi — Class 11 Arts — ₹3,500 (Feb)
- Rishi Bhatt — Class 10 Arts — ₹3,500 (Apr)
- Dev Shah — Class 9 Commerce — ₹3,000 (May)
- Plus partial payments from Rohit, Divya, Harsh totalling ₹4,250

**Action:** Send a WhatsApp reminder today to the Class 11 group — they account for ₹7,500 of the gap.

\`\`\`chartdata
{"type":"bar","title":"Outstanding fees by class","data":[{"name":"Class 9","value":3000},{"name":"Class 10","value":5250},{"name":"Class 11","value":7500},{"name":"Class 12","value":2250}]}
\`\`\``,
  },
  {
    match: /class|revenue|earn|most/i,
    reply: `**Class 12 is your top earner — ₹26,750 collected (38% of total).**

- Class 12: ₹26,750 — highest per-student average (₹4,458)
- Class 11: ₹16,000 — but ₹7,500 still pending
- Class 10: ₹15,750 — most consistent collection
- Class 9: ₹13,500 — lowest pricing, room to raise

**Action:** Class 12 Science is your money-maker — consider adding a weekend batch.

\`\`\`chartdata
{"type":"bar","title":"Collected fees by class (₹)","data":[{"name":"Class 9","value":13500},{"name":"Class 10","value":15750},{"name":"Class 11","value":16000},{"name":"Class 12","value":26750}]}
\`\`\``,
  },
  {
    match: /month|trend|over time/i,
    reply: `**Collection has slipped through April-May — down 22% from peak.**

- January: ₹9,500 — solid start (75% paid)
- February: ₹11,000 — peak month
- March: ₹13,250 — peak
- April: ₹12,000 — first dip
- May: ₹10,250 — keep slipping if unchecked

**Action:** Tighten reminder cadence in the first week of every month — March numbers prove it works.

\`\`\`chartdata
{"type":"line","title":"Monthly fee collection (₹)","data":[{"name":"Jan","value":9500},{"name":"Feb","value":11000},{"name":"Mar","value":13250},{"name":"Apr","value":12000},{"name":"May","value":10250}]}
\`\`\``,
  },
];

const RESTAURANT_ANSWERS: Array<{ match: RegExp; reply: string }> = [
  {
    match: /best|top|popular|item|seller/i,
    reply: `**Biryani is your hero — ₹35,350 across 3 days (24% of total revenue).**

- Biryani — ₹35,350 (101 plates)
- Butter Chicken — ₹32,000 (100 plates)
- Dal Makhani — ₹6,820 (31 plates)
- Paneer Butter Masala — ₹6,600 (22 plates)

**Action:** Push Biryani harder on Fri/Sat — those two days alone drove ₹28,700 of its revenue.

\`\`\`chartdata
{"type":"bar","title":"Top items by revenue (₹)","data":[{"name":"Biryani","value":35350},{"name":"Butter Chicken","value":32000},{"name":"Dal Makhani","value":6820},{"name":"Paneer Butter Masala","value":6600},{"name":"Chole Bhature","value":5220},{"name":"Dal Tadka","value":5200}]}
\`\`\``,
  },
  {
    match: /weekend|weekday|day.*week|fri|sat|sun/i,
    reply: `**Weekends print money — ₹47,560 vs ₹39,290 on weekdays (+21%).**

- Fri-Sun avg/day: ₹15,853
- Mon-Thu avg/day: ₹9,823
- Friday is the single biggest day — ₹15,460 avg

**Action:** Add a 30-min Friday/Saturday Biryani happy hour at 7pm to lock in repeat orders.

\`\`\`chartdata
{"type":"bar","title":"Revenue by day of week (₹)","data":[{"name":"Mon","value":8120},{"name":"Tue","value":8090},{"name":"Wed","value":28840},{"name":"Thu","value":17220},{"name":"Fri","value":30910},{"name":"Sat","value":17080},{"name":"Sun","value":7300}]}
\`\`\``,
  },
  {
    match: /category|breakdown|type/i,
    reply: `**Main Courses dominate at 73% of revenue — but Beverages are dangerously low.**

- Main Course — ₹91,190 (73%)
- Starter — ₹5,040 (4%)
- Bread — ₹6,680 (5%)
- Beverages — ₹9,840 (8%) — attach rate only 22% vs typical 45%
- Dessert — ₹5,860 (5%)
- Side — ₹1,440 (1%)

**Action:** Train waiters to suggest a Lassi or Masala Chai with every Main — even +10pp attach adds ~₹14,000/month.

\`\`\`chartdata
{"type":"pie","title":"Revenue by category","data":[{"name":"Main Course","value":91190},{"name":"Beverages","value":9840},{"name":"Bread","value":6680},{"name":"Dessert","value":5860},{"name":"Starter","value":5040},{"name":"Side","value":1440}]}
\`\`\``,
  },
];

const DEFAULT_ANSWER = `I've got the basics from your file. Once you add a Groq API key in **Settings**, I can dig in with full numeric analysis. In the meantime, try a demo dataset from the dashboard to see how the chat works end-to-end.`;

export function demoAnswer(kind: DemoKind, question: string): string {
  const bank = kind === "coaching" ? COACHING_ANSWERS : kind === "restaurant" ? RESTAURANT_ANSWERS : [];
  for (const a of bank) if (a.match.test(question)) return a.reply;
  if (bank.length) return bank[0].reply;
  return DEFAULT_ANSWER;
}

export function demoAnalysis(kind: DemoKind, file: UploadedFile): AnalysisBlock {
  if (kind === "coaching") {
    return {
      summary:
        "Sharma Coaching is collecting steadily but has ₹13,500 outstanding across 5 students, mostly in Class 11. May collection has slipped to 70% — fix this with one round of reminders.",
      insights: [
        "Class 12 brings 38% of revenue at ₹26,750 — your single biggest segment.",
        "5 students owe ₹13,500; 60% of that gap is Class 11 Commerce + Arts.",
        "Collection peaked in March at ₹13,250 and has fallen 22% by May.",
        "Class 9 has the lowest fee ceiling — pricing is leaving money on the table.",
      ],
      metrics: [
        { label: "Total Collected", value: "₹56,000" },
        { label: "Outstanding", value: "₹13,500" },
        { label: "Collection Rate", value: "81%" },
        { label: "Top Class", value: "Class 12 (38%)" },
      ],
      recommendations: [
        "Send WhatsApp reminders to the 5 pending parents this week — targets ₹13,500.",
        "Raise Class 9 fees by 10% next term — minimal churn risk, +₹6,000/yr.",
        "Add a weekend Class 12 Science batch — highest per-student revenue.",
      ],
    };
  }
  if (kind === "restaurant") {
    return {
      summary:
        "Spice Garden is a Main-Course-heavy restaurant with strong weekend skew. Biryani and Butter Chicken drive ~54% of revenue. Beverage attach rate is far below industry norm — fix this first.",
      insights: [
        "Biryani is the top earner at ₹35,350 — 24% of total revenue.",
        "Weekend revenue is 21% higher per day than weekdays.",
        "Beverages attach at only 22% (typical mid-tier is 45%) — biggest leak.",
        "Friday alone averages ₹15,460/day — highest single day.",
        "Main Courses are 73% of revenue — concentration risk if a chef leaves.",
      ],
      metrics: [
        { label: "Total Revenue", value: "₹86,850" },
        { label: "Top Day", value: "Friday" },
        { label: "Hero Item", value: "Biryani" },
        { label: "Beverage Attach", value: "22%" },
      ],
      recommendations: [
        "Train staff to suggest a Lassi/Chai with every Main — +10pp attach ≈ +₹14,000/mo.",
        "Run a Friday 7pm Biryani happy hour — protect your strongest day.",
        "Document the Butter Chicken & Biryani recipes — concentration risk mitigation.",
      ],
    };
  }
  return {
    summary: `${file.name} loaded with ${file.rowCount ?? 0} rows.`,
    insights: ["Add a Groq API key in Settings for full AI analysis."],
    metrics: [
      { label: "Rows", value: String(file.rowCount ?? 0) },
      { label: "Columns", value: String(file.columnNames?.length ?? 0) },
      { label: "Source", value: file.source ?? "upload" },
      { label: "Status", value: "Loaded" },
    ],
    recommendations: ["Open Settings and paste your Groq key to unlock analysis."],
  };
}
