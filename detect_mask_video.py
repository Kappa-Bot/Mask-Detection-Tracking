# USAGE
# python detect_mask_video.py

# import the necessary packages
from imutils.video import VideoStream
import numpy as np
import argparse
import imutils
import time
import cv2
import os

# initialize the video stream and allow the camera sensor to warm up
print("[INFO] starting video stream...")
#cv2.namedWindow("preview")
vs = cv2.VideoCapture(0)
time.sleep(2.0)
i=0
# loop over the frames from the video stream
#print(vs.get(5))
while True:
	# grab the frame from the threaded video stream and resize it
	# to have a maximum width of 400 pixels
	ret_val, frame = vs.read()
	frame = imutils.resize(frame, width=500)
	
	
	# detect faces in the frame and determine if they are wearing a
	# face mask or not
	'''
	(locs, preds) = detect_and_predict_mask(frame, faceNet, maskNet)

	# loop over the detected face locations and their corresponding
	# locations
	for (box, pred) in zip(locs, preds):
		# unpack the bounding box and predictions
		(startX, startY, endX, endY) = box
		(mask, withoutMask) = pred

		# determine the class label and color we'll use to draw
		# the bounding box and text
		label = "Mask" if mask > withoutMask else "No Mask"
		color = (0, 255, 0) if label == "Mask" else (0, 0, 255)

		# include the probability in the label
		label = "{}: {:.2f}%".format(label, max(mask, withoutMask) * 100)

		# display the label and bounding box rectangle on the output
		# frame
		cv2.putText(frame, label, (startX, startY - 10),
			cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 2)
		cv2.rectangle(frame, (startX, startY), (endX, endY), color, 2)
	'''
	#print(frame)
	#print(type(frame))
	# show the output frame
	if (vs.get(7)%int(vs.get(5) / 4)== 0 ):
		i = i+1
		cv2.imwrite('frame'+str(i)+'.jpg',frame )

		os.system("python mask.py ./frame"+str(i)+".jpg")

		frame = cv2.imread("./frame"+str(i)+".jpg")

	cv2.imshow('',frame)
	 

	# if the `q` key was pressed, break from the loop
	if cv2.waitKey(1) == ord("q"):
		break

for file in os.listdir('./'):
	#print(file)
	if file.endswith('.jpg'):
		os.remove(file) 
# do a bit of cleanup
cv2.destroyAllWindows()
vs.release()