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
            && option != Symbol::new(&env, "Blockchain")
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

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, symbol_short, Env};

    #[test]
    fn records_votes_per_option() {
        let env = Env::default();
        let contract_id = env.register(PollContract, ());
        let client = PollContractClient::new(&env, &contract_id);
        let voter = Address::generate(&env);

        env.mock_all_auths();
        client.vote(&voter, &symbol_short!("AI"));
        client.vote(&voter, &symbol_short!("AI"));

        assert_eq!(client.get_votes(&symbol_short!("AI")), 2);
    }

    #[test]
    #[should_panic(expected = "invalid poll option")]
    fn rejects_unknown_options() {
        let env = Env::default();
        let contract_id = env.register(PollContract, ());
        let client = PollContractClient::new(&env, &contract_id);
        let voter = Address::generate(&env);

        env.mock_all_auths();
        client.vote(&voter, &symbol_short!("Rust"));
    }
}
