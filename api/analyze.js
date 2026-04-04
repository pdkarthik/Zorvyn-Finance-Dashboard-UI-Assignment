import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  // CORS configuration for local testing
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { transactions, balance, income, expense } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Missing GEMINI_API_KEY in environment variables.' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Take the most recent transactions to avoid huge payload limits
    const recentTransactions = transactions.slice(0, 15).map(t => 
      `${t.date}: ${t.type.toUpperCase()} - $${t.amount} (${t.category}) | ${t.description}`
    ).join('\n');

    const prompt = `
You are an elite, highly analytical personal wealth manager. 
Analyze the user's financial summary and their list of recent transactions below.
Your objective is to provide exactly ONE highly sophisticated paragraph of financial advice (maximum 5 sentences) without any generic intro pleasantries or markdown formatting.

Follow these strict logical rules for your analysis:
1. First, evaluate their cash flow (Income vs Expense). 
2. OVERCOME (If negative deficit): Explicitly instruct them on how to overcome this deficit by identifying their heaviest transaction category and mandating a strict spending freeze or zero-based budget.
3. IMPROVE (If positive surplus): Praise their optimized liquidity, but still identify their biggest expense as an area for micro-budgeting. Instruct them on how to aggressively snowball their surplus (e.g., sweeping funds into index funds, ETFs, or tax-advantaged accounts).
4. Tone: Use professional financial terminology (e.g., "liquidity," "yield," "disproportionate capital drain," "portfolio growth").

SUMMARY:
Total Balance: $${balance}
Total Income: $${income}
Total Expense: $${expense}

RECENT TRANSACTIONS:
${recentTransactions}
`;

    try {
      const result = await model.generateContent(prompt);
      let responseText = result.response.text();
      
      // Clean up any weird markdown bolding
      responseText = responseText.replace(/\*\*/g, '').trim();

      return res.status(200).json({ advice: responseText });
    } catch (apiError) {
      console.warn('API Error, using fallback calculation.');
      
      // Fallback calculation in case of quota limits
      const savingsRate = income > 0 ? ((income - expense) / income * 100).toFixed(1) : 0;
      let highestCategory = { name: 'N/A', amount: 0 };
      const categoryTotals = {};
      
      transactions.forEach(t => {
        if (t.type === 'expense') {
          categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        }
      });
      
      for (const [name, amount] of Object.entries(categoryTotals)) {
         if (amount > highestCategory.amount) highestCategory = { name, amount };
      }

      // Phrase Banks for analysis variance
      const goodMargin = [
        "You are maintaining a very healthy margin, comfortably clearing the standard 20% financial safety baseline. ",
        "Your cash flow is stable and secure, keeping you well above the danger zone. ",
        "You have a solid grip on your finances with a highly sustainable savings cushion. "
      ];

      const enders = [
        "To push your portfolio to the next level, try to incrementally increase your savings rate by just 1% each month to slowly build towards financial independence. ",
        "Keep optimizing your discretionary spending, and your portfolio's liquidity will only continue to strengthen. ",
        "Stay disciplined with your allocations and you will see compounded growth by the end of the quarter. "
      ];

      const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

      let fallbackAdvice = `Your current savings rate stands at ${savingsRate}%. `;
      
      if (savingsRate <= 0) {
        fallbackAdvice += `WARNING: You are currently operating at a critical net-negative cash flow deficit. To overcome this immediately, you must initiate a strict spending freeze on non-essential lifestyle purchases. I highly recommend utilizing a zero-based budget to ruthlessly cut discretionary spending until your incoming cash flow fully covers all baseline operations without relying on credit. `;
      } else if (savingsRate < 20) {
        fallbackAdvice += `This is below the universally recommended 20% threshold, indicating that a disproportionate amount of your capital is tied up in outgoing expenses rather than wealth accumulation. To improve this, actively audit your recurring subscriptions this week and allocate at least 10% of next month's income automatically into a hidden savings account before you see it. `;
      } else if (savingsRate >= 50) {
        fallbackAdvice += `This is an exceptionally strong margin, putting you in an elite tier of savers! Your liquidity is remarkably optimized. To snowball this success, you must ensure your massive surplus capital is not sitting idle; automatically sweep these excess funds into high-yield index funds, ETFs, or tax-advantaged accounts to aggressively multiply your wealth and combat inflation. `;
      } else {
        fallbackAdvice += pick(goodMargin);
        fallbackAdvice += pick(enders);
      }

      if (highestCategory.amount > 0) {
        const drains = [
          `Looking granularly at your ledger, your absolute heaviest capital drain right now is the '${highestCategory.name}' category, commanding a massive $${highestCategory.amount} of your outgoing cash flow. `,
          `A quick audit reveals your largest financial leak is '${highestCategory.name}', draining $${highestCategory.amount} from your accounts. `
        ];
        fallbackAdvice += pick(drains);
        fallbackAdvice += `If you want to rapidly accelerate your portfolio's growth curve in the next 30 days, I strongly advise implementing strict micro-budgets specifically targeting your ${highestCategory.name} expenditures.`;
      }

      // Return fallback response
      return res.status(200).json({ advice: fallbackAdvice });
    }
  } catch (error) {
    console.error('Critical Error:', error);
    return res.status(500).json({ error: 'Failed to complete analysis request.' });
  }
}
