#!/bin/bash

node robot.js intro | tee >(say) >(say -o "./output/intro.aiff")
read -n 1
node robot.js intro2 | tee >(say) >(say -o "./output/intro2.aiff")
read -n 1
node robot.js intro3 | tee >(say) >(say -o "./output/intro3.aiff")
read -n 1
node robot.js intro4 | tee >(say) >(say -o "./output/intro4.aiff")
read -n 1
node robot.js intro5 | tee >(say) >(say -o "./output/intro5.aiff")
read -n 1
node robot.js intro6 | tee >(say) >(say -o "./output/intro6.aiff")
read -n 1
node robot.js fetching | tee >(say) >(say -o "./output/fetching.aiff")
read -n 1
node robot.js pickCoin | tee >(say) >(say -o "./output/pickCoin.aiff")
read -n 1
node robot.js end | tee >(say) >(say -o "./output/end.aiff")
read -n 1