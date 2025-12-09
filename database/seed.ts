import { db } from '@/lib/database';
import { Email, EmailDirection, emails } from '@/lib/schema';

// User and group aliases
const USER_EMAIL = 'user@example.com';
const GROUP_ALIASES = {
  team: 'team@company.com',
  engineering: 'engineering@company.com',
  design: 'design@company.com',
  marketing: 'marketing@company.com',
};

// Realistic senders with full names
const senders = [
  { name: 'Sarah Johnson', email: 'sarah.johnson@company.com' },
  { name: 'Mike Chen', email: 'mike.chen@company.com' },
  { name: 'Lisa Wang', email: 'lisa.wang@company.com' },
  { name: 'David Kim', email: 'david.kim@company.com' },
  { name: 'Alex Rodriguez', email: 'alex.rodriguez@company.com' },
  { name: 'Emma Thompson', email: 'emma.thompson@company.com' },
  { name: 'James Wilson', email: 'james.wilson@company.com' },
  { name: 'Olivia Martinez', email: 'olivia.martinez@company.com' },
  { name: 'William Brown', email: 'william.brown@company.com' },
  { name: 'Sophia Davis', email: 'sophia.davis@company.com' },
  { name: 'Benjamin Lee', email: 'benjamin.lee@company.com' },
  { name: 'Isabella Garcia', email: 'isabella.garcia@company.com' },
  { name: 'Lucas Anderson', email: 'lucas.anderson@company.com' },
  { name: 'Mia Taylor', email: 'mia.taylor@company.com' },
  { name: 'Henry Moore', email: 'henry.moore@company.com' },
  { name: 'Client Contact', email: 'contact@acmecorp.com' },
  { name: 'John Smith', email: 'john.smith@clientco.com' },
  { name: 'Rachel Green', email: 'rachel@partner.io' },
];

// Thread storylines with realistic conversations
interface ThreadStoryline {
  subject: string;
  recipient: string; // group alias or USER_EMAIL
  messages: Array<{
    from: 'user' | number; // 'user' or index in senders array
    content: string;
    isRead?: boolean;
    isImportant?: boolean;
  }>;
}

