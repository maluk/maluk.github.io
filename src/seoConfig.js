export const CURRENT_YEAR = String(new Date().getFullYear());

export const STATE_META = {
  CA: {
    slug: 'california',
    name: 'California',
    code: 'CA',
    getTitle: (year) => `California Paycheck Tax Calculator ${year} | thetax.us`,
    getDescription: (year) =>
      `Calculate your California take-home pay for ${year}. Includes CA state income tax, SDI, Social Security, and Medicare. Free, no signup required.`,
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
    ],
  },
  NY: {
    slug: 'new-york',
    name: 'New York',
    code: 'NY',
    getTitle: (year) => `New York Paycheck Tax Calculator ${year} | thetax.us`,
    getDescription: (year) =>
      `Calculate your New York take-home pay for ${year}. Includes NY state income tax, Social Security, and Medicare. Free, no signup required.`,
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
    ],
  },
  TX: {
    slug: 'texas',
    name: 'Texas',
    code: 'TX',
    getTitle: (year) => `Texas Paycheck Tax Calculator ${year} | thetax.us`,
    getDescription: (year) =>
      `Calculate your Texas take-home pay for ${year}. Texas has no state income tax. Includes federal taxes, Social Security, and Medicare. Free, no signup required.`,
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
    ],
  },
  WA: {
    slug: 'washington',
    name: 'Washington',
    code: 'WA',
    getTitle: (year) => `Washington State Paycheck Tax Calculator ${year} | thetax.us`,
    getDescription: (year) =>
      `Calculate your Washington state take-home pay for ${year}. Washington has no state income tax. Includes federal taxes, Social Security, and Medicare. Free, no signup required.`,
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
