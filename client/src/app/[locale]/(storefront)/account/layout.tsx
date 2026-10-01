import { Container } from "@/components/ui/section-title";
import { AccountNav } from "@/features/auth/components/account-nav";
import { RequireAuth } from "@/features/auth/components/require-auth";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <Container className="max-w-5xl py-10 lg:py-16">
      <AccountNav />
      <RequireAuth>{children}</RequireAuth>
    </Container>
  );
}
