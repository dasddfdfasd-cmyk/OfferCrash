"use client";

import { useEffect, useState } from "react";

import {
  AppFrame,
  Card,
  HomeIcon,
  PageShell,
  PrimaryButton,
  RestartIcon,
  STORAGE_KEYS,
  SecondaryButton,
  Tag,
  companyProfiles,
  getCompanyStyle,
  getReport,
  readText,
} from "../../components/offercrash-shared";
import { mockReport } from "../../lib/mockData";
import type { CompanyStyle, InterviewReport } from "../../types/interview";

const scoreLabels: Record<keyof InterviewReport["dimensionScores"], string> = {
  structuredExpression: "结构化表达",
  projectDepth: "项目理解深度",
  userInsight: "用户洞察",
  dataSense: "数据意识",
  personalContribution: "个人贡献",
  pressureResistance: "抗压表现",
};

export default function ReportPage() {
  const [report, setReport] = useState<InterviewReport>(mockReport);
  const [showFallbackNotice, setShowFallbackNotice] = useState(false);
  const [companyStyle, setCompanyStyle] = useState<CompanyStyle>("bytedance");
  const selected = companyProfiles[companyStyle];

  useEffect(() => {
    setReport(getReport());
    setShowFallbackNotice(readText(STORAGE_KEYS.reportFallback, "false") === "true");
    setCompanyStyle(getCompanyStyle());
  }, []);

  const scores = Object.entries(report.dimensionScores) as Array<[
    keyof InterviewReport["dimensionScores"],
    number,
  ]>;

  return (
    <AppFrame>
      <PageShell>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <Tag>诊断报告</Tag>
            <h1 style={{ color: "#111827", fontSize: 40, marginBottom: 8 }}>产品经理校招面试诊断报告</h1>
            <p className="oc-muted">{selected.label}｜面试时长已记录｜共 6 轮追问</p>
          </div>
          <div className="oc-actions" style={{ marginTop: 0 }}>
            <SecondaryButton href="/" icon={<HomeIcon />}>返回首页</SecondaryButton>
            <PrimaryButton href="/meeting" icon={<RestartIcon />}>再来一轮</PrimaryButton>
          </div>
        </div>

        {showFallbackNotice && (
          <div className="oc-alert">报告生成服务异常，已使用演示报告继续流程。</div>
        )}

        <section className="oc-report-grid">
          <Card style={{ padding: 24 }}>
            <p style={{ color: "#2563eb", fontWeight: 800 }}>综合评级</p>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 22 }}>
              <span style={{ color: "#111827", fontSize: 76, fontWeight: 900 }}>{report.overallGrade}</span>
              <div style={{ paddingBottom: 12 }}>
                <p style={{ color: "#2563eb", fontSize: 24, fontWeight: 900 }}>
                  进入下一轮概率：{report.passProbability}%
                </p>
                <p style={{ color: "#111827", fontWeight: 800 }}>被刷风险：{report.eliminationRisk}</p>
              </div>
            </div>
            <p style={{ borderRadius: 16, background: "#eff6ff", padding: 16, lineHeight: 1.8 }}>
              {report.oneSentenceFeedback}
            </p>
          </Card>

          <Card style={{ padding: 24 }}>
            <h2 style={{ color: "#111827" }}>六维评分</h2>
            <div className="oc-score-grid">
              {scores.map(([key, score]) => (
                <div key={key}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <strong>{scoreLabels[key]}</strong>
                    <strong style={{ color: "#111827" }}>{score}</strong>
                  </div>
                  <div className="oc-score-bar">
                    <div className="oc-score-fill" style={{ width: `${score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="oc-report-grid" style={{ gridTemplateColumns: "2fr 1fr" }}>
          <Card style={{ padding: 24 }}>
            <h2 style={{ color: "#111827" }}>核心崩点分析</h2>
            {report.keyBreakpoints.map((item, index) => (
              <div key={item.title} style={{ border: "1px solid #dde7f8", borderRadius: 16, background: "#f7fafc", padding: 18, marginTop: 14 }}>
                <h3 style={{ color: "#111827" }}>{index + 1}. {item.title}</h3>
                <p><strong>影响：</strong>{item.impact}</p>
                <p><strong>证据：</strong>{item.evidence}</p>
                <p><strong>建议：</strong>{item.suggestion}</p>
              </div>
            ))}
          </Card>
          <Card style={{ padding: 24 }}>
            <h2 style={{ color: "#111827" }}>面试官最不满意的一点</h2>
            <p style={{ lineHeight: 1.8 }}>{report.interviewerMostDissatisfied}</p>
          </Card>
        </section>

        <section className="oc-report-grid">
          <Card style={{ padding: 24 }}>
            <h2 style={{ color: "#111827" }}>优化回答示范</h2>
            <ReportBlock label="原问题" text={report.improvedAnswer.originalQuestion} />
            <ReportBlock label="原回答问题" text={report.improvedAnswer.originalIssue} />
            <ReportBlock label="改写策略" text={report.improvedAnswer.rewriteStrategy} />
            <ReportBlock label="优化后回答" text={report.improvedAnswer.sampleAnswer} />
          </Card>
          <Card style={{ padding: 24 }}>
            <h2 style={{ color: "#111827" }}>下一轮训练建议</h2>
            <p style={{ lineHeight: 1.8 }}>下一轮建议重点训练：{report.nextTrainingPlan.focus}</p>
            <strong style={{ color: "#111827" }}>你需要准备：</strong>
            <ol style={{ lineHeight: 1.9 }}>
              {report.nextTrainingPlan.tasks.map((task) => (
                <li key={task}>{task}</li>
              ))}
            </ol>
          </Card>
        </section>
      </PageShell>
    </AppFrame>
  );
}

function ReportBlock({ label, text }: { label: string; text: string }) {
  return (
    <div style={{ border: "1px solid #dde7f8", borderRadius: 14, background: "#f7fafc", padding: 14, marginTop: 12 }}>
      <p style={{ color: "#2563eb", fontWeight: 800, marginTop: 0 }}>{label}</p>
      <p style={{ lineHeight: 1.8 }}>{text}</p>
    </div>
  );
}
