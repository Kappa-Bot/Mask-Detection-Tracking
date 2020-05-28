# SM-Hackaton3 -> Mask Detection + Tracking

## Authenticate to Google before sending requests (Linux):
    export GOOGLE_APPLICATION_CREDENTIALS="path_to_your_credentials.json"

## Online AutoML models (us-central1)
  ### For Images
    projectId = 513991189750
    modelId = IOD6802542101608267776
  ### For Videos
    projectId = 742118677212
    modelId = VOT184643186675679232
    
## Offline AutoML models
  ### For Images
    model.json, *.bin, dict.txt
  ### For Videos
    model.tflite, label_map.pbtxt, frozen_interference_graph.pb

## If you want to deploy the web locally:
  ### Run a local http server
    NodeJS:    
        #Install dependency
        npm install --global http-server 

        http-server -p [DESIRED_PORT]
        
    Python:
        python -m SimpleHTTPServer [DESIRED_PORT]
  ### Offline AutoML models path
    ./static/model.[json|tflite]
