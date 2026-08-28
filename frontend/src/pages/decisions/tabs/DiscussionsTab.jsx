import React from 'react';
import { Plus } from 'lucide-react';

export const DiscussionsTab = ({
  discussions,
  meetingNotes,
  replyText,
  setReplyText,
  setShowAddDiscModal,
  setShowAddNoteModal,
  handlePostComment,
}) => {
  return (
    <div className="space-y-8">
      {/* Discussions Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Discussion Threads</h3>
            <p className="text-xs text-slate-500">Collaborative debate and architecture reasoning</p>
          </div>
          <button
            onClick={() => setShowAddDiscModal(true)}
            className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-3.5 py-2 rounded-lg text-xs font-semibold hover:bg-blue-700"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Start Discussion</span>
          </button>
        </div>

        <div className="space-y-6">
          {discussions.map((disc) => (
            <div key={disc.id} className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900">{disc.title}</h4>
                <span className="text-[11px] text-slate-400">By {disc.created_by_name}</span>
              </div>

              <div className="space-y-3 pl-2 border-l-2 border-slate-200">
                {disc.comments?.map((c) => (
                  <div key={c.id} className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{c.author_name}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{c.body}</p>

                    {c.replies?.map((r) => (
                      <div key={r.id} className="mt-2 pl-3 border-l-2 border-blue-200 bg-blue-50/30 p-2.5 rounded-lg space-y-1">
                        <span className="font-bold text-slate-900 block">{r.author_name}</span>
                        <p className="text-slate-700">{r.body}</p>
                      </div>
                    ))}

                    <div className="pt-2 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Write a reply..."
                        value={replyText[`${disc.id}_${c.id}`] || ''}
                        onChange={(e) =>
                          setReplyText({ ...replyText, [`${disc.id}_${c.id}`]: e.target.value })
                        }
                        className="flex-1 bg-slate-50 border border-slate-200 text-xs px-3 py-1.5 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={() => handlePostComment(disc.id, c.id)}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Add a comment to this thread..."
                  value={replyText[disc.id] || ''}
                  onChange={(e) => setReplyText({ ...replyText, [disc.id]: e.target.value })}
                  className="flex-1 bg-white border border-slate-200 text-xs px-3.5 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => handlePostComment(disc.id)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-blue-700"
                >
                  Post Comment
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Meeting Notes Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Meeting Notes & ARB Minutes</h3>
            <p className="text-xs text-slate-500">Record minutes from review sessions</p>
          </div>
          <button
            onClick={() => setShowAddNoteModal(true)}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Meeting Note</span>
          </button>
        </div>

        <div className="space-y-4">
          {meetingNotes.map((note) => (
            <div key={note.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900">{note.title}</h4>
                <span className="text-slate-400">
                  Occurred on: {new Date(note.occurred_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">{note.body}</p>
              <span className="text-[10px] text-slate-400 block pt-1">Recorded by: {note.recorded_by_name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
