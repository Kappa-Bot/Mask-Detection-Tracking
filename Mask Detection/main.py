# Copyright 2018 Google LLC
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

# [START gae_python37_app]
from flask import Flask, render_template, request
"""import logging
	logging.basicConfig(level=logging.INFO)
import googleclouddebugger
googleclouddebugger.enable()"""

import model as md
#import highlight as hl

# If `entrypoint` is not defined in app.yaml, App Engine will look for an app
# called `app` in `main.py`.
app = Flask(__name__, template_folder='static')

@app.route('/')
def main():
	return render_template('index.html')

@app.route('/model', methods=["POST"])
def model_image():
	image_url = md.process(request.files['files'])
	return render_template('processat.html', value=image_url)

@app.route('/model_video', methods=["POST"])
def model_video():
	output_file = hl.process_video(request.files['files'], request.files['files'].filename)
	return render_template('video.html', value=output_file)

@app.route('/model.json')
def model():
	return app.send_static_file('model.json')

@app.route('/dict.txt')
def dict():
	return app.send_static_file('dict.txt')

@app.route('/group1-shard1of3.bin')
def shard1():
	return app.send_static_file('group1-shard1of3.bin')

@app.route('/group1-shard2of3.bin')
def shard2():
	return app.send_static_file('group1-shard2of3.bin')

@app.route('/group1-shard3of3.bin')
def shard3():
	return app.send_static_file('group1-shard3of3.bin')

if __name__ == '__main__':
	# This is used when running locally only. When deploying to Google App
	# Engine, a webserver process such as Gunicorn will serve the app. This
	# can be configured by adding an `entrypoint` to app.yaml.
	app.run(host='127.0.0.1', port=8080, debug=True)
# [END gae_python37_app]