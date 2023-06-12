import { Elusiv, TokenType, TopupTxData } from "@elusiv/sdk";
import {
  Cluster,
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { NextResponse } from "next/server";
import bs58 from "bs58";
import base58 from "bs58";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cluster = searchParams.get("cluster") || "devnet";
  const seed = searchParams.get("seed");
  const token = searchParams.get("token");
  const amount = parseFloat(searchParams.get("amount") || "0.0");

  const connection = new Connection(clusterApiUrl(cluster));
  const userPublicKey = searchParams.get("userPublicKey");
  const elusiv = await Elusiv.getElusivInstance(
    bs58.decode(seed!),
    new PublicKey(userPublicKey!),
    connection,
    cluster as Cluster
  );

  const topupTxData = await elusiv.buildTopUpTx(
     amount,
    token as TokenType
  );

  const transaction = topupTxData.tx;
  const serializedTransaction = transaction.serialize({
    verifySignatures: false,
    requireAllSignatures: false,
  });
  const base64Transaction = serializedTransaction.toString("base64");

  return NextResponse.json({
    transaction: base64Transaction,
    topupTxData: {
      ...topupTxData,
      commitmentHash: base58.encode(topupTxData.commitmentHash),
    },
  });
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const { topupTxData, signedTransaction } = await request.json();
  const cluster = searchParams.get("cluster") || "devnet";
  const seed = searchParams.get("seed");
  const connection = new Connection(clusterApiUrl(cluster));
  const userPublicKey = searchParams.get("userPublicKey");
  const transactionEncodedStr = signedTransaction;
  const elusiv = await Elusiv.getElusivInstance(
    bs58.decode(seed!),
    new PublicKey(userPublicKey!),
    connection,
    cluster as Cluster
  );
  console.log(topupTxData);
  const transactionDecoded = new Buffer(transactionEncodedStr!, "base64");
  const transaction = Transaction.from(transactionDecoded);
  const topup = new TopupTxData(
    topupTxData.fee,
    topupTxData.tokenType,
    topupTxData.lastNonce,
    bs58.decode(topupTxData.commitmentHash),
    topupTxData.merkleStartIndex,
    topupTxData.wardenInfo,
    transaction,
    topupTxData.hashAccIndex,
    topupTxData.merge
  );
  const signature = await elusiv.sendElusivTx(topup);
  return NextResponse.json({ signature: signature });
}
