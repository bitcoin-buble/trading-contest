require("dotenv").config();
const {
  map,
  flow,
  filter,
  zipObject,
  keyBy,
  set,
  zip,
  fromPairs,
  toPairs,
  update,
  split,
  get,
  orderBy,
  compact,
  first,
  join,
  last
} = require("lodash/fp");
const ccxt = require("ccxt");
const big = require("big.js");
const { getPhonetic } = require("./phonetic");

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

// console.log(oneWeekAgo.getTime());

exports.run = async () => {
  const binance = new ccxt.binance();
  const coinbase = new ccxt.coinbasepro();

  const markets = await binance.fetchMarkets();
  const btcMarkets = flow(
    filter({ quote: "BTC" }),
    // reject({ symbol: "BCH/BTC" }), // showing no values in binance
    // reject({ symbol: "HSR/BTC" }), // showing no values in binance
    map("symbol")
    // slice(0, 3)
  )(markets);
  // console.log(btcMarkets);

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

  console.log("Parsing market data. ");
  const allOHLCVs = flow(
    map(keyByTimestamp),
    map(applyUsdPrices(btcByTimestamp)),
    zip(btcMarkets),
    fromPairs
  )(allMarketValues);

  const calculatePercentageChange = obj =>
    set(
      "percentChange",
      Number(
        obj.end
          .minus(obj.start)
          .div(obj.end)
          .times(100)
          .toFixed(5)
      ),
      obj
    );

  const extractStartAndEnd = ([symbol, values]) => {
    if (values.length === 0) {
      return;
    }

    return {
      start: first(values).usdMid,
      end: last(values).usdMid,
      symbol
    };
  };

  const tickersWithPercentChange = flow(
    toPairs,
    map(extractStartAndEnd),
    compact,
    map(calculatePercentageChange),
    map(update("start", val => val.toFixed(4))),
    map(update("end", val => val.toFixed(4))),
    orderBy(["percentChange"], ["asc"])
  )(allOHLCVs);

  // console.log(tickersWithPercentChange);
  console.log("Extracting the winner. ");
  const thePick = first(tickersWithPercentChange);

  const coin = flow(
    get("symbol"),
    split("/"),
    first
  )(thePick);

  // console.log(coin);
  const phoneticCoin = flow(
    split(""),
    map(getPhonetic),
    join(" ")
  )(coin);

  // console.log(phoneticCoin);

  return { coin, phoneticCoin, drop: thePick.percentChange };
};
