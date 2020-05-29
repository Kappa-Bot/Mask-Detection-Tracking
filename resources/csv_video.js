const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

const Video = require('@google-cloud/video-intelligence').v1p3beta1;
const automl = require('@google-cloud/automl')  ;

const video = new Video.VideoIntelligenceServiceClient();
const client = new automl.PredictionServiceClient();

//Purpose
const TRAIN = "TRAIN", TEST = "TEST";
//Labeling
const MASK = "Mask", NO_MASK = "No Mask";

//For AutoML
const projectId = "corded-nature-276111";                     // If wanted to detect with a AutoML mask detector
const computeRegion = "us-central1";
const modelId = "IOD6802542101608267776";
const filePath = "./maskvideos/";                             // Path to dataset locally
const fileName = "vid6b.mp4";                                 // Name of video stored on GCS
const scoreThreshold = "0.85";                                // High for Unmasked-only Videos, Low for Maksed-only Vieos
const gcsUri = "gs://mask-video-set/maskvideos/" + fileName;  // Path to dataset in GCS

async function go(faceAnnotations) {
  var i = -1;
  for (const {tracks} of faceAnnotations) { // Distinct faces
    i++;
    for (const {segment, timestampedObjects} of tracks) { // Instants
      console.log(`Face\n`);
      // For each instant of tracking
      timestampedObjects.forEach((item, idx) => {
        // timeOffset
        let start = (segment.startTimeOffset.seconds + (segment.startTimeOffset.nanos / 1e6).toFixed(0)) / 1000;
        console.log(item);

        /* This is for cutting a video into single frames using [FFMPEG] command
        // Not needed now
        var start = (tracks[0].segment.startTimeOffset.seconds +
        (tracks[0].segment.startTimeOffset.nanos / 1e6).toFixed(0)) / 1000;
        var end = (tracks[0].segment.endTimeOffset.seconds +
        (tracks[0].segment.endTimeOffset.nanos / 1e6).toFixed(0)) / 1000;
        let command = ffmpeg(filePath + fileName)
        .screenshots({
          timestamps: [start],
          filename: `vid3_${i}.png`,
          folder: filePath,
        });
        */
        // Bounding Box
        let left = item.normalizedBoundingBox.left.toFixed(2);
        let top = item.normalizedBoundingBox.top.toFixed(2);
        let right = item.normalizedBoundingBox.right.toFixed(2);
        let bot = item.normalizedBoundingBox.bottom.toFixed(2);

        // GCSPATH, TAG,
        fs.appendFileSync('lastTrain.csv', `${gcsUri},nomask,${i},${start},${left},${top},${right},${top},${right},${bot},${left},${bot}\n`);
      });
    }
      /* Get prediction of frames result of [FFMPEG] by AutoML mask detector
      * Not needed now
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
      for (const annotationPayload of response.payload) {
        console.log(`Predicted class name: ${annotationPayload.displayName}`);
        console.log(
          `Predicted class score: ${annotationPayload.imageObjectDetection.score}`
        );
        console.log('Normalized vertices:');
        for (const vertex of annotationPayload.imageObjectDetection.boundingBox
          .normalizedVertices) {
          console.log(vertex);
          console.log(`\tX: ${vertex.x}, Y: ${vertex.y}`);

        }
      }*/
  }
};
//snapThatShit([]);

//Function that requests from a video stored in GCS
async function detectFacesGCS() {
  //Face tracking requests, returns bounds, and instants of tracking
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
  go(faceAnnotations);
}

detectFacesGCS();
