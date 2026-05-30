import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bot,
  Brain,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  ClipboardList,
  FileText,
  Home,
  MessageSquare,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Play,
  RefreshCw,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Volume2,
  Wifi,
  Zap,
} from 'lucide-react';
import mammoth from 'mammoth/mammoth.browser';
import {
  companyProfiles,
  mockCandidateProfile,
  mockReport,
  questionBank,
  sampleAnswers,
  sampleResumeText,
  standardOpening,
} from './lib/mockData';
import './styles.css';
import type {
  CandidateProfile,
  CompanyProfile,
  CompanyStyle,
  DoubaoConfig,
  InterviewQuestion,
  InterviewReport,
  InterviewStage,
  InterviewTranscriptItem,
  MeetingStatus,
  RagHit,
  ServiceMode,
  TriggerType,
} from './types/interview';

const steps = ['home', 'upload', 'profile', 'config', 'meeting', 'report'];
const stepLabels = ['首页', '上传', '档案', '配置', '面试', '复盘'];

const defaultDoubaoConfig: DoubaoConfig = {
  endpoint: import.meta.env.VITE_DOUBAO_API_URL ?? '',
  apiKey: import.meta.env.VITE_DOUBAO_API_KEY ?? '',
  model: import.meta.env.VITE_DOUBAO_MODEL ?? 'doubao-seed-1-6-250615',
  enabled: Boolean(import.meta.env.VITE_DOUBAO_API_URL),
};

function App() {
  const [step, setStep] = useState('home');
  const [selectedCompany, setSelectedCompany] = useState<CompanyStyle>('bytedance');
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile>(mockCandidateProfile);
  const [serviceMode, setServiceMode] = useState<ServiceMode>('voice');
  const [doubaoConfig, setDoubaoConfig] = useState<DoubaoConfig>(defaultDoubaoConfig);
  const [report, setReport] = useState<InterviewReport>(mockReport);

  const selected = companyProfiles[selectedCompany];

  const goToStep = (nextStep: string) => {
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-page text-body">
      {step !== 'meeting' && <TopNav step={step} goToStep={goToStep} />}
      {step === 'home' && <HomePage onStart={() => goToStep('upload')} />}
      {step === 'upload' && (
        <UploadPage
          onBack={() => goToStep('home')}
          onParsed={(profile) => {
            setCandidateProfile(profile);
            goToStep('profile');
          }}
        />
      )}
      {step === 'profile' && (
        <ProfilePage candidateProfile={candidateProfile} onNext={() => goToStep('config')} />
      )}
      {step === 'config' && (
        <ConfigPage
          candidateProfile={candidateProfile}
          selectedCompany={selectedCompany}
          setSelectedCompany={setSelectedCompany}
          serviceMode={serviceMode}
          setServiceMode={setServiceMode}
          doubaoConfig={doubaoConfig}
          setDoubaoConfig={setDoubaoConfig}
          onNext={() => goToStep('meeting')}
        />
      )}
      {step === 'meeting' && (
        <MeetingPage
          candidateProfile={candidateProfile}
          selectedCompany={selectedCompany}
          selected={selected}
          serviceMode={serviceMode}
          setServiceMode={setServiceMode}
          doubaoConfig={doubaoConfig}
          onReport={(nextReport) => {
            setReport(nextReport);
            goToStep('report');
          }}
        />
      )}
      {step === 'report' && (
        <ReportPage
          report={report}
          selected={selected}
          onRestart={() => goToStep('meeting')}
          onHome={() => goToStep('home')}
        />
      )}
    </div>
  );
}

function TopNav({ step, goToStep }: { step: string; goToStep: (nextStep: string) => void }) {
  const currentIndex = steps.indexOf(step);
  return (
    <header className="sticky top-0 z-30 border-b border-lineBlue bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <button className="flex items-center gap-2 text-left" onClick={() => goToStep('home')}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-soft">
            <BriefcaseBusiness size={19} />
          </span>
          <span>
            <span className="block text-base font-bold text-ink">OfferCrash</span>
            <span className="block text-xs text-muted">PM 实时语音压力面试 Agent</span>
          </span>
        </button>
        <div className="hidden items-center gap-2 md:flex">
          {stepLabels.map((label, index) => (
            <div key={label} className="flex items-center gap-2">
              <span
                className={`flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-semibold ${
                  index <= currentIndex ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600'
                }`}
              >
                {label}
              </span>
              {index < stepLabels.length - 1 && <ChevronRight size={16} className="text-muted" />}
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}

function PageShell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <main className={`mx-auto max-w-7xl px-5 py-8 lg:py-12 ${className}`}>{children}</main>;
}

function Tag({ children, tone = 'blue' }: { children: React.ReactNode; tone?: 'blue' | 'orange' | 'green' }) {
  const toneClass =
    tone === 'orange'
      ? 'bg-orange-50 text-orange-700'
      : tone === 'green'
        ? 'bg-emerald-50 text-emerald-700'
        : 'bg-brand-50 text-brand-600';
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${toneClass}`}>{children}</span>;
}

function PrimaryButton({
  children,
  onClick,
  icon: Icon = ArrowRight,
  disabled,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300 ${className}`}
    >
      {children}
      {Icon && <Icon size={18} />}
    </button>
  );
}

function SecondaryButton({
  children,
  onClick,
  icon: Icon,
  disabled,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-lineBlue bg-white px-5 py-3 text-sm font-semibold text-brand-600 transition hover:border-brand-600 hover:bg-brand-50 disabled:cursor-not-allowed disabled:text-muted ${className}`}
    >
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-lineBlue bg-white shadow-card ${className}`}>{children}</section>;
}

function HomePage({ onStart }: { onStart: () => void }) {
  return (
    <PageShell>
      <section className="grid items-center gap-8 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="py-6">
          <Tag>产品经理校招实时语音压力面试</Tag>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight text-ink md:text-6xl">
            让 AI 面试官主动开场、追问、质疑和收尾。
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-body">
            上传 DOCX 简历后选择字节或腾讯风格，系统会结合简历 RAG、实时转写和回答质量生成 5-7 轮动态追问，并在语音异常时自动切换文字兜底。
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <PrimaryButton onClick={onStart} icon={Play}>开始搭建面试</PrimaryButton>
            <span className="inline-flex items-center gap-2 text-sm text-muted">
              <Check size={17} className="text-brand-600" />
              支持豆包 API 代理和本地 RAG 兜底
            </span>
          </div>
        </div>
        <Card className="overflow-hidden p-5">
          <MeetingPreview />
        </Card>
      </section>
      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          ['主动 Agent', 'AI 不等待用户提问，而是控制面试阶段并持续追问。', Bot],
          ['实时语音', '浏览器语音播报和转写优先，异常时可一键切到文字模式。', Mic],
          ['动态 RAG', '每轮问题都展示命中的简历片段和题库追问依据。', Brain],
        ].map(([title, desc, Icon]) => (
          <Card key={String(title)} className="p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              {React.createElement(Icon as React.ComponentType<{ size?: number }>, { size: 22 })}
            </div>
            <h2 className="mt-5 text-lg font-bold text-ink">{title}</h2>
            <p className="mt-2 leading-7 text-muted">{desc}</p>
          </Card>
        ))}
      </section>
    </PageShell>
  );
}

