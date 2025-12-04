#!/usr/bin/env python3
"""
Simple TTS HTTP Server using gTTS (Google Text-to-Speech)
Free, no API key required, natural voices
"""
from flask import Flask, request, send_file
from gtts import gTTS
import os
import tempfile
import logging

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

@app.route('/health', methods=['GET'])
def health():
    return {'status': 'healthy'}, 200

@app.route('/tts', methods=['GET', 'POST'])
def text_to_speech():
    """Generate speech from text"""
    try:
        # Get text from query param or POST body
        if request.method == 'GET':
            text = request.args.get('text')
        else:
            text = request.json.get('text') if request.json else request.args.get('text')
        
        if not text:
            return {'error': 'No text provided'}, 400
        
        logging.info(f"Generating TTS for: {text[:50]}...")
        
        # Generate speech using gTTS
        tts = gTTS(text=text, lang='en', slow=False, tld='com')
        
        # Save to temporary file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
        tts.save(temp_file.name)
        temp_file.close()
        
        logging.info(f"✅ TTS generated successfully")
        
        # Send file and clean up
        response = send_file(temp_file.name, mimetype='audio/mpeg')
        
        # Delete temp file after sending
        @response.call_on_close
        def cleanup():
            try:
                os.unlink(temp_file.name)
            except:
                pass
        
        return response
        
    except Exception as e:
        logging.error(f"TTS error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {'error': str(e)}, 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=False)
