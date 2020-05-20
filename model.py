# import Image
from PIL import Image
import process as pr
import urllib.request
import io
from io import BytesIO
from google.cloud import storage
from google.cloud import vision
import os
import tempfile

def process_upload(image):

	nom = image.filename
	
	# EL PUGEM A GCS
	storage_client = storage.Client()
	bucket = storage_client.get_bucket("hackathon-3")

	#name='gray.png'
	blob = bucket.blob(nom)

	# FROM FILENAME
	blob.upload_from_filename(nom)





	base_dir = tempfile.gettempdir()
	filename = 'geeks.png'

	path = os.path.join(base_dir, filename)
	
	

	URL = 'https://storage.googleapis.com/hackathon-3/' + nom
	
	with urllib.request.urlopen(URL) as url:
		img = BytesIO(url.read())
		img2 = Image.open(img)
		img2.save(path)
    #content = img.read()
    

    #image = types.Image(content=content)

	with io.open(path, 'rb') as image_file:
		content = image_file.read()

	image = vision.types.Image(content=content)

	name = pr.highlight_faces(image, pr.detect_faces(image), nom)



	return name

	# O FROM STRING
	# blob.upload_from_string(
    #     uploaded_file.read(),
    #     content_type=uploaded_file.content_type
    # )