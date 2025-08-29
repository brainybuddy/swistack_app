'use client';

import { useState } from 'react';
import {
  UserPlus,
  Users,
  Shield,
  Mail,
  MoreVertical,
  Settings,
  UserX,
  Crown,
  Edit,
  Trash2,
  Plus,
  Search,
  Check,
  X,
  Clock,
  GitBranch,
  Code2
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  avatar: string;
  status: 'active' | 'invited';
  joinedAt: string;
  lastActive: string;
}

interface Team {
  id: string;
  name: string;
  description: string;
  members: TeamMember[];
  projects: number;
  createdAt: string;
}

export default function TeamsView() {
  const [activeTeam, setActiveTeam] = useState('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);

  const teams: Team[] = [
    {
      id: '1',
      name: 'Development Team',
      description: 'Main development team for all projects',
      members: [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'owner',
          avatar: 'JD',
          status: 'active',
          joinedAt: '6 months ago',
          lastActive: 'Online now'
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'admin',
          avatar: 'JS',
          status: 'active',
          joinedAt: '5 months ago',
          lastActive: '2 hours ago'
        },
        {
          id: '3',
          name: 'Mike Johnson',
          email: 'mike@example.com',
          role: 'member',
          avatar: 'MJ',
          status: 'active',
          joinedAt: '3 months ago',
          lastActive: '1 day ago'
        },
        {
          id: '4',
          name: 'Sarah Wilson',
          email: 'sarah@example.com',
          role: 'member',
          avatar: 'SW',
          status: 'invited',
          joinedAt: 'Pending',
          lastActive: 'Not yet joined'
        }
      ],
      projects: 12,
      createdAt: '6 months ago'
    },
    {
      id: '2',
      name: 'Design Team',
      description: 'UI/UX design and frontend development',
      members: [
        {
          id: '5',
          name: 'Alex Brown',
          email: 'alex@example.com',
          role: 'admin',
          avatar: 'AB',
          status: 'active',
          joinedAt: '4 months ago',
          lastActive: '5 minutes ago'
        },
        {
          id: '6',
          name: 'Chris Lee',
          email: 'chris@example.com',
          role: 'member',
          avatar: 'CL',
          status: 'active',
          joinedAt: '2 months ago',
          lastActive: '3 hours ago'
        }
      ],
      projects: 8,
      createdAt: '4 months ago'
    }
  ];

  const currentTeam = teams.find(t => t.id === activeTeam) || teams[0];
  
  const filteredMembers = currentTeam.members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'admin':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'member':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-3 h-3" />;
      case 'admin':
        return <Shield className="w-3 h-3" />;
      default:
        return <Users className="w-3 h-3" />;
    }
  };

  return (
    <div className="p-6">
      <div className="flex">
        {/* Teams Sidebar */}
        <div className="w-64 pr-6 border-r border-gray-800">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Your Teams</h2>
            <button className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors mb-3">
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Create Team</span>
            </button>
          </div>

          <div className="space-y-2">
            {teams.map(team => (
              <button
                key={team.id}
                onClick={() => setActiveTeam(team.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  activeTeam === team.id
                    ? 'bg-teal-500/20 border border-teal-500/30'
                    : 'hover:bg-gray-800/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-medium text-white">{team.name}</h3>
                  <span className="text-xs text-gray-500">{team.members.length}</span>
                </div>
                <p className="text-xs text-gray-400 truncate">{team.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Team Details */}
        <div className="flex-1 pl-6">
          {/* Team Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-2xl font-semibold text-white mb-1">{currentTeam.name}</h1>
                <p className="text-sm text-gray-400">{currentTeam.description}</p>
              </div>
              <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <Settings className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-500 mt-4">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>{currentTeam.members.length} members</span>
              </div>
              <div className="flex items-center space-x-2">
                <GitBranch className="w-4 h-4" />
                <span>{currentTeam.projects} projects</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Created {currentTeam.createdAt}</span>
              </div>
            </div>
          </div>

          {/* Members Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-white">Team Members</h2>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-gray-800/50 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-teal-500 transition-colors w-64"
                  />
                </div>
                <button 
                  onClick={() => setShowInviteModal(true)}
                  className="flex items-center space-x-2 px-3 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="text-sm font-medium">Invite Member</span>
                </button>
              </div>
            </div>

            {/* Members List */}
            <div className="space-y-3">
              {filteredMembers.map(member => (
                <div
                  key={member.id}
                  className="bg-gray-800/30 border border-gray-700 rounded-lg p-4 hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                        {member.avatar}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-sm font-medium text-white">{member.name}</h3>
                          <span className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs border ${getRoleColor(member.role)}`}>
                            {getRoleIcon(member.role)}
                            <span>{member.role.charAt(0).toUpperCase() + member.role.slice(1)}</span>
                          </span>
                          {member.status === 'invited' && (
                            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full text-xs">
                              Pending Invite
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Mail className="w-3 h-3" />
                            <span>{member.email}</span>
                          </div>
                          <span>Joined {member.joinedAt}</span>
                          <span>{member.lastActive}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {member.status === 'invited' && (
                        <button className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors">
                          Resend Invite
                        </button>
                      )}
                      <button className="p-1.5 hover:bg-gray-700 rounded transition-colors">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Projects */}
          <div>
            <h2 className="text-lg font-medium text-white mb-4">Team Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-gray-800/30 border border-gray-700 rounded-lg p-4 hover:bg-gray-800/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-teal-500/20 rounded flex items-center justify-center">
                      <Code2 className="w-4 h-4 text-teal-400" />
                    </div>
                    <h3 className="text-sm font-medium text-white">Project {i}</h3>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">Sample project description for team collaboration</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Updated 2 days ago</span>
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map((j) => (
                        <div
                          key={j}
                          className="w-6 h-6 bg-gray-600 rounded-full border-2 border-gray-800 flex items-center justify-center text-xs text-white"
                        >
                          {j}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal (simplified) */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium text-white mb-4">Invite Team Member</h3>
            <input
              type="email"
              placeholder="Enter email address"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500 mb-4"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}