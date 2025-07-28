# Zettle-Zero-Settle-

Zettle is a zero-settlement expense-splitting app built on the Morph network think Splitwise, but fully on-chain. Easily create groups using your Farcaster/Twitter following list, add shared expenses in just a few clicks, and settle balances instantly, all without leaving the Morph ecosystem.

No bridging, no off-chain tracking Zettle brings seamless, trustless expense management to Morph.

![zettle](https://github.com/user-attachments/assets/c199a90b-c92e-4b3f-bdd1-9503c518ffde)

**1. Create Group**

- User connects wallet.
- Select or import friends via Farcaster followers.
- Group created with members’ wallet addresses + names.

**2. Add Expense**

- User inputs:
- Expense name (e.g., “Dinner @ Goa”)
- Total amount
- Select members to split with
- Network to initiate payment (e.g., Avalanche)
- The app automatically:
- Splits the amount
- Assigns equal (or custom) debt shares to members
- Creates DEPOSIT transactions for each member
- Creates a CLAIM transaction for the payer

**3. Payback Flow**

- Each debtor sees pending transactions in their UI.
- They can pay back from any chain (e.g., from Sepolia even if the debt was on Avalanche).
- Using CCIP, funds are bridged and payment confirmed.

**4. Debt Resolution & Claim**

- Once all DEPOSIT transactions are marked completed:
- The creator (payer) can claim the amount on their preferred chain
- Zettle settles debts on-chain and updates group stats
