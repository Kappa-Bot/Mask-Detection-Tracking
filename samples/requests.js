// Imports the Google Cloud client libraries
const vision = require('@google-cloud/vision');
const fs = require('fs');
const fetch = require('node-fetch');
const sizeOf = require('image-size');

const client = new vision.ImageAnnotatorClient();
const fileName = 'mask5.jpeg';

async function detectLabels(fileName) {
  // Performs label detection on the image file
  const [result] = await client.labelDetection(fileName);
  const labels = result.labelAnnotations;
  labels.forEach((item, i) => {
    console.log(`Found ${item.description}` + "\11\t" + `score: ${item.score}`)
  });
}
//detectLabels(fileName);

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
}
//detectFaces(fileName);

async function localizeObjects(fileName) {
  // Make a call to the Vision API to detect the faces
  const request = {
    image: {
      content: fs.readFileSync(fileName)
    },
  };
  const results = await client.objectLocalization(request);
  results[0].localizedObjectAnnotations.forEach((item, i) => {
    console.log(`Found ${item.name} #${i + 1}` + "\11\t" + `${item.score}`);
  });
}
//localizeObjects(fileName);

//Meant to be the main function
async function sendReq(fileName, mode) {
  var type;
  switch(mode) {
    case 0:
      type = "OBJECT_LOCALIZATION";
      break;
    case 1:
      type = "FACE_DETECTION";
      break;
    default:
      console.log("Excuse me what the fuck");
      break;
  }
  const request = {
    "requests": [{
      "image": {
        "content": Buffer.from(fs.readFileSync(fileName)).toString('base64')
      },
      "features": {
          "type": type,
          "maxResults": 100
      }
    }]
  };
  var dimensions = sizeOf(fileName);
  fetch('https://vision.googleapis.com/v1/images:annotate?key=AIzaSyAp6xBe0ZvUMW6zr1AXgeao8OlhFlSVM0U', {
    method: 'POST',
    body: JSON.stringify(request),
  }).then((response) => {
    return response.json();
  }).then((response) => {
    var annotationsList;
    switch (mode) {
      case 0:
        annotationsList = response.responses[0].localizedObjectAnnotations;
        break;
      case 1:
        annotationsList = response.responses[0].faceAnnotations;
        break;
      default:

    }
    annotationsList.forEach((item, i) => {
      var vertexList;
      switch (mode) {
        case 0:
          console.log(`Found ${item.name} #${i + 1}` + "\n\t" + `Score: ${item.score} at`);
          vertexList = item.boundingPoly.normalizedVertices;
          break;
        case 1:
          console.log(`Found Face #${i + 1}:`);
          vertexList = item.boundingPoly.vertices;
          break;
        default:
          console.log("Excuse me literally what the fuck");
      }
      vertexList.forEach((coord, i) => {
        console.log(`\tx:${coord.x * dimensions.height}\ty:${coord.y * dimensions.width}`);
      });
    });
    console.log(dimensions);
  })
};
const mode = 0;
sendReq(fileName, mode);
