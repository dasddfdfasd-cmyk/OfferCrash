"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  Check,
  ClipboardList,
  FileText,
  Home,
  MonitorUp,
  Play,
  RefreshCw,
  ShieldQuestion,
  Sparkles,
  UploadCloud,
} from "lucide-react";

import { mockCandidateProfile, mockReport } from "@/lib/mockData";
import type {
  CandidateProfile,
  CompanyStyle,
  InterviewReport,
} from "@/types/interview";

export const DEMO_NOTICE =
  "当前服务异常，已切换到演示模式，不影响体验流程。";
export const FALLBACK_PROFILE_NOTICE =
  "当前使用示例档案完成演示，不影响后续体验流程。";

export const STORAGE_KEYS = {
  candidateProfile: "offercrash_candidateProfile",
  interviewMode: "offercrash_interviewMode",
  instantRole: "offercrash_instantRole",
  profileFallback: "offercrash_profileFallback",
  companyStyle: "offercrash_companyStyle",
  report: "offercrash_report",
  reportFallback: "offercrash_reportFallback",
  rawText: "offercrash_rawText",
};

export const companyProfiles: Record<
  CompanyStyle,
  {
    short: string;
    label: string;
    meetingLabel: string;
    interviewer: string;
    title: string;
    traits: string;
    question: string;
  }
> = {
  bytedance: {
    short: "字节",
    label: "字节数据高压型",
    meetingLabel: "字节风格",
    interviewer: "字节产品经理面试官",
    title: "字节风格：数据高压型面试官",
    traits: "节奏快、重视数据和结果、追问个人贡献，对空泛表达容忍度低。",
    question: "你说提升了交易效率，具体提升了多少？",
  },
  tencent: {
    short: "腾讯",
    label: "腾讯用户价值型",
    meetingLabel: "腾讯风格",
    interviewer: "腾讯产品经理面试官",
    title: "腾讯风格：用户价值型面试官",
    traits: "重视用户体验、深挖用户需求、关注场景理解和协作推进。",
    question: "你怎么判断这是用户真实需求？",
  },
};

const steps = [
  { path: "/", label: "首页" },
  { path: "/upload", label: "上传" },
  { path: "/profile", label: "档案" },
  { path: "/config", label: "配置" },
  { path: "/meeting", label: "会议" },
  { path: "/report", label: "报告" },
];

export function isDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

export function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Keep the flow usable if localStorage is unavailable.
  }
}

export function readText(key: string, fallback = "") {
  if (typeof window === "undefined") return fallback;
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeText(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Keep the flow usable if localStorage is unavailable.
  }
}

export function removeStoredValue(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Keep the flow usable if localStorage is unavailable.
  }
}

export function getCandidateProfile() {
  return readJson<CandidateProfile>(
    STORAGE_KEYS.candidateProfile,
    mockCandidateProfile,
  );
}

export function getCompanyStyle(): CompanyStyle {
  const value = readText(STORAGE_KEYS.companyStyle, "bytedance");
  return value === "tencent" ? "tencent" : "bytedance";
}

export function getReport() {
  return readJson<InterviewReport>(STORAGE_KEYS.report, mockReport);
}

export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.path === pathname),
  );

  return (
    <div className="oc-page">
      <header className="oc-topnav">
        <div className="oc-topnav-inner">
          <Link className="oc-brand" href="/">
            <span className="oc-logo">
              <BriefcaseBusiness size={20} />
            </span>
            <span>
              <strong style={{ display: "block", color: "#111827" }}>
                OfferCrash
              </strong>
              <span className="oc-muted" style={{ display: "block", fontSize: 12 }}>
                PM 校招压力面试 Agent
              </span>
            </span>
          </Link>
          <div className="oc-stepper">
            {steps.map((step, index) => (
              <span
                key={step.path}
                className={`oc-step ${index <= currentIndex ? "is-active" : ""}`}
              >
                {step.label}
              </span>
            ))}
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}