function MeetingPreview() {
  return (
    <div className="overflow-hidden rounded-lg border border-lineBlue bg-[#F7F8FA]">
      <div className="flex items-center justify-between border-b border-lineBlue bg-white px-4 py-3 text-xs text-muted">
        <span>会议详情 00:48 / 产品经理压力面试</span>
        <span className="inline-flex items-center gap-2"><Wifi size={15} /> 实时语音</span>
      </div>
      <div className="grid min-h-[330px] grid-cols-[1fr_170px]">
        <div className="flex flex-col items-center justify-center gap-8 p-6">
          <div className="rounded-lg border border-lineBlue bg-brand-50 p-4 text-sm font-semibold leading-7 text-ink">
            你好，我是今天的产品经理面试官。请你用 1 分钟介绍一下自己。
          </div>
          <div className="flex items-center gap-14">
            <AvatarBubble label="AI 面试官" active />
            <AvatarBubble label="候选人" />
          </div>
        </div>
        <div className="border-l border-lineBlue bg-white p-4 text-xs">
          <p className="font-bold text-ink">实时对话转写</p>
          <p className="mt-5 text-brand-600">AI · 开场</p>
          <p className="mt-2 leading-6 text-muted">围绕简历和项目经历开始压力面试...</p>
        </div>
      </div>
    </div>
  );
}

function UploadPage({
  onParsed,
  onBack,
}: {
  onParsed: (profile: CandidateProfile) => void;
  onBack: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loadingLine, setLoadingLine] = useState('');
  const [error, setError] = useState('');

  const isLoading = Boolean(loadingLine);

  const parseFile = async () => {
    setError('');
    if (!selectedFile) {
      setError('请先选择一个 .docx 简历文件。');
      return;
    }
    setLoadingLine('正在读取 DOCX...');
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      setLoadingLine('正在提取项目经历...');
      const result = await mammoth.extractRawText({ arrayBuffer });
      const rawText = result.value.trim();
      if (!rawText) throw new Error('DOCX 文本为空');
      setLoadingLine('正在构建 RAG 简历档案...');
      onParsed(extractProfileFromText(rawText));
    } catch (parseError) {
      console.error(parseError);
      setError('DOCX 解析失败，已启用示例 DOCX 兜底，现场流程可以继续。');
      window.setTimeout(() => onParsed(extractProfileFromText(sampleResumeText)), 650);
    } finally {
      setLoadingLine('');
    }
  };

  return (
    <PageShell className="max-w-5xl">
      <button onClick={onBack} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-600">
        <ArrowLeft size={17} />
        返回
      </button>
      <div className="text-center">
        <Tag>DOCX 简历解析</Tag>
        <h1 className="mt-4 text-3xl font-bold text-ink md:text-4xl">上传 DOCX 并构建面试 RAG 档案</h1>
        <p className="mx-auto mt-4 max-w-3xl leading-7 text-muted">
          建议包含教育背景、实习经历、项目经历、负责内容和项目结果。解析失败时会自动切换示例 DOCX。
        </p>
      </div>
      <Card className="mt-8 p-6 md:p-10">
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            setError('');
            if (file && !file.name.toLowerCase().endsWith('.docx')) {
              setSelectedFile(null);
              setError('仅支持上传 .docx 文件。');
              return;
            }
            setSelectedFile(file);
          }}
        />
        <button
          disabled={isLoading}
          onClick={() => fileInputRef.current?.click()}
          className="flex min-h-[300px] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-lineBlue bg-[#F7FAFC] px-6 text-center transition hover:border-brand-600 hover:bg-brand-50"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-white text-brand-600 shadow-soft">
            <UploadCloud size={30} />
          </span>
          <h2 className="mt-6 text-xl font-bold text-ink">点击选择 DOCX 简历</h2>
          <p className="mt-2 text-sm text-muted">{selectedFile ? `已选择：${selectedFile.name}` : '仅支持 .docx 文件'}</p>
        </button>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <PrimaryButton disabled={isLoading} onClick={parseFile} icon={UploadCloud}>上传并解析 DOCX</PrimaryButton>
          <SecondaryButton
            disabled={isLoading}
            onClick={() => onParsed(extractProfileFromText(sampleResumeText))}
            icon={FileText}
          >
            使用示例 DOCX
          </SecondaryButton>
        </div>
        {error && <div className="mt-5 rounded-lg border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-700">{error}</div>}
      </Card>
      {loadingLine && <LoadingOverlay text={loadingLine} desc="前端正在完成 DOCX 文本抽取和 RAG 索引准备。" />}
    </PageShell>
  );
}

