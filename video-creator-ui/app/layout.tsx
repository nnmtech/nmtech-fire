import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Video Creator - AI-Powered Video Generation",
  description: "Create stunning videos with Remotion and AI",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-white antialiased">
        <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎬</span>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  Video Creator
                </span>
              </div>
              <div className="flex items-center gap-4">
                <a href="/" className="px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                  Home
                </a>
                <a href="/create" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors">
                  Create Video
                </a>
                <a href="/library" className="px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                  Library
                </a>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
