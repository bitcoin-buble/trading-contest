const powerUps = ["short", "leverage", "take profit"];
const percentDrop = require("./percentDrop");

const pickCoin = async () => {
  const { coin, phoneticCoin, drop } = await percentDrop.run();
  return `This week we have picked a coin with a drop of ${drop} percent. It's ${coin}. That's ${phoneticCoin}`;
};

const steps = {
  intro: () =>
    "O M G, I'm having such fun with this! This T A shit is a robot's dream.",
  intro2: () =>
    "Hey, Beak, how are the scores looking? Not quite so cocky now hey kid!?",
  intro3: () =>
    "Yeah, whatever, come at me bro. You're joint last with the highest and lowest IQ in the room",
  intro4: () =>
    "This week Boobs wanted to get involved a bit more so he's picked the power up and his twitter poll has picked the strategy for picking the coin.",
  intro5: () =>
    "We're going to pick the coin that has dropped the largest percentage over the last week. And. You guessed it. We're going all in. ",
  intro6: () =>
    "That's right. We're going to 10 X the worst performing coin of the week. I'll run the numbers now...",
  fetching: () => "Fetching market data.",
  pickCoin,
  end: () => "Max leverage that bad boy please P Money"
};

const run = async step => {
  const say = await steps[step]();
  console.log(say);
};

const step = process.argv[2];
run(step);