function ProfilePage({ candidateProfile, onNext }: { candidateProfile: CandidateProfile; onNext: () => void }) {
  return (
    <PageShell className="max-w-6xl">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Tag tone="green">解析完成</Tag>
          <h1 className="mt-4 text-3xl font-bold text-ink md:text-4xl">候选人面试档案已生成</h1>
          <p className="mt-3 text-muted">系统已识别项目经历、风险点和可追问方向。</p>
        </div>
        <PrimaryButton onClick={onNext}>下一步：选择面试官</PrimaryButton>
      </div>
      <Card className="mt-8 overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="border-b border-lineBlue bg-brand-50 p-7 lg:border-b-0 lg:border-r">
            <p className="text-sm font-semibold text-brand-600">目标岗位</p>
            <h2 className="mt-2 text-3xl font-bold text-ink">{candidateProfile.role}</h2>
            <p className="mt-5 leading-7 text-body">{candidateProfile.summary}</p>
          </div>
          <div className="p-7">
            {candidateProfile.projects.map((project) => (
              <div key={project.name} className="mb-6 rounded-lg border border-lineBlue bg-[#F7FAFC] p-5">
                <p className="text-sm font-bold text-brand-600">主要项目</p>
                <h3 className="mt-2 text-xl font-bold text-ink">{project.name}</h3>
                <InfoRow label="背景" value={project.background} />
                <InfoRow label="职责" value={project.role} />
                <InfoRow label="结果" value={project.result} />
              </div>
            ))}
            <p className="font-bold text-ink">系统识别风险点</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {candidateProfile.risks.map((risk) => (
                <div key={risk} className="flex items-center gap-3 rounded-lg border border-lineBlue bg-white p-4">
                  <AlertTriangle size={18} className="text-orange-600" />
                  <span>{risk}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </PageShell>
  );
}

function ConfigPage({
  candidateProfile,
  selectedCompany,
  setSelectedCompany,
  serviceMode,
  setServiceMode,
  doubaoConfig,
  setDoubaoConfig,
  onNext,
}: {
  candidateProfile: CandidateProfile;
  selectedCompany: CompanyStyle;
  setSelectedCompany: (style: CompanyStyle) => void;
  serviceMode: ServiceMode;
  setServiceMode: (mode: ServiceMode) => void;
  doubaoConfig: DoubaoConfig;
  setDoubaoConfig: (config: DoubaoConfig) => void;
  onNext: () => void;
}) {
  return (
    <PageShell>
      <Tag>面试配置</Tag>
      <h1 className="mt-4 text-3xl font-bold text-ink md:text-4xl">选择面试官风格和语音策略</h1>
      <p className="mt-3 text-muted">当前岗位：{candidateProfile.role} · 预计 5-7 轮 · AI 主动控制流程。</p>

      <section className="mt-8 grid gap-5 lg:grid-cols-2">
        {(Object.entries(companyProfiles) as Array<[CompanyStyle, CompanyProfile]>).map(([key, item]) => {
          const active = key === selectedCompany;
          return (
            <button
              key={key}
              onClick={() => setSelectedCompany(key)}
              className={`rounded-lg border p-6 text-left transition ${
                active ? 'border-brand-600 bg-brand-50 shadow-card' : 'border-lineBlue bg-white hover:border-brand-600'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-ink">{item.title}</h2>
                  <p className="mt-3 leading-7 text-body">{item.traits}</p>
                </div>
                {active && <Check size={22} className="text-brand-600" />}
              </div>
              <div className="mt-5 rounded-lg border border-lineBlue bg-white p-4">
                <p className="text-xs font-bold text-brand-600">压力话术</p>
                <p className="mt-2 font-semibold text-ink">{item.pressureLine}</p>
              </div>
            </button>
          );
        })}
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-ink">现场兜底策略</h2>
          <div className="mt-4 grid gap-3">
            <ModeButton active={serviceMode === 'voice'} icon={Mic} label="实时语音优先" desc="使用浏览器 TTS/STT；失败自动提示切换文字模式。" onClick={() => setServiceMode('voice')} />
            <ModeButton active={serviceMode === 'text'} icon={MessageSquare} label="文字稳定模式" desc="保留完整 Agent 流程，适合现场网络或麦克风异常。" onClick={() => setServiceMode('text')} />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-ink">豆包 API / RAG 配置</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                可填火山方舟 OpenAI 兼容代理地址；若 CORS、鉴权或网络异常，前端会自动使用本地 RAG 追问引擎。
              </p>
            </div>
            <button
              onClick={() => setDoubaoConfig({ ...doubaoConfig, enabled: !doubaoConfig.enabled })}
              className={`rounded-full px-3 py-1 text-xs font-bold ${doubaoConfig.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-muted'}`}
            >
              {doubaoConfig.enabled ? '已启用' : '未启用'}
            </button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <ConfigInput label="API Endpoint" value={doubaoConfig.endpoint} onChange={(endpoint) => setDoubaoConfig({ ...doubaoConfig, endpoint })} placeholder="https://你的代理/v1/chat/completions" />
            <ConfigInput label="Model" value={doubaoConfig.model} onChange={(model) => setDoubaoConfig({ ...doubaoConfig, model })} placeholder="doubao-seed-1-6-250615" />
          </div>
          <div className="mt-3">
            <ConfigInput label="API Key / 代理令牌" value={doubaoConfig.apiKey} onChange={(apiKey) => setDoubaoConfig({ ...doubaoConfig, apiKey })} placeholder="仅用于黑客松本机演示，生产请放后端" password />
          </div>
        </Card>
      </section>

      <div className="mt-7 flex justify-end">
        <PrimaryButton onClick={onNext} icon={MonitorUp}>开始语音面试</PrimaryButton>
      </div>
    </PageShell>
  );
}

function MeetingPage({
  candidateProfile,
  selectedCompany,
  selected,
  serviceMode,
  setServiceMode,
  doubaoConfig,
  onReport,
}: {
  candidateProfile: CandidateProfile;
  selectedCompany: CompanyStyle;
  selected: CompanyProfile;
  serviceMode: ServiceMode;
  setServiceMode: (mode: ServiceMode) => void;
  doubaoConfig: DoubaoConfig;
  onReport: (report: InterviewReport) => void;
}) {
  const [meetingStatus, setMeetingStatus] = useState<MeetingStatus>('idle');
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion>(() => ({
    stage: '开场',
    trigger: 'opening',
    text: standardOpening,
    ragHits: buildRagHits(candidateProfile, '自我介绍 产品经理 简历 项目'),
  }));
  const [transcript, setTranscript] = useState<InterviewTranscriptItem[]>([]);
  const [draftAnswer, setDraftAnswer] = useState('');
  const [interimText, setInterimText] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [notice, setNotice] = useState('');
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecordPanelOpen, setIsRecordPanelOpen] = useState(true);
  const recognitionRef = useRef<any>(null);
  const thinkingRef = useRef(false);

  const userAnswerCount = transcript.filter((item) => item.role === '用户').length;
  const stageIndex = Math.min(userAnswerCount + 1, 6);
  const canAnswer = meetingStatus === 'user_answering';

  useEffect(() => {
    if (meetingStatus === 'idle' || meetingStatus === 'ended') return undefined;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [meetingStatus]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      recognitionRef.current?.stop?.();
    };
  }, []);

  const appendTranscript = (role: 'AI' | '用户' | '系统', stage: InterviewStage, text: string, trigger?: TriggerType) => {
    setTranscript((items) => [
      ...items,
      { id: crypto.randomUUID(), role, stage, text, time: formatClock(elapsed), trigger },
    ]);
  };

  const askQuestion = (question: InterviewQuestion) => {
    setCurrentQuestion(question);
    appendTranscript('AI', question.stage, question.text, question.trigger);
    setMeetingStatus('ai_speaking');
    setDraftAnswer('');
    setInterimText('');
    speakQuestion(question);
  };

  const speakQuestion = (question: InterviewQuestion) => {
    recognitionRef.current?.stop?.();
    if (serviceMode === 'text' || isMuted || !('speechSynthesis' in window)) {
      window.setTimeout(() => {
        if (question.trigger === 'closing') finishInterview();
        else setMeetingStatus('user_answering');
      }, question.trigger === 'closing' ? 900 : 500);
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(question.text);
      utterance.lang = 'zh-CN';
      utterance.rate = 1;
      utterance.onend = () => {
        if (question.trigger === 'closing') finishInterview();
        else startRecognition();
      };
      utterance.onerror = () => {
        setNotice('语音播报异常，已切换到文字模式。');
        setServiceMode('text');
        if (question.trigger === 'closing') finishInterview();
        else setMeetingStatus('user_answering');
      };
      window.speechSynthesis.speak(utterance);
    } catch {
      setNotice('语音播报异常，已切换到文字模式。');
      setServiceMode('text');
      setMeetingStatus(question.trigger === 'closing' ? 'generating_report' : 'user_answering');
    }
  };

  const startRecognition = () => {
    if (serviceMode === 'text' || isMuted) {
      setMeetingStatus('user_answering');
      return;
    }
    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Recognition) {
      setNotice('当前浏览器不支持实时语音转写，已切换到文字模式。');
      setServiceMode('text');
      setMeetingStatus('user_answering');
      return;
    }
    try {
      const recognition = new Recognition();
      recognition.lang = 'zh-CN';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (event: any) => {
        let finalText = '';
        let interim = '';
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const piece = event.results[index][0]?.transcript ?? '';
          if (event.results[index].isFinal) finalText += piece;
          else interim += piece;
        }
        if (finalText) setDraftAnswer((value) => `${value}${finalText}`);
        setInterimText(interim);
      };
      recognition.onerror = () => {
        setNotice('语音转写失败，可继续使用文字输入或手动触发下一轮。');
        setServiceMode('text');
        setMeetingStatus('user_answering');
      };
      recognition.onend = () => setInterimText('');
      recognitionRef.current = recognition;
      setMeetingStatus('user_answering');
      recognition.start();
    } catch {
      setNotice('麦克风启动失败，已切换到文字模式。');
      setServiceMode('text');
      setMeetingStatus('user_answering');
    }
  };

  const startInterview = () => {
    setTranscript([]);
    setElapsed(0);
    setNotice('');
    askQuestion({
      stage: '开场',
      trigger: 'opening',
      text: standardOpening,
      ragHits: buildRagHits(candidateProfile, '自我介绍 产品经理 简历 项目'),
    });
  };

  const submitAnswer = async (manual = false) => {
    if (!canAnswer || thinkingRef.current) return;
    thinkingRef.current = true;
    recognitionRef.current?.stop?.();
    const answer = `${draftAnswer}${interimText}`.trim() || (manual ? '语音转写失败，候选人已完成回答但未成功转写。' : '');
    if (!answer) {
      setNotice('还没有识别到回答。你可以继续说，或输入文字后提交。');
      thinkingRef.current = false;
      return;
    }
    appendTranscript('用户', currentQuestion.stage, answer);
    setDraftAnswer('');
    setInterimText('');
    setMeetingStatus('ai_thinking');

    const nextCount = userAnswerCount + 1;
    window.setTimeout(async () => {
      if (nextCount >= 6) {
        const closing = buildClosingQuestion(candidateProfile);
        thinkingRef.current = false;
        askQuestion(closing);
        return;
      }
      const nextQuestion = await buildNextQuestion({
        candidateProfile,
        selectedCompany,
        previousQuestion: currentQuestion,
        answer,
        round: nextCount,
        transcript,
        doubaoConfig,
        onFallback: (message) => setNotice(message),
      });
      thinkingRef.current = false;
      askQuestion(nextQuestion);
    }, 650);
  };

  const finishInterview = () => {
    recognitionRef.current?.stop?.();
    setMeetingStatus('generating_report');
    window.setTimeout(() => {
      onReport(buildReport(transcript, currentQuestion));
      setMeetingStatus('ended');
    }, 900);
  };

  const statusText: Record<MeetingStatus, string> = {
    idle: '待开始',
    ai_speaking: 'AI 正在提问',
    user_answering: '用户正在回答',
    ai_thinking: 'AI 正在思考',
    generating_report: '正在生成复盘',
    ended: '已结束',
  };

  return (
    <main className="flex h-screen min-h-[720px] flex-col bg-[#F7F8FA] text-[13px] text-body">
      <MeetingTopBar elapsed={elapsed} selected={selected} serviceMode={serviceMode} />
      <div className={`grid min-h-0 flex-1 ${isRecordPanelOpen ? 'lg:grid-cols-[minmax(0,1fr)_420px]' : 'grid-cols-1'}`}>
        <section className="relative flex min-h-0 flex-col border-r border-line bg-[#F7F8FA]">
          <div className="mx-auto mt-6 w-[min(760px,calc(100%-32px))] shrink-0 rounded-lg border border-lineBlue bg-white px-5 py-4 shadow-soft">
            <div className="flex flex-wrap items-center gap-2">
              <Tag>{currentQuestion.stage}</Tag>
              <StatusPill icon={BriefcaseBusiness} label="当前岗位：产品经理" />
              <StatusPill icon={Bot} label={`当前面试官：${selected.short}`} />
              <StatusPill icon={Activity} label={`当前状态：${statusText[meetingStatus]}`} />
            </div>
            <p className="mt-3 text-[15px] font-semibold leading-7 text-ink">{meetingStatus === 'ai_thinking' ? '我正在分析你的回答，下一问会基于简历、上一轮回答和当前阶段生成。' : currentQuestion.text}</p>
          </div>

          <div className="flex flex-1 items-center justify-center px-6 pb-16 pt-6">
            <div className="grid w-full max-w-4xl gap-8 md:grid-cols-2">
              <ParticipantCard title="AI 面试官" subtitle={selected.interviewer} active={meetingStatus === 'ai_speaking' || meetingStatus === 'ai_thinking'} icon={Bot} />
              <ParticipantCard title="候选人" subtitle="只负责回答问题" active={meetingStatus === 'user_answering'} icon={Mic} />
            </div>
          </div>

          <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 flex-wrap items-center justify-center gap-3 rounded-full border border-line bg-white px-4 py-2 text-xs text-muted shadow-soft">
            <span>{statusText[meetingStatus]}</span>
            <span className="h-3 w-px bg-line" />
            <span>当前阶段：{currentQuestion.stage}</span>
            <span className="h-3 w-px bg-line" />
            <span>第 {stageIndex}/6 轮</span>
          </div>
        </section>

        {isRecordPanelOpen && (
          <RecordPanel
            transcript={transcript}
            currentQuestion={currentQuestion}
            draftAnswer={draftAnswer}
            interimText={interimText}
            setDraftAnswer={setDraftAnswer}
            canAnswer={canAnswer}
            onSubmit={() => submitAnswer(false)}
            onManualNext={() => submitAnswer(true)}
            onClose={() => setIsRecordPanelOpen(false)}
          />
        )}
      </div>

      {notice && <div className="border-t border-orange-100 bg-orange-50 px-5 py-2 text-sm font-semibold text-orange-700">{notice}</div>}

      <MeetingControlBar
        serviceMode={serviceMode}
        setServiceMode={setServiceMode}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        isRecordPanelOpen={isRecordPanelOpen}
        setIsRecordPanelOpen={setIsRecordPanelOpen}
        meetingStatus={meetingStatus}
        onStart={startInterview}
        onSubmit={() => submitAnswer(false)}
        onEnd={() => setShowEndConfirm(true)}
      />

      {meetingStatus === 'idle' && (
        <DeviceModal
          serviceMode={serviceMode}
          selected={selected}
          onEnter={startInterview}
        />
      )}
      {showEndConfirm && <ConfirmModal onCancel={() => setShowEndConfirm(false)} onConfirm={finishInterview} />}
    </main>
  );
}

function RecordPanel({
  transcript,
  currentQuestion,
  draftAnswer,
  interimText,
  setDraftAnswer,
  canAnswer,
  onSubmit,
  onManualNext,
  onClose,
}: {
  transcript: InterviewTranscriptItem[];
  currentQuestion: InterviewQuestion;
  draftAnswer: string;
  interimText: string;
  setDraftAnswer: (value: string) => void;
  canAnswer: boolean;
  onSubmit: () => void;
  onManualNext: () => void;
  onClose: () => void;
}) {
  return (
    <aside className="hidden min-h-0 flex-col border-l border-line bg-white lg:flex">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
        <div className="flex items-center gap-2">
          <ClipboardList size={20} className="text-[#374151]" />
          <h2 className="text-base font-bold text-ink">实时对话转写</h2>
        </div>
        <button onClick={onClose} className="rounded-md p-1.5 text-muted hover:bg-[#F3F4F6]">收起</button>
      </div>
      <div className="border-b border-line bg-[#F4F7FF] px-5 py-3 text-sm text-brand-600">
        RAG 命中：{currentQuestion.ragHits.map((hit) => hit.title).join(' / ') || '简历全文'}
      </div>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
        {transcript.length === 0 && <p className="text-sm text-muted">点击开始后，AI 会主动开场并生成转写记录。</p>}
        {transcript.map((item) => (
          <article key={item.id} className="relative pl-5">
            <span className={`absolute left-0 top-1.5 h-2 w-2 rounded-full ${item.role === '用户' ? 'bg-emerald-500' : item.role === 'AI' ? 'bg-brand-600' : 'bg-orange-500'}`} />
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={`font-bold ${item.role === '用户' ? 'text-emerald-600' : 'text-brand-600'}`}>{item.role}</span>
                <Tag tone={item.stage === '压力追问' ? 'orange' : 'blue'}>{item.stage}</Tag>
              </div>
              <span className="text-xs text-muted">{item.time}</span>
            </div>
            <p className="mt-2 text-sm leading-7 text-body">{item.text}</p>
          </article>
        ))}
      </div>
      <div className="shrink-0 border-t border-line px-4 py-3">
        <textarea
          value={`${draftAnswer}${interimText ? ` ${interimText}` : ''}`}
          onChange={(event) => setDraftAnswer(event.target.value)}
          disabled={!canAnswer}
          rows={3}
          placeholder={canAnswer ? '语音转写会出现在这里，也可直接输入文字兜底。' : '等待 AI 提问结束后回答'}
          className="w-full resize-none rounded-lg border border-line bg-[#F9FAFB] px-3 py-2 text-sm leading-6 outline-none focus:border-brand-600 disabled:text-muted"
        />
        <div className="mt-3 flex gap-2">
          <PrimaryButton disabled={!canAnswer} onClick={onSubmit} icon={Send} className="flex-1">提交回答</PrimaryButton>
          <SecondaryButton disabled={!canAnswer} onClick={onManualNext} icon={Zap}>手动下一轮</SecondaryButton>
        </div>
      </div>
    </aside>
  );
}

async function buildNextQuestion({
  candidateProfile,
  selectedCompany,
  previousQuestion,
  answer,
  round,
  transcript,
  doubaoConfig,
  onFallback,
}: {
  candidateProfile: CandidateProfile;
  selectedCompany: CompanyStyle;
  previousQuestion: InterviewQuestion;
  answer: string;
  round: number;
  transcript: InterviewTranscriptItem[];
  doubaoConfig: DoubaoConfig;
  onFallback: (message: string) => void;
}): Promise<InterviewQuestion> {
  const analysis = analyzeAnswer(answer, candidateProfile, round);
  const ragHits = buildRagHits(candidateProfile, `${answer} ${analysis.reason} ${previousQuestion.text}`);
  const stage = stageForRound(round, analysis.trigger);
  const localText = localQuestionText(candidateProfile, selectedCompany, answer, analysis.trigger, stage);

  const doubaoText = await generateWithDoubao({
    config: doubaoConfig,
    candidateProfile,
    companyStyle: selectedCompany,
    stage,
    answer,
    trigger: analysis.trigger,
    ragHits,
    transcript,
  }).catch(() => '');

  if (doubaoConfig.enabled && !doubaoText) {
    onFallback('豆包 API 服务异常，已切换到本地 RAG 动态追问。');
  }

  return {
    stage,
    trigger: analysis.trigger,
    text: doubaoText || localText,
    ragHits,
  };
}

async function generateWithDoubao({
  config,
  candidateProfile,
  companyStyle,
  stage,
  answer,
  trigger,
  ragHits,
  transcript,
}: {
  config: DoubaoConfig;
  candidateProfile: CandidateProfile;
  companyStyle: CompanyStyle;
  stage: InterviewStage;
  answer: string;
  trigger: TriggerType;
  ragHits: RagHit[];
  transcript: InterviewTranscriptItem[];
}) {
  if (!config.enabled || !config.endpoint) return '';
  const style = companyProfiles[companyStyle];
  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: 'system',
          content:
            '你是产品经理校招压力面试官 Agent。你必须主动控制流程，每次只问一个核心问题。问题要结合简历 RAG、上一轮回答、面试官风格和当前阶段。输出中文问题本身，不要输出 JSON。',
        },
        {
          role: 'user',
          content: JSON.stringify({
            companyStyle: style.title,
            stage,
            trigger,
            candidateProfile,
            lastAnswer: answer,
            ragHits,
            transcript: transcript.slice(-8),
          }),
        },
      ],
      temperature: 0.7,
    }),
  });
  if (!response.ok) return '';
  const data = await response.json();
  return String(data?.choices?.[0]?.message?.content ?? data?.data?.text ?? '').trim();
}

