const jimp = require('jimp');
const fs = require('fs')

const imagePaths = [];
let outputImage = `${new Date().toISOString()}.png`;
let processMode = 'PIXEL';

const jimps = [];
const bestSourceImage = {};
let charsPerPixel = 4; // 3 for RGB, 4 for RGBA

const processCliArgs = (args) => {
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {

      case '-ii':
      case '--input-image':
        {
          try {
            if (fs.existsSync(args[i + 1])) {
              imagePaths.push(args[i + 1]);
              i++;
              continue;
            }
            console.error(`processCliArgs: File: '${args[i + 1]}' does not exist or is not readable.`);
          } catch (err) {
            console.error('processCliArgs: Error on image input:');
            console.error(err);
            process.exit(1);
          }
          break;
        }

        case '-oi':
        case '--output-image':
          {
            try {
              if (fs.existsSync(args[i + 1])) {
                console.error(`processCliArgs: File: '${args[i + 1]}' already exists. Will overwrite.`);
                // continue;
              }
              outputImage = args[i + 1];
            } catch (err) {
              console.error('processCliArgs: Error on image output:');
              console.error(err);
              process.exit(2);
            }
            break;
          }

          case '-m':
          case '--mode':
            {
              try {
                if (args[i + 1] === 'CHANNEL') {
                  processMode = args[i + 1];
                  continue;
                }
                if (args[i + 1] === 'PIXEL') {
                  processMode = args[i + 1];
                  continue;
                }
                console.error(`processCliArgs: Error on mode: Unknown Mode '${args[i + 1]}'`);
              } catch (err) {
                console.error('processCliArgs: Error on mode:');
                console.error(err);
                process.exit(2);
              }
              break;
            }

            case '-cppx':
            case '--chars-per-pixel':
              {
                try {
                  const charsPerPixelString = args[i + 1];
                  const charsPerPixelIn = Number.parseInt(charsPerPixelString);
                  if (Number.isNaN(charsPerPixelIn)) {
                    console.error(`processCliArgs: Error on mode: Unknown Mode '${args[i + 1]}'`);
                    continue;
                  }
                  
                  charsPerPixel = charsPerPixelIn;
                } catch (err) {
                  console.error('processCliArgs: Error on chars per pixel:');
                  console.error(err);
                  process.exit(2);
                }
                break;
              }
    
    }
  }
};

const getClosest = (target, arr) => {
  return arr.sort((a, b) => {
    return Math.abs(target - a) - Math.abs(target - b)
  })[0];
};

const getMode = (arr) => {
  let item;
  let index = -1;
  let modeFrequency = 1
  let m = 0;

  for (let i = 0; i < arr.length; i++) {
    for (let j = i; j < arr.length; j++) {
      if (arr[i] === arr[j]) {
        m++;
      }
      if (modeFrequency < m) {
        modeFrequency = m; 
        item = arr[i];
        index = i;
      }
    }
    m = 0;
  }

  return {
    item,
    index,
    modeFrequency
  };
}

const getAverage = (arr) => {
  return arr.reduce((a, b) => a + b) / arr.length;
};

const getHighest = (inputObject) => {
  return Object.keys(inputObject).reduce((a, b) => inputObject[a] > inputObject[b] ? a : b);
}

const main = () => {
  for (let i = 0; i < imagePaths.length; i++) {
    jimps.push(jimp.read(imagePaths[i]));
  }
  
  Promise.all(jimps).then((data) => {
    new jimp(data[0].bitmap.width, data[0].bitmap.height, (err, newImage) => {
      for (let i = 0; i < newImage.bitmap.data.length; i += charsPerPixel) {
        const localBestSource = {};

        for (let rgba = 0; rgba < charsPerPixel; rgba++) {
          const pixelList = data.map((image) => {
            return image.bitmap.data[i + rgba];
          });
          const pixelAverage = getAverage(pixelList);
          const closest = getClosest(pixelAverage, JSON.parse(JSON.stringify(pixelList)));
          const fromImage = pixelList.indexOf(closest);
  
          pixelList.findIndex((value, index) => {
            if (value === closest) {
              if (!bestSourceImage[imagePaths[index]]) {
                bestSourceImage[imagePaths[index]] = 0;
              }
              bestSourceImage[imagePaths[index]]++;

              if (!localBestSource[index]) {
                localBestSource[index] = 0;
              }
              localBestSource[index]++;

            }
          });

          // Update each color channel individually
          if (processMode === 'CHANNEL') {
            newImage.bitmap.data[i + rgba] = closest;
          }
        }

        // Select best fitting/matching pixel from all images.
        if (processMode === 'PIXEL') {
          const bestLocalIndex = getHighest(localBestSource);

          for (let rgba = 0; rgba < charsPerPixel; rgba++) {
            newImage.bitmap.data[i + rgba] = data[bestLocalIndex].bitmap.data[i + rgba];
          }
        }
      }
    
      newImage.write(outputImage, () => {
        console.log(`Width: ${newImage.bitmap.width}`);
        console.log(`Height: ${newImage.bitmap.height}`);
        console.log(`Pixels: ${newImage.bitmap.data.length / charsPerPixel}`);
        console.log(`Chars per Pixel: ${charsPerPixel}`);
        console.log('Best Source Image: ', getHighest(bestSourceImage));
        console.log('Source Image Scores: ', bestSourceImage);
        console.log(`Image written to disk: ${outputImage}`);
      });
    });

  }).catch((err) => {
    console.log(err);
  });
};

processCliArgs(process.argv);
console.log(`Processing Mode: ${processMode}`);
console.log(`Processing Images: ${imagePaths}`);
main();
