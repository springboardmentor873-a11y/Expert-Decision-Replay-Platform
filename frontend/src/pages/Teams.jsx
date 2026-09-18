import React, { useEffect, useState } from 'react';
import { decisionService } from '../services/decisionService';
import { Users, Search, Plus, MoreHorizontal, FileText, ChevronRight, MessageSquare, Calendar } from 'lucide-react';

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    decisionService.getTeams()
      .then(data => {
        setTeams(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load teams", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Teams</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Teams you are a part of. Collaborate, contribute and make better decisions together.
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <button className="btn-primary text-sm flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
            <Plus className="w-4 h-4" /> Join a Team
          </button>
          <div className="bg-blue-50 text-blue-700 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
            <Users className="w-4 h-4" />
            Your teams give you access to team decisions, discussions and shared knowledge.
          </div>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="flex items-center justify-between border-b border-slate-200 mt-6 mb-6">
        <div className="flex gap-6">
          <button className="pb-3 border-b-2 border-blue-600 text-blue-600 font-semibold text-sm">
            Active Teams
          </button>
          <button className="pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-700 font-medium text-sm">
            Archived Teams
          </button>
        </div>
        <div className="flex items-center gap-4 pb-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search teams..." 
              className="pl-9 pr-4 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 w-64"
            />
          </div>
          <div className="text-sm text-slate-500 flex items-center gap-2 cursor-pointer">
            Sort by: <span className="font-semibold text-slate-700">Name</span>
          </div>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-slate-500">Loading teams...</p>
        ) : (
          teams.map(team => (
            <div key={team.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="p-5 border-b border-slate-100 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    <Users className="w-6 h-6" />
                  </div>
                  <button className="text-slate-400 hover:text-slate-600">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
                <h3 className="font-bold text-lg text-slate-900">{team.name}</h3>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{team.description || 'No description provided.'}</p>
                
                <div className="flex items-center justify-between mt-4">
                  <span className="bg-emerald-50 text-emerald-600 text-xs font-semibold px-2 py-1 rounded-md flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                  </span>
                  <span className="text-xs text-slate-500">{team.members ? team.members.length : 0} members</span>
                </div>
              </div>
              
              <div className="bg-slate-50 p-4">
                <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Recent Decisions</h4>
                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <p className="text-sm text-slate-700 font-medium truncate group-hover:text-blue-600">AI-based user onboarding</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-xs text-slate-400">2 days ago</span>
                      <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-blue-500" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <p className="text-sm text-slate-700 font-medium truncate group-hover:text-blue-600">Product roadmap for Q4</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-xs text-slate-400">1 week ago</span>
                      <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-blue-500" />
                    </div>
                  </div>
                </div>
                <button className="w-full py-2 text-center text-sm font-semibold text-blue-600 border border-blue-100 bg-white rounded-lg hover:bg-blue-50 transition-colors">
                  View Team
                </button>
              </div>
            </div>
          ))
        )}

        {/* Request to Join Card */}
        <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center p-8 text-center hover:bg-slate-100 transition-colors cursor-pointer min-h-[300px]">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-blue-500 shadow-sm mb-4">
            <Plus className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-lg text-slate-900 mb-1">Request to Join a Team</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-[200px]">
            Don't see a team? You can request to join an existing team.
          </p>
          <button className="px-6 py-2 bg-white border border-slate-200 text-blue-600 font-semibold text-sm rounded-lg hover:border-blue-300 shadow-sm">
            Browse Teams
          </button>
        </div>
      </div>

      {/* Bottom Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900">My Team Activity</h3>
            <button className="text-xs font-semibold text-blue-600 hover:underline flex items-center">View all <ChevronRight className="w-3 h-3" /></button>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex flex-shrink-0 items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-slate-800"><span className="font-semibold">Rahul Sharma</span> commented on "Cloud infrastructure upgrade"</p>
                <p className="text-xs text-slate-500">Product Team • 2 hours ago</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex flex-shrink-0 items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-slate-800">You were added to the Compliance Team</p>
                <p className="text-xs text-slate-500">3 days ago</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex flex-shrink-0 items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-slate-800"><span className="font-semibold">Anika Verma</span> shared a document in "Evaluate LLM providers"</p>
                <p className="text-xs text-slate-500">AI Research Team • 4 days ago</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900">Upcoming Team Meetings</h3>
            <button className="text-xs font-semibold text-blue-600 hover:underline flex items-center">View all <ChevronRight className="w-3 h-3" /></button>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 flex flex-col justify-between h-[calc(100%-2rem)] relative overflow-hidden">
            <div className="space-y-4 z-10 relative">
              <div className="flex gap-4 items-center">
                <div className="bg-blue-50 text-blue-700 w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 mb-0.5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Product Team Sync</p>
                  <p className="text-xs text-slate-500">Tomorrow, 5:00 PM</p>
                </div>
              </div>
              <div className="flex gap-4 items-center">
                <div className="bg-blue-50 text-blue-700 w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 mb-0.5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">AI Research Discussion</p>
                  <p className="text-xs text-slate-500">12 Sep 2025, 4:00 PM</p>
                </div>
              </div>
              <div className="flex gap-4 items-center">
                <div className="bg-blue-50 text-blue-700 w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 mb-0.5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Compliance Review</p>
                  <p className="text-xs text-slate-500">15 Sep 2025, 11:00 AM</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 bg-blue-50 rounded-xl p-4 flex gap-4 items-center relative overflow-hidden z-10">
              <div className="flex-1">
                <p className="text-sm font-bold text-blue-900 italic">"Great decisions are never made alone."</p>
                <p className="text-xs text-blue-700 mt-1">Collaborate with your team and turn ideas into impact.</p>
              </div>
              <Users className="w-12 h-12 text-blue-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Teams;