function analyzeAnswer(answer: string, profile: CandidateProfile, round: number): { trigger: TriggerType; reason: string } {
  const hasNumber = /\d|一|二|三|四|五|六|七|八|九|十|百|千|万|%/.test(answer);
  const hasWe = (answer.match(/我们|团队/g) ?? []).length;
  const hasI = (answer.match(/我/g) ?? []).length;
  const mentionsGrowth = /提升|优化|改善|增长|效率|转化|留存|降低/.test(answer);
  const mentionsUser = /用户|需求|痛点|场景/.test(answer);
  const hasEvidence = /访谈|调研|样本|问卷|数据|反馈|观察|日志/.test(answer);
  const mentionsFeature = /功能|设计|方案|优先级|排序|原型|流程/.test(answer);
  const hasWhy = /因为|所以|判断|取舍|权衡|依据|优先/.test(answer);

  if (answer.length < 28 || /不知道|不清楚|没有想过|差不多|还好/.test(answer)) return { trigger: 'pressure', reason: '回答过短或回避问题' };
  if (mentionsGrowth && !hasNumber) return { trigger: 'data', reason: '提到结果提升但没有量化数据' };
  if (hasWe >= 2 && hasI <= 1) return { trigger: 'contribution', reason: '团队视角较多，个人贡献不清晰' };
  if (mentionsUser && !hasEvidence) return { trigger: 'user_insight', reason: '提到用户需求但没有说明依据' };
  if (mentionsFeature && !hasWhy) return { trigger: 'decision', reason: '讲了功能设计但没有解释产品判断' };
  if (round === 1 || profile.risks.length > 0) return { trigger: 'resume_risk', reason: '简历存在可追问风险点' };
  return { trigger: 'pressure', reason: '需要进一步压力质疑' };
}

