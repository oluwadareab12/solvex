const SELLER = "0xB4D0D085563695872a5DC2f7d2dC0DC9daf1C199" as const;

export async function buyHintOnChain(
  cellIdx: number,
  bountyId: string,
  sendTransactionAsync: Function,
  waitForTransactionReceipt: Function
): Promise<{ value: number }> {
  const hash = await sendTransactionAsync({ to: SELLER, value: 1000n });
  await waitForTransactionReceipt({ hash });

  const url = `${window.location.origin}/api/hint/${bountyId}/${cellIdx}?txHash=${hash}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Hint fetch failed");
  }
  return res.json();
}
