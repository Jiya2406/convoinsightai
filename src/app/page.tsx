import { redirect } from "next/navigation";

// Root route sends users into the platform; the dashboard layout enforces auth.
export default function Home() {
  redirect("/dashboard");
}