function localQuestionText(profile: CandidateProfile, style: CompanyStyle, answer: string, trigger: TriggerType, stage: InterviewStage) {
  const project = profile.projects[0];
  const pressureLine = companyProfiles[style].pressureLine;
  const projectName = project?.name || '这个项目';
  const snippets: Record<TriggerType, string> = {
    opening: standardOpening,
    resume_risk: `你简历里写到“${project?.role || '负责需求分析'}”。具体到 ${projectName}，你是怎么分析需求的？请讲清楚输入、判断过程和输出物。`,
    data: '你刚才提到提升或优化，但没有数据。具体提升了多少？这个数据怎么统计？有没有上线前后的对比？',
    contribution: `你一直在说“我们”或“团队”。这个项目里你个人最关键的贡献是什么？如果没有你，${projectName} 会有什么不同？`,
    user_insight: '你说到了用户需求，但我还没听到证据。你怎么判断这是用户真实需求？访谈了多少用户，最关键的发现是什么？',
    decision: '你讲了功能设计，但没有讲为什么这样设计。为什么优先做这个功能，而不是其他功能？背后的产品判断是什么？',
    pressure: `${pressureLine} 说实话，这个回答更像项目介绍，不像产品经理的思考。请你重新回答一遍，直接说出你的关键决策。`,
    closing: '好，本轮面试先到这里。我已经记录了你在项目表达、数据意识、个人贡献和抗压回应中的表现，接下来系统会生成你的复盘报告。',
  };
  if (stage === '项目深挖' && trigger === 'resume_risk') {
    return `我们进入项目深挖。你简历里提到 ${projectName}，请具体介绍项目背景、目标、你的职责，以及你做过的一个关键产品取舍。`;
  }
  return snippets[trigger];
}

