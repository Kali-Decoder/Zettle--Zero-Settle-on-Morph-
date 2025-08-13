/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  History,
  Settings,
  ChevronRight,
  User,
  DollarSign,
  Send,
  Receipt,
  X,
  TrendingUp,
  Bell,
  Search,
  RefreshCcw,
} from "lucide-react";
import GroupDetails from "./components/GroupDetails";
import WalletManager from "./components/WalletManager";
import AddGroup from "./components/AddGroup";
import { useSettle, Transaction, PaymentType } from "@/lib/hooks/useSettle";
import { useAccount, useChainId, useBalance } from "wagmi";
import { formatUnits } from "viem";
import { LoadingSpinner } from "./components/ui/LoadingSpinner";
import { SuccessAnimation } from "./components/ui/SuccessAnimation";
import { ErrorAnimation } from "./components/ui/ErrorAnimation";

interface Group {
  id: number;
  name: string;
  description?: string;
  members: `0x${string}`[];
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
  // Contract-specific fields
  groupId?: bigint;
  inAmount?: bigint;
  outAmount?: bigint;
  totalMembers?: number;
  transactions?: Transaction[];
  desc?: string;
  isActive?: boolean;
}

interface Activity {
  id: number;
  type: "paid" | "expense" | "received";
  user: string;
  amount: number;
  chain?: string;
  time: string;
  group: string;
  description?: string;
}

interface Balance {
  user: string;
  amount: number;
  chain: string;
  avatar: string;
  lastSeen: string;
}

interface Chain {
  id: string;
  name: string;
  symbol: string;
  color: string;
  balance: number;
}

interface GroupCardProps {
  group: Group;
  isDesktop?: boolean;
}

interface ActivityCardProps {
  activity: Activity;
  isDesktop?: boolean;
}

interface BalanceCardProps {
  balance: Balance;
}

