"use client";
import React, { useState } from "react";
import { Users, X, Plus, User, Search, Trash2 } from "lucide-react";
import { formatAddress } from "@/lib/constants";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { SuccessAnimation } from "./ui/SuccessAnimation";
import { ErrorAnimation } from "./ui/ErrorAnimation";

interface Group {
  id: number;
  name: string;
  description: string;
  members: number;
  balance: number;
  avatar: string;
  lastActivity: string;
  totalExpenses?: number;
  memberDetails?: {
    id: number;
    name: string;
    avatar: string;
    balance: number;
    chain?: string;
    address: `0x${string}`;
  }[];
  expenses?: {
    id: number;
    description: string;
    amount: number;
    paidBy: string;
    date: string;
    splitAmong: string[];
    chain?: string;
  }[];
}

interface Member {
  id: string;
  name: string;
  email: string;
  avatar: string;
  address: `0x${string}`;
}

interface AddGroupProps {
  onClose: () => void;
  onGroupCreated: (group: Group) => Promise<void>;
  isMobile: boolean;
}

const AddGroup: React.FC<AddGroupProps> = ({
  onClose,
  onGroupCreated,
  isMobile,
}) => {
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Status states for create group
  const [createGroupStatus, setCreateGroupStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [createGroupError, setCreateGroupError] = useState('');

  // Mock suggested members - in a real app, this would come from contacts or user search
  const suggestedMembers: Member[] = [
    {
      id: "0",
      name: "sneha",
      email: "@chiku",
      avatar: "SN",
      address: "0xB26f59f729590510B56059c7000Da0cB25d4b686",
    },
    {
      id: "1",
      name: "mukesh",
      email: "@mukesh12",
      avatar: "MU",
      address: "0xdAF0182De86F904918Db8d07c7340A1EfcDF8244",
    },
    {
      id: "2",
      name: "Nikku.dev",
      email: "@nikku",
      avatar: "NK",
      address: "0xcfa038455b54714821f291814071161c9870B891",
    },
    {
      id: "2",
      name: "fredics",
      email: "@fredics",
      avatar: "FR",
      address: "0x79bb9cb96c3f6cac2e06a8fc43e51b020f909c40",
    }
  ];

  

  const filteredMembers = suggestedMembers.filter(
    (member) =>
      !members.find((m) => m.id === member.id) &&
      (member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const addMember = (member: Member) => {
    if (!members.find((m) => m.id === member.id)) {
      setMembers([...members, member]);
      setSearchQuery("");
    }
  };

  const removeMember = (memberId: string) => {
    setMembers(members.filter((m) => m.id !== memberId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || members.length === 0) return;

    setCreateGroupStatus('loading');
    setCreateGroupError('');

    try {
      // Create the group object
      const newGroup = {
        id: Date.now(),
        name: groupName,
        description: description,
        members: members.length,
        balance: 0,
        avatar: "👥",
        lastActivity: "Just now",
        memberDetails: members.map((member, index) => ({
          id: index + 1,
          name: member.name,
          avatar: member.avatar,
          balance: 0,
          chain: "arbitrum",
          address: member.address,
        })),
        expenses: [],
      };
      
      // Call the parent's handleGroupCreated function which handles the blockchain call
      await onGroupCreated(newGroup);
      
      // Show success state
      setCreateGroupStatus('success');
      
      // Reset form after success
      setTimeout(() => {
        onClose();
        setCreateGroupStatus('idle');
        setCreateGroupError('');
      }, 2000);
      
    } catch (error) {
      console.error("Error creating group:", error);
      setCreateGroupError(error instanceof Error ? error.message : "Failed to create group");
      setCreateGroupStatus('error');
      
      // Reset error state after 3 seconds
      setTimeout(() => {
        setCreateGroupStatus('idle');
        setCreateGroupError('');
      }, 3000);
    }
  };

  const resetModal = () => {
    onClose();
    setCreateGroupStatus('idle');
    setCreateGroupError('');
    setGroupName("");
    setDescription("");
    setMembers([]);
    setSearchQuery("");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div
        className={`bg-white ${
          isMobile
            ? "w-full h-full rounded-t-3xl"
            : "w-full h-full max-w-md rounded-3xl"
        } overflow-hidden overflow-y-auto `}
      >
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-8 text-white">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold">Create New Group</h2>
            <button
              onClick={resetModal}
              className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-teal-100">Start splitting expenses with friends</p>
        </div>

        {/* Status Display */}
        {createGroupStatus === 'loading' && (
          <div className="p-8 flex flex-col items-center justify-center min-h-[200px]">
            <LoadingSpinner size="lg" text="Creating group..." />
          </div>
        )}

        {createGroupStatus === 'success' && (
          <div className="p-8 flex flex-col items-center justify-center min-h-[200px]">
            <SuccessAnimation message="Group created successfully!" />
          </div>
        )}

        {createGroupStatus === 'error' && (
          <div className="p-8 flex flex-col items-center justify-center min-h-[200px]">
            <ErrorAnimation message={createGroupError} />
          </div>
        )}

        {/* Form - Only show when not loading, success, or error */}
        {createGroupStatus === 'idle' && (
          <>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g., Weekend Trip, Office Lunch"
                  className="w-full p-4 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-3 focus:ring-teal-100 focus:bg-white transition-all text-gray-800 placeholder-gray-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this group for?"
                  rows={3}
                  className="w-full p-4 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-3 focus:ring-teal-100 focus:bg-white transition-all text-gray-800 placeholder-gray-500 resize-none"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Add Members ({members.length})
                </label>

                {/* Selected Members */}
                {members.length > 0 && (
                  <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-2 bg-white rounded-xl"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-teal-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {member.avatar}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 text-sm">
                              {member.name}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {formatAddress(member.address)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMember(member.id)}
                          className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Search and Add Members */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search friends to add..."
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-3 focus:ring-teal-100 focus:bg-white transition-all text-gray-800 placeholder-gray-500"
                    />
                  </div>

                  {/* Suggested Members */}
                  {filteredMembers.length > 0 && (
                    <div className="bg-gray-50 rounded-2xl p-4 space-y-2 max-h-48 overflow-y-auto">
                      {filteredMembers.map((member) => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => addMember(member)}
                          className="w-full flex items-center justify-between p-2 hover:bg-white rounded-xl transition-colors text-left"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {member.avatar}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 text-sm">
                                {member.name}
                              </p>
                              <p className="text-gray-500 text-xs">
                                {formatAddress(member.address)}
                              </p>
                            </div>
                          </div>
                          <Plus className="w-4 h-4 text-teal-600" />
                        </button>
                      ))}
                    </div>
                  )}

                  {filteredMembers.length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No friends found. Try a different search term.
                    </div>
                  )}
                </div>
              </div>
            </form>

            <div className="p-6 pt-0">
              <div className="flex space-x-3">
                <button
                  onClick={resetModal}
                  className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-2xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!groupName.trim() || members.length === 0 || createGroupStatus !== 'idle'}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 text-white py-4 rounded-2xl font-semibold hover:from-teal-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Group
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AddGroup;
