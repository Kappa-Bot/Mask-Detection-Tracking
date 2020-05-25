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
      width:        640,
      height:       480,
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
    tf.automl.loadObjectDetection('model.json').then(mdl => {
      this.model = mdl;
      console.log(this.model);
    }).catch(console.log);
  },
  methods: {
    predict: function(data_uri) {
        this.img.src = data_uri;
        this.model.detect(this.img, {score: 0.4, iou: 0.5, topk: 20}).then(predictions => {
          this.predictionOut = []
          console.log(this.predictionOut);
          predictions.forEach(obj => {
            this.predictionOut.push("| Subject | " + obj.label + " | " + obj.score.toFixed(4) + "%");
            let gradient = this.vueCanvas.createLinearGradient(0, 0, this.width, 0);
            gradient.addColorStop("1.0", obj.label == "mask" ? "lightgreen" : "red");
            this.vueCanvas.strokeStyle = gradient;
            this.vueCanvas.strokeText(obj.label == "mask" ? "Mask" : "Not Mask", obj.box.left - 8, obj.box.top - 4);
            this.vueCanvas.strokeText((obj.score * 100).toFixed(2) + "%", obj.box.left + obj.box.width * 0.75 , obj.box.top - 4);
            this.vueCanvas.strokeRect(obj.box.left, obj.box.top, obj.box.width, obj.box.height);
          });
        }).catch(() => { this.predictionOut = "Loading ..." });
    },
    init: function() {
        this.pollingId = setInterval(() => {
          this.vueCanvas.clearRect(0, 0, this.width, this.height);
          Webcam.snap(this.predict);
        }, 10);
    },
    stop: function () {
        clearInterval(this.pollingId);
        setTimeout(() => this.vueCanvas.clearRect(0, 0, this.width, this.height), 1000);
    },
  },
  template: `<div>
    <button v-on:click="init()">Evaluate Live WebCam</button>
    <button v-on:click="stop()">Stop Evaluating</button> <br/>
  <div style="display:inline-block">
    <div>
      <div id="cam" style="position: absolute"></div>
      <canvas id="draw" width="640" height="480" style="border:2px solid black; position:absolute"></canvas>
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
    predict: function() {
      document.getElementById("uploadImg").remove();
      document.getElementById("thatcontainer").appendChild(this.outImage);
      document.getElementById("thatcontainer").appendChild(this.outCanvas);
      tf.automl.loadObjectDetection('model.json').then(model => {
        model.detect(this.outImage, { score: 0.2, iou: 0.5, topk: 30 }).then((predictions) => {
        this.predictionOut = [];
        predictions.forEach(obj => {
          this.predictionOut.push("| Subject | " + obj.label + " | " + obj.score.toFixed(4) + "%");
          let gradient = this.canvasContext.createLinearGradient(0, 0, this.outCanvas.width, 0);
          gradient.addColorStop("1.0", obj.label == "mask" ? "lightgreen" : "red");
          this.canvasContext.strokeStyle = gradient;
          this.canvasContext.strokeText(obj.label == "mask" ? "Mask" : "Not Mask", obj.box.left - 8, obj.box.top - 4);
          this.canvasContext.strokeText((obj.score * 100).toFixed(2) + "%", obj.box.left + obj.box.width * 0.75 , obj.box.top - 4);
          this.canvasContext.strokeRect(obj.box.left, obj.box.top, obj.box.width, obj.box.height);
        });
      })}).catch(console.log);
    },
    go: function(evt) {
      var tgt = evt.target || window.event.srcElement,
          files = tgt.files;
      if (FileReader && files && files.length) {
          var fr = new FileReader();
          fr.onload = () => {
              this.outImage = document.createElement('img');
              this.outImage.style = "z-index: -1; position: absolute;";
              this.outImage.src = fr.result;
              this.outImage.width = 640;

              this.outCanvas = document.createElement('canvas');
              this.outCanvas.width = this.outImage.width;
              this.outCanvas.height = this.outImage.height;
              this.outCanvas.style= "z-index: 1; position:absolute";

              this.canvasContext = this.outCanvas.getContext("2d");
              this.canvasContext.lineWidth = 4;
              this.canvasContext.font = "24px Verdana";

              document.getElementById("prediction").style = "font-size:32px; position: relative; padding-top: " + this.outImage.height + "px";
              this.predict();
          }
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

Vue.component('mask-video', {
  data: function() {
    return {
      model: null,
      outVideo: null,
      outCanvas: null,
      canvasContext: null,
      predictionOut: null,
    };
  },
  mounted: function() {
    tf.automl.loadObjectDetection('static/model.json').then(model => {
      this.model = model;
    }).catch(console.log);
  },
  methods: {
    predict: function() {
      document.getElementById("uploadVid").remove();
      document.getElementById("thatcontainer").appendChild(this.outVideo);
        this.model.detect(this.outImage, { score: 0.2, iou: 0.5, topk: 30 }).then((predictions) => {
        this.predictionOut = [];
        console.log(predictions);
        /*predictions.forEach(obj => {
          setTimeout(() => {
            this.predictionOut.push("| Subject | " + obj.label + " | " + obj.score.toFixed(4) + "%");
            let gradient = this.canvasContext.createLinearGradient(0, 0, this.outCanvas.width, 0);
            gradient.addColorStop("1.0", obj.label == "mask" ? "lightgreen" : "red");
            this.canvasContext.strokeStyle = gradient;
            this.canvasContext.clearRect(0, 0, this.outCanvas.width, this.outCanvas.height);
            this.canvasContext.strokeText(obj.label == "mask" ? "Mask" : "Not Mask", obj.box.left - 8, obj.box.top - 4);
            this.canvasContext.strokeText((obj.score * 100).toFixed(2) + "%", obj.box.left + obj.box.width * 0.75 , obj.box.top - 4);
            this.canvasContext.strokeRect(obj.box.left, obj.box.top, obj.box.width, obj.box.height);
          }, obj.startTimeOffset.seconds);
        });*/
        this.outVideo.autoplay = true;
      }).catch(console.log);
    },
    go: function(evt) {
      var tgt = evt.target || window.event.srcElement,
          files = tgt.files;
      if (FileReader && files && files.length) {
          var fr = new FileReader();
          fr.onload = () => {
            this.outVideo = document.createElement('video');
            this.outVideo.style = "z-index: -1; position: absolute;";
            this.outVideo.src = fr.result;
            this.outVideo.width = 640;

            this.outCanvas = document.createElement('canvas');
            this.outCanvas.width = this.outVideo.width;
            this.outCanvas.height = this.outVideo.height;
            this.outCanvas.style= "z-index: 1; position:absolute";

            this.canvasContext = this.outCanvas.getContext("2d");
            this.canvasContext.lineWidth = 4;
            this.canvasContext.font = "24px Verdana";

            document.getElementById("prediction").style = "font-size:32px; position: relative; padding-top: " + this.outVideo.height + "px";

              this.predict();
          }
          fr.readAsDataURL(files[0]);
      }
    },
  },
  template: `<div style="display: block">
    <div id="thatcontainer" class="container">
      <input type="file" id="uploadVid" crossorigin="anonymous" v-on:change="go($event)">
    </div>
    <div id="prediction" style="font-size:32px; position: relative; padding-top: 300px">
      <ul>
        <li v-for="prediction in predictionOut">{{prediction}}</li>
      <ul/>
    </div>
  </div>`
});

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var options = {
  el: "#app",
  data: {
    buff: "Hello World!",
    photo: false,
    live: false,
    video: false,
  },
  methods: {
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
    <div class="column" style="float: left">
      <p><button v-on:click="goPhoto()">Detect on a Picture</button></p>
      <p><button v-on:click="goLive()">Track on your live WebCam</button></p>
      <p><button v-on:click="goVideo()">Track on a Video</button></p>
    </div>
    <div class="column" style:float:right>
      <mask-photo v-if="photo"></mask-photo>
      <mask-live v-if="live"></mask-live>
      <mask-video v-if="video"></mask-video>
    </div>
  </div>`
}
var vm = new Vue(options);
