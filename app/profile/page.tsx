"use client";

import { useEffect, useState } from "react";

import {
  AppFrame,
  PageShell,
  PrimaryButton,
  ProfileSummary,
  STORAGE_KEYS,
  Tag,
  getCandidateProfile,
  readText,
} from "../../components/offercrash-shared";
import { mockCandidateProfile } from "../../lib/mockData";
import type { CandidateProfile } from "../../types/interview";

export default function ProfilePage() {
  const [profile, setProfile] = useState<CandidateProfile>(mockCandidateProfile);
  const [showFallbackNotice, setShowFallbackNotice] = useState(false);

  useEffect(() => {
    setProfile(getCandidateProfile());
    setShowFallbackNotice(readText(STORAGE_KEYS.profileFallback, "false") === "true");
  }, []);

  return (
    <AppFrame>
      <PageShell>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <Tag>解析完成</Tag>
            <h1 style={{ color: "#111827", fontSize: 40, marginBottom: 0 }}>候选人档案已生成</h1>
          </div>
          <PrimaryButton href="/config">下一步：选择面试官</PrimaryButton>
        </div>
        <ProfileSummary profile={profile} showFallbackNotice={showFallbackNotice} />
      </PageShell>
    </AppFrame>
  );
}
