require("dotenv").config();
const {
  map,
  flow,
  filter,
  zipObject,
  keyBy,
  slice,
  set,
  zip,
  fromPairs,
  reduce,
  mapValues,
  toPairs,
  update,
  sortBy,
  sumBy
} = require("lodash/fp");
const ccxt = require("ccxt");
const big = require("big.js");

const bigSum = reduce((a, b) => a.add(b), big(0));

const bigSumBy = key =>
  flow(
    map(key),
    bigSum
  );

const keyByTimestamp = flow(
  map(zipObject(["timestamp", "open", "high", "low", "close", "volume"])),
  map(obj => set("mid", (obj.high + obj.low) / 2, obj)),
  keyBy("timestamp")
);

const applyUsdPrices = usdTickers =>
  map(obj =>
    flow(
      set(
        "usdVolume",
        big(usdTickers[obj.timestamp].mid)
          .times(obj.volume)
          .times(obj.mid)
      ),
      set("usdMid", big(usdTickers[obj.timestamp].mid).times(obj.mid)),
      set("btcVolume", big(obj.mid).times(obj.volume))
    )(obj)
  );

const oneWeekAgo = new Date();
oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

console.log(oneWeekAgo.getTime());

const run = async () => {
  const binance = new ccxt.binance();
  const coinbase = new ccxt.coinbasepro();

  const markets = await binance.fetchMarkets();
  const btcMarkets = flow(
    filter({ quote: "BTC" }),
    // filter({ symbol: "POE/BTC" }),
    map("symbol")
  )(markets);
  console.log(btcMarkets);

  const btcusd = await coinbase.fetchOHLCV(
    "BTC/USD",
    "1h",
    oneWeekAgo.getTime()
  );
  // console.log(btcusd);

  const btcByTimestamp = keyByTimestamp(btcusd);

  // console.log(btcByTimestamp);

  const allMarketValues = await Promise.all(
    map(
      symbol => binance.fetchOHLCV(symbol, "1h", oneWeekAgo.getTime()),
      btcMarkets
    )
  );

  const allOHLCVs = flow(
    map(keyByTimestamp),
    map(applyUsdPrices(btcByTimestamp)),
    zip(btcMarkets),
    fromPairs
  )(allMarketValues);

  const usdVolume = flow(
    mapValues(bigSumBy("usdVolume")),
    toPairs,
    map(([symbol, value]) => ({ symbol, value: value })),
    arr => arr.sort((a, b) => b.value.minus(a.value)),
    map(update("value", v => v.toFixed(0)))
  )(allOHLCVs);
  console.log(usdVolume);

  const btcVolume = flow(
    mapValues(bigSumBy("btcVolume")),
    toPairs,
    map(([symbol, value]) => ({ symbol, value: value })),
    arr => arr.sort((a, b) => b.value.minus(a.value)),
    map(update("value", v => v.toFixed(0)))
  )(allOHLCVs);
  console.log(btcVolume);
};

run();