export function PageShell({
  children,
  narrow = false,
}: {
  children: ReactNode;
  narrow?: boolean;
}) {
  return (
    <main className="oc-shell" style={narrow ? { maxWidth: 980 } : undefined}>
      {children}
    </main>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return <span className="oc-tag">{children}</span>;
}

export function Card({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <section className={`oc-card ${className}`} style={style}>
      {children}
    </section>
  );
}

export function PrimaryButton({
  children,
  onClick,
  href,
  icon,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  icon?: ReactNode;
  disabled?: boolean;
}) {
  if (href) {
    return (
      <Link className="oc-primary" href={href}>
        {children}
        {icon ?? <ArrowRight size={18} />}
      </Link>
    );
  }

  return (
    <button className="oc-primary" disabled={disabled} onClick={onClick}>
      {children}
      {icon ?? <ArrowRight size={18} />}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  href,
  icon,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  icon?: ReactNode;
  disabled?: boolean;
}) {
  if (href) {
    return (
      <Link className="oc-secondary" href={href}>
        {icon}
        {children}
      </Link>
    );
  }

  return (
    <button className="oc-secondary" disabled={disabled} onClick={onClick}>
      {icon}
      {children}
    </button>
  );
}

export function HomePage() {
  const router = useRouter();
  const features = [
    [
      "AI 主动提问",
      "不是聊天机器人，而是主动控场的压力面试官。",
      <Bot key="bot" size={22} />,
    ],
    [
      "真实会议场景",
      "模拟腾讯会议式线上面试体验，保留会议栏、头像、问题和记录区。",
      <MonitorUp key="meeting" size={22} />,
    ],
    [
      "面试诊断报告",
      "输出等级、通过概率、崩点分析、优化答案和训练计划。",
      <ClipboardList key="report" size={22} />,
    ],
  ] as const;

  const startResumeInterview = () => {
    writeText(STORAGE_KEYS.interviewMode, "resume");
    removeStoredValue(STORAGE_KEYS.instantRole);
    router.push("/upload");
  };

  const startInstantInterview = () => {
    writeText(STORAGE_KEYS.interviewMode, "instant");
    router.push("/config");
  };

  return (
    <AppFrame>
      <PageShell>
        <section className="oc-grid-hero">
          <div>
            <Tag>产品经理大厂校招压力面试 Agent</Tag>
            <h1 className="oc-h1" style={{ letterSpacing: "0.04em" }}>
              专为大厂校招打造的 Agent 面试官
            </h1>
            <p className="oc-lead">
              从简历解析、语音面试、动态追问到诊断报告，OfferCrash 帮助产品经理候选人在正式面试前完成一次真实的高压预演。
            </p>
            <div className="oc-actions">
              <PrimaryButton onClick={startResumeInterview} icon={<Play size={18} />}>
                开始压力面试
              </PrimaryButton>
              <SecondaryButton onClick={startInstantInterview} icon={<Sparkles size={17} />}>
                即兴面试
              </SecondaryButton>
              <span
                className="oc-muted"
                style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
              >
                <Check size={17} color="#2563eb" />
                Mock 数据可兜底演示
              </span>
            </div>
          </div>
          <HeroShowcase />
        </section>
        <section className="oc-feature-grid">
          {features.map(([title, desc, icon]) => (
            <Card className="oc-feature" key={title}>
              <div className="oc-feature-icon">{icon}</div>
              <h2 style={{ color: "#111827", marginTop: 18 }}>{title}</h2>
              <p className="oc-muted" style={{ lineHeight: 1.8 }}>
                {desc}
              </p>
            </Card>
          ))}
        </section>
      </PageShell>
    </AppFrame>
  );
}

function HeroShowcase() {
  return (
    <div style={{ position: "relative", minHeight: 500, padding: "20px 0 18px" }}>
      <div
        style={{
          position: "absolute",
          inset: "18px 0 0 18px",
          borderRadius: 36,
          background:
            "radial-gradient(circle at 48% 38%, rgba(37,99,235,.16), transparent 42%), radial-gradient(circle at 76% 72%, rgba(96,165,250,.15), transparent 36%)",
          filter: "blur(8px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "46px 28px 34px 48px",
          borderRadius: 30,
          backgroundImage:
            "linear-gradient(rgba(37,99,235,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,.055) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.55,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          marginLeft: 0,
          marginTop: 6,
          overflow: "hidden",
          border: "1px solid rgba(147,197,253,.76)",
          borderRadius: 28,
          background: "rgba(255,255,255,.94)",
          boxShadow: "0 26px 70px rgba(37,99,235,.18), 0 8px 28px rgba(15,23,42,.08)",
          transform: "perspective(1100px) rotateY(-3deg) rotateX(1deg)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #e6eefb",
            background: "linear-gradient(180deg, #fff, #f8fbff)",
            padding: "14px 18px",
            fontSize: 13,
          }}
        >
          <strong style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#2563eb" }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: "#2563eb",
                boxShadow: "0 0 0 5px rgba(37,99,235,.12)",
              }}
            />
            AI 压力面试进行中
          </strong>
          <span className="oc-muted" style={{ display: "inline-flex", alignItems: "center", gap: 14 }}>
            <span>语音模式</span>
            <span style={{ color: "#ef4444" }}>●</span>
            <span>01:17</span>
          </span>
          <span
            style={{
              border: "1px solid #dde7f8",
              borderRadius: 999,
              padding: "7px 12px",
              color: "#111827",
              fontWeight: 700,
              background: "#fff",
            }}
          >
            结束面试
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 205px", minHeight: 370, background: "#f7faff" }}>
          <div style={{ display: "grid", gridTemplateRows: "auto 1fr", gap: 28, padding: "32px 28px 30px" }}>
            <div
              style={{
                border: "1px solid #dbeafe",
                borderRadius: 18,
                background: "#fff",
                padding: "18px 20px",
                boxShadow: "0 16px 34px rgba(37,99,235,.10)",
              }}
            >
              <span className="oc-muted" style={{ fontSize: 12 }}>当前问题 · 1/8</span>
              <h3 style={{ margin: "10px 0 12px", color: "#111827", fontSize: 19 }}>
                当前问题：请你用 1 分钟介绍一下你自己
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {[16, 22, 28, 19, 13, 9, 7, 7].map((height, index) => (
                  <span
                    key={index}
                    style={{
                      width: 4,
                      height,
                      borderRadius: 999,
                      background: index < 5 ? "#2563eb" : "#dbeafe",
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 70 }}>
              <HeroAvatar label="David" subLabel="候选人" />
              <HeroAvatar ai label="AI 面试官" subLabel="正在发言" />
            </div>
          </div>

          <div
            style={{
              borderLeft: "1px solid #e5eefb",
              background: "rgba(255,255,255,.9)",
              padding: 18,
              fontSize: 12,
            }}
          >
            <strong style={{ color: "#111827" }}>面试实时记录</strong>
            <HeroRecord time="01:05" role="AI 开场" text="请你用 1 分钟介绍一下你自己" />
            <HeroRecord time="01:12" role="候选人回答" text="我叫 David，主要做过校园二手交易项目..." />
            <HeroRecord active time="01:17" role="AI 追问" text="你在这个项目中遇到的最大挑战是什么？" />
            <a style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10, color: "#2563eb", fontWeight: 700 }}>
              查看完整记录 <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </div>

      <HeroFloatingCard style={{ left: -18, bottom: 104, width: 174 }}>
        <strong style={{ display: "flex", alignItems: "center", gap: 8, color: "#111827" }}>
          <MonitorUp size={16} color="#2563eb" />
          语音模式
        </strong>
        <p className="oc-muted" style={{ margin: "9px 0 10px", fontSize: 12 }}>
          AI 正在倾听并分析回答
        </p>
        <div style={{ display: "flex", alignItems: "end", gap: 4, height: 22 }}>
          {[7, 11, 17, 22, 14, 19, 10, 8].map((height, index) => (
            <span
              key={index}
              style={{
                width: 4,
                height,
                borderRadius: 999,
                background: index % 2 === 0 ? "#bfdbfe" : "#2563eb",
              }}
            />
          ))}
        </div>
      </HeroFloatingCard>

      <HeroFloatingCard style={{ right: -18, bottom: -10, width: 208 }}>
        <strong style={{ display: "flex", alignItems: "center", gap: 8, color: "#111827" }}>
          <ClipboardList size={16} color="#2563eb" />
          面试诊断预览
        </strong>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
          <div>
            <div style={{ color: "#2563eb", fontSize: 32, fontWeight: 900 }}>A</div>
            <span className="oc-muted" style={{ fontSize: 12 }}>综合等级</span>
          </div>
          <div
            style={{
              width: 62,
              height: 62,
              borderRadius: 999,
              display: "grid",
              placeItems: "center",
              color: "#111827",
              fontWeight: 900,
              background: "conic-gradient(#2563eb 0 68%, #e5eefb 68% 100%)",
            }}
          >
            <span style={{ width: 46, height: 46, borderRadius: 999, display: "grid", placeItems: "center", background: "#fff" }}>
              68%
            </span>
          </div>
        </div>
        <p className="oc-muted" style={{ margin: "12px 0 0", fontSize: 12, lineHeight: 1.6 }}>
          待提升：数据意识、个人贡献表达
        </p>
      </HeroFloatingCard>
    </div>
  );
}

