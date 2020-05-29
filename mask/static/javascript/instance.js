/* * * * * * * * * * * * *  * * * * * * * * * * * * *
* * * * Vue.js Instance
* **************************************************
* Components:
* * * mask-live
* * * * * live mask tracking from the WebCam
* * * mask-photo
* * * * * mask detection from an uploaded file
* * * mask-video
* * * * * mask tracking from an uploaded video
* **************************************************
* Offline Edge TFjs detection = better performance
* * * Tuning
* * * * * Parameters can be changed to increase
* * * * * * * precision
* * * * * * * number of results
* * * * * score
* * * * * * * score threshold for detection results
* * * * * iou
* * * * * * * determinancy of multiple choices
* * * * * * * of detection on a near region
* * * * * topk
* * * * * * * best k scored-based results
* **************************************************
* Of course, tuning is so expensive.
* Best patching method is:
* * * Use csv_image.js | csv_video.js
* * * Can take profit or not of previous dataSets
* * * Build a better-adapted AutoML model
* * * Put the best on the place of the actual model
* * * * * * * * * * * * *  * * * * * * * * * * * * */


Vue.component('mask-live', {
  data: function() {
    return {
      pollingId: null,
      predictionOut: null,
      img: null,
      vueCanvas: null,
      width: null,
      height: null,
      model: null,
    };
  },
  mounted: function() {
    Webcam.set({
      width: 640,
      height: 480,
      image_format: 'jpeg',
      jpeg_quality: '40'
    });
    Webcam.attach('#cam');
    var c = document.getElementById("draw");
    this.vueCanvas = c.getContext("2d");
    this.vueCanvas.lineWidth = 4;
    this.vueCanvas.font = "30px Verdana";
    this.width = c.width;
    this.height = c.height;
    this.img = document.createElement('img');
    this.img.width = c.width;
    this.img.height = c.height;
    // Load TensorFlowjs AutoML-offline-exported model locally
    tf.automl.loadObjectDetection('/static/model.json').then(mdl => {
      this.model = mdl;
    }).catch(console.log);
    },
  methods: {
  predict: function(data_uri) {
    this.img.src = data_uri;
    ////////////////////
    //// Prediction ////
    ////////////////////
    this.model.detect(this.img, {score: 0.4, iou: 0.5, topk: 20}).then(predictions => {
      this.predictionOut = []
      // For each found subject
      predictions.forEach(obj => {
        this.predictionOut.push("| Subject | " + obj.label + " | " + obj.score.toFixed(4) + "%");
        let gradient = this.vueCanvas.createLinearGradient(0, 0, this.width, 0);
        // Color of box depending on label
        gradient.addColorStop("1.0", obj.label == "mask" ? "lightgreen" : "red");
        this.vueCanvas.strokeStyle = gradient;
        // Draw tag + score + bounds
        this.vueCanvas.strokeText(obj.label == "mask" ? "Mask" : "Not Mask", obj.box.left - 8, obj.box.top - 4);
        this.vueCanvas.strokeText((obj.score * 100).toFixed(2) + "%", obj.box.left + obj.box.width * 0.75 , obj.box.top - 4);
        this.vueCanvas.strokeRect(obj.box.left, obj.box.top, obj.box.width, obj.box.height);
      });
    }).catch(() => { this.predictionOut = "Loading ..." });4
    ////////////////////////
    //// End Prediction ////
    ////////////////////////
  },
  init: function() {
    // WebCam loop
    this.pollingId = setInterval(() => {
      // Clear previous boxes
      this.vueCanvas.clearRect(0, 0, this.width, this.height);
      // SnapShot and predict + draw
      Webcam.snap(this.predict);
    }, 100); // end setInterval
  },
  stop: function () {
    // Stop evaluating WebCam
    // Make sure to click this before changing functionality
    // Otherwise, this would probably stay using CPU power
    clearInterval(this.pollingId);
    setTimeout(() => this.vueCanvas.clearRect(0, 0, this.width, this.height), 1000);
  },
  },
  template: `<div>
  <button v-on:click="init()">Evaluate Live WebCam</button>
  <button v-on:click="stop()">Stop Evaluating</button> <br/>
  <div style="display:inline-block">
  <div>
    <div id="cam" style="position: absolute; z-index: -1;"></div>
    <canvas id="draw" width="640" height="480" style="z-index: 1; border:2px solid black;"></canvas>
  </div>
  <div style="font-size:32px">
    <ul>
    <li v-for="prediction in predictionOut">{{prediction}}</li>
    <ul/>
  </div>
  <div>
  </div>`
})

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

