const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const { SpeechClient } = require('@google-cloud/speech');

const speechClient = new SpeechClient({ keyFilename: 'key.json' }); // Path to your service account key

async function transcribeWebm(filePath) {
  const outputPath = `${filePath}.flac`;

  await new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .audioChannels(1)
      .audioFrequency(16000)
      .toFormat('flac')
      .on('end', resolve)
      .on('error', reject)
      .save(outputPath);
  });

  const file = fs.readFileSync(outputPath);
  const audioBytes = file.toString('base64');

  const audio = { content: audioBytes };
  const config = {
    encoding: 'FLAC',
    sampleRateHertz: 16000,
    languageCode: 'en-US',
  };

  const request = { audio, config };

  const [response] = await speechClient.recognize(request);
  const transcription = response.results.map(r => r.alternatives[0].transcript).join('/n');

  fs.unlinkSync(outputPath);
  return transcription;
}

// Your actual file path (make sure to escape backslashes or use path.join)
const path = 'C:/Users/Fabheads21/Downloads/Jewellery project/Jewellery project/backend/recordings/conference.wav';

transcribeWebm(path)
  .then(t => console.log('/n📝 Transcription:/n', t))
  .catch(e => console.error('❌ Error:', e));
