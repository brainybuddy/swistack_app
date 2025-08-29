import type { Metadata } from 'next';
import { AuthProvider } from '../contexts/AuthContext';
import { CollaborationProvider } from '../contexts/CollaborationContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'Swistack - Browser-based Coding Platform',
  description: 'Complete development environment in your browser',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CollaborationProvider>
            {children}
          </CollaborationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}