const SplitChainApp = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showWalletManager, setShowWalletManager] = useState(false);
  const [selectedChain, setSelectedChain] = useState("arbitrum");
  const [isMobile, setIsMobile] = useState(false);
  const [groupsList, setGroupsList] = useState<Group[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const [hasLoadedGroups, setHasLoadedGroups] = useState(false);

  const { address } = useAccount();
  const chainId = useChainId();

  const {
    groupId,
    transactionId,
    useGroupDetails,
    getGroupsData,
    useGroupTransactions,
    useUserTransactions,
    handleCreateGroup,
    allGroups,
    handleAddTask,
    handleDeposit,
    handleClaim,
    fetchClaimAmount,
    isCreateGroupPending,
    isAddTaskPending,
    isDepositPending,
    isClaimPending,
  } = useSettle();

  const morphTestnetUsdc = useBalance({
    address: address,
    token: "0x9E12AD42c4E4d2acFBADE01a96446e48e6764B98", // morph holesky USDC
    chainId: 2810,
  });

  const morphMainnetUsdc = useBalance({
    address: address,
    token: "0xc7D67A9cBB121b3b0b9c053DD9f469523243379A", // Replace with actual Sepolia USDC address
    chainId: 2818,
  });

  // Redeem state for main page
  const [redeemAmount, setRedeemAmount] = useState<number | null>(null);
  const [redeemStatus, setRedeemStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [redeemError, setRedeemError] = useState('');

  // Fetch redeemable amount when on Sepolia
  useEffect(() => {
    const fetchAmount = async () => {
      if (chainId === 11155111) {
        try {
          const amt = await fetchClaimAmount();
          setRedeemAmount(Number(amt) / 1e18);
        } catch {
          setRedeemAmount(0);
        }
      } else {
        setRedeemAmount(null);
      }
    };
    fetchAmount();
  }, [chainId, address]);

  const handleRedeem = async () => {
    setRedeemStatus('loading');
    setRedeemError('');
    try {
      await handleClaim();
      setRedeemStatus('success');
      setTimeout(() => setRedeemStatus('idle'), 2000);
      // Refresh redeem amount after successful claim
      setTimeout(() => fetchClaimAmount().then(amt => setRedeemAmount(Number(amt) / 1e18)), 2000);
    } catch (error: unknown) {
      setRedeemStatus('error');
      setRedeemError(
        error && typeof error === 'object' && 'message' in error && typeof (error as { message?: string }).message === 'string'
          ? (error as { message: string }).message
          : 'Failed to redeem'
      );
      setTimeout(() => setRedeemStatus('idle'), 3000);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 1024);
      const handleResize = () => setIsMobile(window.innerWidth < 1024);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Load groups from contracts when component mounts with debouncing
  useEffect(() => {
    const loadGroups = async () => {
      // Check if already loading or has loaded
      if (isLoadingGroups || hasLoadedGroups) return;

      console.log("Starting to load groups...");
      console.log("Current state:", { address, chainId });

      // Check if wallet is connected
      if (!address) {
        console.log("Wallet not connected, skipping group loading");
        setGroupsError("Please connect your wallet to view groups");
        return;
      }


      setIsLoadingGroups(true);
      setGroupsError(null);

      try {
        console.log("Calling getGroupsData...");
        await getGroupsData();
        console.log("getGroupsData completed");
        setHasLoadedGroups(true);
      } catch (error) {
        console.error("Error loading groups:", error);
        setGroupsError(
          error instanceof Error ? error.message : "Failed to load groups"
        );
      } finally {
        setIsLoadingGroups(false);
      }
    };

    loadGroups();
  }, [address, chainId]);

  // Reset loading state when wallet disconnects
  useEffect(() => {
    if (!address) {
      setHasLoadedGroups(false);
      setIsLoadingGroups(false);
      setGroupsError(null);
    }
  }, [address]);

  // Load groups when groups tab is accessed and groups haven't been loaded yet
  useEffect(() => {
    if (
      activeTab === "groups" &&
      address &&
      !hasLoadedGroups &&
      !isLoadingGroups
    ) {
      console.log("Groups tab accessed, triggering group load...");
      setHasLoadedGroups(false);
      handleRefresh();
    }
  }, [activeTab, address, hasLoadedGroups, isLoadingGroups]);

  // Load groups on component mount if wallet is connected
  useEffect(() => {
    if (address && !hasLoadedGroups && !isLoadingGroups) {
      console.log("Component mounted with wallet connected, loading groups...");
      handleRefresh();
    }
  }, []); // Empty dependency array means this runs only once on mount

  // Update groupsList when allGroups changes
  useEffect(() => {
    console.log("allGroups changed:", allGroups);
    if (allGroups && allGroups.length > 0) {
      console.log("allGroups", allGroups);
      const formattedGroups: Group[] = allGroups.map((group, index) => ({
        id: index,
        name: group.name,
        description: group.desc,
        members: group.members,
        balance: Number(group.inAmount || 0) - Number(group.outAmount || 0),
        avatar: "👥",
        lastActivity: "Recently",
        totalExpenses: Number(group.inAmount || 0),
        totalMembers: group.members.length,
        groupId: BigInt(group.groupId),
        inAmount: BigInt(group.inAmount || 0),
        outAmount: BigInt(group.outAmount || 0),
        transactions: group.transactions,
        desc: group.desc,
        isActive: true,
      }));
      console.log("formattedGroups:", formattedGroups);
      setGroupsList(formattedGroups);
    } else {
      console.log("No groups found or allGroups is empty");
      setGroupsList([]);
    }
  }, [allGroups]);

  console.log({ groupsList });

  const handleGroupCreated = async (newGroup: Group) => {
    const _members = newGroup?.memberDetails;
    const addresses = _members?.map((item) => item.address) || [];
    if (newGroup.description) {
      try {
        await handleCreateGroup(newGroup.name, newGroup.description, addresses);
        // Refresh the groups list after creating a new group
        setHasLoadedGroups(false);
        await handleRefresh();
      } catch (error) {
        console.error("Error in handleGroupCreated:", error);
        throw error; // Re-throw to let the AddGroup component handle the error
      }
    }
  };

  const recentActivity: Activity[] = [
    {
      id: 1,
      type: "paid",
      user: "Alex Johnson",
      amount: 25.5,
      chain: "morph-Holesky",
      time: "2h ago",
      group: "Trip to Goa",
    },
    {
      id: 2,
      type: "expense",
      user: "Sarah Chen",
      amount: 89.3,
      group: "Trip to Goa",
      time: "5h ago",
      description: "Hotel booking",
    },
    {
      id: 3,
      type: "received",
      user: "Mike Wilson",
      amount: 15.2,
      chain: "morph-Holesky",
      time: "1d ago",
      group: "Office Lunch",
    },
    {
      id: 4,
      type: "paid",
      user: "Emma Davis",
      amount: 45.75,
      chain: "morph-Holesky",
      time: "2d ago",
      group: "Roommates",
    },
    {
      id: 5,
      type: "expense",
      user: "John Smith",
      amount: 67.4,
      group: "Weekend Party",
      time: "3d ago",
      description: "Dinner expenses",
    },
  ];

  const balances = [
    {
      user: "Alex Johnson",
      amount: 45.3,
      chain: "morph-Holesky",
      avatar: "AJ",
      lastSeen: "2h ago",
    },
    {
      user: "Sarah Chen",
      amount: -23.8,
      chain: "morph-Holesky",
      avatar: "SC",
      lastSeen: "5h ago",
    },
    {
      user: "Mike Wilson",
      amount: 78.5,
      chain: "morph-Holesky",
      avatar: "MW",
      lastSeen: "1d ago",
    },
    {
      user: "Emma Davis",
      amount: -34.2,
      chain: "morph-Holesky",
      avatar: "ED",
      lastSeen: "2d ago",
    },
    {
      user: "John Smith",
      amount: 92.15,
      chain: "morph-Holesky",
      avatar: "JS",
      lastSeen: "3d ago",
    },
  ];

  const chains = [
    {
      id: "morph-Holesky",
      name: "Morph Holesky",
      symbol: "USDT",
      color: "bg-blue-600",
      balance: morphTestnetUsdc.data?.formatted,
    },
    {
      id: "morph-mainnet",
      name: "Morph Mainnet",
      symbol: "USDT",
      color: "bg-purple-500",
      balance: morphMainnetUsdc.data?.formatted,
    },
  ];

  // Calculate real stats from groupsList
  const totalSpent = groupsList.reduce(
    (sum, group) => sum + Number(group.inAmount || 0),
    0
  );
  const activeGroups = groupsList.length;
  const pendingSettlements = groupsList.reduce((sum, group) => {
    if (!group.transactions) return sum;
    return (
      sum +
      group.transactions
        .filter((txn) => txn.payment_type === 0 && txn.payment_status === 0)
        .reduce((txnSum, txn) => txnSum + Number(txn.amount), 0)
    );
  }, 0);

  const stats = [
    {
      label: "Total Spent",
      value: `$${(totalSpent / 1e18).toFixed(2)}`,
      change: "+12%", // You can calculate this dynamically if you want
      icon: TrendingUp,
      color: "text-blue-600",
    },
    {
      label: "Active Groups",
      value: activeGroups.toString(),
      change: "+1", // You can calculate this dynamically if you want
      icon: Users,
      color: "text-green-600",
    },
    {
      label: "Pending Settlements",
      value: `$${(pendingSettlements / 1e18).toFixed(2)}`,
      change: "-8%", // You can calculate this dynamically if you want
      icon: DollarSign,
      color: "text-orange-600",
    },
  ];

  // const { data: groupDetails } = useGroupDetails(0n);
  // const { data: groupTransactions } = useGroupTransactions(groupId);
  // const { data: userTransactions } = useUserTransactions(PaymentType.DEPOSIT);
  // console.log({userTransactions})

  const handleRefresh = async () => {
    if (isLoadingGroups) {
      console.log("Already loading groups, skipping refresh");
      return;
    }

    setIsLoadingGroups(true);
    setGroupsError(null);
    setHasLoadedGroups(false);

    try {
      console.log("Refreshing data...");
      await getGroupsData();
      setHasLoadedGroups(true);
    } catch (error) {
      console.error("Error refreshing data:", error);
      setGroupsError(
        error instanceof Error ? error.message : "Failed to refresh data"
      );
    } finally {
      setIsLoadingGroups(false);
    }
  };

  const BalanceCard = ({ balance }: BalanceCardProps) => (
    <div className="flex items-center justify-between p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
          <span className="text-sm font-semibold text-teal-700">
            {balance.avatar}
          </span>
        </div>
        <div>
          <p className="font-medium text-gray-800">{balance.user}</p>
          <p className="text-sm text-gray-600">Last seen {balance.lastSeen}</p>
        </div>
      </div>
      <div className="text-right">
        <p
          className={`font-semibold ${
            balance.amount > 0 ? "text-green-600" : "text-red-500"
          }`}
        >
          {balance.amount > 0 ? "+" : ""}${Math.abs(balance.amount).toFixed(2)}
        </p>
        <div className="flex items-center justify-end space-x-1 mt-1">
          <div
            className={`w-2 h-2 rounded-full ${
              chains.find((c) => c.id === balance.chain)?.color
            }`}
          ></div>
          <span className="text-xs text-gray-500">{balance.chain}</span>
        </div>
      </div>
    </div>
  );

  // Desktop Components
  const DesktopHeader = () => (
    <div className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Zettle</h1>
          </div>
          <div className="ml-8 flex items-center space-x-1 bg-gray-100 rounded-xl p-1">
            {[
              { id: "home", label: "Dashboard", icon: DollarSign },
              { id: "balances", label: "Balances", icon: Wallet },
              { id: "groups", label: "Groups", icon: Users },
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-all font-medium ${
                    activeTab === tab.id
                      ? "bg-white text-teal-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search transactions, groups..."
              className="pl-10 pr-4 py-2 bg-gray-100 rounded-lg border-0 focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors w-80"
            />
          </div>
          <button className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>
          <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
            <Settings className="w-5 h-5" />
          </button>
          <button className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
            <User className="w-5 h-5" />
            <span className="font-medium">John Doe</span>
          </button>
        </div>
      </div>
    </div>
  );

  const DesktopStatsCards = () => (
    <div className="grid grid-cols-3 gap-6 mb-8">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center`}
              >
                <IconComponent className={`w-6 h-6 ${stat.color}`} />
              </div>
              <span
                className={`text-sm font-medium px-2 py-1 rounded-full ${
                  stat.change.startsWith("+")
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {stat.change}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-1">
              {stat.value}
            </h3>
            <p className="text-gray-600 text-sm">{stat.label}</p>
          </div>
        );
      })}
    </div>
  );

  const DesktopBalanceCard = () => (
    <div className="bg-gradient-to-br from-black to-teal-400 rounded-3xl p-8 text-white mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium opacity-90 mb-2">Total Balance</h2>
          <p className="text-4xl font-bold mb-6">
            $
            {(
              Number(morphTestnetUsdc.data?.formatted || 0) +
              Number(morphMainnetUsdc.data?.formatted || 0)
            ).toFixed(2)}
          </p>
          <div className="flex space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm opacity-90">Morph Holesky USDT</p>
                <p className="text-xl font-semibold">
                  ${Number(morphTestnetUsdc.data?.formatted || 0).toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm opacity-90">Morph Mainnet USDC</p>
                <p className="text-xl font-semibold">
                  ${Number(morphMainnetUsdc.data?.formatted || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="space-y-3">
            {chains.map((chain) => (
              <div
                key={chain.id}
                className="flex items-center space-x-3 bg-white bg-opacity-10 rounded-xl p-3"
              >
                <div className={`w-3 h-3 rounded-full ${chain.color}`}></div>
                <span className="text-sm font-medium">{chain.name}</span>
                <span className="text-lg font-semibold ml-auto">
                  ${chain.balance}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const MobileBalanceCard = () => (
    <div className="bg-gradient-to-br from-black to-teal-400 rounded-2xl p-6 text-white mb-6">
      <div>
        <h2 className="text-base font-medium opacity-90 mb-1">Total Balance</h2>
        <p className="text-3xl font-bold mb-4">
          $
          {(
            Number(morphTestnetUsdc.data?.formatted || 0) +
            Number(morphMainnetUsdc.data?.formatted || 0)
          ).toFixed(2)}
        </p>
        <div className="flex space-x-4">
          <div className="flex-1 flex flex-col items-center">
            <span className="text-xs opacity-80 mb-1">Arbitrum USDC</span>
            <span className="text-lg font-semibold">
              ${Number(morphTestnetUsdc.data?.formatted || 0).toFixed(2)}
            </span>
          </div>
          <div className="flex-1 flex flex-col items-center">
            <span className="text-xs opacity-80 mb-1">Sepolia USDC</span>
            <span className="text-lg font-semibold">
              ${Number(morphMainnetUsdc.data?.formatted || 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const DesktopQuickActions = () => (
    <div className="grid grid-cols-4 gap-4 mb-8">
      <button
        onClick={() => setShowAddExpense(true)}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all group"
      >
        <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-teal-200 transition-colors">
          <Receipt className="w-7 h-7 text-teal-600" />
        </div>
        <h3 className="font-semibold text-gray-800 mb-1">Split Bill</h3>
        <p className="text-sm text-gray-600">Add new expense to split</p>
      </button>

      <button
        onClick={() => setShowPayModal(true)}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all group"
      >
        <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
          <Send className="w-7 h-7 text-green-600" />
        </div>
        <h3 className="font-semibold text-gray-800 mb-1">Send Payment</h3>
        <p className="text-sm text-gray-600">Pay someone directly</p>
      </button>

      <button
        onClick={() => setShowWalletManager(true)}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all group"
      >
        <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
          <Wallet className="w-7 h-7 text-blue-600" />
        </div>
        <h3 className="font-semibold text-gray-800 mb-1">
          Manage Wallet
        </h3>
        <p className="text-sm text-gray-600">Connect & manage wallets</p>
      </button>

      {chainId === 11155111 ? (
        <button
          onClick={handleRedeem}
          disabled={!redeemAmount || redeemAmount <= 0 || redeemStatus === 'loading'}
          className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transition-all group ${
            !redeemAmount || redeemAmount <= 0 || redeemStatus === 'loading'
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:shadow-lg'
          }`}
        >
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform shadow-lg">
            <DollarSign className="w-7 h-7 text-white" />
          </div>
          <h3 className="font-semibold text-gray-800 mb-1">Redeem USDC</h3>
          <p className="text-sm text-gray-600">
            {redeemAmount && redeemAmount > 0 ? `$${redeemAmount.toFixed(2)} available` : 'No USDC to redeem'}
          </p>
        </button>
      ) : (
        <button
          onClick={() => setShowAddGroup(true)}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all group"
        >
          <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
            <Users className="w-7 h-7 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-800 mb-1">Create Group</h3>
          <p className="text-sm text-gray-600">
            Start splitting with friends
          </p>
        </button>
      )}
    </div>
  );

  // Mobile Quick Actions (compact version)
  const MobileQuickActions = () => (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <button
        onClick={() => setShowAddExpense(true)}
        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all"
      >
        <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <Receipt className="w-6 h-6 text-teal-600" />
        </div>
        <span className="text-sm font-medium text-gray-700">Split Bill</span>
      </button>

      <button
        onClick={() => setShowPayModal(true)}
        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all"
      >
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <Send className="w-6 h-6 text-green-600" />
        </div>
        <span className="text-sm font-medium text-gray-700">Pay</span>
      </button>

      <button
        onClick={() => setShowAddGroup(true)}
        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all"
      >
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <Users className="w-6 h-6 text-blue-600" />
        </div>
        <span className="text-sm font-medium text-gray-700">Create Group</span>
      </button>
    </div>
  );

  const GroupCard: React.FC<GroupCardProps> = ({
    group,
    isDesktop = false,
  }) => (
    <div
      onClick={() => setSelectedGroup(group)}
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all cursor-pointer ${
        isDesktop ? "p-6" : "p-4"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div
            className={`${
              isDesktop ? "w-14 h-14" : "w-12 h-12"
            } bg-teal-100 rounded-2xl flex items-center justify-center text-xl`}
          >
            {group.avatar ? group.avatar : "🏖️"}
          </div>
          <div>
            <h3
              className={`font-semibold text-gray-800 ${
                isDesktop ? "text-lg" : ""
              }`}
            >
              {group.name}
            </h3>
            <p className="text-sm text-gray-600">
              {group?.description?.slice(0, 25) ||
                group?.desc?.slice(0, 25) ||
                "No description"}
            </p>
            {isDesktop && (
              <p className="text-xs text-gray-500 mt-1">
                Last activity: {group.lastActivity}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className={`font-semibold ${isDesktop ? "text-xl" : ""}`}>
            Morph Sepolia
          </p>
          <p className="text-xs text-gray-500">
            {group.totalMembers || group.members.length} Members
          </p>
        </div>
      </div>
    </div>
  );

  const ActivityCard: React.FC<ActivityCardProps> = ({
    activity,
    isDesktop = false,
  }) => (
    <div
      className={`flex items-center justify-between bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all ${
        isDesktop ? "p-6" : "p-4"
      }`}
    >
      <div className="flex items-center space-x-4">
        <div
          className={`${
            isDesktop ? "w-12 h-12" : "w-10 h-10"
          } rounded-full flex items-center justify-center ${
            activity.type === "paid"
              ? "bg-green-100"
              : activity.type === "expense"
              ? "bg-blue-100"
              : "bg-teal-100"
          }`}
        >
          {activity.type === "paid" ? (
            <ArrowUpRight
              className={`${isDesktop ? "w-6 h-6" : "w-5 h-5"} text-green-600`}
            />
          ) : activity.type === "expense" ? (
            <Receipt
              className={`${isDesktop ? "w-6 h-6" : "w-5 h-5"} text-blue-600`}
            />
          ) : (
            <ArrowDownLeft
              className={`${isDesktop ? "w-6 h-6" : "w-5 h-5"} text-teal-600`}
            />
          )}
        </div>
        <div>
          <p
            className={`font-medium text-gray-800 ${
              isDesktop ? "text-lg" : ""
            }`}
          >
            {activity.user}
          </p>
          <p className="text-sm text-gray-600">{activity.group}</p>
          {isDesktop && activity.description && (
            <p className="text-xs text-gray-500 mt-1">{activity.description}</p>
          )}
        </div>
      </div>
      <div className="text-right">
        <p
          className={`font-semibold text-gray-800 ${
            isDesktop ? "text-lg" : ""
          }`}
        >
          ${activity.amount}
        </p>
        <p className="text-xs text-gray-500">{activity.time}</p>
        {isDesktop && activity.chain && (
          <div className="flex items-center justify-end space-x-1 mt-1">
            <div
              className={`w-2 h-2 rounded-full ${
                chains.find((c) => c.id === activity.chain)?.color
              }`}
            ></div>
            <span className="text-xs text-gray-500">{activity.chain}</span>
          </div>
        )}
      </div>
    </div>
  );

  const AddExpenseModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className={`bg-white rounded-2xl p-6 ${
          isMobile ? "w-full mx-4 max-h-[80vh]" : "w-[500px]"
        } overflow-y-auto`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Add Expense</h2>
          <button onClick={() => setShowAddExpense(false)}>
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Description (e.g., Dinner at restaurant)"
            className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />

          <div className="flex space-x-4">
            <input
              type="number"
              placeholder="Amount"
              className="flex-1 p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <select className="p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 min-w-[100px]">
              <option>USD</option>
              <option>USDC</option>
            </select>
          </div>

          <select className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500">
            <option>Select Group</option>
            {groupsList.map((group) => (
              <option key={group.id}>{group.name}</option>
            ))}
          </select>

          <div className="flex space-x-3 pt-4">
            <button
              onClick={() => setShowAddExpense(false)}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button className="flex-1 bg-black text-white py-3 rounded-xl font-medium hover:bg-teal-700 transition-colors">
              Add Expense
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const PayModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className={`bg-white rounded-2xl p-6 ${
          isMobile ? "w-full mx-4" : "w-[500px]"
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Send Payment</h2>
          <button onClick={() => setShowPayModal(false)}>
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Enter username or wallet address"
            className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />

          <input
            type="number"
            placeholder="Amount"
            className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />

          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Select Chain</p>
            <div className="grid grid-cols-3 gap-3">
              {chains.map((chain) => (
                <button
                  key={chain.id}
                  onClick={() => setSelectedChain(chain.id)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedChain === chain.id
                      ? "border-teal-500 bg-teal-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full ${chain.color} mx-auto mb-2`}
                  ></div>
                  <p className="text-sm font-medium">{chain.name}</p>
                  <p className="text-xs text-gray-500">${chain.balance}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              onClick={() => setShowPayModal(false)}
              className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button className="flex-1 bg-black text-white py-3 rounded-xl font-medium hover:bg-teal-700 transition-colors">
              Send Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const HomeTab = () => {
    if (!isMobile) {
      // Desktop Layout
      return (
        <div className="space-y-8">
          <DesktopStatsCards />
          {isMobile ? <MobileBalanceCard /> : <DesktopBalanceCard />}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <button
              onClick={() => setShowAddExpense(true)}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all group"
            >
              <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-teal-200 transition-colors">
                <Receipt className="w-7 h-7 text-teal-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">Split Bill</h3>
              <p className="text-sm text-gray-600">Add new expense to split</p>
            </button>

            <button
              onClick={() => setShowPayModal(true)}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all group"
            >
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <Send className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">Send Payment</h3>
              <p className="text-sm text-gray-600">Pay someone directly</p>
            </button>

            <button
              onClick={() => setShowWalletManager(true)}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all group"
            >
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                <Wallet className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">
                Manage Wallet
              </h3>
              <p className="text-sm text-gray-600">Connect & manage wallets</p>
            </button>

            {chainId === 11155111 ? (
              <button
                onClick={handleRedeem}
                disabled={!redeemAmount || redeemAmount <= 0 || redeemStatus === 'loading'}
                className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transition-all group ${
                  !redeemAmount || redeemAmount <= 0 || redeemStatus === 'loading'
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:shadow-lg'
                }`}
              >
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform shadow-lg">
                  <DollarSign className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">Redeem USDC</h3>
                <p className="text-sm text-gray-600">
                  {redeemAmount && redeemAmount > 0 ? `$${redeemAmount.toFixed(2)} available` : 'No USDC to redeem'}
                </p>
              </button>
            ) : (
              <button
                onClick={() => setShowAddGroup(true)}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all group"
              >
                <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                  <Users className="w-7 h-7 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">Create Group</h3>
                <p className="text-sm text-gray-600">
                  Start splitting with friends
                </p>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* Groups Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">
                  Your Groups
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleRefresh()}
                    disabled={isLoadingGroups}
                    className={`p-2 rounded-full transition-colors ${
                      isLoadingGroups
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <RefreshCcw
                      className={`w-4 h-4 ${
                        isLoadingGroups ? "animate-spin" : ""
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => setActiveTab("groups")}
                    className="text-teal-600 font-medium hover:text-teal-700 flex items-center space-x-1"
                  >
                    <span>View All</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {isLoadingGroups ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center space-x-3">
                      <RefreshCcw className="w-5 h-5 animate-spin text-teal-600" />
                      <span className="text-gray-600">Loading groups...</span>
                    </div>
                  </div>
                ) : groupsList.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500 mb-4">
                      <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm font-medium">No groups yet</p>
                      <p className="text-xs">
                        Create your first group to start splitting expenses
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAddGroup(true)}
                      className="bg-teal-600 text-white px-4 py-2 rounded-xl hover:bg-teal-700 transition-colors text-sm"
                    >
                      Create Group
                    </button>
                  </div>
                ) : (
                  groupsList
                    .slice(0, 3)
                    .map((group) => (
                      <GroupCard
                        key={group.id}
                        group={group}
                        isDesktop={true}
                      />
                    ))
                )}
              </div>
            </div>

            {/* Recent Activity Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">
                  Recent Activity
                </h3>
                <button className="text-teal-600 font-medium hover:text-teal-700 flex items-center space-x-1">
                  <span>View All</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                {recentActivity.slice(0, 4).map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    isDesktop={true}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      // Mobile Layout
      return (
        <div className="space-y-6">
          {/* Balance Overview */}
          <div className="bg-gradient-to-r from-black to-teal-400 rounded-3xl p-6 text-white">
            <h2 className="text-lg font-medium opacity-90 mb-2">
              Total Balance
            </h2>
            <p className="text-3xl font-bold mb-4">
              $
              {(
                Number(morphTestnetUsdc.data?.formatted || 0) +
                Number(morphMainnetUsdc.data?.formatted || 0)
              ).toFixed(2)}
            </p>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <ArrowUpRight className="w-4 h-4" />
                <span className="text-sm">
                  ${Number(morphTestnetUsdc.data?.formatted || 0).toFixed(2)}{" "}
                  Morph Sepolia USDC
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <ArrowDownLeft className="w-4 h-4" />
                <span className="text-sm">
                  ${Number(morphMainnetUsdc.data?.formatted || 0).toFixed(2)} Morph Holesky
                  USDC
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setShowAddExpense(true)}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Receipt className="w-6 h-6 text-teal-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">
                Split Bill
              </span>
            </button>

            <button
              onClick={() => setShowPayModal(true)}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Send className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Pay</span>
            </button>

            <button
              onClick={() => setShowWalletManager(true)}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Wallets</span>
            </button>

            {chainId === 11155111 ? (
              <button
                onClick={handleRedeem}
                disabled={!redeemAmount || redeemAmount <= 0 || redeemStatus === 'loading'}
                className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transition-all group ${
                  !redeemAmount || redeemAmount <= 0 || redeemStatus === 'loading'
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:shadow-lg'
                }`}
              >
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform shadow-lg">
                  <DollarSign className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">Redeem USDC</h3>
                <p className="text-sm text-gray-600">
                  {redeemAmount && redeemAmount > 0 ? `$${redeemAmount.toFixed(2)} available` : 'No USDC to redeem'}
                </p>
              </button>
            ) : (
              <button
                onClick={() => setShowAddGroup(true)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  Create Group
                </span>
              </button>
            )}
          </div>

          {/* Groups */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Your Groups
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleRefresh()}
                  disabled={isLoadingGroups}
                  className={`p-1.5 rounded-full transition-colors ${
                    isLoadingGroups
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <RefreshCcw
                    className={`w-3.5 h-3.5 ${
                      isLoadingGroups ? "animate-spin" : ""
                    }`}
                  />
                </button>
                <button
                  onClick={() => setActiveTab("groups")}
                  className="text-teal-600 text-sm font-medium"
                >
                  View All
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {isLoadingGroups ? (
                <div className="flex items-center justify-center py-6">
                  <div className="flex items-center space-x-2">
                    <RefreshCcw className="w-4 h-4 animate-spin text-teal-600" />
                    <span className="text-gray-600 text-sm">
                      Loading groups...
                    </span>
                  </div>
                </div>
              ) : groupsList.length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-gray-500 mb-3">
                    <Users className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm font-medium">No groups yet</p>
                    <p className="text-xs">
                      Create your first group to start splitting expenses
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddGroup(true)}
                    className="bg-teal-600 text-white px-3 py-2 rounded-xl hover:bg-teal-700 transition-colors text-xs"
                  >
                    Create Group
                  </button>
                </div>
              ) : (
                groupsList
                  .slice(0, 3)
                  .map((group) => <GroupCard key={group.id} group={group} />)
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              {recentActivity.slice(0, 4).map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          </div>
        </div>
      );
    }
  };

  const BalancesTab = () => (
    <div className="space-y-6">
      <div className="text-center py-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Balances</h2>
        <p className="text-gray-600">Track who owes what across all chains</p>
      </div>

      <div className="space-y-4">
        {balances.map((balance, index) => (
          <BalanceCard key={index} balance={balance} />
        ))}
      </div>
    </div>
  );

  const GroupsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between ">
        <h2 className="text-2xl font-bold text-gray-800">Groups</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddGroup(true)}
            className="bg-black text-white p-3 rounded-full hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleRefresh()}
            disabled={isLoadingGroups}
            className={`p-3 rounded-full transition-colors ${
              isLoadingGroups
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-black text-white hover:bg-gray-800"
            }`}
          >
            <RefreshCcw
              className={`w-5 h-5 ${isLoadingGroups ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Wallet Not Connected Message */}
      {!address && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <Wallet className="w-12 h-12 mx-auto mb-3 text-blue-500" />
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            Connect Your Wallet
          </h3>
          <p className="text-blue-600 mb-4">
            Please connect your wallet to view and manage your groups
          </p>
          <button
            onClick={() => setShowWalletManager(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      )}

      {/* Error Message */}
      {groupsError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700 text-sm">
            <strong>Error:</strong> {groupsError}
          </p>
          <button
            onClick={() => handleRefresh()}
            className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoadingGroups && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <RefreshCcw className="w-6 h-6 animate-spin text-teal-600" />
            <span className="text-gray-600">Loading groups...</span>
          </div>
        </div>
      )}

      {/* Groups List */}
      {address && !isLoadingGroups && (
        <div className="space-y-4 overflow-y-auto h-[100vh]">
          {groupsList.length === 0 && !groupsError ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium">No groups yet</p>
                <p className="text-sm">
                  Create your first group to start splitting expenses
                </p>
              </div>
              <button
                onClick={() => setShowAddGroup(true)}
                className="bg-teal-600 text-white px-6 py-3 rounded-xl hover:bg-teal-700 transition-colors"
              >
                Create Group
              </button>
            </div>
          ) : (
            groupsList.map((group) => (
              <GroupCard key={group.id} group={group} isDesktop={!isMobile} />
            ))
          )}
        </div>
      )}
    </div>
  );

  console.log({ selectedGroup });
  return (
    <div className="min-h-screen bg-gray-50">
      {selectedGroup ? (
        <GroupDetails
          group={{
            id: selectedGroup.id,
            name: selectedGroup.name,
            avatar: selectedGroup.avatar,
            totalExpenses: selectedGroup.totalExpenses || 0,
            members: selectedGroup.members.map((addr) => addr as string),
            expenses: selectedGroup.expenses || [],
            groupId: selectedGroup.groupId,
            inAmount: selectedGroup.inAmount,
            totalMembers: selectedGroup.members.length,
            transactions: selectedGroup.transactions,
          }}
          onBack={() => setSelectedGroup(null)}
          isMobile={isMobile}
          onRefresh={async () => {
            // Refresh the groups data
            setHasLoadedGroups(false);
            await handleRefresh();
          }}
        />
      ) : showWalletManager ? (
        <WalletManager
          onBack={() => setShowWalletManager(false)}
          isMobile={isMobile}
        />
      ) : (
        <>
          {/* Header */}
          <div className="bg-white shadow-sm sticky top-0 z-40">
            <div className={`${isMobile ? "px-4 py-4" : "px-8 py-6"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">Z</span>
                  </div>
                  <h1 className="text-xl font-bold text-gray-800 uppercase">
                    Zettle
                  </h1>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowWalletManager(true)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <Wallet className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex relative">
            {/* Desktop Sidebar */}
            {!isMobile && (
              <div className="w-64 fixed left-0 top-[72px] bottom-0 bg-white border-r border-gray-200 overflow-y-auto">
                <nav className="p-4 space-y-2">
                  <button
                    onClick={() => setActiveTab("home")}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-medium ${
                      activeTab === "home"
                        ? "bg-teal-50 text-teal-600"
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    <DollarSign className="w-5 h-5" />
                    <span>Dashboard</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("balances")}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-medium ${
                      activeTab === "balances"
                        ? "bg-teal-50 text-teal-600"
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    <Wallet className="w-5 h-5" />
                    <span>Balances</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("groups")}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-medium ${
                      activeTab === "groups"
                        ? "bg-teal-50 text-teal-600"
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    <Users className="w-5 h-5" />
                    <span>Groups</span>
                  </button>
                </nav>
              </div>
            )}

            {/* Main Content */}
            <div className={`${isMobile ? "w-full" : "ml-64"} flex-1`}>
              <div className={`${isMobile ? "px-4 py-4" : "px-8 py-8"}`}>
                {activeTab === "home" && <HomeTab />}
                {activeTab === "balances" && <BalancesTab />}
                {activeTab === "groups" && <GroupsTab />}
              </div>
            </div>
          </div>

          {/* Bottom Navigation for Mobile */}
          {isMobile && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-40">
              <div className="flex items-center justify-around">
                {[
                  { id: "home", label: "Home", icon: DollarSign },
                  { id: "balances", label: "Balances", icon: Wallet },
                  { id: "groups", label: "Groups", icon: Users },
                ].map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all ${
                        activeTab === tab.id
                          ? "text-teal-600 bg-teal-50"
                          : "text-gray-600"
                      }`}
                    >
                      <IconComponent className="w-6 h-6 mb-1" />
                      <span className="text-xs font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Modals */}
          {showAddExpense && <AddExpenseModal />}
          {showPayModal && <PayModal />}
          {showAddGroup && (
            <AddGroup
              onClose={() => setShowAddGroup(false)}
              onGroupCreated={async (group) => {
                // Convert AddGroup's Group interface to our Group interface
                const addresses =
                  group.memberDetails?.map((member) => member.address) || [];
                const convertedGroup: Group = {
                  id: group.id,
                  name: group.name,
                  description: group.description,
                  members: addresses, // Convert from memberDetails to address array
                  balance: group.balance,
                  avatar: group.avatar,
                  lastActivity: group.lastActivity,
                  totalExpenses: group.totalExpenses,
                  memberDetails: group.memberDetails,
                  expenses: group.expenses,
                  isActive: true,
                };
                await handleGroupCreated(convertedGroup);
              }}
              isMobile={isMobile}
            />
          )}

          {/* Redeem Status Modal */}
          {redeemStatus !== 'idle' && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4">
                {redeemStatus === 'loading' && (
                  <LoadingSpinner size="lg" text="Processing redeem..." />
                )}
                {redeemStatus === 'success' && (
                  <SuccessAnimation message="USDC redeemed successfully!" />
                )}
                {redeemStatus === 'error' && (
                  <ErrorAnimation message={redeemError} />
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SplitChainApp;
