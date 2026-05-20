export function createWagmiAdapter(
  address: string,
  sendTransactionAsync: (tx: {
    to: `0x${string}`;
    data?: `0x${string}`;
    value?: bigint;
  }) => Promise<`0x${string}`>,
  waitForTransactionReceipt: (args: { hash: `0x${string}` }) => Promise<unknown>
) {
  return {
    prepare: async (tx: { to: string; data?: string; value?: bigint }) => {
      const hash = await sendTransactionAsync({
        to: tx.to as `0x${string}`,
        data: tx.data as `0x${string}` | undefined,
        value: tx.value,
      });
      return { hash };
    },
    prepareAction: async (tx: any) => {
      console.log("prepareAction called with:", JSON.stringify(tx, null, 2));
      const hash = await sendTransactionAsync({
        to: tx.to as `0x${string}`,
        data: tx.data as `0x${string}` | undefined,
        value: tx.value,
      });
      return { hash };
    },
    waitForTransaction: async ({ hash }: { hash: string }) => {
      return waitForTransactionReceipt({ hash: hash as `0x${string}` });
    },
    getAddress: () => address,
    validateChainSupport: async (chain: unknown) => {
      return true;
    },
  };
}
