import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  Camera,
  CameraOff,
  Check,
  ChevronRight,
  ClipboardList,
  FileText,
  Grid2X2,
  Hand,
  Home,
  Maximize2,
  MessageSquare,
  Mic,
  MicOff,
  Minimize2,
  MonitorUp,
  MoreHorizontal,
  PanelRightClose,
  PanelRightOpen,
  Play,
  RefreshCw,
  ScreenShare,
  Send,
  Settings,
  ShieldCheck,
  ShieldQuestion,
  Smile,
  Square,
  UploadCloud,
  UserPlus,
  Users,
  Video,
  Volume2,
  Wifi,
  X,
} from 'lucide-react';
import './styles.css';

const steps = ['home', 'upload', 'profile', 'config', 'meeting', 'report'];

const candidateProfile = {
  role: '产品经理',
  summary: '候选人具备校园二手交易小程序项目经历，主要负责用户调研、需求分析和原型设计。',
  project: '校园二手交易小程序',
  responsibilities: '用户调研、需求分析、原型设计、功能规划',
  risks: ['项目结果数据不明确', '个人贡献不够具体', '用户调研样本未知', '产品决策依据不足'],
};

const companyProfiles = {
  bytedance: {
    short: '字节',
    label: '字节数据压迫型',
    meetingLabel: '字节风格',
    interviewer: '字节产品经理面试官',
    title: '字节风格：数据压迫型面试官',
    traits: '节奏快、重视数据和结果、追问个人贡献、对空泛表达容忍度低',
    question: '你说提升了交易效率，具体提升了多少？',
  },
  tencent: {
    short: '腾讯',
    label: '腾讯用户价值型',
    meetingLabel: '腾讯风格',
    interviewer: '腾讯产品经理面试官',
    title: '腾讯风格：用户价值型面试官',
    traits: '重视用户体验、深挖用户需求、关注场景理解、追问协作推动',
    question: '你怎么判断这是用户真实需求？',
  },
};

const mockInterviewTurns = [
  {
    stage: '开场',
    type: '自我介绍',
    ai: '请你用 1 分钟介绍一下你自己，并说明为什么想做产品经理。',
    userMock: '我目前是深圳大学学生，做过校园二手交易小程序，主要负责用户调研、需求分析和原型设计。',
  },
  {
    stage: '自我介绍追问',
    type: '动机追问',
    ai: '你刚才提到对产品经理感兴趣，但这个理由还比较泛。请结合你的项目说明你体现了哪些产品能力。',
    userMock: '我在项目中参与了需求分析和原型设计，也和同学做过一些用户访谈。',
  },
  {
    stage: '项目深挖',
    type: '项目追问',
    ai: '你简历里提到校园二手交易小程序，请介绍一下这个项目的背景、目标和你具体负责的部分。',
    userMock: '这个项目主要解决校园二手交易信息分散的问题，我负责调研、需求整理和功能规划。',
  },
  {
    stage: '项目深挖',
    type: '数据追问',
    ai: '你说提升了交易效率，具体提升了多少？你们用什么指标衡量，是成交时间、匹配率，还是消息回复率？',
    userMock: '当时没有非常完整的数据，但我们根据用户反馈判断效率有提升。',
  },
  {
    stage: '压力质疑',
    type: '贡献追问',
    ai: '我现在还是没有听到你个人不可替代的贡献。你一直在说我们团队，但我想知道，如果没有你，这个项目会有什么不同？',
    userMock: '如果没有我，前期用户调研和需求优先级可能不会那么清晰，我主要推动了调研和功能排序。',
  },
  {
    stage: '收尾',
    type: '收尾',
    ai: '好，本轮面试先到这里。我已经记录了你在项目表达、数据意识、个人贡献和抗压回应中的表现。接下来系统会生成你的面试诊断报告。',
    userMock: '',
  },
];

