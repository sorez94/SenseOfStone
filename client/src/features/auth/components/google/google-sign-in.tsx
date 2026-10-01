"use client";

import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { env } from "@/config/env";
import { useApiErrorMessage } from "@/hooks/use-api-error";
import { useServices } from "@/providers/services-context";
import { useSession } from "../../session";
import { MockGoogleButton } from "./mock-google-button";
import { RealGoogleButton } from "./real-google-button";

/**
 * "Continue with Google" for both login and register (the backend creates the account on first use).
 * Adapter selection: real Google Identity Services when NEXT_PUBLIC_GOOGLE_CLIENT_ID is set, mock otherwise.
 */
export function GoogleSignIn() {
  const t = useTranslations("auth");
  const services = useServices();
  const { signIn } = useSession();
  const errorMessage = useApiErrorMessage();

  const mutation = useMutation({
    mutationFn: (idToken: string) => services.auth.signInWithGoogle({ idToken }),
    onSuccess: (session) => {
      signIn(session);
      toast.success(t("signedIn"));
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <div className="relative">
      {env.googleClientId ? (
        <RealGoogleButton clientId={env.googleClientId} onCredential={(token) => mutation.mutate(token)} />
      ) : (
        <MockGoogleButton label={t("continueWithGoogle")} onCredential={(token) => mutation.mutate(token)} disabled={mutation.isPending} />
      )}
      {mutation.isPending ? (
        <div className="absolute inset-0 flex items-center justify-center rounded-md bg-white/70">
          <Spinner label={t("signingIn")} />
        </div>
      ) : null}
    </div>
  );
}
