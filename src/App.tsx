import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Mic, 
  MicOff, 
  Headphones, 
  Settings, 
  MessageSquare, 
  RefreshCcw, 
  Coffee,
  Heart,
  Volume2,
  VolumeX,
  ChevronDown,
  Info
} from "lucide-react";
import { useGeminiLive } from "./hooks/useGeminiLive";

export default function App() {
  const {
    isConnected,
    isSpeaking,
    isMicActive,
    transcript,
    error,
    connect,
    disconnect,
    startMic,
    stopMic,
    interrupt,
  } = useGeminiLive();

  const [showHistory, setShowHistory] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcript]);

  const handleToggleMic = async () => {
    if (!isMicActive) {
      // startMic internally calls interrupt() to shut up the AI
      await startMic();
    } else {
      stopMic();
    }
  };

  const handleConnect = async () => {
    if (!isConnected) {
      await connect();
    } else {
      disconnect();
    }
  };

  const handleSilence = () => {
    interrupt();
  };

  return (
    <div className="min-h-screen bg-[#2D1B2E] text-white font-sans selection:bg-orange-500/30 overflow-hidden flex flex-col relative">
      {/* Immersive Dynamic Background blobs */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF8C42] via-[#E0444E] to-[#6320EE] opacity-30" />
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-100px] right-[-100px] w-[600px] h-[600px] bg-orange-400 rounded-full blur-[140px] opacity-20" 
        />
        <motion.div 
          animate={{ x: [0, -40, 0], y: [0, 60, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-100px] left-[-100px] w-[700px] h-[700px] bg-purple-600 rounded-full blur-[160px] opacity-30" 
        />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen h-screen">
        {/* Header */}
        <header className="flex items-center justify-between px-10 py-6 shrink-0 bg-black/10 backdrop-blur-md border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 flex items-center justify-center shadow-2xl">
              <span className="text-2xl font-bold text-orange-200">أ</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                أستاذي <span className="text-orange-300 font-normal">Ostazy</span>
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-sm font-medium">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${isConnected ? 'bg-green-500/10 border-green-500/20 text-green-300' : 'bg-white/5 border-white/10 text-white/50'}`}>
              <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-gray-500'}`} />
              <span>{isConnected ? "متصل (Online)" : "غير متصل"}</span>
            </div>
            <div className="px-4 py-2 bg-white/5 backdrop-blur-lg rounded-full border border-white/10 hidden md:block">
              القاهرة، {new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </header>

        {/* Main Content Layout */}
        <main className="flex-1 flex px-10 py-8 gap-8 overflow-hidden min-h-0">
          
          {/* Left Column: History & Memory */}
          <section className="hidden lg:flex w-1/4 flex-col gap-6 overflow-hidden h-full">
            <div className="flex-1 frosted-glass rounded-[32px] p-6 flex flex-col overflow-hidden min-h-0 shadow-inner">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] uppercase tracking-widest text-white/40 font-bold">سجل الدردشة (History)</h3>
                <MessageSquare size={14} className="text-white/30" />
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                {transcript.length === 0 ? (
                  <div className="text-center py-10 opacity-30 italic text-sm font-light">Lessa ma-fesh klam...</div>
                ) : (
                  transcript.map((msg, i) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={i} 
                      className={`p-4 rounded-2xl border transition-all hover:bg-white/15 ${msg.role === 'user' ? 'bg-orange-500/10 border-orange-500/20' : 'bg-white/10 border-white/10'}`}
                    >
                      <p className={`text-[10px] mb-1 font-bold ${msg.role === 'user' ? 'text-orange-300' : 'text-blue-300'}`}>
                        {msg.role === 'user' ? 'أنت' : 'أستاذي'}
                      </p>
                      <p className={`text-sm leading-relaxed ${msg.role === 'user' ? 'italic text-white/80' : 'text-white/95'}`}>{msg.text}</p>
                    </motion.div>
                  ))
                )}
                <div ref={transcriptEndRef} />
              </div>
            </div>

            <div className="h-[30%] bg-orange-500/10 backdrop-blur-xl rounded-[32px] border border-orange-500/20 p-6 flex flex-col shrink-0 group transition-all hover:bg-orange-500/15">
              <h3 className="text-[10px] uppercase tracking-widest text-orange-300 mb-4 font-bold">فاكر إيه؟ (Memory)</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/40">الاسم:</span>
                  <span className="font-semibold text-white/90">أحمد (Guest)</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/40">الاهتمام:</span>
                  <span className="font-semibold text-right text-white/90">علوم وبرمجة</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/40">الجدول:</span>
                  <span className="font-semibold text-right text-orange-200">مذاكرة لغة عربية</span>
                </div>
              </div>
            </div>
          </section>

          {/* Center Column: AI interaction */}
          <section className="flex-1 flex flex-col items-center justify-center relative h-full">
            {/* Visualizer Orbits */}
            <div className="absolute w-[500px] h-[500px] border-2 border-white/5 rounded-full pointer-events-none" />
            <div className="absolute w-[400px] h-[400px] border border-white/10 rounded-full pointer-events-none" />
            
            <div className="relative flex flex-col items-center">
              <motion.div 
                animate={isSpeaking ? { scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] } : {}}
                className="w-64 h-64 rounded-full bg-gradient-to-tr from-orange-400 via-purple-500 to-pink-500 p-1 flex items-center justify-center shadow-[0_0_100px_rgba(255,140,66,0.3)] relative"
              >
                <div className="w-full h-full rounded-full bg-[#1A0B1B] flex items-center justify-center overflow-hidden relative">
                   <AnimatePresence mode="wait">
                    {isSpeaking ? (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex gap-1.5 items-end h-32"
                      >
                        {[...Array(9)].map((_, i) => (
                          <motion.div
                            key={i}
                            animate={{ height: [12, 60, 12] }}
                            transition={{ 
                              duration: 0.6, 
                              repeat: Infinity, 
                              delay: i * 0.08,
                              ease: "easeInOut"
                            }}
                            className="w-1.5 bg-gradient-to-t from-white/20 to-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                          />
                        ))}
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center gap-4"
                      >
                        <Headphones size={48} className="text-white/10" />
                        <div className="flex gap-1.5 items-center">
                           <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse" />
                           <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse delay-75" />
                           <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse delay-150" />
                        </div>
                      </motion.div>
                    )}
                   </AnimatePresence>
                </div>
              </motion.div>

              <div className="mt-12 text-center max-w-md">
                <motion.p 
                  key={isConnected ? (isSpeaking ? "talk" : "wait") : "idle"}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl font-medium mb-3 min-h-[3rem] px-4"
                >
                  {!isConnected 
                    ? "أهلاً بيك! أنا أستاذي، ومستعد أسمعك." 
                    : (isSpeaking ? "أستاذي بيتكلم دلوقتي..." : (isMicActive ? "أنا باخد بالي من كل كلمة بتقولها..." : "أنا سامعك يا بطل، قول اللي عندك."))}
                </motion.p>
                <p className="text-white/40 text-sm italic font-light tracking-wide">
                  {!isConnected ? "اضغط على زرار الاتصال عشان نبدأ." : (isMicActive ? "اتكلم بـ راحتك، أنا ساكت ومستنيك تخلص." : "اضغط على المايك عشان تتكلم.")}
                </p>
              </div>
            </div>

            {/* Quick Action Proposals */}
            <div className="mt-16 flex flex-wrap justify-center gap-3">
              {[ "احكيلي حكاية", "ساعدني في الواجب", "قولي نكتة" ].map((action) => (
                <button 
                  key={action}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-lg rounded-2xl border border-white/20 transition-all text-sm font-medium hover:scale-105 active:scale-95"
                >
                  {action}
                </button>
              ))}
            </div>

            {/* Main Controls - Enhanced with Silence Button */}
            <div className="mt-12 flex items-center gap-8 relative">
               {!isConnected ? (
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(249, 115, 22, 0.4)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleConnect}
                    className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-12 py-5 rounded-[2.5rem] font-bold shadow-2xl flex items-center gap-3 text-lg"
                  >
                    <RefreshCcw size={24} />
                    <span>Connect Ostazy</span>
                  </motion.button>
               ) : (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={disconnect}
                      className="w-14 h-14 frosted-glass rounded-2xl flex items-center justify-center text-white/50 hover:text-red-400 transition-colors"
                      title="End Session"
                    >
                      <RefreshCcw size={24} />
                    </motion.button>
                    
                    <motion.button
                      animate={isMicActive ? { scale: [1, 1.1, 1], boxShadow: ["0 0 20px rgba(239, 68, 68, 0.4)", "0 0 60px rgba(239, 68, 68, 0.8)", "0 0 20px rgba(239, 68, 68, 0.4)"] } : {}}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleToggleMic}
                      className={`w-32 h-32 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all border-4 ${
                        isMicActive 
                          ? "bg-red-500 text-white border-red-400" 
                          : "bg-gradient-to-br from-orange-400 to-orange-600 text-white border-orange-300 hover:shadow-orange-500/50"
                      }`}
                    >
                      {isMicActive ? <Mic size={48} /> : <MicOff size={48} />}
                      <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">{isMicActive ? "ON AIR" : "OFF"}</span>
                    </motion.button>

                    <div className="flex flex-col gap-4">
                      {/* BRUTE FORCE SILENCE BUTTON */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleSilence}
                        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-purple-700 flex flex-col items-center justify-center text-white shadow-xl border border-red-400/30 hover:shadow-red-600/50"
                        title="Brute Force Silence"
                      >
                        <VolumeX size={24} />
                        <span className="text-[10px] font-bold mt-0.5">سكوت!</span>
                      </motion.button>
                    </div>
                  </>
               )}
            </div>
          </section>

          {/* Right Column: Ideas / Suggestions */}
          <section className="hidden lg:flex w-1/4 flex-col gap-6 h-full overflow-hidden">
            <div className="flex-1 frosted-glass rounded-[32px] p-6 overflow-hidden flex flex-col min-h-0 shadow-inner">
               <div className="flex items-center justify-between mb-6">
                <h3 className="text-[10px] uppercase tracking-widest text-white/40 font-bold">اقتراحات ليك (Ideas)</h3>
                <Coffee size={14} className="text-white/30" />
               </div>
               <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                  {[
                    { title: "ألغاز سريعة", desc: "نشط عقلك بأسئلة ذكاء مصرية أصيلة." },
                    { title: "تاريخ مصر", desc: "حكاوي عن الفراعنة والملوك بلهجة سهلة." },
                    { title: "ترجمة روشة", desc: "إزاي تقول عبارات إنجليزي بالمصري العامي؟" },
                    { title: "حكاوي زمان", desc: "قصص وأساطير من التراث الشعبي المصري." }
                  ].map((idea, i) => (
                    <motion.div 
                      key={idea.title}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ x: 5, backgroundColor: "rgba(255,255,255,0.1)" }}
                      className="group cursor-pointer p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-orange-500/30 transition-all shadow-sm"
                    >
                        <p className="font-bold mb-1 text-orange-200 text-sm">{idea.title}</p>
                        <p className="text-xs text-white/50 leading-relaxed font-light">{idea.desc}</p>
                    </motion.div>
                  ))}
               </div>
               
               <div className="mt-8 pt-6 border-t border-white/5 shrink-0">
                  <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20 backdrop-blur-md">
                    <div className="text-[10px] uppercase font-bold text-purple-400 mb-2 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      تلميحة روشة
                    </div>
                    <p className="text-xs leading-relaxed text-white/60 italic font-light">"ممكن تسألني عن أي حاجة في التاريخ أو العلوم، وأنا هشرحلك كأننا قاعدين على القهوة."</p>
                  </div>
               </div>
            </div>
            
            <div className="h-24 flex items-center justify-center gap-4 shrink-0">
              <button className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                <Settings size={20} className="text-white/40" />
              </button>
              <button 
                onClick={() => setShowHistory(true)}
                className="lg:hidden w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <MessageSquare size={20} className="text-white/40" />
              </button>
            </div>
          </section>
        </main>

        <footer className="relative z-10 p-6 flex justify-center border-t border-white/5 bg-black/40 shrink-0">
           <p className="text-[10px] text-white/30 font-medium tracking-[0.3em] uppercase flex items-center gap-3">
             <span className="hover:text-white/50 transition-colors cursor-default">استمتع بمحادثة حقيقية مع صديقك المفضل</span>
             <span className="opacity-30">|</span>
             <span className="text-orange-400 font-bold group">OSTAZY AI <span className="text-orange-600">v1.1</span></span>
           </p>
        </footer>

        {/* Transcription drawer for mobile/smaller screens */}
        <AnimatePresence>
          {(showHistory && transcript.length > 0) && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="lg:hidden fixed inset-x-0 bottom-0 z-50 max-h-[80vh] bg-[#2D1B2E] rounded-t-[40px] border-t border-white/10 shadow-2xl flex flex-col"
            >
              <div className="p-4 flex items-center justify-between border-b border-white/5">
                <h3 className="font-bold flex items-center gap-2">
                  <MessageSquare size={18} className="text-orange-400" />
                  سجل المحادثة
                </h3>
                <button onClick={() => setShowHistory(false)} className="p-2"><ChevronDown /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {transcript.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-orange-500/20 border border-orange-500/30' : 'bg-white/5 border border-white/10 text-white/90'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Notification */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-4 frosted-glass-heavy text-red-400 rounded-2xl shadow-2xl z-[60] flex items-center gap-3 border-red-500/30"
            >
              <Info size={18} />
              <span className="font-medium text-sm">{error}</span>
              <button onClick={() => window.location.reload()} className="underline text-[10px] font-bold ml-2">RETRY</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


