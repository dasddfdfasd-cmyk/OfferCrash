"use client";

import type { ChangeEvent } from "react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

import {
  AppFrame,
  BackToHome,
  Card,
  DEMO_NOTICE,
  FileIcon,
  PageShell,
  PrimaryButton,
  SecondaryButton,
  STORAGE_KEYS,
  Tag,
  UploadIcon,
  isDemoMode,
  useGoProfileWithMock,
  writeJson,
  writeText,
} from "../../components/offercrash-shared";
import { mockCandidateProfile } from "../../lib/mockData";
import type { CandidateProfile } from "../../types/interview";

const loadingLines = ["正在读取 DOCX...", "正在提取项目经历...", "正在生成候选人面试档案..."];

type UploadResponse = {
  success?: boolean;
  rawText?: string;
  data?: { rawText?: string };
  error?: string | { message?: string };
  message?: string;
};

type ExtractResponse = {
  success?: boolean;
  fallback?: boolean;
  candidateProfile?: CandidateProfile;
  data?: { candidateProfile?: CandidateProfile; fallback?: boolean };
  error?: string | { message?: string };
  message?: string;
};

function getErrorMessage(data: UploadResponse | ExtractResponse, fallback: string) {
  if (typeof data.error === "string") return data.error;
  if (data.error?.message) return data.error.message;
  return data.message || fallback;
}

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loadingLine, setLoadingLine] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const useExample = useGoProfileWithMock();
  const isUploading = Boolean(loadingLine);

  const runLoading = () => {
    setLoadingLine(loadingLines[0]);
    const timers = loadingLines.map((line, index) =>
      window.setTimeout(() => setLoadingLine(line), index * 650),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  };

  const chooseFile = () => {
    if (!isUploading) fileInputRef.current?.click();
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setError("");
    setNotice("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!file.name.toLowerCase().endsWith(".docx")) {
      setSelectedFile(null);
      event.target.value = "";
      setError("仅支持上传 .docx 文件，请重新选择。");
      return;
    }

    setSelectedFile(file);
  };

  const upload = async () => {
    setError("");
    setNotice("");

    if (!selectedFile) {
      setError("请先选择一个 .docx 简历文件。");
      return;
    }

    const stopLoading = runLoading();

    try {
      let rawText = "";
      let candidateProfile = mockCandidateProfile;
      let fallback = isDemoMode();

      if (!isDemoMode()) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadResponse = await fetch("/api/upload-docx", {
          method: "POST",
          body: formData,
        });
        const uploadData = (await uploadResponse.json().catch(() => ({}))) as UploadResponse;

        if (!uploadResponse.ok || uploadData.success !== true) {
          throw new Error(getErrorMessage(uploadData, "DOCX 上传解析失败，请稍后重试。"));
        }

        rawText = uploadData.rawText ?? uploadData.data?.rawText ?? "";
        writeText(STORAGE_KEYS.rawText, rawText);

        const extractResponse = await fetch("/api/extract-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rawText }),
        });
        const extractData = (await extractResponse.json().catch(() => ({}))) as ExtractResponse;

        if (!extractResponse.ok || extractData.success !== true) {
          throw new Error(getErrorMessage(extractData, DEMO_NOTICE));
        }

        candidateProfile =
          extractData.candidateProfile ?? extractData.data?.candidateProfile ?? mockCandidateProfile;
        fallback = Boolean(extractData.fallback ?? extractData.data?.fallback);
      }

      writeJson(STORAGE_KEYS.candidateProfile, candidateProfile);
      writeText(STORAGE_KEYS.profileFallback, fallback ? "true" : "false");
      router.push("/profile");
    } catch (uploadError) {
      console.error(uploadError);
      setError(DEMO_NOTICE);
      setNotice("你仍可以点击“使用示例简历体验”继续完整流程。");
    } finally {
      stopLoading();
      setLoadingLine("");
    }
  };

  return (
    <AppFrame>
      <PageShell narrow>
        <BackToHome />
        <div style={{ marginTop: 22, textAlign: "center" }}>
          <Tag>DOCX 简历解析</Tag>
          <h1 style={{ color: "#111827", fontSize: 40, marginBottom: 12 }}>上传 DOCX 简历 / 项目经历</h1>
          <p className="oc-muted" style={{ lineHeight: 1.8 }}>
            请上传 .docx 文件，建议包含教育背景、实习经历、项目经历、负责内容和项目结果。
          </p>
        </div>

        <Card style={{ marginTop: 28, padding: 32 }}>
          <input
            ref={fileInputRef}
            className="oc-hidden"
            type="file"
            accept=".docx"
            onChange={onFileChange}
          />
          <button className="oc-upload-drop" disabled={isUploading} onClick={chooseFile}>
            <span className="oc-logo" style={{ width: 64, height: 64, background: "#fff", color: "#2563eb" }}>
              <UploadIcon />
            </span>
            <h2 style={{ marginTop: 22 }}>拖拽 DOCX 到这里，或点击选择文件</h2>
            <p className="oc-muted">{selectedFile ? `已选择：${selectedFile.name}` : "仅支持 .docx 文件"}</p>
          </button>

          <div className="oc-actions" style={{ justifyContent: "center" }}>
            <PrimaryButton disabled={isUploading} icon={<UploadIcon />} onClick={upload}>
              上传 DOCX
            </PrimaryButton>
            <SecondaryButton disabled={isUploading} icon={<FileIcon />} onClick={useExample}>
              使用示例简历体验
            </SecondaryButton>
          </div>

          {error && <div className="oc-alert oc-alert-error">{error}</div>}
          {notice && <div className="oc-alert">{notice}</div>}
        </Card>

        {loadingLine && (
          <div className="oc-modal-backdrop">
            <Card className="oc-modal" style={{ textAlign: "center" }}>
              <RefreshCw className="spin" color="#2563eb" size={34} />
              <h2 style={{ color: "#111827" }}>{loadingLine}</h2>
              <p className="oc-muted">阶段 2 暂时完成 DOCX 读取，后续分析会自动兜底。</p>
            </Card>
          </div>
        )}
      </PageShell>
    </AppFrame>
  );
}