function stageForRound(round: number, trigger: TriggerType): InterviewStage {
  if (round <= 1) return '自我介绍';
  if (round <= 3 && trigger !== 'pressure') return '项目深挖';
  if (round <= 5) return '压力追问';
  return '收尾';
}

function buildClosingQuestion(profile: CandidateProfile): InterviewQuestion {
  return {
    stage: '收尾',
    trigger: 'closing',
    text: localQuestionText(profile, 'bytedance', '', 'closing', '收尾'),
    ragHits: buildRagHits(profile, '复盘 报告 数据 贡献'),
  };
}

function buildRagHits(profile: CandidateProfile, query: string): RagHit[] {
  const resumeHits: RagHit[] = [
    ...profile.projects.map((project) => ({
      title: `简历项目：${project.name}`,
      content: `${project.background} ${project.role} ${project.result}`,
      score: keywordScore(`${project.name} ${project.background} ${project.role} ${project.result}`, query),
    })),
    ...profile.risks.map((risk) => ({
      title: `简历风险：${risk}`,
      content: risk,
      score: keywordScore(risk, query) + 2,
    })),
  ];
  const bankHits = questionBank.map((hit) => ({
    ...hit,
    score: keywordScore(`${hit.title} ${hit.content}`, query),
  }));
  return [...resumeHits, ...bankHits]
    .sort((a, b) => b.score - a.score)
    .filter((hit) => hit.score > 0)
    .slice(0, 3);
}

function keywordScore(text: string, query: string) {
  const keywords = ['数据', '提升', '优化', '用户', '需求', '贡献', '我们', '团队', '功能', '设计', '决策', '访谈', '调研', '效率', '项目', '产品'];
  return keywords.reduce((score, keyword) => score + (text.includes(keyword) && query.includes(keyword) ? 3 : text.includes(keyword) ? 1 : 0), 0);
}

function extractProfileFromText(rawText: string): CandidateProfile {
  const compact = rawText.replace(/\s+/g, ' ').trim();
  const projectName = extractAfter(compact, ['项目经历：', '项目：', '项目名称：']) || guessProjectName(compact);
  const background = extractAfter(compact, ['项目背景：', '背景：']) || '简历中存在项目经历，但项目背景描述不够完整，需要在面试中追问。';
  const role = extractAfter(compact, ['个人职责：', '负责内容：', '职责：']) || '简历中提到参与需求分析、原型设计或项目推进，个人职责需要进一步澄清。';
  const result = extractAfter(compact, ['项目结果：', '结果：', '成果：']) || '项目结果缺少明确量化表达。';
  const risks = inferRisks(compact);
  return {
    role: /产品经理|PM|Product Manager/i.test(compact) ? '产品经理' : '产品经理',
    summary: `候选人简历中包含${projectName}经历，主要围绕${role}。系统将重点追问数据结果、个人贡献、用户洞察和产品决策依据。`,
    rawText,
    projects: [{ name: projectName, background, role, result }],
    risks,
  };
}

function extractAfter(text: string, labels: string[]) {
  for (const label of labels) {
    const index = text.indexOf(label);
    if (index >= 0) {
      const rest = text.slice(index + label.length);
      const next = rest.search(/(项目背景：|个人职责：|关键动作：|项目结果：|教育背景：|实习经历：|项目经历：|目标岗位：)/);
      return (next > 8 ? rest.slice(0, next) : rest).trim().slice(0, 120);
    }
  }
  return '';
}

