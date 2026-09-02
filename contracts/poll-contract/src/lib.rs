#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Votes(Symbol),
}

#[contract]
pub struct PollContract;

#[contractimpl]
impl PollContract {
    pub fn vote(env: Env, voter: Address, option: Symbol) {
        voter.require_auth();
        if option != symbol_short!("C")
            && option != symbol_short!("Java")
            && option != symbol_short!("AI")
            && option != symbol_short!("Chain")
        {
            panic!("invalid poll option");
        }

        let key = DataKey::Votes(option.clone());
        let count: u32 = env.storage().persistent().get(&key).unwrap_or(0);
        env.storage().persistent().set(&key, &(count + 1));
        env.events().publish((symbol_short!("vote"), option), voter);
    }

    pub fn get_votes(env: Env, option: Symbol) -> u32 {
        env.storage().persistent().get(&DataKey::Votes(option)).unwrap_or(0)
    }
}
