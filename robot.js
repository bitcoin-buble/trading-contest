const powerUps = ["short", "leverage", "take profit"];
const highestRSI = require("./highestRSI");

const pickCoin = async () => {
  const { coin, phoneticCoin, lastRsi } = await highestRSI.run();
  return `This week we have picked ${coin}. with an R S I of ${lastRsi}. That's ${phoneticCoin}`;
};

const steps = {
  intro: () =>
    "Ah, I'm sorry lads, Boobs is off surfing in New Zealand so has struggled to find time to get a high IQ pick lined up. It turns out the byenance API doesn't work so well on the Otargo Peninsular. Wherever the fuck that is.",
  intro2: () =>
    "He's tried his best and has blindly coded some shit for the great P Money to run lyve and debug on the show. Good luck big fella.",
  intro3: () =>
    "We're going to use the reverse strategy from last week for two reasons. One. We only have the take profit power up left. Two. Boobs can't be fucked to code whilst in a camper van. So, Take profit on this one P money:",
  // intro4: () =>
  // "The T L D R is that it gives you indications ",
  // intro5: () =>
  //   "We're going to pick the coin that has dropped the largest percentage over the last week. And. You guessed it. We're going all in. ",
  // intro6: () =>
  // "That's right. We're going to 10 X the worst performing coin of the week. I'll run the numbers now...",
  fetching: () => "Fetching market data. MOON. MOON. MOON.",
  pickCoin
  // end: () => "Come on! FUD FUD FUD"
};

const run = async step => {
  const say = await steps[step]();
  console.log(say);
};

const step = process.argv[2];
run(step);
