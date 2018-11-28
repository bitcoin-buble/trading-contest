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
  sumBy,
  zipWith,
  merge,
  orderBy,
  first,
  last
} = require("lodash/fp");
const ccxt = require("ccxt");
const big = require("big.js");

const bigSum = reduce((a, b) => a.add(b), big(0));

const bigMin = reduce((a, b) => (a.lte(b) ? a : b), big(999999999999999));
const bigMax = reduce((a, b) => (a.gte(b) ? a : b), big(0));

const bigMaxBy = key =>
  flow(
    map(key),
    bigMax
  );

const bigMinBy = key =>
  flow(
    map(key),
    bigMin
  );

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
    // slice(0, 3)
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

  // const minimums = flow(
  //   mapValues(first),
  //   toPairs
  //   // map(([symbol, value]) => ({ symbol, min: value })),
  //   // orderBy(["symbol"], ["asc"])
  //   // arr => arr.sort((a, b) => b.value.minus(a.value)),
  //   // map(update("value", v => v.toFixed(8)))
  // )(allOHLCVs);

  // console.log(minimums);

  // const maximums = flow(
  //   mapValues(last),
  //   toPairs
  //   // map(([symbol, value]) => ({ symbol, max: value })),
  //   // orderBy(["symbol"], ["asc"])
  //   // arr => arr.sort((a, b) => b.value.minus(a.value)),
  //   // map(update("value", v => v.toFixed(8)))
  // )(allOHLCVs);

  // console.log(maximums);

  // const minAndMaxes = zipWith(merge, maximums, minimums);

  // console.log(minAndMaxes);
  console.log(allOHLCVs);
  const calculatePercentageChange = obj =>
    set(
      "percentChange",
      obj.end
        .minus(obj.start)
        .div(obj.end)
        .times(100)
        .toFixed(5),
      obj
    );

  const extractStartAndEnd = arr => {
    return {
      start: first(arr).usdMid,
      end: last(arr).usdMid
    };
  };

  const withChange = flow(
    mapValues(extractStartAndEnd),
    toPairs,
    map(([symbol, obj]) => set("symbol", symbol, obj)),
    map(calculatePercentageChange),
    map(update("start", val => val.toFixed(4))),
    map(update("end", val => val.toFixed(4)))
  )(allOHLCVs);

  console.log(withChange);
  // const usdVolume = flow(
  //   mapValues(bigSumBy("usdVolume")),
  //   toPairs,
  //   map(([symbol, value]) => ({ symbol, value: value })),
  //   arr => arr.sort((a, b) => b.value.minus(a.value)),
  //   map(update("value", v => v.toFixed(0)))
  // )(allOHLCVs);
  // console.log(usdVolume);

  // const btcVolume = flow(
  //   mapValues(bigSumBy("btcVolume")),
  //   toPairs,
  //   map(([symbol, value]) => ({ symbol, value: value })),
  //   arr => arr.sort((a, b) => b.value.minus(a.value)),
  //   map(update("value", v => v.toFixed(0)))
  // )(allOHLCVs);
  // console.log(btcVolume);
};

run();
