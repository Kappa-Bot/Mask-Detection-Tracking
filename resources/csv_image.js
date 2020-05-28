const vision = require('@google-cloud/vision');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const sizeOf = require('image-size');
const client = new vision.ImageAnnotatorClient();

async function detectFaces(fileName) {
  const [result] = await client.faceDetection(fileName);
  const faces = result.faceAnnotations;
  faces.forEach((face, i) => {
    console.log(`Found Face #${i + 1}:`);
    console.log(`\tJoy: ${face.joyLikelihood}`);
    console.log(`\tAnger: ${face.angerLikelihood}`);
    console.log(`\tSorrow: ${face.sorrowLikelihood}`);
    console.log(`\tSurprise: ${face.surpriseLikelihood}`);
  });
  var dimensions = sizeOf(fileName);
  var maxIdx = 0;
  return [
    Math.round((faces[maxIdx].boundingPoly.vertices[0].x / dimensions.height) *10000) / 10000,
    Math.round((faces[maxIdx].boundingPoly.vertices[0].y / dimensions.width)  *10000) / 10000,
    Math.round((faces[maxIdx].boundingPoly.vertices[1].x / dimensions.height) *10000) / 10000,
    Math.round((faces[maxIdx].boundingPoly.vertices[1].y / dimensions.width)  *10000) / 10000,
    Math.round((faces[maxIdx].boundingPoly.vertices[2].x / dimensions.height) *10000) / 10000,
    Math.round((faces[maxIdx].boundingPoly.vertices[2].y / dimensions.width)  *10000) / 10000,
    Math.round((faces[maxIdx].boundingPoly.vertices[3].x / dimensions.height) *10000) / 10000,
    Math.round((faces[maxIdx].boundingPoly.vertices[3].y / dimensions.width)  *10000) / 10000,
  ];
}

const directoryPath = path.join(__dirname, 'maskdataset');
const type = "TRAIN";
const bucket = "gs://mask-track.appspot.com/maskdataset/";
const CSVFILE = [];
let count = 0;

const features = {
    "type": "FACE_DETECTION",
    "maxResults": 1
};
const requests = [];
dims = [];
var doslice = -1;
const fileNames = [];
var tags = [];

function foo() {
  fs.readdir(directoryPath, function (err, files) {
    files.forEach(function (file) {
      let tag = file.includes("mask") ? "mask" : "no mask";
      let subPath = path.join(directoryPath, file)
      fs.readdir(subPath, function (err, images) {
        images.forEach(function (image) {
          count++;
          let vertexList = detectFaces(path.join(subPath,image));
          CSVFILE.push(type + "," + bucket + "," + tag
          + "," + vertexList[0] + "," + vertexList[1]
          + "," + vertexList[2] + "," + vertexList[3]
          + "," + vertexList[4] + "," + vertexList[5]
          + "," + vertexList[6] + "," + vertexList[7]);
        });
      });
    });
  });
}

fs.readdirSync(directoryPath).forEach(function (file) {
  let tag = file.includes("mask") ? "mask" : "no mask";
  let subPath = path.join(directoryPath, file)

  fs.readdirSync(subPath).forEach(function (image) {
    count++;
    requests.push({
      "image": {
        "source": {
          "gcsImageUri": bucket + file + "/" + image
        }
      },
      "features": features
    });
    fileNames.push(bucket + file + "/" + image);
    dims.push(sizeOf(path.join(subPath,image)));
    tags.push(tag);

    if (count == 2266) {
      var count2 = 0;
      var myLoop = function() {
          setTimeout(function () {
            doslice++;
              fetch('https://vision.googleapis.com/v1/images:annotate?key=AIzaSyAp6xBe0ZvUMW6zr1AXgeao8OlhFlSVM0U', {
                method: 'POST',
                body: JSON.stringify({"requests": requests.slice(doslice * 10, doslice * 10 + 10)})
              }).then((response) => {
                return response.json();
              }).then((response) => {
                response.responses.forEach((item, idx) => {
                  let line = type + "," + fileNames[count2] + "," + tags[count2]+ "," +
                    Math.round((item.faceAnnotations[0].boundingPoly.vertices[0].x / dims[count2].height) *10000) / 10000 + "," +
                    Math.round((item.faceAnnotations[0].boundingPoly.vertices[0].y / dims[count2].width)  *10000) / 10000 + "," +
                    Math.round((item.faceAnnotations[0].boundingPoly.vertices[1].x / dims[count2].height) *10000) / 10000 + "," +
                    Math.round((item.faceAnnotations[0].boundingPoly.vertices[1].y / dims[count2].width)  *10000) / 10000 + "," +
                    Math.round((item.faceAnnotations[0].boundingPoly.vertices[2].x / dims[count2].height) *10000) / 10000 + "," +
                    Math.round((item.faceAnnotations[0].boundingPoly.vertices[2].y / dims[count2].width)  *10000) / 10000 + "," +
                    Math.round((item.faceAnnotations[0].boundingPoly.vertices[3].x / dims[count2].height) *10000) / 10000 + "," +
                    Math.round((item.faceAnnotations[0].boundingPoly.vertices[3].y / dims[count2].width)  *10000) / 10000 + "\n";
                    fs.appendFileSync('model2.csv', line);
                    console.log(line);
                    count2++;
                });
              }).catch(console.log).then((x) => { if (count2 < 2266) myLoop() });
              if (count2 >= 2266) return;
         }, 2000);
      };
      myLoop();
    }
  });
});