Vue.component('mask-photo', {
  data: function() {
  return {
    outImage: null,
    outCanvas: null,
    canvasContext: null,
    predictionOut: null,
  };
  },
  mounted: function() {
  },
  methods: {
  // Called only when the new <img> element is formed
  predict: function() {
    document.getElementById("uploadImg").remove();
    document.getElementById("thatcontainer").appendChild(this.outImage);
    document.getElementById("thatcontainer").appendChild(this.outCanvas);
    // Load TensorFlowjs AutoML-offline-exported model locally
    tf.automl.loadObjectDetection('/static/model.json').then(model => {
      ////////////////////
      //// Prediction ////
      ////////////////////
      model.detect(this.outImage, { score: 0.2, iou: 0.5, topk: 30 }).then((predictions) => {
        this.predictionOut = [];
        // For each found subject
        predictions.forEach(obj => {
          this.predictionOut.push("| Subject | " + obj.label + " | " + obj.score.toFixed(4) + "%");
          let gradient = this.canvasContext.createLinearGradient(0, 0, this.outCanvas.width, 0);
          // Color of box depending on label
          gradient.addColorStop("1.0", obj.label == "mask" ? "lightgreen" : "red");
          this.canvasContext.strokeStyle = gradient;
          // Draw tag + score + bounds
          this.canvasContext.strokeText(obj.label == "mask" ? "Mask" : "Not Mask", obj.box.left - 8, obj.box.top - 4);
          this.canvasContext.strokeText((obj.score * 100).toFixed(2) + "%", obj.box.left + obj.box.width * 0.75 , obj.box.top - 4);
          this.canvasContext.strokeRect(obj.box.left, obj.box.top, obj.box.width, obj.box.height);
        });
      })
      ////////////////////////
      //// End Prediction ////
      ////////////////////////
    }).catch(console.log);
  },
  // Function that creates an HTMLImageElement
  // only important thing to know is that once
  // the image is created, the predict function
  // is called to that new image, the function go is
  // called when the <input type="file"> is uploaded
  go: function(evt) {
    var tgt = evt.target || window.event.srcElement,
      files = tgt.files;
    if (FileReader && files && files.length) {
      var fr = new FileReader();
      fr.onload = () => {
      var img = new Image;
      img.onload = () => {
        this.outImage = document.createElement('img');
        this.outImage.style = "z-index: -1; position: absolute; max-height: 1080px; max-width: 1280px";
        this.outImage.src = img.src;
        this.outImage.width = img.width;
        this.outImage.height = img.height;

        console.log(img.width, img.height);

        this.outCanvas = document.createElement('canvas');
        this.outCanvas.style= "z-index: 1;";
        this.outCanvas.width = this.outImage.width;
        this.outCanvas.height = this.outImage.height;

        this.canvasContext = this.outCanvas.getContext("2d");
        this.canvasContext.lineWidth = 4;
        this.canvasContext.font = "24px Verdana";

        document.getElementById("prediction").style = "font-size:32px; position: relative;";
        this.predict();
      };
      img.src = fr.result;
      };
      fr.readAsDataURL(files[0]);
    }
  },
  },
  template: `<div>
  <div id="thatcontainer" style="position:relative;">
    <input type="file" id="uploadImg" crossorigin="anonymous" v-on:change="go($event)">
  </div>
  <div id="prediction">
    <ul>
    <li v-for="prediction in predictionOut">{{prediction}}</li>
    <ul/>
  </div>
  </nav>`
});

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// Don't do this at home or the entire universe will probably explode
Vue.component('mask-video', {
  data: function() {
    return {
      model: null,
      outVideo: null,
      outCanvas: null,
      canvasContext: null,
      predictionOut: null,
      videoGhost: null,
    };
  },
  mounted: function() {
  },
  methods: {
    // Function that creates an HTMLVideoELement
    // called when the <input type="file"> is uploaded
    // When the video is loaded, this makes an stream processing for
    // capturing the frames and makes predictions for each one
    // When the frame list ${array} is ready, make a compression and
    // Get the non redundant frames from the video.
    // The video is resized to 640x480p, for a little speedUp.
    // ¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡   SPOOKY ALERT  !!!!!!!!!!!!!!!!!!!!!
    // The video variable is called ghost because it really doesn't show on the DOM
    // All visualization is provided by canvas draws with an fps
    go: function(evt) {
      // Load TensorFlowjs AutoML-offline-exported model locally
      tf.automl.loadObjectDetection('/static/model.json').then(model => {
        var videoGhost = document.createElement('video');

        var array = [];
        var newArr = [];


        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        canvas.style = "border:2px solid black; position:relative; z-index: -1; line-width: 64px; font: 96px Verdana;";
        ctx.lineWidth = 64;
        ctx.font = "96px Verdana";

        var auxcvs = document.createElement('canvas')
        var auxctx = auxcvs.getContext('2d');
        auxcvs.style = "border:2px solid black; position:relative; z-index: -1; line-width: 64px; font: 96px Verdana;";
        auxctx.lineWidth = 64;
        auxctx.font = "96px Verdana";


        var pro = document.querySelector('#progress');

        var duration;
        var thatFlag = false;

        var playBttn = document.createElement("button");

        // When data loading ends to the video
        var initVideo = function(e) {
          canvas.width =  640;//this.videoWidth;
          auxcvs.width =  640;//this.videoWidth;
          canvas.height = 480;//this.videoHeight;
          auxcvs.height = 480;//this.videoHeight;

          duration = videoGhost.duration;
          document.getElementById("vidInput").remove();
          console.log(videoGhost.width, videoGhost.height, videoGhost.videoWidth, videoGhost.videoHeight);
        }

        // When video is on playing status
        var captureFrame = function(e) {
          videoGhost.pause();
          //auxctx.drawImage(videoGhost, 0, 0);
          // ¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡¡   SPOOKY ALERT  !!!!!!!!!!!!!!!!!!!!!
          // This does not show, is another auxiliar ghost
          auxctx.drawImage(videoGhost, 0, 0, videoGhost.videoWidth, videoGhost.videoHeight, 0, 0, 640, 480);
          // Store a blob of a compressed 640x480 image
          array.push({
            blob: auxcvs.toDataURL("image/png"),
            timeOffset: videoGhost.currentTime,
          });
          // Progress of Frame Loading
          pro.innerHTML = "Loaded " + ((videoGhost.currentTime / duration) * 100).toFixed(2) + ' %';

          if (videoGhost.currentTime < videoGhost.duration)
            videoGhost.play();
        }
        // Once ghost video ends processing
        var lastStep = function(e) {
          //console.log(array.length);
          // Compression of redundant frames !!! Same timestamp and
          // inserted in the same order so take profit!
          array.forEach((item, idx) => {
            if (idx > 0 && item.timeOffset !== array[idx - 1].timeOffset)
                newArr.push(item);
          });
          console.log(`Compressed ${array.length} frames to ${newArr.length}`);
          delete array;

            var count = 0;
            for (let i = 0; i < newArr.length; i++) {
              let img = document.createElement('img');
              img.src = newArr[i].blob;
              img.onload = function(e) {
                // When loaded, show process of Frames Tracking %
                pro.innerHTML = "Tracked " + ((newArr[i].timeOffset / duration) * 100).toFixed(2) + ' %';
                ////////////////////
                //// Prediction ////
                ////////////////////
                model.detect(img, { score: 0.15, iou: 0.6, topk: 50 }).then((predictions) => {
                  delete newArr[i].blob;
                  count++;
                  URL.revokeObjectURL(this.src);
                  newArr[i].preds = predictions;

                  // LAST CASE
                  // IF THERE IS NO MORE STORED FRAMES TO PREDICT ON
                  if (count == newArr.length) {
                    document.getElementById("progress").remove();
                    document.getElementById("prediction").remove();

                    // Appears play button
                    document.getElementById("thatcontainer").appendChild(playBttn);
                    // Appears Video Drawing by canvas
                    document.getElementById("thatcontainer").appendChild(canvas);

                    videoGhost.removeEventListener("loadedmetadata", initVideo, false);
                    videoGhost.removeEventListener("loadedmetadata", initVideo, true);
                    videoGhost.removeEventListener("timeupdate", captureFrame, false);
                    videoGhost.removeEventListener("timeupdate", captureFrame, true);
                    videoGhost.removeEventListener("ended", lastStep, false);
                    videoGhost.removeEventListener("ended", lastStep, true);

                    videoGhost.addEventListener('ended', function (e) { thatFlag = false; }, false);

                    // Preview first frame and pause
                    videoGhost.pause();
                    videoGhost.currentTime = 0;
                    ctx.drawImage(videoGhost, 0, 0, videoGhost.videoWidth, videoGhost.videoHeight, 0, 0, 640, 480);

                    // When clicking play button, starts playing video
                    // REMEMBER FOR THE SPOOKY BOYS
                    // Its not an HTMLVideoELement, its full made of canvas
                    playBttn.onclick = function() {
                      if (!thatFlag) {
                        thatFlag = true;
                        videoGhost.play();
                        finalGo();
                      }
                      console.log(`${thatFlag}`);
                    }
                    playBttn.innerHTML = "Play"

                  } // END LAST CASE

                });
                ////////////////////////
                //// End Prediction ////
                ////////////////////////
              };
            }
            URL.revokeObjectURL(this.src);
        }

        var finalGo = function() {
            /*
            * NOW WE HAVE:
            * * * STORED PREDICTIONS
            * * * STORED TIMESTAMPS OF PREDICTIONS
            */
            for (let i = 0; i < newArr.length; i++) {
              setTimeout(() => {
                //ctx.drawImage(videoGhost, 0, 0);
                // NO MORE GHOSTS HERE
                // STOP SPOOKY AF STUFF
                // This actually shows on
                ctx.drawImage(videoGhost, 0, 0, videoGhost.videoWidth, videoGhost.videoHeight, 0, 0, 640, 480);
                if (newArr[i].preds !== []) {
                  videoGhost.pause(); // Temporally for drawing
                  // For each found subject
                  newArr[i].preds.forEach((obj) => {
                    let gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
                    // Color of box depending on label
                    gradient.addColorStop("1.0", obj.label == "mask" ? "lightgreen" : "red");
                    ctx.strokeStyle = gradient;
                    // Draw tag + score + bounds
                    ctx.strokeText(obj.label == "mask" ? "Mask" : "NoMask", obj.box.left - 8, obj.box.top - 4);
                    ctx.strokeText((obj.score * 100).toFixed(2) + "%", obj.box.left + obj.box.width * 0.75 , obj.box.top - 4);
                    ctx.strokeRect(obj.box.left, obj.box.top, obj.box.width, obj.box.height);
                  });
                  videoGhost.play(); // Resume
                }
                // We know here when to place the box
              }, newArr[i].timeOffset * 1000); // end setTimeout
            }
            console.log(`Found ${newArr.length} tracks!`);
        }

        videoGhost.addEventListener('loadedmetadata', initVideo, false);
        videoGhost.addEventListener('timeupdate', captureFrame, false);
        videoGhost.addEventListener('ended', lastStep, false);

        videoGhost.muted = true;
        // Start loading from <input type="file"> element of the component
        videoGhost.src = URL.createObjectURL(document.getElementById("vidInput").files[0]);
        videoGhost.play();
      });
    },
  },
  template: `<div style="display: block">
    <div id="prediction" style="font-size:32px; position: relative;">
      <p id="progress"></p>
    </div>
    <div id="thatcontainer" class="container" style="position:relative">
      <input id="vidInput" type="file" accept="video/*" v-on:change="go()"/>
    </div>
  </div>`
});



////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// Single Page Application
// Three Functions, Three Sections
// Only displays in function of selected button
var options = {
  el: "#app",
  data: {
  buff: "Hello World!",
  photo: false,
  live: false,
  video: false,
  },
  methods: {
  // When clicking a button,
  // disable every other
  // components in the DOM
  resetDisplay() {
    this.photo = false;
    this.live = false;
    this.video = false;
  },
  goPhoto() {
    this.resetDisplay();
    this.photo = true;
  },
  goLive() {
    this.resetDisplay();
    this.live = true;
  },
  goVideo() {
    this.resetDisplay();
    this.video = true;
  },
  },
  template: `<div class="main clearfix">
  <div class="column" style="float: left; border-right: 1px solid #9A9A9A">
    <p><button v-on:click="goPhoto()">Detect in an Image file</button></p>
    <p><button v-on:click="goLive()">Track in your live WebCam</button></p>
    <p><button v-on:click="goVideo()">Track in a Video file</button></p>
  </div>
  <div class="column" style:float:right>
    <mask-photo v-if="photo"></mask-photo>
    <mask-live v-if="live"></mask-live>
    <mask-video v-if="video"></mask-video>
  </div>
  </div>`
}
var vm = new Vue(options);
