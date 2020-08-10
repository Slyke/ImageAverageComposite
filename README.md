# Image Average Composite

## About
Combines a list of images by grabbing the value of each color channel across each image, finding the average and selecting the closest pixel's color to that average. You can use BMPs, JPGs and PNGs. Output format will be PNG.

### Advice:
The images should be similar in source. Combining images that are not closely matching will produce some weird results.

## Installation
Commands to run locally:
```
git clone https://github.com/Slyke/ImageAverageComposite.git
cd ImageAverageComposite
npm install
```

## Running
All the images need to be the same dimensions. They can be in any of the formats specified in the about section.
```
npm start -- list of images
```

### Params:
* `-ii` | `--input-image`: Add image path list
* `-oi` | `--output-image` (optional): Specify output image filename
* `-m` | `--mode` = ('`PIXEL`' || '`CHANNEL`') (optional): Process mode. Get best value for each color channel in each image, or get the best fitting pixel from all images.
* `-cppx` | `--chars-per-pixel` = (Int) (optional): How many chars in each pixel? 4 for RGBA, 3 for RGB.

### Example:
```
  npm start -- -ii example/1.png --input-image example/2.png -ii example/3.png -oi test.png
```
This will produce an image similar to `example/output.png`.

## Updating
I may push updates from time to time. You can update the code by running the following command from within the project's directory.
```
git pull
```

## Future Updates
* Check each color channel in combination for each pixel before choosing the best source image (helps with hashing distance of images that differ too much).
* Use convolution edge detection to better align and sharpen objects that may move slightly between multiple images (such as tree leaves in the wind).

## Demo:
With these 3 images as the input:

![First Image](/example/1.png)
![Second Image](/example/2.png)
![Third Image](/example/3.png)

An output like this will be generated:

![Output Image](/example/output.png)
