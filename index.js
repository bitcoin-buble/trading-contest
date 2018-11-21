require("dotenv").config();
const {
  map,
  flow,
  filter,
  zipObject,
  keyBy,
  slice,
  set,
  mapValues,
  zip,
  fromPairs
} = require("lodash/fp");
const ccxt = require("ccxt");

const keyByTimestamp = flow(
  map(zipObject(["timestamp", "open", "high", "low", "close", "volume"])),
  map(obj => set("mid", (obj.high + obj.low) / 2, obj)),
  keyBy("timestamp")
);

const applyUsdPrices = usdTickers =>
  map(obj =>
    flow(
      set("usdVolume", usdTickers[obj.timestamp].mid * obj.volume),
      set("usdMid", usdTickers[obj.timestamp].mid * obj.mid)
    )(obj)
  );

const run = async () => {
  const exchange = new ccxt.binance();

  const markets = await exchange.fetchMarkets();
  const btcMarkets = flow(
    filter({ quote: "BTC" }),
    map("symbol"),
    slice(0, 3)
  )(markets);
  console.log(btcMarkets);

  const btcusd = await exchange.fetchOHLCV("BTC/USDT", "1h");
  console.log(btcusd);

  const btcByTimestamp = keyByTimestamp(btcusd);

  console.log(btcByTimestamp);

  const allMarketValues = await Promise.all(
    map(symbol => exchange.fetchOHLCV(symbol, "1h", 1542797805000), btcMarkets)
  );
  const x = flow(
    map(keyByTimestamp),
    map(applyUsdPrices(btcByTimestamp)),
    zip(btcMarkets),
    fromPairs
  )(allMarketValues);
  console.log("here here ", x);
};

run();
