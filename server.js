
const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs-extra');
const gm = require('gm').subClass({imageMagick: true});

const dataDirectoryName = "data";

const app = express();

app.use(fileUpload());
app.use(express.static('public'));

app.get('/', function(request, response) {
    response.sendFile(__dirname + '/views/index.html');
});

app.get('/uploads', async (req, resp) => {
  resp.send({images: fs.readdirSync(dataDirectoryName)})
})

app.post('/upload', function(req, res) {
  if (Object.keys(req.files).length == 0) {
    return res.status(400).send('No files were uploaded.');
  }

  let imageFile = req.files.imageFile;
  imageFile.mv(`${dataDirectoryName}/${imageFile.name}`, (err) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.send('File uploaded!');
  });
});

app.get('/code', async (req, resp) => {
  console.log(`req.query.imageName=${req.query.imageName}`)
  const imageName = req.query.imageName
  const imageData = await generateCode(imageName);
  resp.send({
    luaCode: imageData.luaTableString,
    nestedArrays: imageData.nestedArrays,
    imageFilePath: imageData.imageFilePath,
    width: imageData.width,
    height: imageData.height
  })
});

const listener = app.listen(process.env.PORT, function() {
    console.log('app is listening on port ' + listener.address().port);
});

const imageBufferToNestedArrays = (buffer, width, height, colorChannelCount)  => {
  const imagePixelRows = []
  for (var row = 0; row < height; row++) {
    
    const rowPixels = []
    for (var col = 0; col < width; col++) {
      
      const redIndex = row*width*colorChannelCount + (col*colorChannelCount);
      const greenIndex = row*width*colorChannelCount + (col*colorChannelCount) + 1;
      const blueIndex = row*width*colorChannelCount + (col*colorChannelCount) + 2;
      
      const redValue = buffer.readUInt8(redIndex);
      const greenValue = buffer.readUInt8(greenIndex);
      const blueValue = buffer.readUInt8(blueIndex);
      const pixel = [redValue, greenValue, blueValue];
      
      rowPixels.push(pixel)
    } 
    imagePixelRows.push(rowPixels)
  }  
  return imagePixelRows;
}

const arrayOfArraysToLuaTableString = (arrayOfArrays) => {
  const rowLuaArrayStrings = []
  for (const rowPixels of arrayOfArrays) {
    const rowPixelLuaArrayStrings = []
    for (const pixel of rowPixels) {
      const luaArrayString = '{' + pixel.map((value) => `${value}`).join(',') + '}'
      rowPixelLuaArrayStrings.push(luaArrayString)
    }
    const rowPixelLuaArrayString = "" + rowPixelLuaArrayStrings.join(',') + ",";
    rowLuaArrayStrings.push(rowPixelLuaArrayString)
  }
  
   let luaTableString = `{\n\t${rowLuaArrayStrings.join("\n\t")}\n}`
   return luaTableString;
}

const imageToNestedArrays = async (imageFilePath, colorChannelCount) => {
  return new Promise((resolve, reject) => {
    let width, height;
    gm(imageFilePath).setFormat('ppm')
      .size((err, size) => {
        width = size.width;
        height = size.height;
      })
      .toBuffer((err, buffer) => {
        if (err) {
          return reject(err);
        }
        const imageData = imageBufferToNestedArrays(buffer, width, height, colorChannelCount);
        resolve({data: imageData, width, height, colorChannelCount})
      });    
    }) 
}

const generateCode = async (imageName) => {
  const imageFilePath = `${dataDirectoryName}/${imageName}`
  const colorChannelCount = 3
  const imageData = await imageToNestedArrays(imageFilePath, colorChannelCount)
  const luaTableString = arrayOfArraysToLuaTableString(imageData.data)
  //console.log(luaTableString);
  return Object.assign({imageFilePath, luaTableString, nestedArrays: imageData.data}, imageData)
}

(async () => {
  await fs.ensureDir(dataDirectoryName)
  const imageName = "dog.png"
  
  await generateCode(imageName);
})() 
