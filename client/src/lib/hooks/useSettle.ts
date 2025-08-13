/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useChainId,
} from "wagmi";
import { readContract, sendTransaction, waitForTransaction } from "@wagmi/core";
import {
  SETTLE_ABI,
  MOCK_TOKEN_ABI,
  SETTLE_CONTRACT_ADDRESS,
  USDC_TOKEN_ADDRESS
} from "../constants";
import { wagmiAdapter } from "@/provider";
import {  useState } from "react";
import { parseUnits } from "viem";

export enum PaymentType {
  DEPOSIT = 0,
  CLAIM = 1,
}

export enum PaymentStatus {
  PENDING = 0,
  COMPLETED = 1,
}

export interface Transaction {
  payment_type: PaymentType;
  payment_status: PaymentStatus;
  taskName: string;
  transactionId: bigint;
  amount: bigint;
  groupId: bigint;
  from: `0x${string}`;
  to: `0x${string}`;
}

export interface GroupDetails {
  name: string;
  desc: string;
  admin: `0x${string}`;
  groupId: number;
  inAmount: number;
  outAmount: number;
  isActive: boolean;
  members: `0x${string}`[];
  totalMembers: number;
  transactions: Transaction[];
}

type ChainId = keyof typeof SETTLE_CONTRACT_ADDRESS;

