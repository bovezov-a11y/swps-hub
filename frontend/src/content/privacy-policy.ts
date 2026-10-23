/**
 * The privacy policy shown at /privacy and accepted at sign-up.
 *
 * To change it in an update: edit the text below, raise `version`, set `lastUpdated`, and set the same version in
 * `app.privacy.policy-version` in backend/src/main/resources/application.yml. New sign-ups then accept the new
 * version, and each account records which version it accepted.
 */
export const privacyPolicy = {
  version: '1.0',
  lastUpdated: '23 October 2026',
  repositoryUrl: 'https://github.com/bovezov-a11y/swps-hub',
  sections: [
    {
      heading: 'Who we are',
      paragraphs: [
        'SWPS Hub is an unofficial project built and run by students. It is not affiliated with or endorsed by SWPS University, and the university does not receive or control your data.',
        'If you have a question about this policy or your data, contact the maintainer through the project page linked at the bottom of this policy.',
      ],
    },
    {
      heading: 'Nobody watches what you do',
      paragraphs: ['SWPS Hub is built so that other students cannot follow your activity:'],
      list: [
        'Files you share are anonymous. Other students see "Shared by a student", never your name.',
        'Other students see only totals, such as how many people joined a course or upvoted a file, never who did.',
        'Your courses, your calendar, your upvotes and your AI usage are visible only to you.',
        'Courses and events you add are visible to everyone, without your name.',
        'There are no public profiles, no follower lists and no "last seen" or activity status.',
      ],
    },
    {
      heading: 'What we collect',
      list: [
        'Account: your name, your university email address, and your password, which is stored only as a one-way hash that nobody can read back.',
        'What you add: courses and events you create, files you upload with their title and description, your upvotes, and the courses you join.',
        'Calendar: a secret link token if you use calendar sync. You can reset it at any time.',
        'AI usage: how many AI summaries or quizzes you started each day, to apply the daily limit.',
        'Technical: your login is kept in your browser\'s local storage on your device. Our server may keep short-lived technical logs, such as IP addresses and request times, to keep the service secure and working.',
      ],
    },
    {
      heading: 'What we never do',
      list: [
        'We do not show ads and we do not sell or rent your data.',
        'We do not use analytics, tracking pixels or advertising cookies.',
        'We do not send marketing emails. The only emails we send confirm your address.',
      ],
    },
    {
      heading: 'Who else processes your data',
      paragraphs: ['To run the service, some data passes through providers who process it on our behalf:'],
      list: [
        'Hosting: the server and database that store your account and files.',
        'Email delivery: the service that sends your confirmation email.',
        'AI study tools (only when enabled and only when you use them): the file you ask about is sent to Anthropic, which provides the Claude model that writes the summary or quiz. The result is stored and shown to everyone who opens that file.',
      ],
    },
    {
      heading: 'Why we may use your data',
      paragraphs: [
        'We process your data to provide the service you sign up for and, for security logs, because we have a legitimate interest in keeping the service safe. These are the legal bases under the EU General Data Protection Regulation (GDPR / RODO).',
      ],
    },
    {
      heading: 'How long we keep it',
      list: [
        'Your account data is kept while your account exists.',
        'Confirmation links expire after 24 hours.',
        'When an account is deleted, its personal data is removed. Files it shared may stay available to other students without any link to you, unless you ask us to remove them too.',
      ],
    },
    {
      heading: 'Your rights',
      paragraphs: [
        'You can ask to see, correct, export or delete your data, and you can object to how we use it. You also have the right to complain to the Polish data protection authority, the President of the Personal Data Protection Office (Prezes Urzędu Ochrony Danych Osobowych, UODO).',
      ],
    },
    {
      heading: 'Changes to this policy',
      paragraphs: [
        'We may update this policy as SWPS Hub changes. The version and date at the top show which policy is in force. When we make a significant change, we will tell you in the app and may ask you to accept the new version.',
      ],
    },
  ],
}
