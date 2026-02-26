export const CURRENT_YEAR = String(new Date().getFullYear());

export const STATE_META = {
  CA: {
    slug: 'california',
    name: 'California',
    code: 'CA',
    getTitle: (year) => `California Paycheck Tax Calculator ${year} | thetax.us`,
    getDescription: (year) =>
      `Calculate your California take-home pay for ${year}. Includes CA state income tax, SDI, Social Security, and Medicare. Free, no signup required.`,
    getIntro: (year) =>
      `Enter your annual salary to see your California take-home pay for ${year}. The calculator accounts for federal income tax, California state income tax (1%–13.3%), SDI, Social Security, and Medicare.`,
    faqs: [
      {
        question: 'Does California have state income tax?',
        answer:
          `Yes. California has a progressive state income tax with rates ranging from 1% to 13.3% for ${CURRENT_YEAR}, making it one of the highest in the US.`,
      },
      {
        question: `What is the California SDI rate for ${CURRENT_YEAR}?`,
        answer:
          `The California State Disability Insurance (SDI) rate for ${CURRENT_YEAR} is 1.1% on all wages. There is no wage cap, meaning SDI applies to your full gross income.`,
      },
      {
        question: `What is the California standard deduction for ${CURRENT_YEAR}?`,
        answer:
          `The California standard deduction for single filers is $6,000 for ${CURRENT_YEAR}. For married filing jointly, it is $12,000.`,
      },
      {
        question: 'What taxes are taken out of a California paycheck?',
        answer:
          'A California paycheck typically has federal income tax, Social Security (6.2%), Medicare (1.45%), California state income tax, and California SDI (1.1%) withheld.',
      },
      {
        question: 'How does California compare to Texas for take-home pay?',
        answer:
          `Texas has no state income tax, while California imposes rates up to 13.3%. On a $100,000 salary in ${CURRENT_YEAR}, you can expect to take home roughly $7,000–$10,000 more per year in Texas than in California.`,
      },
      {
        question: `How much do I take home on a $100,000 salary in California for ${CURRENT_YEAR}?`,
        answer:
          `On a $100,000 gross salary in California for ${CURRENT_YEAR}, a single filer takes home approximately $71,000–$73,000 per year after federal income tax, California state income tax, SDI, Social Security, and Medicare. Use the calculator above for your exact amount.`,
      },
      {
        question: `How much do I take home on a $150,000 salary in California for ${CURRENT_YEAR}?`,
        answer:
          `On a $150,000 gross salary in California for ${CURRENT_YEAR}, a single filer takes home approximately $98,000–$102,000 per year. California's high marginal state tax rates and SDI make the effective rate one of the highest in the US. Use the calculator above for your precise figure.`,
      },
    ],
  },
  NY: {
    slug: 'new-york',
    name: 'New York',
    code: 'NY',
    getTitle: (year) => `New York Paycheck Tax Calculator ${year} | thetax.us`,
    getDescription: (year) =>
      `Calculate your New York take-home pay for ${year}. Includes NY state income tax, Social Security, and Medicare. Free, no signup required.`,
    getIntro: (year) =>
      `Enter your annual salary to see your New York take-home pay for ${year}. The calculator accounts for federal income tax, New York state income tax (4%–10.9%), Social Security, and Medicare.`,
    faqs: [
      {
        question: 'Does New York have state income tax?',
        answer:
          `Yes. New York has a progressive state income tax with rates ranging from 4% to 10.9% for ${CURRENT_YEAR}.`,
      },
      {
        question: `What is the New York standard deduction for ${CURRENT_YEAR}?`,
        answer:
          `The New York standard deduction for single filers is $8,000 for ${CURRENT_YEAR}. For married filing jointly, it is $16,050.`,
      },
      {
        question: 'What taxes are taken out of a New York paycheck?',
        answer:
          'A New York paycheck typically has federal income tax, Social Security (6.2%), Medicare (1.45%), and New York state income tax withheld. NYC residents also pay an additional city income tax.',
      },
      {
        question: 'How does New York compare to California for take-home pay?',
        answer:
          'Both states have high income taxes. New York tops out at 10.9% while California tops at 13.3%. For most incomes, California residents pay somewhat more in state taxes, but the difference varies by income level.',
      },
      {
        question: `How much do I take home on a $100,000 salary in New York for ${CURRENT_YEAR}?`,
        answer:
          `On a $100,000 gross salary in New York for ${CURRENT_YEAR}, a single filer takes home approximately $72,000–$74,000 per year after federal and state income taxes, Social Security, and Medicare. Use the calculator above for your exact amount.`,
      },
      {
        question: `How much do I take home on a $75,000 salary in New York for ${CURRENT_YEAR}?`,
        answer:
          `On a $75,000 gross salary in New York for ${CURRENT_YEAR}, a single filer takes home approximately $55,000–$57,000 per year after all taxes. Use the calculator above to see the full breakdown.`,
      },
    ],
  },
  TX: {
    slug: 'texas',
    name: 'Texas',
    code: 'TX',
    getTitle: (year) => `Texas Paycheck Tax Calculator ${year} | thetax.us`,
    getDescription: (year) =>
      `Calculate your Texas take-home pay for ${year}. Texas has no state income tax. Includes federal taxes, Social Security, and Medicare. Free, no signup required.`,
    getIntro: (year) =>
      `Enter your annual salary to see your Texas take-home pay for ${year}. Texas has no state income tax, so deductions are limited to federal income tax, Social Security, and Medicare.`,
    faqs: [
      {
        question: 'Does Texas have state income tax?',
        answer:
          'No. Texas has no state income tax, making it one of the most tax-friendly states for workers. Your paycheck deductions are limited to federal income tax, Social Security, and Medicare.',
      },
      {
        question: 'What taxes are taken out of a Texas paycheck?',
        answer:
          'A Texas paycheck only has federal income tax, Social Security (6.2% up to a cap), and Medicare (1.45%) withheld. There is no Texas state income tax.',
      },
      {
        question: 'How much more do I take home in Texas vs. California?',
        answer:
          `On a $100,000 salary in ${CURRENT_YEAR}, Texas residents take home roughly $7,000–$10,000 more per year than California residents due to the absence of state income tax.`,
      },
      {
        question: 'How much more do I take home in Texas vs. New York?',
        answer:
          `On a $100,000 salary in ${CURRENT_YEAR}, Texas residents generally take home $5,000–$8,000 more per year than New York residents because Texas has no state income tax.`,
      },
      {
        question: `How much do I take home on a $100,000 salary in Texas for ${CURRENT_YEAR}?`,
        answer:
          `On a $100,000 gross salary in Texas for ${CURRENT_YEAR}, a single filer takes home approximately $78,000–$80,000 per year. With no state income tax, Texas residents keep significantly more of their paycheck than in most states. Use the calculator above for your exact amount.`,
      },
      {
        question: `How much do I take home on an $80,000 salary in Texas for ${CURRENT_YEAR}?`,
        answer:
          `On an $80,000 gross salary in Texas for ${CURRENT_YEAR}, a single filer takes home approximately $62,000–$64,000 per year after federal income tax, Social Security, and Medicare. Use the calculator above for a full breakdown.`,
      },
    ],
  },
  WA: {
    slug: 'washington',
    name: 'Washington',
    code: 'WA',
    getTitle: (year) => `Washington State Paycheck Tax Calculator ${year} | thetax.us`,
    getDescription: (year) =>
      `Calculate your Washington state take-home pay for ${year}. Washington has no state income tax. Includes federal taxes, Social Security, and Medicare. Free, no signup required.`,
    getIntro: (year) =>
      `Enter your annual salary to see your Washington state take-home pay for ${year}. Washington has no state income tax, so deductions are limited to federal income tax, Social Security, and Medicare.`,
    faqs: [
      {
        question: 'Does Washington state have state income tax?',
        answer:
          'No. Washington state has no personal income tax. Your paycheck deductions are limited to federal income tax, Social Security, and Medicare.',
      },
      {
        question: 'What taxes are taken out of a Washington state paycheck?',
        answer:
          'A Washington state paycheck has federal income tax, Social Security (6.2% up to a cap), and Medicare (1.45%) withheld. There is no Washington state income tax.',
      },
      {
        question: 'How does Washington compare to California for take-home pay?',
        answer:
          'Washington has no state income tax while California imposes rates up to 13.3%. On a $100,000 salary, Washington residents typically take home $7,000–$10,000 more per year than Californians.',
      },
      {
        question: `How much do I take home on a $100,000 salary in Washington state for ${CURRENT_YEAR}?`,
        answer:
          `On a $100,000 gross salary in Washington state for ${CURRENT_YEAR}, a single filer takes home approximately $78,000–$80,000 per year. Like Texas, Washington has no state income tax, so only federal taxes apply. Use the calculator above for your exact amount.`,
      },
      {
        question: `How much do I take home on a $120,000 salary in Washington for ${CURRENT_YEAR}?`,
        answer:
          `On a $120,000 gross salary in Washington for ${CURRENT_YEAR}, a single filer takes home approximately $91,000–$94,000 per year after federal income tax, Social Security, and Medicare. Use the calculator above for a full breakdown.`,
      },
    ],
  },
};

export const SLUG_TO_STATE = Object.fromEntries(
  Object.entries(STATE_META).map(([code, meta]) => [meta.slug, code])
);

export const DEFAULT_META = {
  getTitle: (year) => `US Paycheck Tax Calculator ${year} | thetax.us`,
  getDescription: (year) =>
    `Free US paycheck tax calculator for ${year}. Calculate federal income tax, Social Security, Medicare, and state taxes for California, New York, Texas, and Washington. No signup required.`,
  getIntro: (year) =>
    `Enter your annual salary to calculate your US take-home pay for ${year}. See your federal income tax, state income tax, Social Security, and Medicare deductions broken down in real time.`,
};

export const SCHEMA_ORG_BASE = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
};
