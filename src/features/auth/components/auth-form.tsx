"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EyeOff, LockKeyhole, Mail, Sparkles, User } from "lucide-react";
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

const authText = {
  login: {
    title: "欢迎回来",
    subtitle: "登录账号，继续你的创作之旅",
    submit: "登录",
    lead: "还没有账号？",
    action: "立即注册",
  },
  register: {
    title: "创建账号",
    subtitle: "加入我们，开启你的创作之旅",
    submit: "注册",
    lead: "已有账号？",
    action: "立即登录",
  },
} satisfies Record<AuthMode, Record<string, string>>;

const inputClass =
  "h-10 rounded-[7px] border-[#dfe3f1] bg-white px-10 text-[13px] font-semibold text-[#080f33] shadow-none placeholder:text-[#8992b1] focus:ring-[#7357f6] 2xl:h-12 2xl:text-sm";

const hintClass = "mt-1.5 text-[11px] font-semibold text-[#7b84a3] 2xl:text-xs";

const iconClass =
  "pointer-events-none absolute left-4 top-1/2 size-3.5 -translate-y-1/2 text-[#7b84a3] 2xl:size-4";

export const AuthForm = ({ mode, locale }: AuthFormProps) => {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<AuthMode>(mode);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = viewMode === "register";
  const text = authText[viewMode];

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

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError("");
      setNotice("");

      if (isRegister && password !== confirmPassword) {
        setError("两次输入的密码不一致");
        return;
      }

      if (isRegister && !accepted) {
        setError("请先阅读并同意用户协议和隐私政策");
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
        setNotice("注册成功，请先到邮箱中点击确认链接，然后再登录。");
        return;
      }

      router.replace(`/${locale}/generate`);
      router.refresh();
    },
    [accepted, confirmPassword, email, isRegister, locale, password, router, username],
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
        className={`absolute inset-y-0 z-20 flex w-full items-center justify-center bg-white px-6 py-8 transition-[left] duration-500 ease-[cubic-bezier(.22,1,.36,1)] lg:w-[50%] lg:px-[7vw] lg:py-0 ${
          isRegister ? "left-1/2" : "left-0"
        }`}
      >
        <svg
          className={`pointer-events-none absolute inset-y-0 hidden h-full w-[86px] lg:block ${
            isRegister ? "left-[-84px]" : "right-[-84px]"
          }`}
          viewBox="0 0 86 1000"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {isRegister ? (
            <>
              <path
                d="M86 0 H16 C28 280 28 720 4 1000 H86 Z"
                fill="#e9e3ff"
              />
              <path d="M86 0 H16 C41 280 41 720 16 1000 H86 Z" fill="white" />
            </>
          ) : (
            <>
              <path
                d="M0 0 H70 C58 280 58 720 82 1000 H0 Z"
                fill="#e9e3ff"
              />
              <path d="M0 0 H70 C45 280 45 720 70 1000 H0 Z" fill="white" />
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
                    placeholder="用户名"
                    className={inputClass}
                    onChange={(event) => setUsername(event.target.value)}
                  />
                </div>
                <p className={hintClass}>用户名支持 3-20 位字母、数字或下划线</p>
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
                  placeholder={isRegister ? "邮箱地址" : "邮箱或用户名"}
                  className={inputClass}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              {isRegister ? <p className={hintClass}>我们将发送验证邮件到此邮箱</p> : null}
            </div>

            <div>
              <div className="relative">
                <LockKeyhole className={iconClass} />
                <Input
                  type="password"
                  value={password}
                  required
                  minLength={6}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  placeholder={isRegister ? "设置密码" : "密码"}
                  className={inputClass}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <EyeOff className="pointer-events-none absolute right-4 top-1/2 size-3.5 -translate-y-1/2 text-[#7b84a3] 2xl:size-4" />
              </div>
              {isRegister ? <p className={hintClass}>密码需包含至少 8 位字符，包含字母和数字</p> : null}
            </div>

            {isRegister ? (
              <div>
                <div className="relative">
                  <LockKeyhole className={iconClass} />
                  <Input
                    type="password"
                    value={confirmPassword}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    placeholder="确认密码"
                    className={inputClass}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                  <EyeOff className="pointer-events-none absolute right-4 top-1/2 size-3.5 -translate-y-1/2 text-[#7b84a3] 2xl:size-4" />
                </div>
                <p className={hintClass}>请再次输入密码</p>
              </div>
            ) : null}

            {isRegister ? (
              <label className="flex items-center gap-2.5 pt-1 text-xs font-semibold text-[#7b84a3] 2xl:text-sm">
                <input
                  type="checkbox"
                  checked={accepted}
                  className="size-3.5 accent-[#6a45ef] 2xl:size-4"
                  onChange={(event) => setAccepted(event.target.checked)}
                />
                <span>
                  我已阅读并同意
                  <span className="text-[#5b3ee8]">《用户协议》</span>
                  和
                  <span className="text-[#5b3ee8]">《隐私政策》</span>
                </span>
              </label>
            ) : (
              <div className="flex items-center justify-between pt-1 text-xs font-semibold 2xl:text-sm">
                <label className="flex items-center gap-2.5 text-[#7b84a3]">
                  <input
                    type="checkbox"
                    checked={remember}
                    className="size-3.5 accent-[#6a45ef] 2xl:size-4"
                    onChange={(event) => setRemember(event.target.checked)}
                  />
                  记住我
                </label>
                <button type="button" className="text-[#5b3ee8]">
                  忘记密码？
                </button>
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
