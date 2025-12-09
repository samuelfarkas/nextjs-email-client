import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import ThemeProvider from '../providers/ThemeProvider';
import QueryProvider from '../providers/QueryProvider';
import AppShell from '../components/AppShell';

export const metadata = {
  title: 'Email Client',
  description: 'Modern Email Client built with Next.js and Drizzle',
};

export default function RootLayout({
  list,
  thread,
}: {
  list: React.ReactNode;
  thread: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <InitColorSchemeScript attribute="class" />
        <AppRouterCacheProvider>
          <QueryProvider>
            <ThemeProvider>
              <AppShell list={list} thread={thread} />
            </ThemeProvider>
          </QueryProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
