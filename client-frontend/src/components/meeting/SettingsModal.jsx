import React, { useState, useEffect } from "react";
import { X, Sliders, Volume2, Video, Sparkles, Check } from "lucide-react";

export const VIRTUAL_BACKGROUNDS = [
  { id: "none", name: "Default (None)", img: null },
  {
    id: "office",
    name: "Modern Office",
    img: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80",
  },
  {
    id: "minimal",
    name: "Cozy Living Room",
    img: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80",
  },
  {
    id: "nature",
    name: "Nature Greenery",
    img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80",
  },
  {
    id: "cafe",
    name: "Quiet Cafe",
    img: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&auto=format&fit=crop&q=80",
  },
];

const SettingsModal = ({
  isOpen,
  onClose,
  localStream,
  virtualBackground,
  onSelectVirtualBackground,
  noiseSupressionEnabled = true,
  onToggleNoiseSuppression,
}) => {
  const [videoDevices, setVideoDevices] = useState([]);
  const [audioDevices, setAudioDevices] = useState([]);
  const [activeTab, setActiveTab] = useState("video");

  useEffect(() => {
    if (!isOpen) return;

    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        setVideoDevices(devices.filter((d) => d.kind === "videoinput"));
        setAudioDevices(devices.filter((d) => d.kind === "audioinput"));
      } catch (err) {
        console.warn("Could not enumerate audio/video devices:", err);
      }
    };
    getDevices();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Audio & Video Settings</h2>
              <p className="text-xs text-slate-500">Configure devices & call preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 pt-3">
          <button
            onClick={() => setActiveTab("video")}
            className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "video"
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Video className="w-4 h-4" />
            Video & Backgrounds
          </button>
          <button
            onClick={() => setActiveTab("audio")}
            className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "audio"
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Volume2 className="w-4 h-4" />
            Audio & Quality
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5">
          {activeTab === "video" ? (
            <>
              {/* Camera device selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Camera Device
                </label>
                <select className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 outline-none focus:border-primary">
                  {videoDevices.length > 0 ? (
                    videoDevices.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>
                        {d.label || `Camera ${i + 1}`}
                      </option>
                    ))
                  ) : (
                    <option>Default Camera</option>
                  )}
                </select>
              </div>

              {/* Virtual Backgrounds */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <label className="text-xs font-semibold text-slate-700">
                    Virtual Background
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {VIRTUAL_BACKGROUNDS.map((bg) => {
                    const isSelected = virtualBackground?.id === bg.id;
                    return (
                      <button
                        key={bg.id}
                        type="button"
                        onClick={() => onSelectVirtualBackground?.(bg)}
                        className={`relative rounded-xl overflow-hidden aspect-video border-2 transition-all flex flex-col items-center justify-center p-1 cursor-pointer ${
                          isSelected
                            ? "border-primary ring-2 ring-primary/20 shadow-xs"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {bg.img ? (
                          <img
                            src={bg.img}
                            alt={bg.name}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] font-medium text-slate-500">None</span>
                        )}
                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-primary text-white p-0.5 rounded-full z-10 shadow-xs">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                        <span className="absolute bottom-0 inset-x-0 bg-slate-900/60 backdrop-blur-xs text-[9px] font-semibold text-white py-0.5 text-center truncate px-1">
                          {bg.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Microphone device selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Microphone Device
                </label>
                <select className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 outline-none focus:border-primary">
                  {audioDevices.length > 0 ? (
                    audioDevices.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>
                        {d.label || `Microphone ${i + 1}`}
                      </option>
                    ))
                  ) : (
                    <option>Default Microphone</option>
                  )}
                </select>
              </div>

              {/* Noise suppression toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <h4 className="text-xs font-semibold text-slate-800">AI Noise Suppression</h4>
                  <p className="text-[11px] text-slate-500">Filters keyboard clicks and background noise</p>
                </div>
                <button
                  type="button"
                  onClick={onToggleNoiseSuppression}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    noiseSupressionEnabled ? "bg-primary" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      noiseSupressionEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
