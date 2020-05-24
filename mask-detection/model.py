from PIL import Image
import process as pr
import urllib.request
import io
from io import BytesIO
from google.cloud import storage
from google.cloud import vision
import os
import tempfile

def process(image):

	storage_client = storage.Client()
	nom = image.filename
	constant = "-copia."

	blobs = storage_client.list_blobs("hackathon-3")
	
	for blob in blobs:
		if blob.name == nom:
			paraules = nom.split(".")
			nom = paraules[0] + constant + paraules[1]

	
	URL = 'https://storage.googleapis.com/hackathon-3/' + nom

	base_dir = tempfile.gettempdir()
	path = os.path.join(base_dir, nom)

	image.save(path)
	
	# EL PUGEM A GCS
	bucket = storage_client.get_bucket("hackathon-3")

	blob = bucket.blob(nom)

	# FROM FILENAME
	blob.upload_from_filename(path)

	#########################################################imatge original pujada a gcs
	

	with urllib.request.urlopen(URL) as url:
		img = BytesIO(url.read())
		img2 = Image.open(img)
		img2.save(path)

	with io.open(path, 'rb') as image_file:
		content = image_file.read()

	image = vision.types.Image(content=content)

	im = pr.highlight_faces(path, pr.detect_faces(image), nom)


	
	im.save(path)

	# EL PUGEM A GCS
	bucket = storage_client.get_bucket("hackathon-3")

	blob = bucket.blob(nom)

	# FROM FILENAME
	blob.upload_from_filename(path)

	return URL