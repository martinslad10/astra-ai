'use client';

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "../lib/supabase-browser";
import { Activity, ArrowUp, BrainCircuit, BriefcaseBusiness, Check, ChevronDown, Code2, FileText, Film, Image as ImageIcon, Menu, Megaphone, Paperclip, Plus, Sparkles, WandSparkles, UserRound, X, FlaskConical, Mic, Volume2, Square } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string; image?: string };
const starters = [
  { icon: BrainCircuit, title: "Přemýšlej se mnou", text: "Pomoz mi rozebrat složitý problém krok za krokem." },
  { icon: Code2, title: "Vytvoř aplikaci", text: "Navrhni architekturu aplikace a rozepiš první implementační kroky." },
  { icon: ImageIcon, title: "Vizuální tvorba", text: "Připrav kreativní koncept pro realistický vizuál produktu." },
  { icon: Film, title: "Video a obsah", text: "Navrhni scénář krátkého videa pro sociální sítě." },
];

export default function Home() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [model, setModel] = useState("gpt-4.1-mini");
  const [deepMode, setDeepMode] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [liveVoiceConnecting, setLiveVoiceConnecting] = useState(false);
  const [liveVoiceActive, setLiveVoiceActive] = useState(false);
  const [liveVoiceStatus, setLiveVoiceStatus] = useState("");
  const [cloudConversationId, setCloudConversationId] = useState<string | null>(null);
  const [cloudSyncNotice, setCloudSyncNotice] = useState("");
  const [cloudMemoryNotes, setCloudMemoryNotes] = useState<{ title: string; content: string }[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const speechAudioRef = useRef<HTMLAudioElement | null>(null);
  const speechContextRef = useRef<AudioContext | null>(null);
  const speechSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const speechUrlRef = useRef<string | null>(null);
  const speechRequestRef = useRef(0);
  const livePeerRef = useRef<RTCPeerConnection | null>(null);
  const liveStreamRef = useRef<MediaStream | null>(null);
  const liveChannelRef = useRef<RTCDataChannel | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    let active = true;
    async function restoreHistory() {
      try {
        const saved = window.localStorage.getItem("astra-ai-chat-v1");
        if (saved && active) setMessages(JSON.parse(saved) as Message[]);
      } catch {
        // Ignore invalid local history.
      }
      setHydrated(true);

      const client = getSupabaseBrowserClient();
      if (!client) return;
      try {
        const { data: sessionData } = await client.auth.getSession();
        const user = sessionData.session?.user;
        if (!user || !active) return;
        const { data: memoryRows, error: memoryError } = await client
          .from("memory_notes").select("title,content")
          .eq("user_id", user.id).order("updated_at", { ascending: false }).limit(10);
        if (memoryError) throw memoryError;
        if (active && memoryRows) {
          setCloudMemoryNotes(memoryRows.filter((note): note is { title: string; content: string } =>
            typeof note.title === "string" && typeof note.content === "string"
          ));
        }
        const { data: rows, error: conversationError } = await client
          .from("conversations").select("id,title,updated_at")
          .eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1);
        if (conversationError) throw conversationError;
        const conversation = rows?.[0];
        if (!conversation || !active) return;
        const { data: cloudMessages, error: messageError } = await client
          .from("messages").select("role,content").eq("conversation_id", conversation.id)
          .eq("user_id", user.id).order("created_at", { ascending: true }).limit(100);
        if (messageError) throw messageError;
        if (active && cloudMessages?.length) {
          setCloudConversationId(conversation.id);
          setMessages(cloudMessages.filter((m): m is Message =>
            (m.role === "user" || m.role === "assistant") && typeof m.content === "string"
          ));
          setCloudSyncNotice("Historie obnovena z cloudu.");
        }
      } catch {
        if (active) setCloudSyncNotice("Cloudovou historii se nepodařilo načíst. Lokální historie zůstává dostupná.");
      }
    }
    void restoreHistory();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem("astra-ai-chat-v1", JSON.stringify(messages.slice(-100).map(({ role, content }) => ({ role, content }))));
    } catch {
      // Storage may be disabled or full.
    }
  }, [messages, hydrated]);

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, busy]);

  async function send(text = draft) {
    const content = text.trim();
    if (!content || busy) return;
    const next: Message[] = [...messages, { role: "user", content, ...(pendingImage ? { image: pendingImage } : {}) }];
    setPendingImage(null);
    setMessages(next); setDraft(""); setError(""); setBusy(true);
    try {
      let memory: { title: string; content: string }[] = [];
      try {
        const savedMemory = window.localStorage.getItem("astra-ai-memory-v1");
        const parsed: unknown = savedMemory ? JSON.parse(savedMemory) : [];
        if (Array.isArray(parsed)) {
          memory = parsed.filter((item): item is { title: string; content: string } =>
            item !== null && typeof item === "object" && "title" in item && "content" in item &&
            typeof (item as { title: unknown }).title === "string" &&
            typeof (item as { content: unknown }).content === "string"
          ).slice(0, 10).map(item => ({ title: item.title.slice(0, 120), content: item.content.slice(0, 1200) }));
        }
      } catch { /* Memory is optional; continue without it. */ }
      const combinedMemory = [...memory, ...cloudMemoryNotes]
        .reduce((acc, note) => {
          if (!acc.some(existing => existing.title === note.title && existing.content === note.content)) acc.push(note);
          return acc;
        }, [] as { title: string; content: string }[])
        .slice(0, 10);
      const latestUserImageIndex = next.reduce((index, message, current) => message.role === "user" && message.image ? current : index, -1);
      const chatMessages = next.map((message, index) => ({ role: message.role, content: message.content, ...(index === latestUserImageIndex && message.image ? { image: message.image } : {}) }));
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: chatMessages, memory: combinedMemory, model, depth: deepMode ? "deep" : "standard" }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Požadavek se nezdařil.");
      const assistantMessage = { role: "assistant" as const, content: data.reply, ...(typeof data.image === "string" ? { image: data.image } : {}) };
      setMessages([...next, assistantMessage]);

      const client = getSupabaseBrowserClient();
      if (client) {
        try {
          const { data: sessionData } = await client.auth.getSession();
          const user = sessionData.session?.user;
          if (user) {
            let conversationId = cloudConversationId;
            if (!conversationId) {
              const title = content.slice(0, 80) || "Nová konverzace";
              const { data: created, error: createError } = await client
                .from("conversations").insert({ user_id: user.id, title }).select("id").single();
              if (createError) throw createError;
              conversationId = created.id;
              setCloudConversationId(conversationId);
            }
            const { error: saveError } = await client.from("messages").insert([
              { conversation_id: conversationId, user_id: user.id, role: "user", content },
              { conversation_id: conversationId, user_id: user.id, role: "assistant", content: data.reply },
            ]);
            if (saveError) throw saveError;
            await client.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId).eq("user_id", user.id);
            setCloudSyncNotice("Konverzace uložena do cloudu.");
          }
        } catch {
          setCloudSyncNotice("Odpověď je hotová, ale cloudové uložení se nezdařilo. Lokální historie zůstává dostupná.");
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Něco se pokazilo. Zkus to znovu.");
    } finally { setBusy(false); textareaRef.current?.focus(); }
  }

  async function speakText(text: string) {
    const requestId = ++speechRequestRef.current;
    // Stop any previous playback so two voices can never overlap.
    speechSourceRef.current?.stop();
    speechSourceRef.current = null;
    if (speechAudioRef.current) {
      speechAudioRef.current.pause();
      speechAudioRef.current.removeAttribute("src");
      speechAudioRef.current.load();
      speechAudioRef.current = null;
    }
    if (speechUrlRef.current) {
      URL.revokeObjectURL(speechUrlRef.current);
      speechUrlRef.current = null;
    }

    // On iOS, unlock Web Audio immediately inside the user's tap, before awaiting the API.
    let audioContext: AudioContext | null = null;
    try {
      const AudioContextClass = window.AudioContext;
      if (AudioContextClass) {
        audioContext = speechContextRef.current ?? new AudioContextClass();
        speechContextRef.current = audioContext;
        if (audioContext.state === "suspended") void audioContext.resume();
      }
    } catch {
      audioContext = null;
    }

    try {
      const response = await fetch("/api/audio/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, 8000) }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Hlas se nepodařilo vytvořit.");
      }
      const audioBlob = await response.blob();
      if (requestId !== speechRequestRef.current) return;

      if (audioContext) {
        if (audioContext.state === "suspended") await audioContext.resume();
        const decoded = await audioContext.decodeAudioData(await audioBlob.arrayBuffer());
        if (requestId !== speechRequestRef.current) return;
        const source = audioContext.createBufferSource();
        source.buffer = decoded;
        source.connect(audioContext.destination);
        speechSourceRef.current = source;
        source.onended = () => {
          if (speechSourceRef.current === source) speechSourceRef.current = null;
        };
        source.start();
      } else {
        // Fallback for browsers without Web Audio support.
        const audioUrl = URL.createObjectURL(audioBlob);
        speechUrlRef.current = audioUrl;
        const audio = new Audio(audioUrl);
        speechAudioRef.current = audio;
        audio.onended = () => {
          if (speechAudioRef.current === audio) speechAudioRef.current = null;
          if (speechUrlRef.current === audioUrl) {
            URL.revokeObjectURL(audioUrl);
            speechUrlRef.current = null;
          }
        };
        await audio.play();
      }
      setError("");
    } catch (e) {
      if (requestId !== speechRequestRef.current) return;
      const blocked = e instanceof DOMException && (e.name === "NotAllowedError" || e.name === "SecurityError");
      setError(blocked
        ? "Safari zablokoval zvuk. Zkus stránku otevřít přímo v Safari a klepnout znovu na „Přečíst nahlas“."
        : e instanceof Error ? e.message : "Hlasový výstup se nezdařil.");
    }
  }

  async function stopLiveVoice() {
    liveChannelRef.current?.close();
    liveChannelRef.current = null;
    livePeerRef.current?.close();
    livePeerRef.current = null;
    liveStreamRef.current?.getTracks().forEach(track => track.stop());
    liveStreamRef.current = null;
    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.srcObject = null;
    }
    setLiveVoiceActive(false);
    setLiveVoiceConnecting(false);
    setVoiceMode(false);
    setLiveVoiceStatus("");
  }

  async function startLiveVoice() {
    if (liveVoiceActive || liveVoiceConnecting) {
      await stopLiveVoice();
      return;
    }
    setLiveVoiceConnecting(true);
    setLiveVoiceStatus("Připojuji hlasového asistenta…");
    setError("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Pro živý hlas otevři ChatSLADAI v Safari a povol přístup k mikrofonu.");
      }
      // Unlock iOS Safari audio playback synchronously from the user's tap.
      const audioElement = remoteAudioRef.current;
      if (!audioElement) throw new Error("Zvukový přehrávač není připraven.");
      audioElement.autoplay = true;
      audioElement.setAttribute("playsinline", "");
      audioElement.muted = true;
      void audioElement.play().catch(() => undefined);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      liveStreamRef.current = stream;
      const recentContext = messages.slice(-16).map(m => (m.role === "user" ? "Uživatel: " : "ChatSLADAI: ") + m.content).join("\n").slice(-12000);
      const tokenResponse = await fetch("/api/audio/realtime-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: recentContext }),
      });
      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok || typeof tokenData.client_secret !== "string") {
        throw new Error(tokenData.error || "Živý hlas se nepodařilo připravit.");
      }

      const peer = new RTCPeerConnection();
      livePeerRef.current = peer;
      peer.ontrack = event => {
        audioElement.srcObject = event.streams[0];
        audioElement.muted = false;
        void audioElement.play().catch(() => setLiveVoiceStatus("Safari zablokoval zvuk. Zkontroluj tichý režim a hlasitost iPhonu a klepni znovu na Živý hlas."));
      };
      stream.getTracks().forEach(track => peer.addTrack(track, stream));
      const channel = peer.createDataChannel("oai-events");
      liveChannelRef.current = channel;
      channel.onopen = () => {
        setLiveVoiceActive(true);
        setLiveVoiceConnecting(false);
        setVoiceMode(true);
        setLiveVoiceStatus("Připojeno – můžeš přirozeně mluvit.");
      };
      channel.onmessage = event => {
        try {
          const payload = JSON.parse(event.data) as { type?: string; transcript?: string; item?: { content?: { transcript?: string }[] }; delta?: string };
          if (payload.type === "conversation.item.input_audio_transcription.completed" && payload.transcript) {
            setMessages(current => [...current, { role: "user", content: payload.transcript! }]);
          } else if (payload.type === "response.output_audio_transcript.done" && payload.transcript) {
            setMessages(current => [...current, { role: "assistant", content: payload.transcript! }]);
          }
        } catch { /* Ignore non-JSON Realtime events. */ }
      };
      peer.onconnectionstatechange = () => {
        if (peer.connectionState === "failed" || peer.connectionState === "disconnected" || peer.connectionState === "closed") {
          setLiveVoiceActive(false);
          setVoiceMode(false);
          if (peer.connectionState === "failed") setError("Spojení hlasového režimu se přerušilo. Zkus se připojit znovu.");
        }
      };
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      const sdpResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        headers: { Authorization: "Bearer " + tokenData.client_secret, "Content-Type": "application/sdp" },
        body: offer.sdp,
      });
      if (!sdpResponse.ok) throw new Error("OpenAI odmítlo připojení živého hlasu (" + sdpResponse.status + ").");
      const answer = await sdpResponse.text();
      await peer.setRemoteDescription({ type: "answer", sdp: answer });
    } catch (e) {
      await stopLiveVoice();
      setError(e instanceof Error ? e.message : "Živý hlas se nepodařilo spustit.");
    } finally {
      setLiveVoiceConnecting(false);
    }
  }

  async function toggleRecording() {
    if (isRecording) { recorderRef.current?.stop(); return; }
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") throw new Error("Tento prohlížeč nepodporuje hlasový vstup. Zkus aktuální Safari nebo Chrome a povol mikrofon.");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find(type => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = async () => {
        setIsRecording(false);
        stream.getTracks().forEach(track => track.stop());
        try {
          const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
          const form = new FormData();
          form.append("file", blob, blob.type.includes("mp4") ? "voice-message.m4a" : "voice-message.webm");
          const response = await fetch("/api/audio/transcribe", { method: "POST", body: form });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Hlas se nepodařilo přepsat.");
          if (typeof data.text === "string" && data.text.trim()) {
            if (voiceMode) await send(data.text.trim());
            else setDraft(current => (current.trim() ? current + " " : "") + data.text.trim());
          }
        } catch (e) { setError(e instanceof Error ? e.message : "Přepis hlasu se nezdařil."); }
      };
      recorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Mikrofon se nepodařilo spustit."); }
  }

  function onSubmit(e: FormEvent) { e.preventDefault(); void send(); }

  async function handleFile(file?: File) {
    if (!file) return;
    if (file.type.startsWith("image/")) {
      if (file.size > 6 * 1024 * 1024) { setError("Fotografie je příliš velká. Limit je 6 MB."); return; }
      const reader = new FileReader();
      reader.onload = () => { if (typeof reader.result === "string") { setPendingImage(reader.result); setError(""); } };
      reader.onerror = () => setError("Fotografii se nepodařilo načíst.");
      reader.readAsDataURL(file);
      return;
    }
    const name = file.name.toLowerCase();
    const textFile = /\.(txt|md|csv|json|html|xml|log)$/i.test(name);
    const documentFile = /\.(pdf|docx)$/i.test(name);
    if (!textFile && !documentFile) {
      setError("Podporované formáty jsou fotografie JPG/PNG/WEBP, TXT, MD, CSV, JSON, HTML, XML, LOG, PDF a DOCX.");
      return;
    }
    if (file.size > (documentFile ? 5 * 1024 * 1024 : 15000)) {
      setError(documentFile ? "Dokument je příliš velký. Limit PDF/DOCX je 5 MB." : "Textový soubor je příliš velký. Limit je 15 kB.");
      return;
    }
    try {
      let text = "";
      if (documentFile) {
        const form = new FormData();
        form.append("file", file);
        const response = await fetch("/api/files/extract", { method: "POST", body: form });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Dokument se nepodařilo přečíst.");
        text = typeof data.text === "string" ? data.text : "";
      } else {
        text = await file.text();
      }
      if (!text.trim()) throw new Error("V souboru nebyl nalezen čitelný text.");
      setDraft(current => current + (current.trim() ? "\n\n" : "") + "[Obsah souboru: " + file.name + "]\n" + text.slice(0, 100000));
      setError("");
      textareaRef.current?.focus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Soubor se nepodařilo přečíst.");
    }
  }

  return <main className="app-shell">
    {sidebarOpen && <button aria-label="Zavřít menu" className="mobile-scrim" onClick={() => setSidebarOpen(false)} />}
    <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
      <div className="brand-row"><div className="brand-mark"><Sparkles size={20}/></div><span className="brand-name">Chat<span>SLADAI</span></span><button className="icon-button mobile-close" aria-label="Zavřít menu" onClick={() => setSidebarOpen(false)}><X size={18}/></button></div>
      <button className="new-chat" onClick={() => {setMessages([]);setCloudConversationId(null);setCloudSyncNotice("");setError("");setSidebarOpen(false);try{window.localStorage.removeItem("astra-ai-chat-v1")}catch{/* Ignore unavailable storage. */}}}><Plus size={17}/> Nová konverzace <span>⌘ K</span></button>
      <div className="side-label">PRACOVNÍ PROSTOR</div>
      <button className="side-link active"><Sparkles size={17}/> Chat <span className="active-dot"/></button>
      <button className="side-link" onClick={() => { router.push("/account"); }}><UserRound size={17}/> Účet / přihlášení</button>
      <button className="side-link" onClick={() => { router.push("/memory"); }}><BrainCircuit size={17}/> Moje paměť</button>
      <button className="side-link" onClick={() => { router.push("/lab"); }}><FlaskConical size={17}/> Výzkumná laboratoř <span className="soon">NOVÉ</span></button>
      <button className="side-link" onClick={() => { router.push("/code"); }}><Code2 size={17}/> Programování</button>
      <button className="side-link" onClick={() => { router.push("/documents"); }}><FileText size={17}/> Word / dokumenty</button>
      <button className="side-link" onClick={() => { router.push("/business"); setSidebarOpen(false); }}><BriefcaseBusiness size={17}/> Podnikání</button>
      <button className="side-link" onClick={() => { router.push("/marketing"); }}><Megaphone size={17}/> Marketing</button>
      <button className="side-link" onClick={() => { router.push("/images"); }}><ImageIcon size={17}/> Obrázky</button>
      <button className="side-link" onClick={() => { router.push("/video"); }}><Film size={17}/> Video</button>
      <div className="sidebar-bottom"><div className="status-card"><span className="status-pulse"/><div><strong>Pracovní verze</strong><small>Vývoj právě začíná</small></div><Activity size={16}/></div><div className="profile-row"><div className="avatar">A</div><div><strong>ChatSLADAI</strong><small>Osobní AI prostor</small></div><ChevronDown size={15}/></div></div>
    </aside>
    <section className="main-panel">
      <header className="topbar"><button className="icon-button menu-button" aria-label="Otevřít menu" onClick={() => setSidebarOpen(true)}><Menu size={20}/></button><div className="breadcrumb"><span>Pracovní prostor</span><span className="crumb-slash">/</span><strong>Chat</strong></div><div className="topbar-right"><span className="model-indicator"><span/> AI model</span><label className="model-select" aria-label="Vybrat AI model"><select value={model} onChange={e => setModel(e.target.value)}><option value="gpt-4.1-mini">Rychlý</option><option value="gpt-4.1">Pokročilý</option><option value="gpt-4o-mini">Úsporný</option></select><ChevronDown size={14}/></label></div></header>
      {cloudSyncNotice && <div className="cloud-sync-notice" role="status">{cloudSyncNotice}</div>}
      <div className={`conversation ${messages.length ? "conversation-active" : ""}`}>
        {messages.length === 0 ? <div className="welcome"><div className="eyebrow"><WandSparkles size={14}/> VÁŠ NOVÝ PRACOVNÍ PROSTOR</div><h1>Velké nápady začínají<br/><span>jednou otázkou.</span></h1><p className="welcome-subtitle">Přemýšlej, tvoř a stavěj. Jedno místo pro práci s AI — postupně vybavené nástroji, které potřebuješ.</p><div className="starter-grid">{starters.map(({icon:Icon,title,text}) => <button className="starter-card" key={title} onClick={() => void send(text)}><div className="starter-icon"><Icon size={18}/></div><strong>{title}</strong><span>{text}</span><ArrowUp className="starter-arrow" size={15}/></button>)}</div><div className="trust-line"><span><Check size={13}/> Samostatný projekt</span><span><Check size={13}/> Soukromí na prvním místě</span><span><Check size={13}/> Postupně rozšiřitelné</span></div></div> : <div className="message-list">{messages.map((m,i) => <div className={`message ${m.role}`} key={`${i}-${m.role}`}><div className="message-avatar">{m.role === "assistant" ? <Sparkles size={16}/> : "Ty"}</div><div className="message-content"><div className="message-role">{m.role === "assistant" ? "ChatSLADAI" : "Ty"}</div><p>{m.content}</p>{m.image && <img className="chat-generated-image" src={m.image} alt={m.role === "user" ? "Fotografie přiložená uživatelem" : "Obrázek vytvořený v ChatSLADAI"} />}{m.role === "assistant" && !m.image && <button type="button" className="speak-message" onClick={() => void speakText(m.content)} aria-label="Přečíst odpověď nahlas"><Volume2 size={15}/> Přečíst nahlas</button>}</div></div>)}{busy && <div className="message assistant"><div className="message-avatar"><Sparkles size={16}/></div><div className="message-content"><div className="message-role">ChatSLADAI</div><div className="typing"><span/><span/><span/></div></div></div>}<div ref={bottomRef}/></div>}
      </div>
      <div className="composer-area">{liveVoiceStatus && <div className="cloud-sync-notice" role="status">{liveVoiceStatus}</div>}<audio ref={remoteAudioRef} className="voice-audio-output" autoPlay playsInline />{error && <div className="error-banner"><span>{error}</span><button aria-label="Zavřít upozornění" onClick={() => setError("")}><X size={15}/></button></div>}<form className="composer" onSubmit={onSubmit}>{pendingImage && <div className="pending-image"><img src={pendingImage} alt="Připravená fotografie" /><button type="button" onClick={() => setPendingImage(null)} aria-label="Odebrat fotografii"><X size={14}/></button></div>}<textarea ref={textareaRef} value={draft} onChange={e => setDraft(e.target.value)} placeholder="Na co dnes společně přijdeme? (Můžeš také požádat o vytvoření obrázku.)" rows={1} onKeyDown={e => {if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void send()}}}/><div className="composer-footer"><div className="composer-tools"><button type="button" className="tool-button" onClick={() => imageInputRef.current?.click()}><ImageIcon size={16}/><span>Přidat fotografii</span></button><input ref={imageInputRef} className="hidden-file-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={e => { void handleFile(e.target.files?.[0]); e.currentTarget.value = ""; }} /><button type="button" className="tool-button" onClick={() => fileInputRef.current?.click()}><Paperclip size={16}/><span>Připojit soubor</span></button><input ref={fileInputRef} className="hidden-file-input" type="file" accept=".txt,.md,.csv,.json,.html,.xml,.log,.pdf,.docx,text/plain,text/markdown,text/csv,application/json,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={e => { void handleFile(e.target.files?.[0]); e.currentTarget.value = ""; }} /><label className="composer-note deep-mode-toggle"><input type="checkbox" checked={deepMode} onChange={e => setDeepMode(e.target.checked)} /> Hluboké myšlení <span title="Druhá kontrolní fáze odpovědi; může trvat déle a spotřebovat více API kreditu.">ⓘ</span></label><button type="button" className={liveVoiceActive ? "tool-button voice-active" : "tool-button"} onClick={() => void startLiveVoice()} aria-pressed={liveVoiceActive} disabled={liveVoiceConnecting}><Volume2 size={15}/><span>{liveVoiceConnecting ? "Připojuji…" : liveVoiceActive ? "Ukončit rozhovor" : "Hlasový rozhovor"}</span></button><button type="button" className={isRecording ? "tool-button voice-recording" : "tool-button"} onClick={() => void toggleRecording()} aria-label={isRecording ? "Zastavit nahrávání" : "Mluvit do chatu"}>{isRecording ? <Square size={15}/> : <Mic size={15}/>}<span>{isRecording ? "Zastavit" : "Mluvit"}</span></button><span className="composer-note">Enter pro odeslání · Shift + Enter pro nový řádek</span></div><button className="send-button" type="submit" disabled={!draft.trim()||busy} aria-label="Odeslat zprávu">{busy ? <span className="send-spinner"/> : <ArrowUp size={18}/>}</button></div></form><p className="disclaimer">ChatSLADAI se vyvíjí. Ověřuj důležité informace a nesdílej tajné údaje.</p></div>
    </section>
  </main>;
}
