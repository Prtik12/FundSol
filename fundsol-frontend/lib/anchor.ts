import { Program, AnchorProvider, Idl, setProvider } from "@coral-xyz/anchor";
import { Connection, PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { FUNDSOL_IDL, type FundSolProgram } from "./idl";

export const PROGRAM_ID = new PublicKey("H3f8YJFN4zFEVsGdb4gnkYnnyKjLcu2HrHxtimcVDDfH");

export const NETWORK = "https://api-devnet.solana.com/";

export interface Wallet {
  publicKey: PublicKey;
  signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T>;
  signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]>;
}

export function getProgram(provider: AnchorProvider): Program<FundSolProgram> {
  return new Program(
    FUNDSOL_IDL as unknown as Idl,
    provider
  ) as Program<FundSolProgram>;
}

export function getFundraiserPDA(userPubkey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("fundraiser"), userPubkey.toBuffer()],
    PROGRAM_ID
  );
}

export async function getProvider(wallet: Wallet): Promise<AnchorProvider> {
  const connection = new Connection(NETWORK, "processed");
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "processed",
  });
  setProvider(provider);
  return provider;
}
