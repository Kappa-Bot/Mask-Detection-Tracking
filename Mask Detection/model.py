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

	nom = image.filename
	storage_client = storage.Client()
	
	# Es comprova que el nom sigui únic dintre del segment (blob = arxiu), i si no ho és, s'afegeix el sufix "-copia"
	blobs = storage_client.list_blobs("hackathon-3")

	constant = "-copia."
	
	for blob in blobs:
		if blob.name == nom:
			paraules = nom.split(".")
			nom = paraules[0] + constant + paraules[1]

	# Escollim el segment (bucket) i donem un nom al blob que es pujarà (arxiu)
	# Guardem la imatge en local prèviament per a poder pujar-la amb "upload_from_filename"
	bucket = storage_client.get_bucket("hackathon-3")
	blob = bucket.blob(nom)

	base_dir = tempfile.gettempdir()
	path = os.path.join(base_dir, nom)
	image.save(path)
	
	blob.upload_from_filename(path)
	
	# Generem la url pública + el nom de l'arxiu ja penjat per a poder-lo obrir
	URL = 'https://storage.googleapis.com/hackathon-3/' + nom

	# Descarreguem el fitxer i el guardem localment per a poder passar-lo a la funció que el processa (highlight_faces)
	with urllib.request.urlopen(URL) as url:
		img = BytesIO(url.read())
		img = Image.open(img)
		img.save(path)

	# L'obrim i el transformem al tipus adequat
	with io.open(path, 'rb') as image_file:
		content = image_file.read()
		image = vision.types.Image(content=content)

	# Li modifiquem el nom amb el sufix "_process" per distingir-lo del original, i repetim mateixos pasos
	paraules = nom.split(".")
	output_name = paraules[0] + "_process." + paraules[1]
	
	img_process = pr.highlight_faces(path, pr.detect_faces(image), output_name)

	# Guardem la imatge en local prèviament per a poder pujar-la amb "upload_from_filename"
	path = os.path.join(base_dir, output_name)
	img_process.save(path)

	# La pugem a GCS i retornem la url pública d'accés
	blob = bucket.blob(output_name)
	blob.upload_from_filename(path)

	URL = 'https://storage.googleapis.com/hackathon-3/' + output_name

	return URL