export function useSettle() {
  const { address } = useAccount();
  const chainId = useChainId();
  console.log("chainId", chainId);
  const [allGroups, setAllGroups] = useState<GroupDetails[]>([]);

  const contractAddress = SETTLE_CONTRACT_ADDRESS[
    chainId.toString() as ChainId
  ] as `0x${string}`;

  const usdcAddress = USDC_TOKEN_ADDRESS[
    chainId.toString() as ChainId
  ] as `0x${string}`;

  // Read functions
  const { data: groupId } = useReadContract({
    address: contractAddress,
    abi: SETTLE_ABI,
    functionName: "groupCounter",
  });

  const { data: transactionId } = useReadContract({
    address: contractAddress,
    abi: SETTLE_ABI,
    functionName: "transactionID",
  });

  const useGroupDetails = (groupId: bigint) => {
    return useReadContract({
      address: contractAddress,
      abi: SETTLE_ABI,
      functionName: "groups",
      args: [groupId],
    });
  };

  const useGroupTransactions = (groupId: bigint) => {
    return useReadContract({
      address: contractAddress,
      abi: SETTLE_ABI,
      functionName: "getGroupTransactions",
      args: [groupId],
    });
  };

  const useUserTransactions = (type: PaymentType) => {
    return useReadContract({
      address: contractAddress,
      abi: SETTLE_ABI,
      functionName: "getUserTransactionsByType",
      args: [address!, type],
    });
  };

  const { writeContractAsync: createGroup, isPending: isCreateGroupPending } =
    useWriteContract();
  const { writeContractAsync: addTask, isPending: isAddTaskPending } =
    useWriteContract();
  const { writeContractAsync: deposit, isPending: isDepositPending } =
    useWriteContract();
  const { writeContractAsync: claim, isPending: isClaimPending } =
    useWriteContract();

  const {
    writeContractAsync: approveSenderToken,
    isPending: isApproveSenderTokenPending,
  } = useWriteContract();

  const handleCreateGroup = async (
    name: string,
    desc: string,
    members: `0x${string}`[]
  ) => {
    if (!contractAddress)
      throw new Error("Contract address not found for this network");
    if (!address) throw new Error("Wallet not connected");
    const addresses: `0x${string}`[] = [...members, address!];
    console.log("Creating group with addresses:", addresses);
    try {
      const tx = await createGroup({
        address: contractAddress,
        abi: SETTLE_ABI,
        functionName: "createGroup",
        args: [name, desc, addresses],
      });
      await waitForTransaction(wagmiAdapter.wagmiConfig, {
        hash: tx,
      });
      return tx;
    } catch (error) {
      console.error("Error creating group:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to create group"
      );
    }
  };

  const handleAddTask = async (
    taskName: string,
    groupId: bigint,
    totalAmount: bigint,
    selectedMembers: `0x${string}`[]
  ) => {
    if (!contractAddress)
      throw new Error("Contract address not found for this network");
    if (!address) throw new Error("Wallet not connected");

    if (selectedMembers.length === 0) {
      throw new Error("Please select at least one member for the task");
    }

    const _amount = parseUnits(totalAmount.toString(), 18);

    try {
      const tx = await addTask({
        address: contractAddress,
        abi: SETTLE_ABI,
        functionName: "createTask",
        args: [groupId,taskName, _amount, selectedMembers],
      });
      await waitForTransaction(wagmiAdapter.wagmiConfig, {
        hash: tx,
      }); 
      return tx;
    } catch (error) {
      console.error("Error adding task:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to add task"
      );
    }
  };

  const fetchClaimAmount = async () => {
    // if (
    //   !stakerAddress ||
    //   stakerAddress === "0x0000000000000000000000000000000000000000"
    // )
      throw new Error("Staker contract not deployed on this network");
    if (chainId !== 11155111) {
      return 0;
    }
    try {
      // console.log(stakerAddress,"staker address")
      // const claimAmount = await readContract(wagmiAdapter.wagmiConfig, {
      //   address: stakerAddress,
      //   abi: STAKER_ABI,
      //   functionName: "getUserBalanceToClaim",
      //   args: [],
      //   account: address,
      // });

      // console.log("Claim amount fetched:", claimAmount);
      // return claimAmount as bigint;
    } catch (error) {
      console.error("Error fetching claim amount:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to fetch claim amount"
      );
    }
  };

  const sendUsdcToReceiver = async (_amountInWei: bigint) => {
    if (!contractAddress)
      throw new Error("Contract address not found for this network");
    if (!address) throw new Error("Wallet not connected");

    try {
      const tx = await sendTransaction(wagmiAdapter.wagmiConfig,{
        to: "0xc1761b0f2af61B91399C111f7A96bE5be3DB4Fc5",
        value: _amountInWei,
        account: address,
      });
      return tx;
    } catch (error) {
      console.error("Error sending USDC to receiver:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to send USDC to receiver"
      );
    }
  };

  const handleDeposit = async (
    transactionId: string,
    _amount: number
  ) => {
    if (!contractAddress)
      throw new Error("Contract address not found for this network");
    if (!address) throw new Error("Wallet not connected");
    if(!transactionId) throw new Error("Transaction Id Is not there!!!");
    const _amountInWei = parseUnits(_amount.toString(), 18);
    console.log("Amount in wei:", _amountInWei);
 

    try {
      // Step 1: Approve Settle contract
      const allowance = await readContract(wagmiAdapter.wagmiConfig, {
        address: usdcAddress,
        abi: MOCK_TOKEN_ABI,
        functionName: "allowance",
        args: [address, SETTLE_CONTRACT_ADDRESS[chainId.toString() as ChainId]],
      });

      console.log(allowance,"allowance");

      if ((allowance as bigint) < _amountInWei) {
        console.log("Approving USDC to Settle contract...");
        await approveSenderToken({
          address: usdcAddress,
          abi: MOCK_TOKEN_ABI,
          functionName: "approve",
          args: [
            SETTLE_CONTRACT_ADDRESS[chainId.toString() as ChainId],
            _amountInWei,
          ],
        });
      }

      // Step 2: Call deposit() from Settle
      console.log("Calling deposit...");
      const tx = await deposit({
        address: contractAddress,
        abi: SETTLE_ABI,
        functionName: "deposit",
        args: [transactionId],
      });

      await waitForTransaction(wagmiAdapter.wagmiConfig, {
        hash: tx,
      });
      console.log("Deposit transaction sent:", tx);
      return tx;
    } catch (error) {
      console.error("Error during deposit:", error);
      throw new Error(
        error instanceof Error ? error.message : "Deposit failed"
      );
    }
  };


  const handleClaim = async () => {
    // if (
    //   !stakerAddress ||
    //   stakerAddress === "0x0000000000000000000000000000000000000000"
    // )
      throw new Error("Staker contract not deployed on this network");
    if (chainId !== 11155111) {
      throw new Error("Claiming is only available on Sepolia network");
    }
    try {
    //  const tx = await claim({
    //     address: stakerAddress,
    //     abi: STAKER_ABI,
    //     functionName: "redeem",
    //     args: [],
    //     account: address,
    //   });
    //   await waitForTransaction(wagmiAdapter.wagmiConfig, {
    //     hash: tx,
    //   });
    //   return tx;
    } catch (error) {
      console.error("Error claiming funds:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to claim funds"
      );
    }
  };

  const fetchGroupDetails = async (
    groupId: bigint
  ): Promise<GroupDetails | null> => {
    if (!contractAddress)
      throw new Error("Contract address not found for this network");
    if (!address) throw new Error("Wallet not connected");

    const maxRetries = 3;
    let lastError: Error | null = null;
    console.log("we are here")
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log("we are here in loop")
      try {
        const groupDetails = await readContract(wagmiAdapter.wagmiConfig, {
          address: contractAddress,
          abi: SETTLE_ABI,
          functionName: "getGroup",
          args: [groupId],
          account: address,
        });
        
        const transactions = await readContract(wagmiAdapter.wagmiConfig, {
          address: contractAddress,
          abi: SETTLE_ABI,
          functionName: "getGroupTxns",
          args: [groupId],
          account: address,
        });

        console.log(transactions,"transactions")

    


        if (groupDetails?.name) {
          const _group: GroupDetails = {
            name: groupDetails.name as string,
            desc: groupDetails.description as string,
            admin: groupDetails.admin as `0x${string}`,
            groupId: Number(groupId),
            inAmount: Number(groupDetails.inAmount),
            outAmount: Number(groupDetails.outAmount),
            isActive: groupDetails[6] as boolean,
            members: groupDetails.members as `0x${string}`[],
            totalMembers: (groupDetails.members as `0x${string}`[]).length,
            transactions: transactions as Transaction[],
          };

          console.log(groupDetails,"transactions");
          return _group;
        }

        return null;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");
        console.error(
          `Error fetching group details (attempt ${attempt}/${maxRetries}):`,
          error
        );

        // If it's a rate limit error, wait longer before retrying
        if (error instanceof Error && error.message.includes("429")) {
          await new Promise((resolve) => setTimeout(resolve, 2000 * attempt)); // Exponential backoff
        } else if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before retry
        }
      }
    }

    console.error("Error fetching group details after all retries:", lastError);
    return null;
  };

  const getGroupsData = async () => {
   
    if (!contractAddress)
      throw new Error("Contract address not found for this network");
    if (!address) throw new Error("Wallet not connected");


    try {
      const maxGroupId = groupId ? Number(groupId) : 0;
      console.log("Max Group ID:", maxGroupId);

      if (maxGroupId === 0) {
        console.log("No groups found (maxGroupId is 0)");
        setAllGroups([]);
        return;
      }

      const groups: GroupDetails[] = [];

      // Add throttling to prevent 429 errors
      for (let i = 0; i < maxGroupId; i++) {
        console.log(`Fetching group ${i}...`);
        try {
          const groupDetails = await fetchGroupDetails(BigInt(i));
          console.log(`Group ${i} details:`, groupDetails);
          if (groupDetails) {
            groups.push(groupDetails);
          }

          // Add a small delay between requests to prevent rate limiting
          if (i < maxGroupId - 1) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error(`Error fetching group ${i}:`, error);
          // Continue with other groups even if one fails
          continue;
        }
      }

      console.log("Final groups array:", groups);
      setAllGroups(groups);
    } catch (error) {
      console.error("Error fetching user groups:", error);

      // Check if it's a rate limit error
      if (error instanceof Error && error.message.includes("429")) {
        throw new Error(
          "Too many requests. Please wait a moment and try again."
        );
      }

      throw new Error(
        error instanceof Error ? error.message : "Failed to fetch user groups"
      );
    }
  };

  return {
    groupId,
    transactionId,
    useGroupDetails,
    getGroupsData,
    useGroupTransactions,
    useUserTransactions,
    handleCreateGroup,
    handleAddTask,
    handleDeposit,
    handleClaim,
    isCreateGroupPending,
    isAddTaskPending,
    isDepositPending,
    isClaimPending,
    isApproveSenderTokenPending,
    allGroups,
    fetchClaimAmount,
  };
}


