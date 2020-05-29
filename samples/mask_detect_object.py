#!/usr/bin/env python

# Copyright 2015 Google, Inc
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Draws squares around detected faces in the given image."""

import os

from google.cloud import vision
from google.cloud.vision import types
from PIL import Image, ImageDraw

###############################################################################
def localize_objects(path):
    """Localize objects in the local image.
    Args:
    path: The path to the local file.
    """
    client = vision.ImageAnnotatorClient()

    with open(path, 'rb') as image_file:
        content = image_file.read()
    image = vision.types.Image(content=content)

    objects = client.object_localization(
        image=image).localized_object_annotations

    print('Number of objects found: {}'.format(len(objects)))
    for object_ in objects:
        print('\n{} (confidence: {})'.format(object_.name, object_.score))
        print('Normalized bounding polygon vertices: ')
        for vertex in object_.bounding_poly.normalized_vertices:
            print(' - ({}, {})'.format(vertex.x, vertex.y))
    return objects
###############################################################################

def highlight_objects(image, objects, output_filename):
    im = Image.open(image)
    draw = ImageDraw.Draw(im)

    for obj in objects:
        box = [(vertex.x * im.size[0], vertex.y * im.size[1])
               for vertex in obj.bounding_poly.normalized_vertices]
        # Draws the bounding box of the detected object
        draw.line([box[0], box[1], box[2], box[3], box[0]], width=8, fill= '#32cd32')
    im.save(output_filename)

def main(input_filename, output_filename, max_results):
    with open(input_filename, 'rb') as image:
        image.seek(0)
        objects = localize_objects(input_filename)
        highlight_objects(image, objects, output_filename)


credential_path = r'./mask-track-3f592d5998a8.json'  #modify this line
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credential_path

main('mask.jpg', 'out.jpg', 4)