function guessProjectName(text: string) {
  const match = text.match(/([\u4e00-\u9fa5A-Za-z0-9]{2,24}(?:小程序|平台|系统|App|APP|项目))/);
  return match?.[1] ?? '简历项目';
}

function inferRisks(text: string) {
  const risks = new Set<string>();
  if (!/\d|%|提升|增长|降低|转化/.test(text)) risks.add('项目结果缺少量化数据');
  if (!/我负责|我主导|我推动|个人/.test(text)) risks.add('个人贡献不够具体');
  if (!/访谈|调研|问卷|样本/.test(text)) risks.add('用户调研样本未知');
  if (!/优先级|取舍|权衡|为什么|判断/.test(text)) risks.add('产品决策依据不足');
  return Array.from(risks).length ? Array.from(risks) : ['结果数据、个人贡献和产品判断仍需面试中验证'];
}

function buildReport(transcript: InterviewTranscriptItem[], currentQuestion: InterviewQuestion): InterviewReport {
  const userText = transcript.filter((item) => item.role === '用户').map((item) => item.text).join(' ');
  const dataWeak = /提升|优化|改善|效率/.test(userText) && !/\d|%/.test(userText);
  const contributionWeak = (userText.match(/我们|团队/g) ?? []).length > (userText.match(/我/g) ?? []).length;
  const insightWeak = /用户|需求/.test(userText) && !/访谈|调研|样本|问卷/.test(userText);
  const issues = [
    dataWeak && { title: '数据表达不足', desc: '回答中出现提升、优化或效率，但没有给出指标、口径和前后对比。' },
    contributionWeak && { title: '个人贡献不清晰', desc: '团队视角偏多，个人推动的关键决策和不可替代价值需要补强。' },
    insightWeak && { title: '用户洞察证据不足', desc: '提到用户需求，但缺少访谈样本、关键发现和优先级依据。' },
  ].filter(Boolean) as Array<{ title: string; desc: string }>;
  return {
    ...mockReport,
    passProbability: Math.max(38, 70 - issues.length * 10),
    riskLevel: issues.length >= 2 ? '中高' : '中等',
    summary: issues.length
      ? `本轮面试完成 ${transcript.filter((item) => item.role === '用户').length} 次回答。主要风险集中在${issues.map((item) => item.title).join('、')}。`
      : '本轮回答整体完整，但仍建议继续补强数据闭环和个人贡献表达。',
    issues: issues.length ? issues : mockReport.issues,
    strongestQuestion: currentQuestion.text,
  };
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-4">
      <p className="text-xs font-bold text-muted">{label}</p>
      <p className="mt-1 leading-7 text-body">{value}</p>
    </div>
  );
}

function ConfigInput({ label, value, onChange, placeholder, password }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; password?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-muted">{label}</span>
      <input
        type={password ? 'password' : 'text'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-lineBlue bg-[#F9FAFB] px-3 py-2 text-sm outline-none focus:border-brand-600"
      />
    </label>
  );
}

function ModeButton({ active, icon: Icon, label, desc, onClick }: { active: boolean; icon: React.ComponentType<{ size?: number; className?: string }>; label: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex items-start gap-3 rounded-lg border p-4 text-left ${active ? 'border-brand-600 bg-brand-50' : 'border-lineBlue bg-white'}`}>
      <Icon size={20} className={active ? 'text-brand-600' : 'text-muted'} />
      <span>
        <span className="block font-bold text-ink">{label}</span>
        <span className="mt-1 block text-sm leading-6 text-muted">{desc}</span>
      </span>
    </button>
  );
}

function MeetingTopBar({ elapsed, selected, serviceMode }: { elapsed: number; selected: CompanyProfile; serviceMode: ServiceMode }) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-line bg-white px-3 text-[#111827]">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#EEF4FF] text-brand-600">
          <MonitorUp size={17} />
        </span>
        <strong>会议详情</strong>
        <span className="hidden text-muted sm:inline">{formatClock(elapsed)} / 10 分钟</span>
        <span className="hidden h-4 w-px bg-line md:block" />
        <span className="hidden truncate text-muted md:block">产品经理压力面试会议室 · {selected.meetingLabel}</span>
        <Wifi size={17} className="text-emerald-500" />
        <ShieldCheck size={17} className="text-brand-600" />
        <Volume2 size={17} className={serviceMode === 'voice' ? 'text-brand-600' : 'text-muted'} />
      </div>
      <div className="flex items-center gap-2 text-muted">
        <StatusPill icon={Settings} label={serviceMode === 'voice' ? '语音模式' : '文字模式'} />
      </div>
    </header>
  );
}

function StatusPill({ icon: Icon, label }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#F3F4F6] px-2.5 py-1 text-xs font-semibold text-muted">
      <Icon size={14} />
      {label}
    </span>
  );
}

function ParticipantCard({ title, subtitle, active, icon: Icon }: { title: string; subtitle: string; active: boolean; icon: React.ComponentType<{ size?: number; className?: string }>; }) {
  return (
    <div className={`flex min-h-[260px] flex-col items-center justify-center rounded-lg border bg-white p-8 text-center shadow-soft ${active ? 'border-brand-600 ring-4 ring-brand-100' : 'border-lineBlue'}`}>
      <div className={`flex h-24 w-24 items-center justify-center rounded-full ${active ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600'}`}>
        <Icon size={42} />
      </div>
      <h2 className="mt-5 text-xl font-bold text-ink">{title}</h2>
      <p className="mt-2 text-sm text-muted">{subtitle}</p>
      {active && (
        <div className="mt-5 flex h-7 items-end gap-1">
          {[0, 1, 2, 3, 4].map((index) => (
            <span key={index} className="wavebar w-1.5 rounded-full bg-brand-600" style={{ height: 12 + index * 3, animationDelay: `${index * 0.12}s` }} />
          ))}
        </div>
      )}
    </div>
  );
}

function AvatarBubble({ label, active }: { label: string; active?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`flex h-20 w-20 items-center justify-center rounded-full border shadow-soft ${active ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-white text-brand-600'}`}>
        {active ? <Bot size={30} /> : <Mic size={28} />}
      </div>
      <p className="mt-2 font-semibold text-ink">{label}</p>
    </div>
  );
}

function MeetingControlBar({
  serviceMode,
  setServiceMode,
  isMuted,
  setIsMuted,
  isRecordPanelOpen,
  setIsRecordPanelOpen,
  meetingStatus,
  onStart,
  onSubmit,
  onEnd,
}: {
  serviceMode: ServiceMode;
  setServiceMode: (mode: ServiceMode) => void;
  isMuted: boolean;
  setIsMuted: React.Dispatch<React.SetStateAction<boolean>>;
  isRecordPanelOpen: boolean;
  setIsRecordPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  meetingStatus: MeetingStatus;
  onStart: () => void;
  onSubmit: () => void;
  onEnd: () => void;
}) {
  return (
    <footer className="grid h-20 shrink-0 grid-cols-3 items-center border-t border-line bg-white px-6">
      <div className="flex justify-start gap-2">
        <ControlItem icon={serviceMode === 'voice' ? Mic : MessageSquare} label={serviceMode === 'voice' ? '语音模式' : '文字模式'} active onClick={() => setServiceMode(serviceMode === 'voice' ? 'text' : 'voice')} />
        <ControlItem icon={isMuted ? MicOff : Volume2} label={isMuted ? '静音' : '播报'} danger={isMuted} onClick={() => setIsMuted((value) => !value)} />
      </div>
      <div className="flex justify-center">
        {meetingStatus === 'idle' ? (
          <PrimaryButton onClick={onStart} icon={Play}>开始语音面试</PrimaryButton>
        ) : (
          <PrimaryButton disabled={meetingStatus !== 'user_answering'} onClick={onSubmit} icon={Send}>回答完毕</PrimaryButton>
        )}
      </div>
      <div className="flex justify-end gap-2">
        {!isRecordPanelOpen && <ControlItem icon={ClipboardList} label="转写" onClick={() => setIsRecordPanelOpen(true)} />}
        <button onClick={onEnd} className="flex h-14 min-w-[86px] flex-col items-center justify-center gap-1 rounded-lg text-[#EF4444] hover:bg-red-50">
          <PhoneOff size={22} />
          <span className="text-xs font-semibold">结束面试</span>
        </button>
      </div>
    </footer>
  );
}

function ControlItem({ icon: Icon, label, active, danger, onClick }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; active?: boolean; danger?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`flex h-16 w-[76px] flex-col items-center justify-center gap-1 rounded-lg text-[#374151] transition hover:bg-[#F3F4F6] ${active ? 'bg-[#F3F4F6]' : ''}`}>
      <Icon size={22} className={danger ? 'text-[#EF4444]' : 'text-[#374151]'} />
      <span className="text-xs">{label}</span>
    </button>
  );
}

