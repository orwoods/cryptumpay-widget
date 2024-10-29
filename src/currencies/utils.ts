export const getCurrencyHash = ({ id, network, ticker, chain, contract }: {
  id: string;
  network: string;
  ticker: string;
  chain: string;
  contract: string;
}): string => {
  const arr = [id, network, ticker, chain, contract];
  if (!arr.every((part) => part.length > 0)) {
    throw new Error('Malformed currency');
  }

  const str = arr.join(':');
  const hash = Buffer.from(str).toString('hex').substring(0, 40 - 1 - str.length);

  return hash;
};

export const checkCurrency = (currency: string) => {
  if (!currency || typeof currency !== 'string') {
    throw new Error('Invalid currency');
  }

  const parts = currency.split(':');
  if (parts.length !== 6 || currency.length !== 40) {
    throw new Error('Wrong format of the currency');
  }

  const [id, network, ticker, chain, contract, hash] = parts;

  const currencyHash = getCurrencyHash({ id, network, ticker, chain, contract });

  if (currencyHash !== hash) {
    throw new Error('Wrong currency hash');
  }
};
