export const dynamic = "force-dynamic";
export const metadata = {
  title: "Server Component Error Demo",
  description: "Demonstration route for Exceptionless App Router server component failures."
};

export default function ServerComponentErrorPage() {
  throw new Error("Server component crash from the Exceptionless Next.js demo");
}
