const jimp = require('jimp');
const fs = require('fs')

const imagePaths = [];
let outputImage = `${new Date().toISOString()}.png`;

var jimps = [];
const bestSourceImage = {};

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
                continue;
              }
              outputImage = args[i + 1];
            } catch (err) {
              console.error('processCliArgs: Error on image output:');
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
      for (let i = 0; i < newImage.bitmap.data.length; i++) {
        const pixelList = data.map((image) => {
          return image.bitmap.data[i];
        });
        const pixelAverage = getAverage(pixelList);
        const closest = getClosest(pixelAverage, JSON.parse(JSON.stringify(pixelList)));
        const fromImage = pixelList.indexOf(closest);

        pixelList.findIndex((value, index) => {
          if (value === closest) {
            if (!bestSourceImage[index]) {
              bestSourceImage[index] = 0;
            }
            bestSourceImage[index]++;
          }
        });

        newImage.bitmap.data[i] = closest;
      }
    
      newImage.write(outputImage, () => {
        console.log(`Width: ${newImage.bitmap.width}`);
        console.log(`Height: ${newImage.bitmap.height}`);
        console.log(`Pixels: ${newImage.bitmap.data.length / 3}`);
        console.log('Best source Image: ', bestSourceImage);
        console.log(`Image written to disk: ${outputImage}`);
      });
    });

  }).catch((err) => {
    console.log(err);
  });
};

processCliArgs(process.argv);
console.log(`Processing Images: ${imagePaths}`);
main();
