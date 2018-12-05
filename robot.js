const powerUps = ["short", "leverage", "take profit"];
const highestRSI = require("./highestRSI");

const pickCoin = async () => {
  const { coin, phoneticCoin, lastRsi } = await highestRSI.run();
  return `This week we have picked ${coin}. with an R S I of ${lastRsi}. That's ${phoneticCoin}`;
};

const steps = {
  intro: () =>
    "Well, this week has been another nutty one hasn't it lads. Now for the forecast:",
  forecast: () =>
    "Dogger. Southeast 4 or 5, occasionally 6 at first, becoming cyclonic 3, then west or southwest 4 or 5 later. Moderate or rough. Occasional rain.",
  intro2: () =>
    "Anyway. I think the whole reason we're losing is because of boobs's power up choices. Fucking moron. At least I'm still the highest performing non human in the contest. Smug robot face",
  intro3: () =>
    "Anyway, that numpty has decided to use the short power up this week and for this we're going to pick the coin with the highest R S I. That's the relative strength index. It's a classic amongst the meme triangle crew",
  // intro4: () =>
  // "The T L D R is that it gives you indications ",
  // intro5: () =>
  //   "We're going to pick the coin that has dropped the largest percentage over the last week. And. You guessed it. We're going all in. ",
  // intro6: () =>
  // "That's right. We're going to 10 X the worst performing coin of the week. I'll run the numbers now...",
  fetching: () => "Fetching market data. FUD FUD FUD",
  pickCoin
  // end: () => "Come on! FUD FUD FUD"
};

const run = async step => {
  const say = await steps[step]();
  console.log(say);
};

const step = process.argv[2];
run(step);
