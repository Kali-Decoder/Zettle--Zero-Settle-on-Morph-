// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SplitPayment is Ownable {
    IERC20 public immutable token;
    uint256 public groupCounter;
    uint256 public txCounter;

    enum TxType { DEPOSIT, CLAIM }
    enum TxStatus { PENDING, COMPLETED }

    struct Group {
        string name;
        string description;
        address admin;
        address[] members;
        uint256 inAmount;
        uint256 outAmount;
        bool isActive;
    }

    struct Transaction {
        uint256 id;
        TxType txType;
        TxStatus status;
        string task;
        uint256 groupId;
        uint256 amount;
        address payer;
        address receiver;
    }

    mapping(uint256 => Group) public groups;
    mapping(uint256 => Transaction[]) public groupTransactions;
    mapping(address => Transaction[]) public userTransactions;
    mapping(uint256 => Transaction) public allTransactions;

    event GroupCreated(uint256 indexed groupId, address indexed admin);
    event TaskCreated(uint256 indexed groupId, string task);
    event DepositMade(uint256 indexed txId, address from);
    event ClaimMade(uint256 indexed txId, address to);
    event GroupResolved(uint256 indexed groupId);

    constructor(address _token) Ownable(msg.sender) {
        token = IERC20(_token);
    }

    function createGroup(string calldata name, string calldata desc, address[] calldata members) external {
        require(members.length >= 2, "At least 2 members required");

        Group storage group = groups[groupCounter];
        group.name = name;
        group.description = desc;
        group.admin = msg.sender;
        group.members = members;
        group.isActive = true;

        emit GroupCreated(groupCounter, msg.sender);
        groupCounter++;
    }

    function isMember(uint256 groupId, address user) internal view returns (bool) {
        address[] storage members = groups[groupId].members;
        for (uint i = 0; i < members.length; i++) {
            if (members[i] == user) return true;
        }
        return false;
    }

    function createTask(
        uint256 groupId,
        string calldata task,
        uint256 totalAmount,
        address[] calldata participants
    ) external {
        Group storage group = groups[groupId];
        require(group.isActive, "Inactive group");
        require(isMember(groupId, msg.sender), "Not a group member");
        require(participants.length > 0, "No participants");

        uint256 split = totalAmount / (participants.length + 1);
        uint256 totalCollected = 0;

        for (uint i = 0; i < participants.length; i++) {
            require(participants[i] != msg.sender, "Cannot charge self");
            require(isMember(groupId, participants[i]), "Invalid participant");

            Transaction memory txDeposit = Transaction({
                id: txCounter,
                txType: TxType.DEPOSIT,
                status: TxStatus.PENDING,
                task: task,
                groupId: groupId,
                amount: split,
                payer: participants[i],
                receiver: msg.sender
            });

            _recordTransaction(txDeposit);
            totalCollected += split;
        }

        Transaction memory txClaim = Transaction({
            id: txCounter,
            txType: TxType.CLAIM,
            status: TxStatus.PENDING,
            task: task,
            groupId: groupId,
            amount: totalCollected,
            payer: msg.sender,
            receiver: msg.sender
        });

        _recordTransaction(txClaim);

        emit TaskCreated(groupId, task);
    }

    function _recordTransaction(Transaction memory txData) internal {
        allTransactions[txCounter] = txData;
        groupTransactions[txData.groupId].push(txData);
        userTransactions[txData.payer].push(txData);
        if (txData.receiver != txData.payer) {
            userTransactions[txData.receiver].push(txData);
        }
        txCounter++;
    }

    function deposit(uint256 txId) external {
        Transaction storage txn = allTransactions[txId];
        require(txn.txType == TxType.DEPOSIT, "Invalid tx type");
        require(txn.status == TxStatus.PENDING, "Already completed");
        require(txn.payer == msg.sender, "Not payer");

        token.transferFrom(msg.sender, address(this), txn.amount);
        txn.status = TxStatus.COMPLETED;

        groups[txn.groupId].inAmount += txn.amount;
        emit DepositMade(txId, msg.sender);

        _tryResolve(txn.groupId);
    }

    function claim(uint256 txId) external  {
        Transaction storage txn = allTransactions[txId];
        require(txn.txType == TxType.CLAIM, "Invalid tx type");
        require(txn.status == TxStatus.PENDING, "Already claimed");
        require(txn.receiver == msg.sender, "Not receiver");

        Transaction[] storage txns = groupTransactions[txn.groupId];
        for (uint i = 0; i < txns.length; i++) {
            if (
                txns[i].txType == TxType.DEPOSIT &&
                txns[i].receiver == msg.sender &&
                allTransactions[txns[i].id].status != TxStatus.COMPLETED
            ) {
                revert("Pending deposits exist");
            }
        }

        txn.status = TxStatus.COMPLETED;
        token.transfer(msg.sender, txn.amount);
        groups[txn.groupId].outAmount += txn.amount;

        emit ClaimMade(txId, msg.sender);
    }

    function _tryResolve(uint256 groupId) internal {
        Group storage group = groups[groupId];
        if (!group.isActive) return;

        Transaction[] storage txns = groupTransactions[groupId];
        for (uint i = 0; i < txns.length; i++) {
            if (txns[i].txType == TxType.DEPOSIT && allTransactions[txns[i].id].status != TxStatus.COMPLETED) {
                return;
            }
        }

        group.isActive = false;
        emit GroupResolved(groupId);
    }

    function getGroup(uint256 groupId) external view returns (Group memory) {
        return groups[groupId];
    }

    function getGroupTxns(uint256 groupId) external view returns (Transaction[] memory) {
        return groupTransactions[groupId];
    }

    function getUserTxns(address user, TxType txType) external view returns (Transaction[] memory) {
        Transaction[] memory all = userTransactions[user];
        uint count = 0;

        for (uint i = 0; i < all.length; i++) {
            if (all[i].txType == txType) count++;
        }

        Transaction[] memory result = new Transaction[](count);
        uint idx = 0;
        for (uint i = 0; i < all.length; i++) {
            if (all[i].txType == txType) result[idx++] = all[i];
        }

        return result;
    }
}
// ["0x5B38Da6a701c568545dCfcB03FcB875f56beddC4","0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2","0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db","0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB"]
