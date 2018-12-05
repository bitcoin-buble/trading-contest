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
  last,
  slice,
  mapValues,
  getOr,
  size,
  reject,
  pick,
  values
} = require("lodash/fp");
const ccxt = require("ccxt");
const big = require("big.js");
const { RSI } = require("technicalindicators");
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
        // console.log(usdTickers[obj.timestamp], obj) ||
        big(getOr(0, `${obj.timestamp}.mid`, usdTickers))
          .times(obj.volume)
          .times(obj.mid)
      ),
      set(
        "usdMid",
        big(getOr(0, `${obj.timestamp}.mid`, usdTickers)).times(obj.mid)
      ),
      set("btcVolume", big(obj.mid).times(obj.volume))
    )(obj)
  );

const timeSince = new Date();
timeSince.setDate(timeSince.getDate() - 30);

// console.log(timeSince.getTime());

exports.run = async () => {
  const binance = new ccxt.binance();
  const coinbase = new ccxt.coinbasepro();

  const markets = await binance.fetchMarkets();
  const btcMarkets = flow(
    filter({ quote: "BTC" }),
    // reject({ symbol: "BCH/BTC" }), // showing no values in binance
    // reject({ symbol: "HSR/BTC" }), // showing no values in binance
    map("symbol")
    // slice(0, 5)
  )(markets);
  // console.log(btcMarkets);

  const btcusd = await coinbase.fetchOHLCV(
    "BTC/USD",
    "1d",
    timeSince.getTime()
  );
  // console.log(slice(0, 2, btcusd));

  const btcByTimestamp = keyByTimestamp(btcusd);

  console.log("Parsing market data. ");
  console.log(
    flow(
      values,
      first
    )(btcByTimestamp)
  );

  const allMarketValues = await Promise.all(
    map(
      symbol => binance.fetchOHLCV(symbol, "1d", timeSince.getTime()),
      btcMarkets
    )
  );

  const allOHLCVs = flow(
    map(keyByTimestamp),
    map(applyUsdPrices(btcByTimestamp)),
    zip(btcMarkets),
    reject(([ticker, values]) => size(values) !== 30),
    map(zipObject(["symbol", "values"]))
  )(allMarketValues);

  // console.log(allOHLCVs);

  // const withRsi = mapValues(
  //   ohlcv => RSI.calculate({ values: map("usdMid", ohlcv), period: 14 }),
  //   allOHLCVs
  // );
  const withRsi = map(
    obj =>
      set(
        "rsi",
        RSI.calculate({ values: map("usdMid", obj.values), period: 14 }),
        obj
      ),
    allOHLCVs
  );

  // console.log(withRsi);
  // console.log(tickersWithPercentChange);
  console.log("Extracting the winner. ");
  const thePick = flow(
    map(obj => set("lastRsi", last(obj.rsi), obj)),
    orderBy(["lastRsi"], ["desc"]),
    first,
    pick(["lastRsi", "symbol"])
  )(withRsi);

  // console.log(thePick);

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
  const returnValue = { coin, phoneticCoin, lastRsi: thePick.lastRsi };
  // console.log(returnValue);
  return returnValue;
};

// exports.run();
