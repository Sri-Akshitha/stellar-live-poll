# Soroban Poll Contract

The frontend expects a Soroban contract deployed on Stellar testnet with this callable interface:

```text
vote(symbol option)
```

The contract accepts the authenticated voter address and option, validates the option, increments its counter, and publishes a `vote` event containing the option and voter address. Set the deployed address in `VITE_POLL_CONTRACT_ID` before using the real transaction path.
