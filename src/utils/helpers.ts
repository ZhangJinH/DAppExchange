export const ETHER_ADDRESS = '0x0000000000000000000000000000000000000000'

export const DECIMALS = 10 ** 18

export const ether = (wei: number) => wei / DECIMALS

export const tokens = ether

export const formatBalance = (balance: number) => {
  const precision = 100
  balance = ether(balance)
  balance = Math.round(balance * precision) / precision
  return balance
}