function App() {
  const [step, setStep] = useState('home');
  const [selectedCompany, setSelectedCompany] = useState('bytedance');
  const [meetingStatus, setMeetingStatus] = useState('device_check');
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [transcript, setTranscript] = useState([]);
  const [loadingLine, setLoadingLine] = useState('');
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const selected = companyProfiles[selectedCompany];

  const goToStep = (nextStep) => {
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startUploadMock = () => {
    const lines = ['正在读取 DOCX...', '正在提取项目经历...', '正在生成候选人面试档案...'];
    setLoadingLine(lines[0]);
    lines.forEach((line, index) => {
      window.setTimeout(() => setLoadingLine(line), index * 500);
    });
    window.setTimeout(() => {
      setLoadingLine('');
      goToStep('profile');
    }, 1500);
  };

  const enterMeeting = () => {
    setCurrentTurnIndex(0);
    setTranscript([{ role: 'AI', tag: mockInterviewTurns[0].stage, text: mockInterviewTurns[0].ai, time: '00:00' }]);
    setMeetingStatus('ai_speaking');
    window.setTimeout(() => setMeetingStatus('user_answering'), 1000);
  };

  const generateReport = () => {
    setMeetingStatus('generating_report');
    window.setTimeout(() => {
      setMeetingStatus('ended');
      setShowEndConfirm(false);
      goToStep('report');
    }, 1000);
  };

  const finishAnswer = () => {
    const turn = mockInterviewTurns[currentTurnIndex];
    if (turn.userMock) {
      setTranscript((items) => [
        ...items,
        { role: '你', tag: '回答', text: turn.userMock, time: formatClock(35 + currentTurnIndex * 12) },
      ]);
    }
    setMeetingStatus('ai_thinking');
    window.setTimeout(() => {
      const nextIndex = currentTurnIndex + 1;
      if (nextIndex >= mockInterviewTurns.length) {
        generateReport();
        return;
      }
      setCurrentTurnIndex(nextIndex);
      setTranscript((items) => [
        ...items,
        {
          role: 'AI',
          tag: mockInterviewTurns[nextIndex].stage,
          text: mockInterviewTurns[nextIndex].ai,
          time: formatClock(62 + nextIndex * 18),
        },
      ]);
      setMeetingStatus('ai_speaking');
      if (mockInterviewTurns[nextIndex].stage === '收尾') {
        window.setTimeout(() => generateReport(), 1200);
      } else {
        window.setTimeout(() => setMeetingStatus('user_answering'), 1000);
      }
    }, 1000);
  };

  const restart = () => {
    setMeetingStatus('device_check');
    setCurrentTurnIndex(0);
    setTranscript([]);
    setShowEndConfirm(false);
    goToStep('meeting');
  };

  return (
    <div className="min-h-screen bg-page text-body">
      {step !== 'meeting' && <TopNav step={step} goToStep={goToStep} />}
      {step === 'home' && <HomePage onStart={() => goToStep('upload')} />}
      {step === 'upload' && <UploadPage loadingLine={loadingLine} onUpload={startUploadMock} onBack={() => goToStep('home')} />}
      {step === 'profile' && <ProfilePage onNext={() => goToStep('config')} />}
      {step === 'config' && (
        <ConfigPage
          selectedCompany={selectedCompany}
          setSelectedCompany={setSelectedCompany}
          onNext={() => goToStep('meeting')}
        />
      )}
      {step === 'meeting' && (
        <MeetingPage
          selected={selected}
          currentTurn={mockInterviewTurns[currentTurnIndex]}
          currentTurnIndex={currentTurnIndex}
          meetingStatus={meetingStatus}
          transcript={transcript}
          enterMeeting={enterMeeting}
          finishAnswer={finishAnswer}
          showEndConfirm={showEndConfirm}
          setShowEndConfirm={setShowEndConfirm}
          generateReport={generateReport}
        />
      )}
      {step === 'report' && <ReportPage selected={selected} onRestart={restart} onHome={() => goToStep('home')} />}
    </div>
  );
}

function formatClock(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function TopNav({ step, goToStep }) {
  const currentIndex = steps.indexOf(step);
  return (
    <header className="sticky top-0 z-30 border-b border-lineBlue bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <button className="flex items-center gap-2 text-left" onClick={() => goToStep('home')}>
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-soft">
            <BriefcaseBusiness size={19} />
          </span>
          <span>
            <span className="block text-base font-bold text-ink">OfferCrash</span>
            <span className="block text-xs text-muted">PM 校招压力面试 Agent</span>
          </span>
        </button>
        <div className="hidden items-center gap-2 md:flex">
          {['首页', '上传', '档案', '配置', '会议', '报告'].map((item, index) => (
            <div key={item} className="flex items-center gap-2">
              <span
                className={`flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-semibold ${
                  index <= currentIndex ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600'
                }`}
              >
                {item}
              </span>
              {index < 5 && <ChevronRight size={16} className="text-muted" />}
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}

function PageShell({ children, className = '' }) {
  return <main className={`mx-auto max-w-7xl px-5 py-8 lg:py-12 ${className}`}>{children}</main>;
}

function Tag({ children, tone = 'blue' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        tone === 'orange' ? 'bg-orange-50 text-orange-700' : 'bg-brand-50 text-brand-600'
      }`}
    >
      {children}
    </span>
  );
}

function PrimaryButton({ children, onClick, icon: Icon = ArrowRight, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 ${className}`}
    >
      {children}
      {Icon && <Icon size={18} />}
    </button>
  );
}

function SecondaryButton({ children, onClick, icon: Icon, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-lineBlue bg-white px-5 py-3 text-sm font-semibold text-brand-600 transition hover:border-brand-600 hover:bg-brand-50 ${className}`}
    >
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
}

function Card({ children, className = '' }) {
  return <section className={`rounded-2xl border border-lineBlue bg-white shadow-card ${className}`}>{children}</section>;
}

function HomePage({ onStart }) {
  const features = [
    ['AI 主动提问', '不是聊天机器人，而是主动控场的面试官', Bot],
    ['真实会议场景', '模拟腾讯会议式线上面试体验', MonitorUp],
    ['面试诊断报告', '输出等级、通过概率、崩点分析和优化建议', ClipboardList],
  ];
  return (
    <PageShell>
      <section className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="py-6">
          <Tag>产品经理大厂校招压力面试 Agent</Tag>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight text-ink md:text-6xl">
            提前崩一次，正式面试少崩一次。
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-body">
            上传 DOCX 简历，进入一场由 AI 面试官主动主持的产品经理校招语音压力面试。支持字节 / 腾讯风格，动态追问，面试后生成诊断报告。
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <PrimaryButton onClick={onStart} icon={Play}>开始压力面试</PrimaryButton>
            <div className="flex items-center gap-2 text-sm text-muted">
              <Check size={17} className="text-brand-600" />
              Mock 流程可直接演示
            </div>
          </div>
        </div>
        <Card className="overflow-hidden p-5">
          <MeetingPreview />
        </Card>
      </section>
      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {features.map(([title, desc, Icon]) => (
          <Card key={title} className="p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <Icon size={22} />
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
    <div className="rounded-2xl border border-lineBlue bg-[#F7F8FA]">
      <div className="flex items-center justify-between border-b border-lineBlue bg-white px-4 py-3 text-xs text-muted">
        <span>会议详情 01:17（40分钟）</span>
        <span>宫格布局</span>
      </div>
      <div className="grid grid-cols-[1fr_150px]">
        <div className="flex min-h-[280px] flex-col items-center justify-center gap-10 p-6">
          <div className="rounded-xl border border-lineBlue bg-brand-50 p-4 text-sm font-semibold text-ink">
            当前问题：请你用 1 分钟介绍一下你自己
          </div>
          <div className="flex items-center gap-16">
            <AvatarBubble label="David" />
            <AvatarBubble label="我是谁" candidate />
          </div>
        </div>
        <div className="border-l border-lineBlue bg-white p-4 text-xs">
          <p className="font-bold text-ink">面试实时记录</p>
          <p className="mt-5 text-brand-600">AI｜开场</p>
          <p className="mt-2 text-muted">请你介绍一下你自己...</p>
        </div>
      </div>
    </div>
  );
}

function UploadPage({ loadingLine, onUpload, onBack }) {
  return (
    <PageShell className="max-w-5xl">
      <button onClick={onBack} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-600">
        <ArrowLeft size={17} />
        返回
      </button>
      <div className="text-center">
        <Tag>DOCX 简历解析</Tag>
        <h1 className="mt-4 text-3xl font-bold text-ink md:text-4xl">上传 DOCX 简历 / 项目经历</h1>
        <p className="mx-auto mt-4 max-w-3xl leading-7 text-muted">
          请上传 .docx 文件，建议包含教育背景、实习经历、项目经历、负责内容和项目结果。
        </p>
      </div>
      <Card className="mt-8 p-6 md:p-10">
        <button
          onClick={onUpload}
          className="flex min-h-[320px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-lineBlue bg-[#F7FAFC] px-6 text-center transition hover:border-brand-600 hover:bg-brand-50"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-soft">
            <UploadCloud size={30} />
          </span>
          <h2 className="mt-6 text-xl font-bold text-ink">拖拽 DOCX 到这里，或点击上传</h2>
          <p className="mt-2 text-sm text-muted">仅支持 .docx 文件</p>
        </button>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <PrimaryButton onClick={onUpload} icon={UploadCloud}>上传 DOCX</PrimaryButton>
          <SecondaryButton onClick={onUpload} icon={FileText}>使用示例 DOCX</SecondaryButton>
        </div>
      </Card>
      {loadingLine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 px-5 backdrop-blur-sm">
          <Card className="w-full max-w-md p-7 text-center">
            <RefreshCw className="mx-auto animate-spin text-brand-600" size={34} />
            <p className="mt-4 text-lg font-bold text-ink">{loadingLine}</p>
            <p className="mt-2 text-sm text-muted">正在使用 mock 数据生成候选人档案</p>
          </Card>
        </div>
      )}
    </PageShell>
  );
}

function ProfilePage({ onNext }) {
  return (
    <PageShell className="max-w-6xl">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Tag>解析完成</Tag>
          <h1 className="mt-4 text-3xl font-bold text-ink md:text-4xl">候选人档案已生成</h1>
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
            <InfoRow label="主要项目" value={candidateProfile.project} />
            <InfoRow label="负责内容" value={candidateProfile.responsibilities} />
            <div className="mt-7">
              <p className="font-bold text-ink">系统识别风险点</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {candidateProfile.risks.map((risk) => (
                  <div key={risk} className="flex items-center gap-3 rounded-2xl border border-lineBlue bg-white p-4">
                    <ShieldQuestion size={18} className="text-brand-600" />
                    <span className="text-sm font-medium text-body">{risk}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </PageShell>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="border-b border-lineBlue py-5 first:pt-0">
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className="mt-2 text-lg font-semibold text-ink">{value}</p>
    </div>
  );
}

function ConfigPage({ selectedCompany, setSelectedCompany, onNext }) {
  return (
    <PageShell className="max-w-6xl">
      <Tag>面试配置</Tag>
      <h1 className="mt-4 text-3xl font-bold text-ink md:text-4xl">面试配置</h1>
      <p className="mt-3 text-muted">岗位：产品经理校招 / 实习</p>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {Object.entries(companyProfiles).map(([key, item]) => {
          const active = key === selectedCompany;
          return (
            <button
              key={key}
              onClick={() => setSelectedCompany(key)}
              className={`rounded-2xl border p-6 text-left shadow-card transition ${
                active ? 'border-brand-600 bg-brand-50' : 'border-lineBlue bg-white hover:border-brand-600'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-xl font-bold text-ink">{item.title}</h2>
                {active && <Check className="shrink-0 text-brand-600" size={22} />}
              </div>
              <p className="mt-4 leading-7 text-body">特点：{item.traits}</p>
              <div className="mt-5 rounded-2xl border border-lineBlue bg-white p-4">
                <p className="text-xs font-semibold text-brand-600">典型追问</p>
                <p className="mt-2 font-medium text-ink">“{item.question}”</p>
              </div>
            </button>
          );
        })}
      </div>
      <Card className="mt-8 p-6">
        <h2 className="text-lg font-bold text-ink">本轮面试设置</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SettingPill label="岗位" value="产品经理" />
          <SettingPill label="面试官" value={companyProfiles[selectedCompany].label} />
          <SettingPill label="简历档案" value="已读取" />
          <SettingPill label="预计时长" value="5-7 分钟" />
        </div>
        <div className="mt-6">
          <PrimaryButton onClick={onNext} icon={MonitorUp}>进入 AI 面试会议室</PrimaryButton>
        </div>
      </Card>
    </PageShell>
  );
}

function SettingPill({ label, value }) {
  return (
    <div className="rounded-2xl border border-lineBlue bg-[#F7FAFC] p-4">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className="mt-2 font-bold text-ink">{value}</p>
    </div>
  );
}

function MeetingPage({
  selected,
  currentTurn,
  currentTurnIndex,
  meetingStatus,
  transcript,
  enterMeeting,
  finishAnswer,
  showEndConfirm,
  setShowEndConfirm,
  generateReport,
}) {
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isRecordPanelOpen, setIsRecordPanelOpen] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(77);

  useEffect(() => {
    if (meetingStatus === 'device_check' || meetingStatus === 'ended') return undefined;
    const timer = window.setInterval(() => setElapsedTime((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [meetingStatus]);

  const statusText = {
    device_check: '设备检测',
    ai_speaking: 'AI 正在提问',
    user_answering: '用户正在回答',
    ai_thinking: 'AI 正在分析',
    generating_report: '正在生成报告',
    ended: '已结束',
  }[meetingStatus];

  return (
    <main className="flex h-screen min-h-[720px] flex-col overflow-hidden bg-[#F7F8FA] text-[13px] text-body">
      <MeetingTopBar elapsedTime={elapsedTime} selected={selected} />
      <div className={`grid min-h-0 flex-1 ${isRecordPanelOpen ? 'lg:grid-cols-[minmax(0,1fr)_400px]' : 'grid-cols-1'}`}>
        <MeetingCanvas
          currentTurn={currentTurn}
          currentTurnIndex={currentTurnIndex}
          meetingStatus={meetingStatus}
          statusText={statusText}
          selected={selected}
        />
        {isRecordPanelOpen && (
          <RecordPanel transcript={transcript} onClose={() => setIsRecordPanelOpen(false)} />
        )}
      </div>
      <MeetingControlBar
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        isVideoOn={isVideoOn}
        setIsVideoOn={setIsVideoOn}
        isRecordPanelOpen={isRecordPanelOpen}
        setIsRecordPanelOpen={setIsRecordPanelOpen}
        meetingStatus={meetingStatus}
        finishAnswer={finishAnswer}
        onEnd={() => setShowEndConfirm(true)}
      />
      {meetingStatus === 'device_check' && <DeviceModal onEnter={enterMeeting} />}
      {showEndConfirm && <ConfirmModal onCancel={() => setShowEndConfirm(false)} onConfirm={generateReport} />}
    </main>
  );
}

function MeetingTopBar({ elapsedTime, selected }) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-line bg-white px-3 text-[#111827]">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#EEF4FF] text-brand-600">
          <MonitorUp size={17} />
        </span>
        <button className="font-semibold">会议详情</button>
        <span className="hidden items-center gap-1 text-muted sm:flex">
          <span className="text-base">⌛</span>
          {formatClock(elapsedTime)}（40分钟）
        </span>
        <span className="hidden h-4 w-px bg-line md:block" />
        <span className="hidden truncate text-muted md:block">产品经理压力面试会议室｜{selected.meetingLabel}</span>
        <Wifi size={17} className="text-emerald-500" />
        <ShieldCheck size={17} className="text-brand-600" />
        <Volume2 size={17} className="text-muted" />
      </div>
      <div className="flex items-center gap-1 text-muted">
        <TopTool icon={Grid2X2} label="宫格布局" hasArrow />
        <TopTool icon={ShieldCheck} label="主持人工具" hasArrow />
        <TopTool icon={Settings} label="设置" />
        <button className="hidden rounded-md p-2 hover:bg-[#F3F4F6] md:inline-flex" title="全屏">
          <Maximize2 size={17} />
        </button>
        <button className="hidden rounded-md p-2 hover:bg-[#F3F4F6] md:inline-flex" title="窗口">
          <Minimize2 size={17} />
        </button>
      </div>
    </header>
  );
}

function TopTool({ icon: Icon, label, hasArrow }) {
  return (
    <button className="hidden items-center gap-1 rounded-md px-2 py-1.5 hover:bg-[#F3F4F6] md:inline-flex">
      <Icon size={16} />
      <span>{label}</span>
      {hasArrow && <span className="text-xs">⌄</span>}
    </button>
  );
}

function MeetingCanvas({ currentTurn, currentTurnIndex, meetingStatus, statusText, selected }) {
  const questionText =
    meetingStatus === 'ai_thinking'
      ? 'AI 正在分析你的回答...'
      : meetingStatus === 'generating_report'
        ? '正在生成面试诊断报告...'
        : currentTurn.ai;

  return (
    <section className="relative flex min-h-0 flex-col border-r border-line bg-[#F7F8FA]">
      <div className="absolute left-1/2 top-8 z-10 w-[min(520px,calc(100%-32px))] -translate-x-1/2 rounded-xl border border-[#DDE7F8] bg-[#EFF6FF] px-5 py-4 shadow-soft">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-600 text-white">
            <MessageSquare size={15} />
          </span>
          <span className="font-bold text-ink">当前问题</span>
          <Tag tone={currentTurn.stage === '压力质疑' ? 'orange' : 'blue'}>{currentTurn.type}</Tag>
        </div>
        <p className="mt-3 text-[15px] font-medium leading-7 text-ink">{questionText}</p>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 pt-24">
        <div className="flex translate-y-10 items-start justify-center gap-20 sm:gap-28">
          <MeetingMember
            name="David"
            role="AI 面试官"
            active={meetingStatus === 'ai_speaking'}
            status={meetingStatus === 'ai_speaking' ? '正在提问' : meetingStatus === 'ai_thinking' ? '正在分析' : selected.interviewer}
            host
          />
          <MeetingMember
            name="我是谁"
            role="候选人 / 你"
            active={meetingStatus === 'user_answering'}
            status={meetingStatus === 'user_answering' ? '正在回答 · 00:42' : '等待回答'}
            candidate
          />
        </div>
      </div>

      <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full border border-line bg-white px-4 py-2 text-xs text-muted shadow-soft">
        <span>{statusText}</span>
        <span className="h-3 w-px bg-line" />
        <span>第 {currentTurnIndex + 1}/6 轮</span>
      </div>
    </section>
  );
}

function MeetingMember({ name, role, active, status, host, candidate }) {
  return (
    <div className="flex w-32 flex-col items-center text-center">
      <div className={`relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border bg-white shadow-soft ${active ? 'border-brand-600 ring-4 ring-brand-100' : 'border-line'}`}>
        {host ? (
          <div className="flex h-full w-full flex-col items-center justify-end bg-gradient-to-b from-[#F9FAFB] to-[#E5E7EB]">
            <div className="mt-2 h-9 w-8 rounded-t-full bg-[#111827]" />
            <div className="h-9 w-14 rounded-t-2xl bg-[#1F2937]" />
            <div className="absolute top-5 h-10 w-10 rounded-full bg-[#F3D4C4]" />
            <div className="absolute top-4 h-5 w-12 rounded-t-full bg-[#111827]" />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-brand-600 text-2xl font-bold text-white">
            {candidate ? '是谁' : '你'}
          </div>
        )}
        {host && (
          <span className="absolute bottom-1 right-1 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-700">
            主持
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center justify-center gap-1.5 font-semibold text-ink">
        <MicOff size={15} className="text-muted" />
        <span>{name}</span>
      </div>
      <p className="mt-1 text-xs text-muted">{role}</p>
      {active && <p className="mt-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">{status}</p>}
      {!active && <p className="mt-2 text-xs text-muted">{status}</p>}
    </div>
  );
}

function AvatarBubble({ label, candidate }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`flex h-20 w-20 items-center justify-center rounded-full ${candidate ? 'bg-brand-600 text-white' : 'bg-white'} border border-line shadow-soft`}>
        <span className="text-lg font-bold">{candidate ? '是谁' : 'D'}</span>
      </div>
      <p className="mt-2 font-semibold text-ink">🔇 {label}</p>
    </div>
  );
}

function RecordPanel({ transcript, onClose }) {
  return (
    <aside className="hidden min-h-0 flex-col border-l border-line bg-white lg:flex">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
        <div className="flex items-center gap-2">
          <ClipboardList size={20} className="text-[#374151]" />
          <h2 className="text-base font-bold text-ink">面试实时记录</h2>
        </div>
        <div className="flex items-center gap-1 text-muted">
          <button className="rounded-md p-1.5 hover:bg-[#F3F4F6]" title="弹出">
            <PanelRightOpen size={17} />
          </button>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-[#F3F4F6]" title="关闭">
            <X size={18} />
          </button>
        </div>
      </div>
      <div className="border-b border-line bg-[#F4F7FF] px-5 py-3 text-sm text-brand-600">
        ⏱ 面试开始 01:17
      </div>
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
        {transcript.length === 0 && <p className="text-sm text-muted">进入面试后，AI 会主动开场并生成记录。</p>}
        {transcript.map((item, index) => {
          const pressure = item.tag === '压力质疑' || item.tag === '数据追问';
          return (
            <article key={`${item.role}-${index}`} className="relative pl-5">
              <span className={`absolute left-0 top-1.5 h-1.5 w-1.5 rounded-full ${item.role === '你' ? 'bg-emerald-500' : 'bg-brand-600'}`} />
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${item.role === '你' ? 'text-emerald-600' : 'text-brand-600'}`}>{item.role}</span>
                  <Tag tone={pressure ? 'orange' : 'blue'}>{item.tag}</Tag>
                </div>
                <span className="text-xs text-muted">{item.time}</span>
              </div>
              <p className="mt-2 text-sm leading-7 text-body">{item.text}</p>
            </article>
          );
        })}
      </div>
      <div className="shrink-0 border-t border-line px-4 py-3">
        <div className="flex items-center gap-2 rounded-lg border border-line bg-[#F9FAFB] px-3 py-2">
          <input
            disabled
            placeholder="请输入消息..."
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
          />
          <button disabled className="text-muted">
            <Send size={17} />
          </button>
        </div>
        <p className="mt-2 text-xs text-muted">实时记录将用于面试评估，请如实作答。</p>
      </div>
    </aside>
  );
}

function MeetingControlBar({
  isMuted,
  setIsMuted,
  meetingStatus,
  finishAnswer,
  onEnd,
}) {
  const answerDisabled = meetingStatus !== 'user_answering';
  return (
    <footer className="grid h-20 shrink-0 grid-cols-3 items-center border-t border-line bg-white px-6">
      <div className="flex justify-start">
        <ControlItem
          icon={isMuted ? MicOff : Mic}
          label={isMuted ? '解除静音' : '静音'}
          danger={isMuted}
          onClick={() => setIsMuted((value) => !value)}
        />
      </div>

      <div className="flex justify-center">
        <button
          onClick={answerDisabled ? undefined : finishAnswer}
          className={`flex h-12 min-w-32 items-center justify-center rounded-lg px-6 text-sm font-semibold ${
            answerDisabled ? 'bg-[#F3F4F6] text-muted' : 'bg-brand-600 text-white shadow-soft hover:bg-brand-700'
          }`}
        >
          回答完毕
        </button>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onEnd}
          className="flex h-14 min-w-[86px] flex-col items-center justify-center gap-1 rounded-lg text-[#EF4444] hover:bg-red-50"
        >
          <PhoneEndIcon />
          <span className="text-xs font-semibold">结束会议</span>
        </button>
      </div>
    </footer>
  );
}

function ControlItem({ icon: Icon, label, active, danger, accent, onClick, className = 'flex' }) {
  return (
    <button
      onClick={onClick}
      className={`${className} h-16 w-[70px] flex-col items-center justify-center gap-1 rounded-lg text-[#374151] transition hover:bg-[#F3F4F6] ${
        active ? 'bg-[#F3F4F6]' : ''
      }`}
    >
      <Icon size={22} className={danger ? 'text-[#EF4444]' : accent ? 'text-emerald-600' : 'text-[#374151]'} />
      <span className="text-xs">{label}</span>
    </button>
  );
}

function PhoneEndIcon() {
  return (
    <span className="flex h-7 w-9 items-center justify-center rounded-full bg-[#EF4444] text-white">
      <span className="block h-2 w-5 rounded-b-full border-b-4 border-white" />
    </span>
  );
}

function DeviceModal({ onEnter }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/75 px-5 backdrop-blur-sm">
      <Card className="w-full max-w-lg p-7">
        <h2 className="text-2xl font-bold text-ink">进入面试前，请确认设备状态</h2>
        <div className="mt-6 grid gap-3">
          {['麦克风：已连接', '语音服务：已连接', '简历档案：已读取'].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-2xl bg-brand-50 p-4">
              <Check size={18} className="text-brand-600" />
              <span className="font-semibold text-ink">{item}</span>
            </div>
          ))}
        </div>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <SecondaryButton icon={Volume2} className="flex-1">测试麦克风</SecondaryButton>
          <PrimaryButton onClick={onEnter} icon={MonitorUp} className="flex-1">进入面试</PrimaryButton>
        </div>
      </Card>
    </div>
  );
}

function ConfirmModal({ onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/75 px-5 backdrop-blur-sm">
      <Card className="w-full max-w-md p-7">
        <h2 className="text-xl font-bold text-ink">确定结束本轮面试并生成诊断报告吗？</h2>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <SecondaryButton onClick={onCancel} className="flex-1">继续面试</SecondaryButton>
          <PrimaryButton onClick={onConfirm} icon={ClipboardList} className="flex-1">生成报告</PrimaryButton>
        </div>
      </Card>
    </div>
  );
}

function ReportPage({ selected, onRestart, onHome }) {
  const scores = [
    ['结构化表达', 72],
    ['项目理解深度', 70],
    ['用户洞察', 65],
    ['数据意识', 52],
    ['个人贡献', 58],
    ['抗压表现', 60],
  ];
  return (
    <PageShell>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Tag>诊断报告</Tag>
          <h1 className="mt-4 text-3xl font-bold text-ink md:text-4xl">产品经理校招面试诊断报告</h1>
          <p className="mt-3 text-muted">{selected.label}｜面试时长 08:42｜共 6 轮追问</p>
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
            <span className="text-7xl font-bold text-ink">B</span>
            <div className="pb-2">
              <p className="text-2xl font-bold text-brand-600">进入下一轮概率：46%</p>
              <p className="mt-2 font-semibold text-body">被刷风险：中高</p>
            </div>
          </div>
          <p className="mt-6 rounded-2xl bg-brand-50 p-4 leading-7 text-body">
            你具备基础项目表达能力，但在数据意识、个人贡献和抗压回应上仍然暴露出明显短板。
          </p>
        </Card>
        <Card className="p-6">
          <h2 className="text-lg font-bold text-ink">六维评分</h2>
          <div className="mt-5 grid gap-4">
            {scores.map(([label, score]) => (
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
            {[
              ['数据表达不足', '你多次使用“提升效率”“优化体验”等表达，但没有给出具体指标、统计口径和对比数据。'],
              ['个人贡献不清晰', '你频繁使用“我们团队”，但没有说明你个人推动了什么决策。'],
              ['被追问时容易补背景', '面对压力质疑时，你倾向于补充项目背景，而不是正面回答问题。'],
            ].map(([title, desc], index) => (
              <div key={title} className="rounded-2xl border border-lineBlue bg-[#F7FAFC] p-5">
                <p className="font-bold text-ink">{index + 1}. {title}</p>
                <p className="mt-2 leading-7 text-body">{desc}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="text-lg font-bold text-ink">面试官最不满意的一点</h2>
          <p className="mt-4 leading-7 text-body">
            你没有证明自己是项目的产品推动者。你讲了项目发生了什么，但没有讲清楚你为什么这么做、你怎么判断、结果如何验证。
          </p>
        </Card>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-ink">优化回答示范</h2>
          <div className="mt-5 space-y-4">
            <ReportBlock label="原问题" text="你在这个项目中具体负责什么？" />
            <ReportBlock label="原回答问题" text="表达较泛，缺少个人贡献和产品决策。" />
            <ReportBlock
              label="优化后回答"
              text="我在这个项目中主要负责用户调研和需求优先级判断。前期我们访谈了 15 位有二手交易需求的学生，发现核心问题不是“没有交易平台”，而是“信息分散”和“信任成本高”。因此我把产品目标定义为提升匹配效率和降低交易信任成本，并优先设计了校区筛选、品类分类和信用评价三个功能。"
            />
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="text-lg font-bold text-ink">下一轮训练建议</h2>
          <p className="mt-4 leading-7 text-body">下一轮建议重点训练：数据表达 + 个人贡献说明</p>
          <p className="mt-4 font-semibold text-ink">你需要准备：</p>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-body">
            <li>当前项目的 3 个核心指标</li>
            <li>你个人推动的 2 个关键决策</li>
            <li>一个失败或取舍案例</li>
            <li>一句清晰的个人贡献总结</li>
          </ol>
        </Card>
      </section>
    </PageShell>
  );
}

function ReportBlock({ label, text }) {
  return (
    <div className="rounded-2xl border border-lineBlue bg-[#F7FAFC] p-4">
      <p className="text-sm font-bold text-brand-600">{label}</p>
      <p className="mt-2 leading-7 text-body">{text}</p>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
