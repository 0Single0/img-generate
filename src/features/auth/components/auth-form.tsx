"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Mail, Sparkles, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import type { Locale } from "@/lib/i18n/routing";

type AuthMode = "login" | "register";

type AuthFormProps = {
  mode: AuthMode;
  locale: Locale;
};

const inputClass =
  "h-9 rounded-[7px] border-[#dfe3f1] bg-white px-10 text-xs font-semibold text-[#080f33] shadow-none placeholder:text-[#8992b1] focus:ring-[#7357f6] sm:h-10 sm:text-[13px] 2xl:h-12 2xl:text-sm";

const hintClass = "mt-1.5 text-[11px] font-semibold text-[#7b84a3] 2xl:text-xs";

const iconClass =
  "pointer-events-none absolute left-4 top-1/2 size-3.5 -translate-y-1/2 text-[#7b84a3] 2xl:size-4";

const passwordToggleClass =
  "absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-[#7b84a3] transition-colors hover:text-[#5b3ee8] focus:outline-none focus:ring-2 focus:ring-[#7357f6] 2xl:size-9";

const passwordToggleIconClass = "size-3.5 2xl:size-4";

export const AuthForm = ({ mode, locale }: AuthFormProps) => {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [viewMode, setViewMode] = useState<AuthMode>(mode);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  const isRegister = viewMode === "register";
  const text = useMemo(
    () =>
      isRegister
        ? {
            title: t("createAccount"),
            subtitle: t("createAccountSubtitle"),
            submit: t("register"),
            lead: t("loginLead"),
            action: t("loginAction"),
          }
        : {
            title: t("welcomeBack"),
            subtitle: t("welcomeSubtitle"),
            submit: t("login"),
            lead: t("registerLead"),
            action: t("registerAction"),
          },
    [isRegister, t],
  );

  const alternateHref = useMemo(
    () => (isRegister ? `/${locale}/login` : `/${locale}/register`),
    [isRegister, locale],
  );

  const handleModeSwitch = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      const nextMode: AuthMode = isRegister ? "login" : "register";
      setError("");
      setNotice("");
      setViewMode(nextMode);
      window.setTimeout(() => router.push(`/${locale}/${nextMode}`), 520);
    },
    [isRegister, locale, router],
  );

  const handleTogglePasswordVisibility = useCallback(() => {
    setIsPasswordVisible((visible) => !visible);
  }, []);

  const handleToggleConfirmPasswordVisibility = useCallback(() => {
    setIsConfirmPasswordVisible((visible) => !visible);
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError("");
      setNotice("");

      if (isRegister && password !== confirmPassword) {
        setError(t("passwordMismatch"));
        return;
      }

      setIsSubmitting(true);

      const supabase = createClient();
      const result = isRegister
        ? await supabase.auth.signUp({
            email,
            password,
            options: { data: { username } },
          })
        : await supabase.auth.signInWithPassword({ email, password });

      setIsSubmitting(false);

      if (result.error) {
        setError(result.error.message);
        return;
      }

      if (isRegister && !result.data.session) {
        setNotice(t("registerSuccessNotice"));
        return;
      }

      router.replace(`/${locale}/generate`);
      router.refresh();
    },
    [confirmPassword, email, isRegister, locale, password, router, t, username],
  );

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-[#f8f8ff]">
      <Image
        src="/imgs/login-back.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />

      <div
        className={`absolute inset-y-0 z-20 flex w-full items-center justify-center bg-white px-6 py-8 transition-[left] duration-500 ease-[cubic-bezier(.22,1,.36,1)] lg:w-[50%] lg:bg-transparent lg:px-[7vw] lg:py-0 ${
          isRegister ? "left-1/2" : "left-0"
        }`}
      >
        <svg
          className={`pointer-events-none absolute inset-y-0 hidden h-full w-[calc(100%+160px)] lg:block ${
            isRegister ? "right-0" : "left-0"
          }`}
          viewBox="0 0 880 1000"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {isRegister ? (
            <>
              <path
                d="M96 0 C128 210 150 405 148 560 C146 725 126 875 98 1000 L115 1000 C142 875 164 725 166 560 C168 405 144 210 112 0 Z"
                fill="#e9e3ff"
              />
              <path
                d="M880 0 H112 C144 210 168 405 166 560 C164 725 142 875 115 1000 H880 Z"
                fill="white"
              />
            </>
          ) : (
            <>
              <path
                d="M768 0 C736 210 712 405 714 560 C716 725 738 875 765 1000 L782 1000 C754 875 734 725 732 560 C730 405 752 210 784 0 Z"
                fill="#e9e3ff"
              />
              <path
                d="M0 0 H768 C736 210 712 405 714 560 C716 725 738 875 765 1000 H0 Z"
                fill="white"
              />
            </>
          )}
        </svg>

        <div className="relative z-10 w-full max-w-[390px] 2xl:max-w-[460px]">
          <div className="mb-6 flex items-center gap-3 2xl:mb-8">
            <div className="flex size-11 items-center justify-center rounded-[11px] bg-gradient-to-br from-[#70a5ff] to-[#6638e8] text-white 2xl:size-12">
              <Sparkles className="size-6 fill-white 2xl:size-7" />
            </div>
            <div>
              <p className="text-[22px] font-bold leading-none tracking-normal text-[#080f33] 2xl:text-2xl">
                Image2Gen
              </p>
              <p className="mt-1 text-xs font-semibold text-[#8790ad] 2xl:text-sm">
                AI Image Generator
              </p>
            </div>
          </div>

          <div className="mb-5 2xl:mb-7">
            <h1 className="text-[25px] font-bold leading-tight tracking-normal text-[#080f33] 2xl:text-[30px]">
              {text.title}
            </h1>
            <p className="mt-2 text-sm font-semibold text-[#7b84a3] 2xl:text-base">
              {text.subtitle}
            </p>
          </div>

          <form className="space-y-3 2xl:space-y-3.5" onSubmit={handleSubmit}>
            {isRegister ? (
              <div>
                <div className="relative">
                  <User className={iconClass} />
                  <Input
                    value={username}
                    required
                    minLength={3}
                    maxLength={20}
                    placeholder={t("username")}
                    className={inputClass}
                    onChange={(event) => setUsername(event.target.value)}
                  />
                </div>
                <p className={hintClass}>{t("usernameHint")}</p>
              </div>
            ) : null}

            <div>
              <div className="relative">
                {isRegister ? <Mail className={iconClass} /> : <User className={iconClass} />}
                <Input
                  type="email"
                  value={email}
                  required
                  autoComplete="email"
                  placeholder={isRegister ? t("emailAddress") : t("emailOrUsername")}
                  className={inputClass}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <LockKeyhole className={iconClass} />
                <Input
                  type={isPasswordVisible ? "text" : "password"}
                  value={password}
                  required
                  minLength={6}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  placeholder={isRegister ? t("setPassword") : t("password")}
                  className={inputClass}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  aria-label={isPasswordVisible ? t("hidePassword") : t("showPassword")}
                  title={isPasswordVisible ? t("hidePassword") : t("showPassword")}
                  className={passwordToggleClass}
                  onClick={handleTogglePasswordVisibility}
                >
                  {isPasswordVisible ? (
                    <EyeOff className={passwordToggleIconClass} />
                  ) : (
                    <Eye className={passwordToggleIconClass} />
                  )}
                </button>
              </div>
              {isRegister ? <p className={hintClass}>{t("passwordHint")}</p> : null}
            </div>

            {isRegister ? (
              <div>
                <div className="relative">
                  <LockKeyhole className={iconClass} />
                  <Input
                    type={isConfirmPasswordVisible ? "text" : "password"}
                    value={confirmPassword}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    placeholder={t("confirmPassword")}
                    className={inputClass}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    aria-label={isConfirmPasswordVisible ? t("hidePassword") : t("showPassword")}
                    title={isConfirmPasswordVisible ? t("hidePassword") : t("showPassword")}
                    className={passwordToggleClass}
                    onClick={handleToggleConfirmPasswordVisibility}
                  >
                    {isConfirmPasswordVisible ? (
                      <EyeOff className={passwordToggleIconClass} />
                    ) : (
                      <Eye className={passwordToggleIconClass} />
                    )}
                  </button>
                </div>
                <p className={hintClass}>{t("confirmPasswordHint")}</p>
              </div>
            ) : null}

            {isRegister ? null : (
              <div className="flex items-center justify-between pt-1 text-xs font-semibold 2xl:text-sm">
                <label className="flex items-center gap-2.5 text-[#7b84a3]">
                  <input
                    type="checkbox"
                    checked={remember}
                    className="size-3.5 accent-[#6a45ef] 2xl:size-4"
                    onChange={(event) => setRemember(event.target.checked)}
                  />
                  {t("rememberMe")}
                </label>
              </div>
            )}

            {error ? <p className="text-sm font-semibold text-destructive">{error}</p> : null}
            {notice ? <p className="text-sm font-semibold text-primary">{notice}</p> : null}

            <Button
              className="h-10 w-full rounded-[7px] bg-[#6537e8] text-sm font-bold text-white shadow-none hover:bg-[#5730d0] 2xl:h-12 2xl:text-base"
              disabled={isSubmitting}
            >
              {text.submit}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm font-semibold text-[#7b84a3] 2xl:mt-6 2xl:text-base">
            {text.lead}
            <Link href={alternateHref} onClick={handleModeSwitch} className="ml-2 text-[#5b3ee8]">
              {text.action}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
};
