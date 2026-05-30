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
  UploadCloud,
} from "lucide-react";

import { mockCandidateProfile, mockReport } from "../lib/mockData";
import type {
  CandidateProfile,
  CompanyStyle,
  InterviewReport,
} from "../types/interview";

export const DEMO_NOTICE = "当前服务异常，已切换到演示模式，不影响体验流程。";
export const FALLBACK_PROFILE_NOTICE = "当前使用示例档案完成演示，不影响后续体验流程。";

export const STORAGE_KEYS = {
  candidateProfile: "offercrash_candidateProfile",
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
    label: "字节数据压迫型",
    meetingLabel: "字节风格",
    interviewer: "字节产品经理面试官",
    title: "字节风格：数据压迫型面试官",
    traits: "节奏快、重视数据和结果、追问个人贡献、对空泛表达容忍度低",
    question: "你说提升了交易效率，具体提升了多少？",
  },
  tencent: {
    short: "腾讯",
    label: "腾讯用户价值型",
    meetingLabel: "腾讯风格",
    interviewer: "腾讯产品经理面试官",
    title: "腾讯风格：用户价值型面试官",
    traits: "重视用户体验、深挖用户需求、关注场景理解、追问协作推动",
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

export function getCandidateProfile() {
  return readJson<CandidateProfile>(STORAGE_KEYS.candidateProfile, mockCandidateProfile);
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
              <strong style={{ display: "block", color: "#111827" }}>OfferCrash</strong>
              <span className="oc-muted" style={{ display: "block", fontSize: 12 }}>
                PM 校招压力面试 Agent
              </span>
            </span>
          </Link>
          <div className="oc-stepper">
            {steps.map((step, index) => (
              <span key={step.path} className={`oc-step ${index <= currentIndex ? "is-active" : ""}`}>
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

export function PageShell({ children, narrow = false }: { children: ReactNode; narrow?: boolean }) {
  return (
    <main className="oc-shell" style={narrow ? { maxWidth: 980 } : undefined}>
      {children}
    </main>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return <span className="oc-tag">{children}</span>;
}

export function Card({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
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
  const features = [
    ["AI 主动提问", "不是聊天机器人，而是主动控场的面试官", <Bot key="bot" size={22} />],
    ["真实会议场景", "模拟腾讯会议式线上面试体验", <MonitorUp key="meeting" size={22} />],
    ["面试诊断报告", "输出等级、通过概率、崩点分析和优化建议", <ClipboardList key="report" size={22} />],
  ] as const;

  return (
    <AppFrame>
      <PageShell>
        <section className="oc-grid-hero">
          <div>
            <Tag>产品经理大厂校招压力面试 Agent</Tag>
            <h1 className="oc-h1">提前崩一次，正式面试少崩一次。</h1>
            <p className="oc-lead">
              上传 DOCX 简历，进入一场由 AI 面试官主动主持的产品经理校招语音压力面试。支持字节 / 腾讯风格，动态追问，面试后生成诊断报告。
            </p>
            <div className="oc-actions">
              <PrimaryButton href="/upload" icon={<Play size={18} />}>
                开始压力面试
              </PrimaryButton>
              <span className="oc-muted" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Check size={17} color="#2563eb" />
                Mock 流程可兜底演示
              </span>
            </div>
          </div>
          <Card style={{ padding: 20 }}>
            <MeetingPreview />
          </Card>
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

export function MeetingPreview() {
  return (
    <div style={{ border: "1px solid #dde7f8", borderRadius: 16, overflow: "hidden", background: "#f7f8fa" }}>
      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #dde7f8", background: "#fff", padding: "12px 14px", fontSize: 12 }} className="oc-muted">
        <span>会议详情 01:17（40分钟）</span>
        <span>宫格布局</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 150px" }}>
        <div style={{ minHeight: 280, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 36, padding: 24 }}>
          <div style={{ border: "1px solid #dde7f8", borderRadius: 12, background: "#eff6ff", color: "#111827", padding: 14, fontWeight: 700 }}>
            当前问题：请你用 1 分钟介绍一下你自己
          </div>
          <div style={{ display: "flex", gap: 64 }}>
            <PreviewAvatar label="David" />
            <PreviewAvatar label="我是谁" candidate />
          </div>
        </div>
        <div style={{ borderLeft: "1px solid #dde7f8", background: "#fff", padding: 16, fontSize: 12 }}>
          <strong style={{ color: "#111827" }}>面试实时记录</strong>
          <p style={{ color: "#2563eb", marginTop: 20 }}>AI｜开场</p>
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
        <strong>{candidate ? "是谁" : "D"}</strong>
      </div>
      <p style={{ color: "#111827", fontWeight: 700 }}>🔇 {label}</p>
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
            <p style={{ color: "#2563eb", fontSize: 13, fontWeight: 800 }}>目标岗位</p>
            <h2 style={{ color: "#111827", fontSize: 32, margin: "8px 0 18px" }}>{profile.targetRole}</h2>
            <p style={{ lineHeight: 1.8 }}>{profile.candidateSummary}</p>
            {profile.education && (
              <div className="oc-row">
                <p className="oc-muted" style={{ fontSize: 13, fontWeight: 700 }}>教育背景</p>
                <strong style={{ color: "#111827" }}>{profile.education}</strong>
              </div>
            )}
          </div>
          <div className="oc-profile-main">
            <h3 style={{ color: "#111827" }}>主要项目</h3>
            <div className="oc-project-grid">
              {profile.mainProjects.map((project) => (
                <div key={project.projectName} style={{ borderBottom: "1px solid #dde7f8", paddingBottom: 16 }}>
                  <h4 style={{ color: "#111827", marginBottom: 8 }}>{project.projectName}</h4>
                  <p style={{ lineHeight: 1.8 }}>{project.background}</p>
                  <p><strong>候选人角色：</strong>{project.userRole}</p>
                  <p><strong>项目结果：</strong>{project.result}</p>
                </div>
              ))}
            </div>
            <h3 style={{ color: "#111827", marginTop: 24 }}>系统识别风险点</h3>
            <div className="oc-risk-grid">
              {profile.overallRiskPoints.map((risk) => (
                <div key={risk} style={{ display: "flex", gap: 10, alignItems: "center", border: "1px solid #dde7f8", borderRadius: 14, padding: 14 }}>
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
