const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const speech = require('@google-cloud/speech');
const mm = require('music-metadata');
const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(bodyParser.json());

const client = new speech.SpeechClient({
  keyFilename: './audio-text-converter-0c4eb25a1688.json' // Set the path to your google cloud service account key
});

function getAudioEncoding(filePath) {
  return new Promise((resolve, reject) => {
    mm.parseFile(filePath)
      .then(metadata => {
        const format = metadata.format;
        if (!format || !format.codec) {
          reject(new Error('Encoding type not found'));
          return;
        }
        resolve(format.codec);
      })
      .catch(error => {
        reject(error);
      });
  });
}

function getSampleRate(filePath) {
  return new Promise((resolve, reject) => {
    mm.parseFile(filePath, { native: true })
      .then(metadata => {
        const audioStream = metadata.format && metadata.format.sampleRate;
        if (!audioStream) {
          reject(new Error('Sample rate not found'));
          return;
        }
        resolve(audioStream);
      })
      .catch(error => {
        reject(error);
      });
  });
}

app.post('/convert', upload.single('audio'), async (req, res) => {
  try {
    const audioFilePath = req.file.path;
    console.log(req.body.languageCode);
    getAudioEncoding(audioFilePath)
      .then(encoding => {
        getSampleRate(audioFilePath)
          .then(async sampleRate => {
            const audioContent = fs.readFileSync(audioFilePath);
            const [response] = await client.recognize({
              audio: { content: audioContent },
              config: {
                encoding: req.body.languageCode,
                sampleRateHertz: sampleRate,
                languageCode: 'en-US'
              }
            });
            const transcription = response.results
              .map(result => result.alternatives[0].transcript)
              .join('\n');
            res.json({ transcription });
          })
          .catch(error => {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal server error' });
          });
      })
      .catch(error => {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
      });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
