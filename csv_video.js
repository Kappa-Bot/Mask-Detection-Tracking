const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

const Video = require('@google-cloud/video-intelligence').v1p3beta1;
const automl = require('@google-cloud/automl').v1;

const video = new Video.VideoIntelligenceServiceClient();
const client = new automl.PredictionServiceClient();

const gcsUri = "gs://mask-track.appspot.com/maskvideos/vid1.mp4";
const CSV = [];

//Purpose
const TRAIN = "TRAIN", TEST = "TEST";
//Labeling
const MASK = "Mask", NO_MASK = "No Mask";

//For AutoML
const projectId = "513991189750";
const computeRegion = "us-central1";
const modelId = "IOD6802542101608267776";
const filePath = "./maskvideos/";
const scoreThreshold = "0.5";

async function snapThatShit(faceAnnotations) {
  var i = 0;
  for (const {tracks} of faceAnnotations) {
    let command = ffmpeg(filePath + 'vid1.mp4')
    .screenshots({
      timestamps: [
        ((tracks[0].segment.startTimeOffset.seconds +
        (tracks[0].segment.startTimeOffset.nanos / 1e6).toFixed(0)) / 1000) + ""
      ],
      filename: `vid1_${i}.png`,
      folder: filePath,
    });

    i++;

    ////////////////////////////////////////////////////////////////////////////
    // Ahora tomamos en cuenta el tiempo en que aparece.
    ////// TODO: En este punto solo falta el label "Mask" / "No Mask" //////////
    ////////////////////////////////////////////////////////////////////////////
    console.log("go");
    const [response] = await client.predict({
      name: client.modelPath(projectId, computeRegion, modelId),
      payload: {
        image:  {
          imageBytes: fs.readFileSync(filePath + `vid1_${i}.png`, 'base64')
        }
      },
      params: {
         score_threshold: scoreThreshold
       },
    });
    console.log("done");
    for (const annotationPayload of response.payload) {
      console.log(`Predicted class name: ${annotationPayload.displayName}`);
      console.log(
        `Predicted class score: ${annotationPayload.imageObjectDetection.score}`
      );
      console.log('Normalized vertices:');
      for (const vertex of annotationPayload.imageObjectDetection.boundingBox
        .normalizedVertices) {
        console.log(`\tX: ${vertex.x}, Y: ${vertex.y}`);
      }
    }
  }
};
//snapThatShit([]);

async function detectFacesGCS() {
  const [operation] = await video.annotateVideo({
    inputUri: gcsUri,
    features: ['FACE_DETECTION'],
    videoContext: {
      faceDetectionConfig: {
        includeBoundingBoxes: true,
      },
    },
  });
  const results = await operation.promise();
  const faceAnnotations = results[0].annotationResults[0].faceDetectionAnnotations;
  for (const {tracks} of faceAnnotations) {
    for (const {segment, timestampedObjects} of tracks) {
      if (segment.startTimeOffset.seconds === undefined) segment.startTimeOffset.seconds = 0;
      if (segment.startTimeOffset.nanos === undefined) segment.startTimeOffset.nanos = 0;
      if (segment.endTimeOffset.seconds === undefined) segment.endTimeOffset.seconds = 0;
      if (segment.endTimeOffset.nanos === undefined) segment.endTimeOffset.nanos = 0;
      console.log(
        `Face\n\tStart: ${segment.startTimeOffset.seconds}.` +
          `${(segment.startTimeOffset.nanos / 1e6).toFixed(0)}s`);
      console.log(`\tEnd: ${segment.endTimeOffset.seconds}.` +
          `${(segment.endTimeOffset.nanos / 1e6).toFixed(0)}s`);
    }
  }
  snapThatShit(faceAnnotations);
}

detectFacesGCS();
