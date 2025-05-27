# MindAgent MCP

A Model Context Protocol (MCP) server that allows large language models (LLMs) to interact with the Mind Agent through MetaMask.

With these tools, your private keys remain securely stored in your crypto wallet and are never shared with the AI agent when signing messages or sending transactions.

## Requirements

- Node.js (v20 or higher)
- pnpm

## Setup

### NPX

```
{
  "mcpServers": {
    "mind-agent-mcp-server": {
      "command": "npx",
      "args": ["-y", "mind-agent-mcp-server"]
    }
  }
}
```

## Tools

`connectWallet`
Connect to MetaMask for interacting with Mind Network.

`disconnectWallet`
Disconnect the currently connected wallet.

`getAccountInfo`
Get address and chain ID of connected wallet. Valid chains: Mind Network Mainnet(228), BNB Smart Chain(56), Mind Network Testnet(192940).

`switchChain`
Switch to a supported chain before other actions.

`getClaimableReward`
Fetch FHE rewards that can be claimed by an address.

`claimReward`
Claim earned FHE rewards from hub training.

`getAgentId`
Retrieve the agent NFT ID for a given wallet.

`getFheBalance`
Get available FHE token balance for a wallet.

`listHubs`
List available hubs for Agent training.

`getStakeAmount`
Get total staked FHE for a wallet’s Agent.

`stakeFHE`
Stake FHE to create or fund an Agent.

`unstakeFHE`
Unstake part of FHE from the Agent.

`getCurrentHub`
Get the hub where the Agent is currently training.

`exitHub`
Stop training in the current hub.

`trainInHub`
Start training in a selected hub (if idle).

`switchHub`
Exit current hub and start training in another.

## License

MIT License
