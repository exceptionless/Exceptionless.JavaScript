export const dynamic = "force-dynamic";

export default function ServerComponentErrorPage() {
  throw new Error("Server component crash from the Exceptionless Next.js demo");
}
