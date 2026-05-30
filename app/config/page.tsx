"use client";

import { useEffect, useState } from "react";
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
  writeText,
} from "../../components/offercrash-shared";
import type { CandidateProfile, CompanyStyle } from "../../types/interview";
import { mockCandidateProfile } from "../../lib/mockData";

export default function ConfigPage() {
  const [selectedCompany, setSelectedCompany] = useState<CompanyStyle>("bytedance");
  const [profile, setProfile] = useState<CandidateProfile>(mockCandidateProfile);

  useEffect(() => {
    setSelectedCompany(getCompanyStyle());
    setProfile(getCandidateProfile());
  }, []);

  const selectCompany = (style: CompanyStyle) => {
    setSelectedCompany(style);
    writeText(STORAGE_KEYS.companyStyle, style);
  };

  return (
    <AppFrame>
      <PageShell>
        <Tag>面试配置</Tag>
        <h1 style={{ color: "#111827", fontSize: 40, marginBottom: 8 }}>面试配置</h1>
        <p className="oc-muted">岗位：{profile.targetRole}校招 / 实习</p>

        <div className="oc-config-grid">
          {(Object.entries(companyProfiles) as Array<[CompanyStyle, typeof companyProfiles.bytedance]>).map(([key, item]) => {
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
                <div style={{ border: "1px solid #dde7f8", borderRadius: 14, background: "#fff", padding: 14, marginTop: 16 }}>
                  <p style={{ color: "#2563eb", fontSize: 12, fontWeight: 800, margin: 0 }}>典型追问</p>
                  <p style={{ color: "#111827", fontWeight: 700 }}>“{item.question}”</p>
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
            <Setting label="简历档案" value="已读取" />
            <Setting label="预计时长" value="5-7 分钟" />
          </div>
          <div className="oc-actions">
            <PrimaryButton href="/meeting" icon={<MonitorUp size={18} />}>
              进入 AI 面试会议室
            </PrimaryButton>
          </div>
        </Card>
      </PageShell>
    </AppFrame>
  );
}

function Setting({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: "1px solid #dde7f8", borderRadius: 14, background: "#f7fafc", padding: 16 }}>
      <p className="oc-muted" style={{ fontSize: 12, fontWeight: 800, margin: 0 }}>{label}</p>
      <strong style={{ color: "#111827" }}>{value}</strong>
    </div>
  );
}
