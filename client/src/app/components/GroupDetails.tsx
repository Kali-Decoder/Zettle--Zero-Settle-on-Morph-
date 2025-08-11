"use client";
import React from "react";
import {
  Receipt,
  Users,
  ChevronLeft,
  X,
  Send,
  DollarSign,
  User,
} from "lucide-react";
import { formatAddress } from "@/lib/constants";
import { useSettle, Transaction } from "@/lib/hooks/useSettle";
import { useAccount } from "wagmi";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { SuccessAnimation } from "./ui/SuccessAnimation";
import { ErrorAnimation } from "./ui/ErrorAnimation";

interface GroupExpense {
  id: number;
  description: string;
  amount: number;
  paidBy: string;
  date: string;
  splitAmong: string[];
  chain?: string;
}

interface GroupDetailsProps {
  group: {
    id: number;
    name: string;
    avatar: string;
    totalExpenses: number;
    members: string[];
    expenses: GroupExpense[];
    groupId?: bigint;
    inAmount?: bigint;
    totalMembers?: number;
    transactions?: Transaction[];
  };
  onBack: () => void;
  isMobile: boolean;
  onRefresh?: () => Promise<void>;
}

const GroupDetails: React.FC<GroupDetailsProps> = ({
  group,
  onBack,
  isMobile,
  onRefresh,
}) => {
  const [showAddExpense, setShowAddExpense] = React.useState(false);
  const [showSettleUp, setShowSettleUp] = React.useState(false);
  const [taskDescription, setTaskDescription] = React.useState("");
  const [amount, setAmount] = React.useState(0);
  const { handleAddTask, handleDeposit } = useSettle();
  const [selectedMembers, setSelectedMembers] = React.useState<`0x${string}`[]>(
    []
  );
  const [selectedTransaction, setSelectedTransaction] =
    React.useState<Transaction | null>(null);
  const { address } = useAccount();

  // Loading and status states for Add Expense
  const [addExpenseStatus, setAddExpenseStatus] = React.useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [addExpenseError, setAddExpenseError] = React.useState("");

  // Loading and status states for Settle Up
  const [settleUpStatus, setSettleUpStatus] = React.useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [settleUpError, setSettleUpError] = React.useState("");

  console.log({ group });

  const addMemberToExpense = (memberAddress: `0x${string}`) => {
    setSelectedMembers((prevMembers) => {
      const exists = prevMembers.some((m) => m === memberAddress);
      if (!exists) {
        return [...prevMembers, memberAddress];
      } else {
        return prevMembers.filter((m) => m !== memberAddress);
      }
    });
  };

  // Fixed: Functions to open modals
  const openAddExpenseModal = () => {
    setShowAddExpense(true);
    // Reset all states when opening
    setAddExpenseStatus("idle");
    setAddExpenseError("");
    setTaskDescription("");
    setAmount(0);
    setSelectedMembers([]);
  };

  const openSettleUpModal = () => {
    setShowSettleUp(true);
    // Reset all states when opening
    setSettleUpStatus("idle");
    setSettleUpError("");
    setSelectedTransaction(null);
  };

  const resetAddExpenseModal = () => {
    setShowAddExpense(false);
    setAddExpenseStatus("idle");
    setAddExpenseError("");
    setTaskDescription("");
    setAmount(0);
    setSelectedMembers([]);
  };

  const resetSettleUpModal = () => {
    setShowSettleUp(false);
    setSettleUpStatus("idle");
    setSettleUpError("");
    setSelectedTransaction(null);
  };

  const handleAddExpense = async () => {
    console.log("Adding expense:", group);
    if (group.groupId == undefined) {
      throw new Error("Group ID is undefined");
    }
    if (
      taskDescription.trim() === "" ||
      amount <= 0 ||
      selectedMembers.length === 0
    ) {
      alert("Please fill in all fields correctly.");
      return;
    }
    setAddExpenseStatus("loading");
    setTimeout(async () => {
      const addresses = selectedMembers?.map((item) => item);
      try {
        await handleAddTask(
          taskDescription,
          group.groupId as bigint,
          BigInt(amount),
          addresses
        );
        setAddExpenseStatus("success");
        // Reset form after success
        setTimeout(() => {
          resetAddExpenseModal();
        }, 2000);
        if (onRefresh) {
          await onRefresh();
        }
      } catch (error) {
        console.error("Error adding expense:", error);
        setAddExpenseError(
          error instanceof Error ? error.message : "Failed to add expense"
        );
        setAddExpenseStatus("error");
        // Reset error state after 3 seconds
        setTimeout(() => {
          setAddExpenseStatus("idle");
          setAddExpenseError("");
        }, 3000);
      }
    }, 0);
  };

  const handleSettleUp = async () => {
    if (!selectedTransaction) {
      alert("Please select a transaction to settle up.");
      return;
    }
    if (selectedTransaction.payer !== address) {
      alert("Wrong address connected to pay");
      return;
    }
    console.log({ selectedTransaction });
    setSettleUpStatus("loading");
    setTimeout(async () => {
      try {
        const amountInUSD = Number(selectedTransaction.amount) / 1e18;
        await handleDeposit(
          selectedTransaction.id.toString(),
          selectedTransaction.groupId.toString(),
          amountInUSD
        );
        setSettleUpStatus("success");
        // Reset form after success
        setTimeout(async () => {
          resetSettleUpModal();
          if (onRefresh) {
            await onRefresh();
          }
        }, 2000);
      } catch (error) {
        console.error("Error settling up:", error);
        setSettleUpError(
          error instanceof Error ? error.message : "Failed to settle up"
        );
        setSettleUpStatus("error");
        // Reset error state after 3 seconds
        setTimeout(() => {
          setSettleUpStatus("idle");
          setSettleUpError("");
        }, 3000);
      }
    }, 0);
  };

  const AddExpenseModal = ({ user }: { user: `0x${string}` | undefined }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div
        className={`bg-white ${
          isMobile
            ? "w-full h-full rounded-t-3xl"
            : "w-full h-full max-w-md rounded-3xl"
        } overflow-y-auto`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-8 text-white">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold">Add Expense</h2>
            <button
              onClick={resetAddExpenseModal}
              className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-teal-100">
            Split with {group?.name || "Port Blair"}
          </p>
        </div>

        {/* Status Display */}
        {addExpenseStatus === "loading" && (
          <div className="p-8 flex flex-col items-center justify-center min-h-[200px]">
            <LoadingSpinner size="lg" text="Adding expense..." />
          </div>
        )}

        {addExpenseStatus === "success" && (
          <div className="p-8 flex flex-col items-center justify-center min-h-[200px]">
            <SuccessAnimation message="Expense added successfully!" />
          </div>
        )}

        {addExpenseStatus === "error" && (
          <div className="p-8 flex flex-col items-center justify-center min-h-[200px]">
            <ErrorAnimation message={addExpenseError} />
          </div>
        )}

        {/* Form - Only show when not loading, success, or error */}
        {addExpenseStatus === "idle" && (
          <>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="description"
                  className="text-sm font-semibold text-gray-700 flex items-center gap-2"
                >
                  <Receipt className="w-4 h-4" />
                  Description
                </label>
                <input
                  type="text"
                  name="description"
                  onChange={(e) => setTaskDescription(e.target.value)}
                  value={taskDescription}
                  placeholder="What did you pay for?"
                  className="w-full p-4 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-3 focus:ring-teal-100 focus:bg-white transition-all text-gray-800 placeholder-gray-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Amount
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    name="amount"
                    onChange={(e) => setAmount(Number(e.target.value))}
                    value={amount}
                    className="w-full p-4 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-3 focus:ring-teal-100 focus:bg-white transition-all text-gray-800 placeholder-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Currency
                  </label>
                  <select className="w-full p-4 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-3 focus:ring-teal-100 focus:bg-white transition-all text-gray-800">
                    <option>USD</option>
                    <option>USDC</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Paid by
                </label>
                <select className="w-full p-4 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-3 focus:ring-teal-100 focus:bg-white transition-all text-gray-800">
                  <option>Select who paid</option>
                  {group.members.length &&
                    group.members.map((member, i) => (
                      <option key={i} value={member}>
                        <span className="text-gray-500 text-sm">
                          👨 ({formatAddress(member)}){" "}
                          {member === user ? "(You)" : ""}
                        </span>
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">
                  Split with
                </label>
                <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                  {group.members.map((member, i) => (
                    <label
                      key={i}
                      className="flex items-center justify-between p-2 hover:bg-white rounded-xl transition-colors cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-500 rounded-full flex items-center justify-center text-white font-medium shadow-sm">
                          👨
                        </div>

                        <span className="text-gray-500 text-xs">
                          ({formatAddress(member)}){" "}
                          {member === user ? "(You)" : ""}
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-teal-600 rounded-lg border-2 border-gray-300 focus:ring-teal-500 focus:ring-2"
                        checked={selectedMembers.some(
                          (m) => m.toLowerCase() === member.toLowerCase()
                        )}
                        onChange={() =>
                          addMemberToExpense(member as `0x${string}`)
                        }
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 pt-0">
              <div className="flex space-x-3">
                <button
                  onClick={resetAddExpenseModal}
                  className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-2xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddExpense}
                  disabled={addExpenseStatus !== "idle"}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 text-white py-4 rounded-2xl font-semibold hover:from-teal-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Expense
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const SettleUpModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div
        className={`bg-white ${
          isMobile
            ? "w-full h-full rounded-t-3xl"
            : "w-full max-w-md rounded-3xl"
        } overflow-hidden`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-8 text-white">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold">Settle Up</h2>
            <button
              onClick={resetSettleUpModal}
              className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-green-100">Select transaction to deposit</p>
        </div>

        {/* Status Display */}
        {settleUpStatus === "loading" && (
          <div className="p-8 flex flex-col items-center justify-center min-h-[200px]">
            <LoadingSpinner size="lg" text="Processing deposit..." />
          </div>
        )}

        {settleUpStatus === "success" && (
          <div className="p-8 flex flex-col items-center justify-center min-h-[200px]">
            <SuccessAnimation message="Deposit successful!" />
          </div>
        )}

        {settleUpStatus === "error" && (
          <div className="p-8 flex flex-col items-center justify-center min-h-[200px]">
            <ErrorAnimation message={settleUpError} />
          </div>
        )}

        {/* Transaction Selection - Only show when not loading, success, or error */}
        {settleUpStatus === "idle" && (
          <>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  Select Transaction
                </label>
                <div className="bg-gray-50 rounded-2xl p-4 space-y-3 max-h-60 overflow-y-auto">
                  {group.transactions
                    ?.filter(
                      (txn) =>
                        txn.txType === 0 && txn.status === 0
                    )
                    .map((transaction) => (
                      <label
                        key={transaction.id.toString()}
                        className="flex items-center justify-between p-3 hover:bg-white rounded-xl transition-colors cursor-pointer border border-gray-200"
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          <input
                            type="radio"
                            name="selectedTransaction"
                            className="w-4 h-4 text-green-600 border-2 border-gray-300 focus:ring-green-500 focus:ring-2"
                            checked={
                              selectedTransaction?.id ===
                              transaction.id
                            }
                            onChange={() => setSelectedTransaction(transaction)}
                          />
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800 text-sm">
                              {transaction.task}
                            </p>
                            <p className="text-xs text-gray-600">
                              From: {formatAddress(transaction.payer)}
                              {transaction.payer === address ? " (You)" : ""}
                            </p>
                            <p className="text-xs text-gray-600">
                              Amount: $
                              {(Number(transaction.amount) / 1e18).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </label>
                    ))}
                  {(!group.transactions ||
                    group.transactions.filter(
                      (txn) =>
                        txn.txType === 0 && txn.status === 0
                    ).length === 0) && (
                    <p className="text-gray-500 text-center py-4">
                      No pending deposits available
                    </p>
                  )}
                </div>
              </div>

              {selectedTransaction && (
                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-2">
                    Selected Transaction
                  </h3>
                  <p className="text-sm text-blue-700">
                    <strong>Task:</strong> {selectedTransaction.task}
                  </p>
                  <p className="text-sm text-blue-700">
                    <strong>Amount:</strong> $
                    {(Number(selectedTransaction.amount) / 1e18).toFixed(2)}
                  </p>
                  <p className="text-sm text-blue-700">
                    <strong>From:</strong>{" "}
                    {formatAddress(selectedTransaction.payer)}
                    {selectedTransaction.from === address ? " (You)" : ""}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 pt-0">
              <div className="flex space-x-3">
                <button
                  onClick={resetSettleUpModal}
                  className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-2xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSettleUp}
                  disabled={!selectedTransaction || settleUpStatus !== "idle"}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-2xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                  Deposit
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white">
        <div className={`${isMobile ? "px-4 py-6" : "px-8 py-8"}`}>
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={onBack}
              className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-3xl flex items-center justify-center text-2xl backdrop-blur-sm">
                {group.avatar ? group.avatar : "🏖️"}
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {group.name || "Port Blair"}
                </h1>
                <div className="flex items-center space-x-2 text-teal-100">
                  <Users className="w-4 h-4" />
                  <span>
                    {group?.totalMembers || group.members.length} members
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Total Expenses Card */}
          <div className="bg-white bg-opacity-15 backdrop-blur-sm rounded-3xl p-6">
            <div className="text-center">
              <p className="text-teal-100 text-sm font-medium mb-1">
                Total Group Expenses
              </p>
              <p className="text-3xl font-bold">
                $
                {group?.inAmount
                  ? (Number(group.inAmount) / 18).toFixed(2)
                  : "0.00"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className={`${isMobile ? "px-4 py-6" : "px-8 py-8"} space-y-8`}>
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={openAddExpenseModal}
            className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 group"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform shadow-lg">
              <Receipt className="w-7 h-7 text-white" />
            </div>
            <span className="text-gray-800 font-semibold">Add Expense</span>
          </button>

          <button
            onClick={openSettleUpModal}
            className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 group"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform shadow-lg">
              <Send className="w-7 h-7 text-white" />
            </div>
            <span className="text-gray-800 font-semibold">Settle Up</span>
          </button>
        </div>

        {/* Expense History */}
        <div>
         

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Recent Activity</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{group?.transactions?.length || 0} transactions</span>
            </div>
          </div>

          <div className="space-y-3">
            {group?.transactions?.length ? (
              group.transactions.map((expense) => (
                <div
                  key={expense.id.toString()}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Transaction Icon */}
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                          expense.txType === 0
                            ? "bg-gradient-to-br from-blue-400 to-blue-500"
                            : "bg-gradient-to-br from-green-400 to-green-500"
                        }`}
                      >
                        {expense.txType === 0 ? (
                          <Receipt className="w-6 h-6 text-white" />
                        ) : (
                          <Send className="w-6 h-6 text-white" />
                        )}
                      </div>

                      {/* Transaction Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-800 text-lg group-hover:text-teal-600 transition-colors">
                            {expense.task}
                          </h3>
                          <div className="text-right">
                            <p className="text-xl font-bold text-gray-800">
                              ${(Number(expense.amount) / 1e18).toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {/* Transaction Parties */}
                        <div className="space-y-1 mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500 font-medium">
                              FROM:
                            </span>
                            <span className="text-sm text-gray-700 font-medium">
                              {formatAddress(expense.payer)}
                              {expense.payer === address && (
                                <span className="ml-1 text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
                                  You
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500 font-medium">
                              TO:
                            </span>
                            <span className="text-sm text-gray-700 font-medium">
                              {formatAddress(expense.receiver)}
                              {expense.receiver === address && (
                                <span className="ml-1 text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
                                  You
                                </span>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Status Badges */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                              expense.txType === 0
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-green-50 text-green-700 border-green-200"
                            }`}
                          >
                            {expense.txType === 0 ? "Deposit" : "Claim"}
                          </span>
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                              expense.status === 0
                                ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            {expense.status === 0
                              ? "Pending"
                              : "Completed"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Receipt className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  No transactions yet
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Start by adding an expense to this group
                </p>
                <button
                  onClick={openAddExpenseModal}
                  className="bg-teal-600 text-white px-6 py-3 rounded-xl hover:bg-teal-700 transition-colors font-medium"
                >
                  Add First Expense
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAddExpense && <AddExpenseModal user={address} />}
      {showSettleUp && <SettleUpModal />}
    </div>
  );
};

export default GroupDetails;