function HeroRecord({
  active,
  role,
  text,
  time,
}: {
  active?: boolean;
  role: string;
  text: string;
  time: string;
}) {
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", color: active ? "#2563eb" : "#64748b" }}>
        <span>{time}</span>
        <strong>{role}</strong>
      </div>
      <p className="oc-muted" style={{ margin: "6px 0 0", lineHeight: 1.55 }}>
        {text}
      </p>
    </div>
  );
}

function HeroFloatingCard({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        position: "absolute",
        zIndex: 4,
        border: "1px solid rgba(191,219,254,.9)",
        borderRadius: 18,
        background: "rgba(255,255,255,.88)",
        boxShadow: "0 18px 45px rgba(37,99,235,.16), 0 8px 22px rgba(15,23,42,.08)",
        backdropFilter: "blur(12px)",
        padding: 16,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function HeroAvatar({ ai, label, subLabel }: { ai?: boolean; label: string; subLabel: string }) {
  return (
    <div style={{ position: "relative", textAlign: "center" }}>
      <div
        style={{
          position: "relative",
          width: 94,
          height: 94,
          borderRadius: 999,
          display: "grid",
          placeItems: "center",
          color: ai ? "#fff" : "#2563eb",
          background: ai ? "linear-gradient(135deg, #2563eb, #60a5fa)" : "#fff",
          border: ai ? "8px solid #dbeafe" : "8px solid #e5eefb",
          boxShadow: "0 16px 38px rgba(37,99,235,.16)",
        }}
      >
        {ai && (
          <span
            style={{
              position: "absolute",
              inset: -16,
              border: "2px solid rgba(37,99,235,.35)",
              borderRadius: 999,
              animation: "oc-pulse 1.6s ease-out infinite",
            }}
          />
        )}
        {ai ? <Bot size={38} /> : <BriefcaseBusiness size={34} />}
      </div>
      <strong style={{ display: "block", marginTop: 12, color: "#111827" }}>{label}</strong>
      <span className="oc-tag" style={{ marginTop: 6 }}>
        {subLabel}
      </span>
    </div>
  );
}

export function MeetingPreview() {
  return (
    <div
      style={{
        border: "1px solid #dde7f8",
        borderRadius: 16,
        overflow: "hidden",
        background: "#f7f8fa",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          borderBottom: "1px solid #dde7f8",
          background: "#fff",
          padding: "12px 14px",
          fontSize: 12,
        }}
        className="oc-muted"
      >
        <span>会议详情 01:17</span>
        <span>宫格布局</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 150px" }}>
        <div
          style={{
            minHeight: 280,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: 36,
            padding: 24,
          }}
        >
          <div
            style={{
              border: "1px solid #dde7f8",
              borderRadius: 12,
              background: "#eff6ff",
              color: "#111827",
              padding: 14,
              fontWeight: 700,
            }}
          >
            当前问题：请你用 1 分钟介绍一下你自己
          </div>
          <div style={{ display: "flex", gap: 64 }}>
            <PreviewAvatar label="David" />
            <PreviewAvatar label="我是谁" candidate />
          </div>
        </div>
        <div
          style={{
            borderLeft: "1px solid #dde7f8",
            background: "#fff",
            padding: 16,
            fontSize: 12,
          }}
        >
          <strong style={{ color: "#111827" }}>面试实时记录</strong>
          <p style={{ color: "#2563eb", marginTop: 20 }}>AI：开场</p>
          <p className="oc-muted">请你介绍一下你自己...</p>
        </div>
      </div>
    </div>
  );
}

function PreviewAvatar({ label, candidate }: { label: string; candidate?: boolean }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div className={`oc-avatar ${candidate ? "oc-avatar-candidate" : ""}`}>
        <strong>{candidate ? "我" : "D"}</strong>
      </div>
      <p style={{ color: "#111827", fontWeight: 700 }}>{label}</p>
    </div>
  );
}

export function BackToHome() {
  return (
    <SecondaryButton href="/" icon={<ArrowLeft size={17} />}>
      返回首页
    </SecondaryButton>
  );
}

export function ProfileSummary({
  profile,
  showFallbackNotice,
}: {
  profile: CandidateProfile;
  showFallbackNotice?: boolean;
}) {
  return (
    <>
      {showFallbackNotice && <div className="oc-alert">{FALLBACK_PROFILE_NOTICE}</div>}
      <Card style={{ marginTop: 28, overflow: "hidden" }}>
        <div className="oc-info-grid">
          <div className="oc-profile-side">
            <p style={{ color: "#2563eb", fontSize: 13, fontWeight: 800 }}>
              目标岗位
            </p>
            <h2 style={{ color: "#111827", fontSize: 32, margin: "8px 0 18px" }}>
              {profile.targetRole}
            </h2>
            <p style={{ lineHeight: 1.8 }}>{profile.candidateSummary}</p>
            {profile.education && (
              <div className="oc-row">
                <p className="oc-muted" style={{ fontSize: 13, fontWeight: 700 }}>
                  教育背景
                </p>
                <strong style={{ color: "#111827" }}>{profile.education}</strong>
              </div>
            )}
          </div>
          <div className="oc-profile-main">
            <h3 style={{ color: "#111827" }}>主要项目</h3>
            <div className="oc-project-grid">
              {profile.mainProjects.map((project) => (
                <div
                  key={project.projectName}
                  style={{ borderBottom: "1px solid #dde7f8", paddingBottom: 16 }}
                >
                  <h4 style={{ color: "#111827", marginBottom: 8 }}>
                    {project.projectName}
                  </h4>
                  <p style={{ lineHeight: 1.8 }}>{project.background}</p>
                  <p>
                    <strong>候选人角色：</strong>
                    {project.userRole}
                  </p>
                  <p>
                    <strong>项目结果：</strong>
                    {project.result}
                  </p>
                </div>
              ))}
            </div>
            <h3 style={{ color: "#111827", marginTop: 24 }}>系统识别风险点</h3>
            <div className="oc-risk-grid">
              {profile.overallRiskPoints.map((risk) => (
                <div
                  key={risk}
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    border: "1px solid #dde7f8",
                    borderRadius: 14,
                    padding: 14,
                  }}
                >
                  <ShieldQuestion size={18} color="#2563eb" />
                  <span>{risk}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}

export function useGoProfileWithMock() {
  const router = useRouter();
  return () => {
    writeText(STORAGE_KEYS.interviewMode, "resume");
    removeStoredValue(STORAGE_KEYS.instantRole);
    writeJson(STORAGE_KEYS.candidateProfile, mockCandidateProfile);
    writeText(STORAGE_KEYS.profileFallback, "true");
    router.push("/profile");
  };
}

export function UploadIcon() {
  return <UploadCloud size={30} />;
}

export function FileIcon() {
  return <FileText size={18} />;
}

export function RestartIcon() {
  return <RefreshCw size={18} />;
}

export function HomeIcon() {
  return <Home size={18} />;
}
