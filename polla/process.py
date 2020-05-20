#from __main__ import *

# Imports system modules
import io
from werkzeug.datastructures import FileStorage
import os
from google.cloud import vision
from google.cloud.vision import types
from PIL import Image, ImageDraw, ImageFont
import cv2
import numpy as np
import sys

def detect_faces(face_file, max_results=300):

    # Performs face detection on the image
    response = client.face_detection(image=face_file, max_results=max_results)

    faces = response.face_annotations
   
    intface =0
    for face in faces:
        #print(intface)
        print("detection_confidence", face.detection_confidence)
        print("landmarking_confidence", face.landmarking_confidence)
        intface = intface+1
    
    return faces

def detect_faces_uri(uri, max_results=4):
    # Initializes image from web url or image file path
    image = vision.types.Image()
    image.source.image_uri = uri
    # Performs face detection on the image
    response = client.face_detection(image=image)
    faces = response.face_annotations

    # Names of likelihood from google.cloud.vision.enums
    likelihood_name = ('UNKNOWN', 'VERY_UNLIKELY', 'UNLIKELY', 'POSSIBLE',
                       'LIKELY', 'VERY_LIKELY')
 
    if input('See additional features? ') == 'yes':
        print(faces)

def highlight_faces(image, faces, output_filename):
    """Draws a polygon around the faces, then saves to output_filename.
    Args:
      image: a file containing the image with the faces.
      faces: a list of faces found in the file. This should be in the format
          returned by the Vision API.
      output_filename: the name of the image file to be created, where the
          faces have polygons drawn around them.
    """
   
    #fontb = ImageFont.truetype(r'/users/pclavellmaso/downloads/google-cloud-sdk/mask-detection/arial.ttf', 20)
    fontb = ImageFont.truetype("arial.ttf", 20)

    im = Image.open(image)
    draw = ImageDraw.Draw(im)
    # Sepecify the font-family and the font-size
    for face in faces:
        box = [(vertex.x, vertex.y)
               for vertex in face.bounding_poly.vertices]
        if(face.detection_confidence >= 0.28):
            draw.line(box + [box[0]], width=8, fill= '#32cd32' if face.landmarking_confidence <= 0.3 else '#ff0000')
            
            if face.landmarking_confidence <= 0.3:
                draw.text(((face.bounding_poly.vertices)[0].x + 100,(face.bounding_poly.vertices)[0].y - 30), "Mask",font = fontb, fill='#32cd32')
            else: 
                draw.text(((face.bounding_poly.vertices)[0].x + 100,(face.bounding_poly.vertices)[0].y - 30), "No Mask",font = fontb, fill='#ff0000')
        
        else:
            draw.line(box + [box[0]], width=8, fill= '#ff8c00')
            draw.text(((face.bounding_poly.vertices)[0].x + 100,(face.bounding_poly.vertices)[0].y - 30), "Undefined",font = fontb, fill='#ff8c00')
        # Place the confidence value/score of the detected faces above the
        # detection box in the output image
        draw.text(((face.bounding_poly.vertices)[0].x,(face.bounding_poly.vertices)[0].y - 30),
            str(format(face.detection_confidence, '.3f')) + '%',font = fontb, fill='#32cd32' if face.landmarking_confidence <= 0.3 else '#ff0000')

    #im.save(output_filename)
    return output_filename


def clahe(image_path):
    img = cv2.imread(image_path, 1)
    #cv2.imshow("img",img) 

    #-----Converting image to LAB Color model----------------------------------- 
    lab= cv2.cvtColor(img, cv2.COLOR_BGR2LAB)

    #-----Splitting the LAB image to different channels-------------------------
    l, a, b = cv2.split(lab)

    #-----Applying CLAHE to L-channel-------------------------------------------
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
    cl = clahe.apply(l)

    #-----Merge the CLAHE enhanced L-channel with the a and b channel-----------
    limg = cv2.merge((cl,a,b))

    #-----Converting image from LAB Color model to RGB model--------------------
    final = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
    #cv2.imshow('final', final)
    cv2.imwrite('clahetest.jpg',final)


# Main starts here --------------------------------------------------------------------------------------
credential_path = r'./Test-AppEngine-7311953a6fd8.json'  #modify this line
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credential_path


#clahe('./mask3.jpg')
#detect_faces_uri(input('Enter image url: '))
#detect_faces('./clahetest.jpg')

client = vision.ImageAnnotatorClient();

#highlight_faces(sys.argv[1], detect_faces(sys.argv[1]) , sys.argv[1])