const threadStorylines: ThreadStoryline[] = [
  // 1. Q1 Planning kickoff (team@)
  {
    subject: 'Q1 2025 Planning Kickoff',
    recipient: GROUP_ALIASES.team,
    messages: [
      {
        from: 0, // Sarah
        content:
          "Hi team, I'd like to kick off our Q1 planning session. We have some exciting initiatives lined up and I want to make sure everyone is aligned on priorities. Can we schedule a 2-hour session next week?",
        isImportant: true,
      },
      {
        from: 1, // Mike
        content:
          "Great idea Sarah! I'm available Tuesday or Thursday afternoon. Should we prepare any materials beforehand?",
      },
      {
        from: 'user',
        content:
          'Thursday works for me. I can put together a summary of our Q4 achievements and learnings to kick things off.',
      },
      {
        from: 2, // Lisa
        content:
          "Perfect, Thursday it is. I'll send out the calendar invite. Sarah, do you want to share the strategic objectives doc before the meeting?",
      },
      {
        from: 0,
        content:
          "Yes, I'll share it by EOD today. Looking forward to the discussion!",
        isRead: false,
      },
    ],
  },

  // 2. Website redesign project (design@)
  {
    subject: 'Website Redesign - Phase 2 Updates',
    recipient: GROUP_ALIASES.design,
    messages: [
      {
        from: 9, // Sophia
        content:
          "Hi design team, I've completed the mockups for the new landing page. The updated color palette and typography are now consistent with our brand guidelines. Please review and share feedback.",
        isImportant: true,
      },
      {
        from: 'user',
        content:
          'These look fantastic Sophia! I especially like the hero section. One small suggestion - can we try a slightly larger CTA button? I think it might improve conversion.',
      },
      {
        from: 9,
        content:
          "Good catch! I'll make that adjustment. Also thinking of adding some subtle animations to the feature cards. Thoughts?",
      },
      {
        from: 13, // Mia
        content:
          'Love the animation idea. Just make sure they work well on mobile and can be disabled for accessibility.',
      },
      {
        from: 'user',
        content:
          'Agreed on accessibility. Sophia, can you also prepare a version with reduced motion for users who prefer it?',
        isRead: false,
      },
    ],
  },

  // 3. Database performance issue (engineering@)
  {
    subject: 'URGENT: Database Performance Degradation',
    recipient: GROUP_ALIASES.engineering,
    messages: [
      {
        from: 4, // Alex
        content:
          "Team, we're seeing significant slowdowns on the user queries endpoint. Response times have increased from 50ms to 800ms in the last hour. I'm investigating but could use some help.",
        isImportant: true,
        isRead: false,
      },
      {
        from: 10, // Benjamin
        content:
          "I'm looking at the query logs now. Seems like the index on user_sessions table isn't being used. Did anyone deploy changes recently?",
      },
      {
        from: 'user',
        content:
          'I pushed a migration yesterday that added a new column to that table. Let me check if the index needs to be rebuilt.',
      },
      {
        from: 4,
        content:
          'Found it! The migration dropped and recreated the table instead of altering it. The indexes were lost in the process.',
      },
      {
        from: 'user',
        content:
          "I'll push a fix immediately to recreate the indexes. Sorry about this - I should have been more careful with the migration.",
      },
      {
        from: 10,
        content:
          "No worries, happens to everyone. I'll add a CI check to verify indexes are preserved after migrations. Let me know when the fix is deployed.",
        isRead: false,
      },
    ],
  },

  // 4. Marketing campaign brainstorm (marketing@)
  {
    subject: 'Spring Campaign Ideas',
    recipient: GROUP_ALIASES.marketing,
    messages: [
      {
        from: 7, // Olivia
        content:
          "Hey marketing crew! It's time to start planning our spring campaign. I was thinking we could focus on the 'fresh start' theme. Any initial ideas?",
      },
      {
        from: 13, // Mia
        content:
          "I love that concept! What about a 'Spring Clean Your Workflow' angle? We could highlight productivity features and offer a seasonal discount.",
      },
      {
        from: 'user',
        content:
          'Great idea Mia. We could also partner with some influencers in the productivity space. I have a few contacts who might be interested.',
      },
      {
        from: 7,
        content:
          "Perfect! Let's schedule a brainstorm session to flesh out the details. I'll prepare a mood board to get us started.",
        isRead: false,
      },
    ],
  },

  // 5. Coffee chat invitation (direct to user)
  {
    subject: 'Coffee catch-up?',
    recipient: USER_EMAIL,
    messages: [
      {
        from: 6, // James
        content:
          "Hey! It's been a while since we caught up. Would you be up for grabbing coffee this week? I'd love to hear how the new project is going.",
      },
      {
        from: 'user',
        content:
          'Hey James! Would love to catch up. How about Thursday at 3pm at the usual place?',
      },
      {
        from: 6,
        content:
          'Thursday works perfectly. See you at Blue Bottle on 3rd Street!',
        isRead: false,
      },
    ],
  },

  // 6. New hire onboarding (team@)
  {
    subject: 'Welcome Marcus to the team!',
    recipient: GROUP_ALIASES.team,
    messages: [
      {
        from: 0, // Sarah
        content:
          "Hi everyone! I'm excited to announce that Marcus Rivera will be joining us as a Senior Engineer starting Monday. He comes from Stripe and has extensive experience with payment systems. Please make him feel welcome!",
        isImportant: true,
      },
      {
        from: 1, // Mike
        content:
          'Welcome Marcus! Looking forward to working with you. Let me know if you need any help getting set up.',
      },
      {
        from: 'user',
        content:
          "Welcome aboard Marcus! I'll be your onboarding buddy for the first two weeks. I'll send you a separate email with the getting started guide.",
      },
      {
        from: 2, // Lisa
        content:
          "Excited to have you on the team! We're doing team lunch on Tuesday if you'd like to join.",
        isRead: false,
      },
    ],
  },

  // 7. Bug report from production (engineering@)
  {
    subject: 'Bug: Payment processing failing for EU customers',
    recipient: GROUP_ALIASES.engineering,
    messages: [
      {
        from: 12, // Lucas
        content:
          "We're getting reports from customer support that EU customers can't complete purchases. Getting a generic error message. I've reproduced it locally - seems related to the currency conversion service.",
        isImportant: true,
      },
      {
        from: 'user',
        content:
          "I'll take a look. The currency API we're using might have changed their response format. Let me check the logs.",
      },
      {
        from: 'user',
        content:
          'Confirmed - they added a new required field last week. Deploying a hotfix now.',
      },
      {
        from: 12,
        content:
          'You rock! Customer support is going to be so relieved. Should we add monitoring for API response schema changes?',
      },
      {
        from: 'user',
        content:
          "Good idea. I'll create a ticket for that. Fix is deployed and I've verified payments are working again.",
        isRead: false,
      },
    ],
  },

  // 8. Client feedback review (team@)
  {
    subject: 'Client Feedback: Acme Corp Demo',
    recipient: GROUP_ALIASES.team,
    messages: [
      {
        from: 15, // Client Contact
        content:
          "Hi team, thank you for the demo yesterday. Our leadership was impressed with the platform's capabilities. We do have a few questions about the enterprise features and pricing. Could we schedule a follow-up call?",
        isImportant: true,
      },
      {
        from: 0, // Sarah
        content:
          "That's great to hear! I'd be happy to schedule a follow-up. How does Thursday at 10am PT work for your team?",
      },
      {
        from: 15,
        content:
          'Thursday works. Could you also send over the security compliance documentation they mentioned?',
      },
      {
        from: 'user',
        content:
          "I'll prepare the SOC 2 and GDPR compliance docs and send them over before the call.",
        isRead: false,
      },
    ],
  },

  // 9. Sprint retrospective (engineering@)
  {
    subject: 'Sprint 24 Retro Notes',
    recipient: GROUP_ALIASES.engineering,
    messages: [
      {
        from: 4, // Alex
        content:
          "Team, here are the key takeaways from today's retro:\n\nWhat went well:\n- Shipped the new dashboard on time\n- Great collaboration between frontend and backend\n\nWhat to improve:\n- Need better test coverage\n- Sprint planning estimates were off\n\nAction items:\n- Set up automated integration tests\n- Try planning poker next sprint",
      },
      {
        from: 10, // Benjamin
        content:
          'Thanks for the summary Alex. I can lead the integration testing initiative. Anyone want to pair with me?',
      },
      {
        from: 'user',
        content:
          "I'm interested! I've been wanting to improve our testing practices. Let's set up a working session next week.",
      },
      {
        from: 4,
        content:
          'Perfect combo. Let me know if you need any resources or time allocated for this.',
        isRead: false,
      },
    ],
  },

  // 10. Budget approval request (direct to user)
  {
    subject: 'Budget Approval: New Development Tools',
    recipient: USER_EMAIL,
    messages: [
      {
        from: 14, // Henry
        content:
          "Hi, I'm putting together a request for some new development tools. The team has been asking for GitHub Copilot licenses and a better CI/CD platform. Total cost would be around $2,400/year. Could you approve this from the engineering budget?",
      },
      {
        from: 'user',
        content:
          "Hey Henry, thanks for putting this together. The Copilot licenses make sense given the productivity gains we've seen. Can you also include a comparison of the CI/CD options?",
      },
      {
        from: 14,
        content:
          "Sure thing! I've attached a comparison between CircleCI, GitHub Actions, and Buildkite. GitHub Actions seems to be the most cost-effective for our needs.",
        isRead: false,
      },
    ],
  },

  // 11. Training session announcement (team@)
  {
    subject: 'Upcoming: React Server Components Workshop',
    recipient: GROUP_ALIASES.team,
    messages: [
      {
        from: 5, // Emma
        content:
          "Hi all! I'll be running a workshop on React Server Components next Friday at 2pm. This will cover the new patterns we're adopting in our frontend architecture. All levels welcome!",
        isImportant: true,
      },
      {
        from: 'user',
        content:
          "This is perfect timing Emma! I've been wanting to learn more about the streaming patterns. Will you cover that too?",
      },
      {
        from: 5,
        content:
          "Yes! I'll have a whole section on streaming and Suspense boundaries. Bring your questions!",
      },
      {
        from: 3, // David
        content:
          "Count me in! Will this be recorded for those who can't make it?",
      },
      {
        from: 5,
        content:
          "Great question - yes, I'll record it and share the link afterward. Also preparing some hands-on exercises.",
        isRead: false,
      },
    ],
  },

  // 12. Code review request (engineering@)
  {
    subject: 'PR Review: Authentication Refactor',
    recipient: GROUP_ALIASES.engineering,
    messages: [
      {
        from: 10, // Benjamin
        content:
          "Hey team, I've got a PR ready for the auth system refactor. It's a pretty significant change (~800 lines) so I wanted to give a heads up. The main changes are:\n- Moving to JWT tokens\n- Adding refresh token rotation\n- Implementing proper session management\n\nPR link: github.com/company/app/pull/456",
      },
      {
        from: 'user',
        content:
          "I'll take a look this afternoon. The JWT implementation looks solid from the description. Did you consider using the jose library instead of jsonwebtoken?",
      },
      {
        from: 10,
        content:
          "Good suggestion! jose has better TypeScript support. I'll switch to that before merging.",
      },
      {
        from: 4, // Alex
        content:
          "I've left some comments on the token rotation logic. Overall looks great though!",
        isRead: false,
      },
    ],
  },

  // 13. Design feedback (design@)
  {
    subject: 'Mobile App Icons - Final Review',
    recipient: GROUP_ALIASES.design,
    messages: [
      {
        from: 9, // Sophia
        content:
          "Hi team, I've finalized the mobile app icons. Attached are options A, B, and C. I personally lean towards option B as it works better at small sizes. Thoughts?",
      },
      {
        from: 'user',
        content:
          'I agree, option B is the cleanest. The gradient on option A might cause issues on certain backgrounds. Have you tested how they look on the actual home screen?',
      },
      {
        from: 13, // Mia
        content:
          'Just tested on both iOS and Android. Option B looks great on both. The contrast is perfect for accessibility too.',
      },
      {
        from: 9,
        content:
          "Perfect! I'll finalize option B and send to development for implementation. Thanks for the quick feedback!",
        isRead: false,
      },
    ],
  },

  // 14. Quarterly report (team@)
  {
    subject: 'Q4 Results Summary',
    recipient: GROUP_ALIASES.team,
    messages: [
      {
        from: 0, // Sarah
        content:
          "Team, I'm thrilled to share our Q4 results! We exceeded our targets across the board:\n\n- Revenue: 112% of target\n- New customers: 156 (target was 120)\n- NPS: 72 (up from 65)\n- Engineering velocity: 28% improvement\n\nThank you all for your hard work. Full report attached.",
        isImportant: true,
      },
      {
        from: 1, // Mike
        content:
          'These numbers are incredible! The NPS improvement is especially impressive. What do we attribute that to?',
      },
      {
        from: 0,
        content:
          'Great question Mike. The customer success team traced it back to the improved onboarding flow and faster support response times.',
      },
      {
        from: 'user',
        content:
          'Congrats everyone! The engineering velocity improvement was a team effort. Special shoutout to Alex for streamlining our deployment process.',
        isRead: false,
      },
    ],
  },

  // 15. Vacation coverage (direct to user)
  {
    subject: 'Coverage while I am OOO',
    recipient: USER_EMAIL,
    messages: [
      {
        from: 2, // Lisa
        content:
          "Hey! I'll be on vacation next week (Dec 18-26). Would you mind covering for me on the daily standups and any urgent issues that come up? I'll make sure everything is documented in the handover doc.",
      },
      {
        from: 'user',
        content:
          "Of course! Happy to cover. Enjoy your vacation - you've earned it after the Q4 push.",
      },
      {
        from: 2,
        content:
          "Thanks so much! I've shared the handover doc with you. Let me know if anything is unclear. Emergency contact is in there just in case.",
        isRead: false,
      },
    ],
  },

  // 16. Product launch coordination (team@)
  {
    subject: 'Product Launch Checklist - January Release',
    recipient: GROUP_ALIASES.team,
    messages: [
      {
        from: 7, // Olivia
        content:
          "Hi all, here's the checklist for our January product launch. Please update with your status by EOD Wednesday:\n\n- [ ] Engineering: Feature freeze complete\n- [ ] Design: Marketing assets ready\n- [ ] Marketing: Press release drafted\n- [ ] Support: FAQ updated\n- [ ] Sales: Demo environment ready",
        isImportant: true,
      },
      {
        from: 4, // Alex
        content:
          'Engineering is on track. Feature freeze is tomorrow and we have a full QA day scheduled.',
      },
      {
        from: 'user',
        content:
          "I've updated the demo environment with the latest features. Sales team can start using it for previews.",
      },
      {
        from: 9, // Sophia
        content:
          "Marketing assets are 90% done. Just waiting on the final product screenshots after tomorrow's freeze.",
        isRead: false,
      },
    ],
  },

  // 17. Security audit findings (engineering@)
  {
    subject: 'Security Audit Results',
    recipient: GROUP_ALIASES.engineering,
    messages: [
      {
        from: 8, // William
        content:
          "Team, the external security audit is complete. Good news: no critical vulnerabilities found. We do have 3 medium and 5 low priority items to address. I've created tickets for each. The medium ones need to be fixed before our next release.",
        isImportant: true,
      },
      {
        from: 'user',
        content:
          'Thanks William! I can take the medium items related to input validation. Which tickets are those?',
      },
      {
        from: 8,
        content:
          'SEC-124, SEC-125, and SEC-126. The first two are related to XSS prevention in the rich text editor. Third one is about rate limiting on the API.',
      },
      {
        from: 10, // Benjamin
        content:
          "I'll help with the rate limiting one. Been meaning to implement that properly for a while.",
        isRead: false,
      },
    ],
  },

  // 18. Social media campaign (marketing@)
  {
    subject: 'Social Media Calendar - December',
    recipient: GROUP_ALIASES.marketing,
    messages: [
      {
        from: 13, // Mia
        content:
          "Hey team! I've drafted the social media calendar for December. Focusing on end-of-year themes and customer success stories. Let me know if you have any additions or changes.",
      },
      {
        from: 'user',
        content:
          'Looks good! Can we add a post highlighting the new features we shipped this year? I can provide a summary for the copy.',
      },
      {
        from: 7, // Olivia
        content:
          "Great idea! A 'Year in Review' post would perform well. Let's schedule it for the last week of December.",
      },
      {
        from: 13,
        content:
          "Love it! I'll block Dec 28 for that post. User, can you send me the feature summary by Dec 20?",
        isRead: false,
      },
    ],
  },

  // 19. Office event planning (team@)
  {
    subject: 'Holiday Party Planning',
    recipient: GROUP_ALIASES.team,
    messages: [
      {
        from: 11, // Isabella
        content:
          "Hi everyone! It's that time of year - holiday party planning! I'm thinking December 20th at 6pm. We can do it at the office with catering, or book a restaurant. Preferences?",
      },
      {
        from: 3, // David
        content:
          'I vote for restaurant - would be nice to get out of the office!',
      },
      {
        from: 'user',
        content:
          '+1 for restaurant. How about that Italian place we went to last year? The private room was perfect.',
      },
      {
        from: 11,
        content:
          "Great idea! I'll call them today to check availability. Any dietary restrictions I should know about?",
      },
      {
        from: 5, // Emma
        content:
          "I'm vegetarian, but that place had great options as I recall.",
        isRead: false,
      },
    ],
  },

  // 20. Technical documentation (engineering@)
  {
    subject: 'API Documentation Update',
    recipient: GROUP_ALIASES.engineering,
    messages: [
      {
        from: 'user',
        content:
          "Hey team, I've been updating our API documentation. Can everyone review their respective sections? The webhook documentation especially needs verification - I noticed some endpoints were out of date.",
      },
      {
        from: 4, // Alex
        content:
          "I'll review the authentication section. Also noticed we're missing docs for the new batch endpoints.",
      },
      {
        from: 12, // Lucas
        content:
          'Webhook docs reviewed and I found a few issues. Made the corrections directly - check my commits.',
      },
      {
        from: 'user',
        content:
          "Thanks Lucas! I've merged your changes. Alex, let me know when the auth section is ready.",
        isRead: false,
      },
    ],
  },

  // 21. Customer support escalation (direct to user)
  {
    subject: 'Escalation: Enterprise Customer Issue',
    recipient: USER_EMAIL,
    messages: [
      {
        from: 5, // Emma
        content:
          "Hi, we have an escalation from TechCorp (enterprise customer). They're experiencing data sync issues that support couldn't resolve. Given your familiarity with the sync engine, could you take a look? Their account manager is getting pressure from their CTO.",
        isImportant: true,
      },
      {
        from: 'user',
        content:
          "I'll look into it right away. Can you send me their account ID and any relevant support tickets?",
      },
      {
        from: 5,
        content:
          'Account ID: TC-2847. Tickets: #8834, #8856. The issue seems to be with their Salesforce integration specifically.',
      },
      {
        from: 'user',
        content:
          "Found the issue - there was a schema mismatch after their Salesforce admin added custom fields. I'll patch their config and follow up directly with their team.",
        isRead: false,
      },
    ],
  },

  // 22. Performance review scheduling (direct to user)
  {
    subject: 'Performance Review - Schedule',
    recipient: USER_EMAIL,
    messages: [
      {
        from: 0, // Sarah
        content:
          "Hi! It's time for our annual performance review. I'd like to schedule a 1-hour session. I have availability next week on Tuesday 2-3pm or Thursday 10-11am. Which works better for you?",
      },
      {
        from: 'user',
        content:
          'Thursday at 10am works great for me. Should I prepare anything specific beforehand?',
      },
      {
        from: 0,
        content:
          "Perfect, I'll send the invite. Yes - please complete the self-assessment form (I've attached it) and think about your goals for next year. Looking forward to discussing your excellent work!",
        isImportant: true,
        isRead: false,
      },
    ],
  },

  // 23. API integration discussion (engineering@)
  {
    subject: 'Stripe API v2023-10 Migration',
    recipient: GROUP_ALIASES.engineering,
    messages: [
      {
        from: 10, // Benjamin
        content:
          "Heads up team - Stripe is deprecating API version 2023-08 in February. We need to migrate to 2023-10. Main changes are around the payment intents flow. I've started a doc outlining the required changes.",
        isImportant: true,
      },
      {
        from: 'user',
        content:
          "Thanks for the heads up. I'll review the doc. Do we know if our current webhook handlers need updates too?",
      },
      {
        from: 10,
        content:
          "Good question - yes, there are some payload changes for the payment_intent.succeeded event. I've documented those as well.",
      },
      {
        from: 4, // Alex
        content:
          "I can help with the webhook migration. I've done a few Stripe version bumps before. Let's sync tomorrow.",
        isRead: false,
      },
    ],
  },

  // 24. Brand guidelines update (design@)
  {
    subject: 'Updated Brand Guidelines',
    recipient: GROUP_ALIASES.design,
    messages: [
      {
        from: 9, // Sophia
        content:
          "Hi design team! I've finished updating our brand guidelines based on the feedback from last month. Key changes:\n\n- New secondary color palette\n- Updated typography scale\n- Refined logo usage rules\n\nPlease review and start using these in new projects.",
        isImportant: true,
      },
      {
        from: 'user',
        content:
          'These look polished! Quick question - should we update the existing marketing pages to match the new guidelines, or just apply to new work?',
      },
      {
        from: 9,
        content:
          "Good question. Let's update high-traffic pages first - homepage, pricing, about. We can phase in the rest over Q1.",
      },
      {
        from: 13, // Mia
        content:
          "I can start on the homepage updates next week. Sophia, can you share the Figma component library when it's ready?",
        isRead: false,
      },
    ],
  },

  // 25. End of year wrap-up (team@)
  {
    subject: 'Thank You All - What a Year!',
    recipient: GROUP_ALIASES.team,
    messages: [
      {
        from: 0, // Sarah
        content:
          "Team, as we wrap up the year, I want to take a moment to thank each of you. We've accomplished incredible things together - from launching our mobile app to growing revenue 150%. None of this would have been possible without your dedication and teamwork. Enjoy the holidays and recharge!",
        isImportant: true,
      },
      {
        from: 1, // Mike
        content:
          "Thank you Sarah! It's been a privilege working with such a talented team. Wishing everyone a restful holiday season!",
      },
      {
        from: 'user',
        content:
          "Thanks Sarah! This team is truly special. Proud of what we've built together. Happy holidays everyone!",
      },
      {
        from: 3, // David
        content:
          'What a year indeed! Looking forward to 2025 with this crew. Happy holidays!',
      },
      {
        from: 2, // Lisa
        content: 'Best team ever! See you all in the new year. Rest up!',
        isRead: false,
      },
    ],
  },

  // Additional storylines to reach ~50 threads

  // 26. Onboarding feedback (direct to user)
  {
    subject: 'How was your onboarding experience?',
    recipient: USER_EMAIL,
    messages: [
      {
        from: 14, // Henry
        content:
          "Hey! Now that you've been here about 3 months, I wanted to check in on how your onboarding experience was. Any feedback on what worked well or could be improved?",
      },
      {
        from: 'user',
        content:
          'Thanks for asking Henry! Overall it was great. The buddy system really helped. One suggestion - it would be helpful to have a checklist of all the tools and accesses needed upfront.',
      },
      {
        from: 14,
        content:
          "That's excellent feedback! I'll add that to our onboarding doc. Glad the buddy system worked well - we just implemented that this year.",
        isRead: false,
      },
    ],
  },

  // 27. Technical debt discussion (engineering@)
  {
    subject: 'Tech Debt Prioritization',
    recipient: GROUP_ALIASES.engineering,
    messages: [
      {
        from: 4, // Alex
        content:
          "Team, we need to carve out time for tech debt this quarter. I've compiled a list of the top items. Can we review and prioritize in our next planning meeting?",
      },
      {
        from: 'user',
        content:
          'Thanks for putting this together Alex. The database connection pooling issue should be high priority - it caused that outage last month.',
      },
      {
        from: 10, // Benjamin
        content:
          '+1 on the connection pooling. Also think we should tackle the test suite performance - it takes 45 minutes to run now.',
      },
      {
        from: 4,
        content:
          "Agreed on both. I'll bump those to P1. Any objections to dedicating 20% of next sprint to tech debt?",
        isRead: false,
      },
    ],
  },

  // 28. Meeting rescheduling (direct to user)
  {
    subject: 'Need to reschedule our 1:1',
    recipient: USER_EMAIL,
    messages: [
      {
        from: 0, // Sarah
        content:
          'Hi! Unfortunately I have a conflict with our 1:1 tomorrow - an urgent client meeting came up. Can we move it to Friday same time?',
      },
      {
        from: 'user',
        content:
          'No problem Sarah! Friday works for me. Should I still send you the updates I was planning to discuss via email?',
      },
      {
        from: 0,
        content: 'That would be great, thanks for being flexible! Talk Friday.',
        isRead: false,
      },
    ],
  },

  // 29. Feature request discussion (team@)
  {
    subject: 'Feature Request: Dark Mode',
    recipient: GROUP_ALIASES.team,
    messages: [
      {
        from: 5, // Emma
        content:
          "We've had 47 customer requests for dark mode in the last month. Should we prioritize this for the next release?",
        isImportant: true,
      },
      {
        from: 9, // Sophia
        content:
          "I've actually been working on a dark mode concept in my spare time. Happy to share the mockups!",
      },
      {
        from: 'user',
        content:
          'From an engineering standpoint, it would be a moderate effort since we already use CSS custom properties. Maybe 2-3 sprints?',
      },
      {
        from: 0, // Sarah
        content:
          "Let's add it to the backlog and discuss in roadmap planning. Sophia, please share those mockups!",
        isRead: false,
      },
    ],
  },

  // 30. Interview feedback (direct to user)
  {
    subject: 'Candidate Feedback Request',
    recipient: USER_EMAIL,
    messages: [
      {
        from: 8, // William
        content:
          'Hey! Thanks for interviewing Jordan Martinez yesterday. Can you submit your feedback in Greenhouse by EOD? We want to make a decision this week.',
      },
      {
        from: 'user',
        content:
          'Just submitted! Strong technical skills, especially in system design. I gave a hire recommendation.',
      },
      {
        from: 8,
        content:
          "Awesome, that aligns with the other feedback. Looks like we'll be extending an offer!",
        isRead: false,
      },
    ],
  },

  // 31. Infrastructure update (engineering@)
  {
    subject: 'AWS Region Expansion',
    recipient: GROUP_ALIASES.engineering,
    messages: [
      {
        from: 12, // Lucas
        content:
          "Team, we're adding EU-West as a new AWS region to reduce latency for European customers. Terraform configs are ready for review. Target go-live is next Friday.",
      },
      {
        from: 'user',
        content:
          'Great timing with the new EU customers coming in. Have we set up the monitoring and alerting for the new region?',
      },
      {
        from: 12,
        content:
          'Yes, DataDog is configured with the same dashboards as us-east. Also set up cross-region failover testing.',
      },
      {
        from: 4, // Alex
        content:
          "LGTM on the Terraform changes. One suggestion - let's add a runbook for the failover procedure.",
        isRead: false,
      },
    ],
  },

  // 32. Content review request (marketing@)
  {
    subject: 'Blog Post Draft: Engineering Culture',
    recipient: GROUP_ALIASES.marketing,
    messages: [
      {
        from: 7, // Olivia
        content:
          "Hi all! I've drafted a blog post about our engineering culture for the careers page. Can someone from engineering review it for accuracy?",
      },
      {
        from: 'user',
        content:
          'Happy to review! Just sent you some comments. Main feedback: the section on code reviews is a bit outdated - we use pull requests now instead of the old review system.',
      },
      {
        from: 7,
        content:
          "Thanks for the quick turnaround! I've made the updates. Can you take one more look?",
        isRead: false,
      },
    ],
  },

  // 33. Design system discussion (design@)
  {
    subject: 'Component Library Migration',
    recipient: GROUP_ALIASES.design,
    messages: [
      {
        from: 13, // Mia
        content:
          'Hey design team! Engineering asked if we can migrate our Figma components to their new design system format. This would make the design-to-code workflow smoother.',
      },
      {
        from: 'user',
        content:
          'This would be huge for development speed. Mia, do you have capacity to work with our frontend team on this?',
      },
      {
        from: 9, // Sophia
        content:
          "I can help too. Let's set up a working group with engineering to define the component specs.",
      },
      {
        from: 13,
        content:
          "Perfect! I'll schedule a kickoff meeting for next week. Will include key engineers too.",
        isRead: false,
      },
    ],
  },

  // 34. Sales support request (direct to user)
  {
    subject: 'Technical Questions from BigBank Prospect',
    recipient: USER_EMAIL,
    messages: [
      {
        from: 16, // John Smith (client)
        content:
          'Hi, our security team has some technical questions before we can proceed with the evaluation. Specifically around data encryption at rest and in transit. Can you provide documentation or hop on a quick call?',
        isImportant: true,
      },
      {
        from: 'user',
        content:
          "Hi John! I'd be happy to address these. We use AES-256 for data at rest and TLS 1.3 for transit. I'm attaching our security whitepaper. Would a 30-min call on Thursday work for any follow-up questions?",
      },
      {
        from: 16,
        content:
          "Thursday works! 2pm EST? The whitepaper looks comprehensive - I'll send it to our CISO before the call.",
        isRead: false,
      },
    ],
  },

  // 35. Team announcement (team@)
  {
    subject: 'Promotion Announcement',
    recipient: GROUP_ALIASES.team,
    messages: [
      {
        from: 0, // Sarah
        content:
          "I'm delighted to announce that Alex Rodriguez has been promoted to Staff Engineer! Alex has consistently demonstrated technical excellence and leadership, especially in our platform reliability work. Please join me in congratulating them!",
        isImportant: true,
      },
      {
        from: 1, // Mike
        content:
          'Congrats Alex! Well deserved - your work on the observability platform has been outstanding!',
      },
      {
        from: 'user',
        content:
          'Amazing news! Alex, your mentorship has helped me grow so much. Congratulations!',
      },
      {
        from: 4, // Alex
        content:
          "Thank you all! This is a team achievement - couldn't have done it without everyone's support.",
        isRead: false,
      },
    ],
  },

  // 36. Support process improvement (team@)
  {
    subject: 'Improving On-Call Rotation',
    recipient: GROUP_ALIASES.team,
    messages: [
      {
        from: 4, // Alex
        content:
          "Team, I've noticed our on-call rotation is getting heavy. Proposing we expand the rotation and add a secondary on-call. Also want to set up better runbooks. Thoughts?",
      },
      {
        from: 'user',
        content:
          'Fully support this. Last week I got paged 12 times during one shift. Better runbooks would definitely help reduce repeat issues.',
      },
      {
        from: 10, // Benjamin
        content:
          "Agree. Can we also implement a proper escalation path? Sometimes I'm not sure who to escalate to for specific systems.",
      },
      {
        from: 4,
        content:
          "Great feedback. I'll draft a proposal with all these improvements and share before next week's meeting.",
        isRead: false,
      },
    ],
  },

  // 37. External partnership (direct to user)
  {
    subject: 'Partnership Opportunity - Integration',
    recipient: USER_EMAIL,
    messages: [
      {
        from: 17, // Rachel (partner)
        content:
          "Hi! I'm from Partner.io. We're interested in building an integration with your platform. Our users have been requesting it and we think there's a great fit. Would you be open to a call to discuss?",
      },
      {
        from: 'user',
        content:
          "Hi Rachel! Thanks for reaching out. We've actually heard from several mutual customers about this. I'd love to explore the opportunity. Let me loop in our partnerships team.",
      },
      {
        from: 17,
        content:
          "That's great to hear! Looking forward to the intro. Our technical team is ready to start whenever you are.",
        isRead: false,
      },
    ],
  },

  // 38. Code freeze announcement (engineering@)
  {
    subject: 'Holiday Code Freeze',
    recipient: GROUP_ALIASES.engineering,
    messages: [
      {
        from: 4, // Alex
        content:
          'Reminder: Holiday code freeze starts December 20th and runs through January 2nd. Only critical bugfixes will be deployed during this period. Please plan your PRs accordingly.',
        isImportant: true,
      },
      {
        from: 'user',
        content:
          'Thanks for the reminder. I have one PR that needs to go out before freeze - can I get a priority review?',
      },
      {
        from: 10, // Benjamin
        content: 'I can review it today. Send me the link.',
      },
      {
        from: 'user',
        content:
          "Thanks Benjamin! It's the caching improvements PR - github.com/company/app/pull/892",
        isRead: false,
      },
    ],
  },

  // 39. Vendor evaluation (team@)
  {
    subject: 'Analytics Platform Evaluation',
    recipient: GROUP_ALIASES.team,
    messages: [
      {
        from: 14, // Henry
        content:
          "We need to choose a new analytics platform. I've narrowed it down to Amplitude, Mixpanel, and PostHog. Can stakeholders from each team share their requirements?",
      },
      {
        from: 'user',
        content:
          'From engineering: we need good API access, event batching, and ideally self-hosted option (PostHog has this). Also important: how does it handle PII?',
      },
      {
        from: 7, // Olivia
        content:
          "Marketing needs: funnel analysis, cohort tracking, and easy dashboard creation. We're currently using Google Analytics but need more depth.",
      },
      {
        from: 14,
        content:
          "Great inputs! I'll set up demos with all three vendors next week. Will send calendar invites shortly.",
        isRead: false,
      },
    ],
  },

  // 40. Learning resource sharing (engineering@)
  {
    subject: 'Great talk on distributed systems',
    recipient: GROUP_ALIASES.engineering,
    messages: [
      {
        from: 10, // Benjamin
        content:
          'Just watched this amazing talk on distributed systems at Strange Loop. Highly recommend for anyone working on our microservices: [link]. The section on consensus algorithms is particularly relevant.',
      },
      {
        from: 'user',
        content:
          "Thanks for sharing! This is exactly what I needed for the sync service I'm building. The Raft explanation was really clear.",
      },
      {
        from: 4, // Alex
        content:
          'Great resource! Adding to our engineering wiki. Benjamin, want to do a brown bag session on this topic?',
        isRead: false,
      },
    ],
  },

  // 41. Office logistics (team@)
  {
    subject: 'Office Closure - Building Maintenance',
    recipient: GROUP_ALIASES.team,
    messages: [
      {
        from: 11, // Isabella
        content:
          "FYI the building management informed us of scheduled maintenance this Saturday. The office will be closed from 6am to 6pm. This shouldn't affect most people but wanted to give a heads up in case anyone planned to come in.",
      },
      {
        from: 3, // David
        content:
          'Thanks for the heads up. Will there be any impact to our servers or internet during this time?',
      },
      {
        from: 11,
        content:
          "Good question - I checked and our infrastructure is all cloud-based so no impact expected. The building WiFi might be affected but that's it.",
        isRead: false,
      },
    ],
  },

  // 42. Process documentation (engineering@)
  {
    subject: 'Updated Deployment Process',
    recipient: GROUP_ALIASES.engineering,
    messages: [
      {
        from: 12, // Lucas
        content:
          "Team, I've updated our deployment process documentation to reflect recent changes. Key updates:\n- New staging environment workflow\n- Canary deployment steps\n- Rollback procedures\n\nPlease review and let me know if anything is unclear.",
      },
      {
        from: 'user',
        content:
          "Thanks Lucas! The canary deployment section is really helpful. One question - what's the recommended canary duration before full rollout?",
      },
      {
        from: 12,
        content:
          "Good question - I'll add that. We recommend 30 minutes minimum, watching error rates and latency. For bigger changes, 2 hours.",
        isRead: false,
      },
    ],
  },

  // 43. Team building idea (team@)
  {
    subject: 'Team Building Activity Ideas',
    recipient: GROUP_ALIASES.team,
    messages: [
      {
        from: 5, // Emma
        content:
          'Hey all! We have budget for a team building activity in January. Some ideas: escape room, cooking class, or game night at the office. Any preferences or other ideas?',
      },
      {
        from: 'user',
        content:
          'Escape room sounds fun! We did one at my last company and it was great for teamwork. Plus we could grab dinner after.',
      },
      {
        from: 3, // David
        content:
          "+1 for escape room. There's a new one downtown that got great reviews.",
      },
      {
        from: 5,
        content:
          "Escape room it is! I'll book it for the third week of January. Will send a poll for the exact date.",
        isRead: false,
      },
    ],
  },

  // 44. Customer success story (marketing@)
  {
    subject: 'Case Study Interview Request',
    recipient: GROUP_ALIASES.marketing,
    messages: [
      {
        from: 7, // Olivia
        content:
          "Great news! GlobalTech agreed to do a case study with us. They've seen 40% productivity improvement since implementing our platform. Who wants to lead the interview?",
        isImportant: true,
      },
      {
        from: 'user',
        content:
          'I can help! I worked closely with their team during implementation so I have good context on their use case.',
      },
      {
        from: 7,
        content:
          "Perfect! I'll set up the interview for next week. Can you prepare some questions around their workflow improvements?",
        isRead: false,
      },
    ],
  },

  // 45. Accessibility initiative (design@)
  {
    subject: 'Accessibility Audit Results',
    recipient: GROUP_ALIASES.design,
    messages: [
      {
        from: 9, // Sophia
        content:
          "Team, I completed the accessibility audit for our main user flows. We're mostly WCAG 2.1 AA compliant but have some issues:\n- Color contrast in secondary buttons\n- Missing alt text on some images\n- Keyboard navigation issues in modals\n\nI've created tickets for each issue.",
        isImportant: true,
      },
      {
        from: 'user',
        content:
          "Thanks for this Sophia! I can work on the keyboard navigation issues - that's a code fix I've been meaning to make.",
      },
      {
        from: 13, // Mia
        content:
          "I'll update the secondary button colors. Sophia, can you share the specific contrast ratios needed?",
        isRead: false,
      },
    ],
  },

  // 46. Feedback request (direct to user)
  {
    subject: 'Quick feedback on presentation',
    recipient: USER_EMAIL,
    messages: [
      {
        from: 1, // Mike
        content:
          "Hey! I'm presenting to the board next week on our technical roadmap. Would you mind reviewing my slides and giving feedback? You always have good insights on how to explain technical concepts to non-technical audiences.",
      },
      {
        from: 'user',
        content:
          "Happy to help Mike! Send them over and I'll review by tomorrow.",
      },
      {
        from: 1,
        content:
          "You're the best! Just shared the deck via Google Drive. Let me know if you have any questions.",
        isRead: false,
      },
    ],
  },

  // 47. System monitoring alert discussion (engineering@)
  {
    subject: 'Alert Fatigue - Too Many False Positives',
    recipient: GROUP_ALIASES.engineering,
    messages: [
      {
        from: 4, // Alex
        content:
          "Team, we're getting too many false positive alerts. Last week alone we had 200+ alerts, but only 15 were actionable. We need to tune our thresholds. Can we schedule time to review?",
      },
      {
        from: 'user',
        content:
          'Definitely needed. The CPU alerts are the worst - they fire whenever we have normal traffic spikes. Should we increase the threshold to 90%?',
      },
      {
        from: 12, // Lucas
        content:
          '90% seems reasonable for CPU. We should also add duration requirements - only alert if the condition persists for 5+ minutes.',
      },
      {
        from: 4,
        content:
          "Good ideas. Let's block 2 hours on Thursday to go through all our alerts and tune them.",
        isRead: false,
      },
    ],
  },

  // 48. New tool announcement (team@)
  {
    subject: 'New Tool: Notion for Documentation',
    recipient: GROUP_ALIASES.team,
    messages: [
      {
        from: 14, // Henry
        content:
          "Hi all! We're switching from Confluence to Notion for documentation. It's more intuitive and has better collaboration features. Migration starts next week. Training session on Monday at 11am.",
        isImportant: true,
      },
      {
        from: 2, // Lisa
        content:
          'Excited for this change! Notion is so much cleaner. Will our old Confluence pages be migrated automatically?',
      },
      {
        from: 14,
        content:
          "Yes, we're using a migration tool. The most important pages will be manually reviewed to ensure formatting is correct.",
      },
      {
        from: 'user',
        content:
          'Great choice! One question - how will we handle the engineering runbooks? Those have specific formatting requirements.',
        isRead: false,
      },
    ],
  },

  // 49. Project completion (team@)
  {
    subject: 'Mobile App Launch - SUCCESS!',
    recipient: GROUP_ALIASES.team,
    messages: [
      {
        from: 0, // Sarah
        content:
          'HUGE congratulations team! Our mobile app just went live in the App Store and Play Store! The reviews are already coming in positive. This was 6 months of incredible work - you should all be proud!',
        isImportant: true,
      },
      {
        from: 4, // Alex
        content:
          'We did it! Special shoutout to the QA team for catching that last-minute crash bug. You saved us!',
      },
      {
        from: 'user',
        content:
          "What an amazing journey! Thanks everyone for the late nights and weekend deployments. Now let's celebrate!",
      },
      {
        from: 9, // Sophia
        content:
          "So proud of this team! The design came out exactly as we envisioned. Can't wait to see the user feedback!",
        isRead: false,
      },
    ],
  },

  // 50. Year end goals (direct to user)
  {
    subject: 'Goals Discussion for Next Year',
    recipient: USER_EMAIL,
    messages: [
      {
        from: 0, // Sarah
        content:
          'Hi! As we wrap up the year, I wanted to start thinking about your goals for next year. What areas are you most interested in growing? Any specific projects or skills you want to focus on?',
      },
      {
        from: 'user',
        content:
          "Great question Sarah! I'd love to:\n1. Lead a larger project end-to-end\n2. Improve my system design skills\n3. Mentor more junior engineers\n\nI'm particularly interested in the upcoming platform redesign.",
      },
      {
        from: 0,
        content:
          "These are excellent goals! I think the platform redesign would be a perfect fit for #1 and #2. Let's discuss how to make these happen in our review next week.",
        isImportant: true,
        isRead: false,
      },
    ],
  },
];

