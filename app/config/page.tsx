"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, MonitorUp } from "lucide-react";

import {
  AppFrame,
  Card,
  PageShell,
  PrimaryButton,
  STORAGE_KEYS,
  Tag,
  companyProfiles,
  getCandidateProfile,
  getCompanyStyle,
  readText,
  writeJson,
  writeText,
} from "@/components/offercrash-shared";
import {
  buildInstantCandidateProfile,
  instantRoleConfigs,
  mockCandidateProfile,
} from "@/lib/mockData";
import type {
  CandidateProfile,
  CompanyStyle,
  InstantRole,
  InterviewSourceMode,
} from "@/types/interview";

export default function ConfigPage() {
  const router = useRouter();
  const [selectedCompany, setSelectedCompany] =
    useState<CompanyStyle>("bytedance");
  const [profile, setProfile] = useState<CandidateProfile>(mockCandidateProfile);
  const [sourceMode, setSourceMode] = useState<InterviewSourceMode>("resume");
  const [selectedRole, setSelectedRole] = useState<InstantRole>("product");

  useEffect(() => {
    setSelectedCompany(getCompanyStyle());
    const mode =
      readText(STORAGE_KEYS.interviewMode, "resume") === "instant"
        ? "instant"
        : "resume";
    setSourceMode(mode);

    if (mode === "instant") {
      const storedRole = readText(STORAGE_KEYS.instantRole, "product");
      const role: InstantRole =
        storedRole === "operation" || storedRole === "developer"
          ? storedRole
          : "product";
      const instantProfile = buildInstantCandidateProfile(role);
      setSelectedRole(role);
      setProfile(instantProfile);
      writeText(STORAGE_KEYS.instantRole, role);
      writeJson(STORAGE_KEYS.candidateProfile, instantProfile);
      return;
    }

    setProfile(getCandidateProfile());
  }, []);

  const selectCompany = (style: CompanyStyle) => {
    setSelectedCompany(style);
    writeText(STORAGE_KEYS.companyStyle, style);
  };

  const selectRole = (role: InstantRole) => {
    const instantProfile = buildInstantCandidateProfile(role);
    setSelectedRole(role);
    setProfile(instantProfile);
    writeText(STORAGE_KEYS.instantRole, role);
    writeJson(STORAGE_KEYS.candidateProfile, instantProfile);
  };

  const startInterview = () => {
    writeText(STORAGE_KEYS.companyStyle, selectedCompany);
    router.push("/meeting");
  };

  const isInstant = sourceMode === "instant";

  return (
    <AppFrame>
      <PageShell>
        <Tag>{isInstant ? "即兴面试设置" : "面试配置"}</Tag>
        <h1 style={{ color: "#111827", fontSize: 40, marginBottom: 8 }}>
          {isInstant ? "选择即兴面试岗位" : "面试配置"}
        </h1>
        <p className="oc-muted" style={{ lineHeight: 1.8 }}>
          {isInstant
            ? "无需上传简历，选择岗位后，AI 会从自我介绍开始，并根据你的现场回答动态追问。"
            : `岗位：${profile.targetRole} 校招 / 实习`}
        </p>

        {isInstant && (
          <div className="oc-config-grid">
            {(Object.entries(instantRoleConfigs) as Array<
              [InstantRole, (typeof instantRoleConfigs)["product"]]
            >).map(([key, item]) => {
              const active = key === selectedRole;
              return (
                <button
                  key={key}
                  className={`oc-choice ${active ? "is-selected" : ""}`}
                  onClick={() => selectRole(key)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 14 }}>
                    <h2 style={{ color: "#111827", margin: 0 }}>{item.label}</h2>
                    {active && <Check color="#2563eb" size={22} />}
                  </div>
                  <p className="oc-muted" style={{ lineHeight: 1.8, marginBottom: 0 }}>
                    {item.description.replace(/^重点/, "")}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        <h2 style={{ color: "#111827", marginTop: 30, marginBottom: -12 }}>
          选择面试官风格
        </h2>
        <div className="oc-config-grid">
          {(Object.entries(companyProfiles) as Array<
            [CompanyStyle, (typeof companyProfiles)["bytedance"]]
          >).map(([key, item]) => {
            const active = key === selectedCompany;
            return (
              <button
                key={key}
                className={`oc-choice ${active ? "is-selected" : ""}`}
                onClick={() => selectCompany(key)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 14 }}>
                  <h2 style={{ color: "#111827", margin: 0 }}>{item.title}</h2>
                  {active && <Check color="#2563eb" size={22} />}
                </div>
                <p style={{ lineHeight: 1.8 }}>特点：{item.traits}</p>
                <div
                  style={{
                    border: "1px solid #dde7f8",
                    borderRadius: 14,
                    background: "#fff",
                    padding: 14,
                    marginTop: 16,
                  }}
                >
                  <p style={{ color: "#2563eb", fontSize: 12, fontWeight: 800, margin: 0 }}>
                    典型追问
                  </p>
                  <p style={{ color: "#111827", fontWeight: 700 }}>
                    “{item.question}”
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <Card style={{ marginTop: 28, padding: 24 }}>
          <h2 style={{ color: "#111827" }}>本轮面试设置</h2>
          <div className="oc-feature-grid">
            <Setting label="岗位" value={profile.targetRole} />
            <Setting label="面试官" value={companyProfiles[selectedCompany].label} />
            <Setting
              label="候选人档案"
              value={isInstant ? "现场回答动态补充" : "简历已读取"}
            />
            <Setting label="预计时长" value="5-7 分钟" />
          </div>
          <div className="oc-actions">
            <PrimaryButton onClick={startInterview} icon={<MonitorUp size={18} />}>
              {isInstant ? "开始即兴面试" : "进入 AI 面试会议室"}
            </PrimaryButton>
          </div>
        </Card>
      </PageShell>
    </AppFrame>
  );
}

function Setting({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid #dde7f8",
        borderRadius: 14,
        background: "#f7fafc",
        padding: 16,
      }}
    >
      <p className="oc-muted" style={{ fontSize: 12, fontWeight: 800, margin: 0 }}>
        {label}
      </p>
      <strong style={{ color: "#111827" }}>{value}</strong>
    </div>
  );
}
