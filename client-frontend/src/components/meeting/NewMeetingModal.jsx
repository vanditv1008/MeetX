import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Video, X, Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "@clerk/react";
import api from "../../config/api";

const NewMeetingModal = ({ isOpen, onClose, user }) => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await getToken();
      const res = await api.post(
        "/api/meetings",
        {
          title: title.trim() || "Instant Meeting",
          description: description.trim() || undefined,
        },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );

      const meetingData = res.data?.meeting;
      if (meetingData?.meetingId) {
        toast.success("Meeting created!");
        onClose();
        navigate(`/meeting/${meetingData.meetingId}`);
      } else {
        toast.error("Failed to retrieve meeting details");
      }
    } catch (error) {
      console.error("Create meeting error:", error);
      const msg = error.response?.data?.error || "Failed to create meeting";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-50 text-primary border border-blue-100">
              <Video className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">New Meeting</h2>
              <p className="text-xs text-slate-500">Start an instant or scheduled session</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-4 pt-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Meeting Title
            </label>
            <input
              type="text"
              placeholder="e.g. Design Sync, Weekly Standup"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-400 text-slate-900"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Add key goals or discussion points"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-400 text-slate-900 resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-md shadow-primary/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Start Meeting</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewMeetingModal;