// Generate emails from storylines
function generateEmailData(): Email[] {
  const allEmails: Email[] = [];
  let emailId = 1;

  // Start date: 6 months ago
  const startDate = new Date('2024-06-01T09:00:00Z');
  let currentDate = new Date(startDate);

  threadStorylines.forEach((storyline, threadIndex) => {
    const threadId = `thread-${String(threadIndex + 1).padStart(3, '0')}`;
    let threadDate = new Date(currentDate);

    storyline.messages.forEach((message, messageIndex) => {
      const isFirstMessage = messageIndex === 0;
      const subject = isFirstMessage
        ? storyline.subject
        : `Re: ${storyline.subject}`;

      // Determine sender and recipient
      let from: string;
      let to: string;
      let direction: EmailDirection;

      if (message.from === 'user') {
        from = USER_EMAIL;
        to = storyline.recipient;
        direction = EmailDirection.OUTGOING;
      } else {
        from = senders?.[message.from]?.email ?? 'random@test.com';
        to = storyline.recipient;
        direction = EmailDirection.INCOMING;
      }

      const email: Email = {
        id: emailId++,
        threadId,
        subject,
        from,
        to,
        cc: null,
        bcc: null,
        content: message.content,
        isRead: message.isRead ?? true,
        isImportant: message.isImportant ?? false,
        isDeleted: false,
        direction,
        createdAt: new Date(threadDate),
        updatedAt: new Date(threadDate),
      };

      allEmails.push(email);

      // Add time gap between messages in thread (30 min to 2 days)
      const hoursGap = Math.random() * 48 + 0.5;
      threadDate = new Date(threadDate.getTime() + hoursGap * 60 * 60 * 1000);
    });

    // Add gap between threads (1-7 days)
    const daysGap = Math.random() * 6 + 1;
    currentDate = new Date(
      currentDate.getTime() + daysGap * 24 * 60 * 60 * 1000,
    );
  });

  return allEmails;
}

// Generate email data
export const emailData: Email[] = generateEmailData();

export const threads: Email[] = [];
const seenThreads: Set<string> = new Set();

const mostRecentEmails = [...emailData].sort(
  (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
);
for (const email of mostRecentEmails) {
  if (!seenThreads.has(email.threadId)) {
    threads.push(email);
    seenThreads.add(email.threadId);
  }
}

async function main() {
  console.log('🌱 Starting database seed...');

  // Check if data already exists to avoid duplicates
  const existingEmails = await db.select().from(emails);
  if (existingEmails.length > 0) {
    console.log('✅ Database already contains data. Skipping seed.');
    return;
  }

  const insertedEmails = await Promise.all(
    emailData.map((email) => db.insert(emails).values(email).returning()),
  );

  console.log(`✅ Created ${insertedEmails.length} emails`);
  console.log('🎉 Database seeding completed successfully!');
}

// Only run when executed directly (not when imported)
if (process.argv[1]?.includes('seed')) {
  main().catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  });
}
