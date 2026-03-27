import "./globals.css";

export const metadata = {
  title: "Exceptionless for Next.js",
  description: "A small reference app for Exceptionless client and server monitoring in Next.js."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