function DeviceModal({ serviceMode, selected, onEnter }: { serviceMode: ServiceMode; selected: CompanyProfile; onEnter: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/75 px-5 backdrop-blur-sm">
      <Card className="w-full max-w-lg p-7">
        <h2 className="text-2xl font-bold text-ink">进入面试前，确认状态</h2>
        <div className="mt-6 grid gap-3">
          {[
            `当前岗位：产品经理`,
            `当前面试官：${selected.short}`,
            `服务模式：${serviceMode === 'voice' ? '实时语音优先' : '文字兜底模式'}`,
            'RAG：已读取 DOCX 简历与产品经理题库',
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-lg bg-brand-50 p-4">
              <Check size={18} className="text-brand-600" />
              <span className="font-semibold text-ink">{item}</span>
            </div>
          ))}
        </div>
        <div className="mt-7 flex justify-end">
          <PrimaryButton onClick={onEnter} icon={MonitorUp}>开始语音面试</PrimaryButton>
        </div>
      </Card>
    </div>
  );
}

function ConfirmModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/75 px-5 backdrop-blur-sm">
      <Card className="w-full max-w-md p-7">
        <h2 className="text-xl font-bold text-ink">确定结束本轮面试并生成复盘报告吗？</h2>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <SecondaryButton onClick={onCancel} className="flex-1">继续面试</SecondaryButton>
          <PrimaryButton onClick={onConfirm} icon={ClipboardList} className="flex-1">生成报告</PrimaryButton>
        </div>
      </Card>
    </div>
  );
}

function ReportPage({ report, selected, onRestart, onHome }: { report: InterviewReport; selected: CompanyProfile; onRestart: () => void; onHome: () => void }) {
  return (
    <PageShell>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Tag>复盘报告</Tag>
          <h1 className="mt-4 text-3xl font-bold text-ink md:text-4xl">产品经理校招面试诊断报告</h1>
          <p className="mt-3 text-muted">{selected.label} · AI 动态追问 · 语音转写记录已纳入评估</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <SecondaryButton onClick={onHome} icon={Home}>返回首页</SecondaryButton>
          <PrimaryButton onClick={onRestart} icon={RefreshCw}>再来一轮</PrimaryButton>
        </div>
      </div>
      <section className="mt-8 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <Card className="p-6">
          <p className="text-sm font-semibold text-brand-600">综合评级</p>
          <div className="mt-4 flex items-end gap-5">
            <span className="text-7xl font-bold text-ink">{report.grade}</span>
            <div className="pb-2">
              <p className="text-2xl font-bold text-brand-600">进入下一轮概率：{report.passProbability}%</p>
              <p className="mt-2 font-semibold text-body">被刷风险：{report.riskLevel}</p>
            </div>
          </div>
          <p className="mt-6 rounded-lg bg-brand-50 p-4 leading-7 text-body">{report.summary}</p>
        </Card>
        <Card className="p-6">
          <h2 className="text-lg font-bold text-ink">六维评分</h2>
          <div className="mt-5 grid gap-4">
            {report.scores.map(({ label, score }) => (
              <div key={label}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-body">{label}</span>
                  <span className="font-bold text-ink">{score}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-brand-50">
                  <div className="h-full rounded-full bg-brand-600" style={{ width: `${score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>
      <section className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-ink">核心崩点分析</h2>
          <div className="mt-5 grid gap-4">
            {report.issues.map(({ title, desc }, index) => (
              <div key={title} className="rounded-lg border border-lineBlue bg-[#F7FAFC] p-5">
                <p className="font-bold text-ink">{index + 1}. {title}</p>
                <p className="mt-2 leading-7 text-body">{desc}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="text-lg font-bold text-ink">最值得复盘的问题</h2>
          <p className="mt-4 leading-7 text-body">{report.strongestQuestion}</p>
        </Card>
      </section>
      <section className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-ink">优化回答示范</h2>
          <p className="mt-4 leading-7 text-body">{report.improvedAnswer}</p>
        </Card>
        <Card className="p-6">
          <h2 className="text-lg font-bold text-ink">下一轮训练建议</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-body">
            {report.nextSteps.map((item) => <li key={item}>{item}</li>)}
          </ol>
        </Card>
      </section>
    </PageShell>
  );
}

function LoadingOverlay({ text, desc }: { text: string; desc: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 px-5 backdrop-blur-sm">
      <Card className="w-full max-w-md p-7 text-center">
        <RefreshCw className="mx-auto animate-spin text-brand-600" size={34} />
        <p className="mt-4 text-lg font-bold text-ink">{text}</p>
        <p className="mt-2 text-sm text-muted">{desc}</p>
      </Card>
    </div>
  );
}

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

createRoot(document.getElementById('root')!).render(<App />);
