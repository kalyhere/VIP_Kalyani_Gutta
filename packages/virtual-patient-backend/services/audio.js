import { ElevenLabsClient } from 'elevenlabs';
import dotenv from 'dotenv';
import { secureFileOps } from '../utils/fileOps.js';
import WavEncoder from 'wav-encoder';
import path from 'path';

dotenv.config();

if (!process.env.ELEVEN_LABS_API_KEY) {
  console.error("Missing ELEVEN_LABS_API_KEY environment variable");
  process.exit(1);
}

const elevenLabs = new ElevenLabsClient({
  apiKey: process.env.ELEVEN_LABS_API_KEY,
});

const VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel voice

export const generateAudio = async (text, messageIndex = 0, timestamp = Date.now(), options = {}) => {
  try {
    console.log('Generating audio for text:', text.substring(0, 100) + '...'); // Log first 100 chars
    const t0 = Date.now();
    console.time('ElevenLabs TTS');

    // Generate text-to-speech audio
    const audioStream = await elevenLabs.textToSpeech.convertAsStream(VOICE_ID, {
      text: text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5
      },
      output_format: 'pcm_16000' // WAV-compatible, 16kHz PCM
    });
    console.timeEnd('ElevenLabs TTS');
    const t1 = Date.now();

    // Process audio chunks as they arrive
    console.time('PCM to WAV encoding');
    const chunks = [];
    let totalLength = 0;

    for await (const chunk of audioStream) {
      // Convert chunk to Buffer if it isn't already
      const bufferChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      chunks.push(bufferChunk);
      totalLength += bufferChunk.length;
    }

    if (totalLength === 0) {
      throw new Error('No audio data received from ElevenLabs');
    }

    // Allocate buffer once we know the total size
    const pcmBuffer = Buffer.allocUnsafe(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      chunk.copy(pcmBuffer, offset);
      offset += chunk.length;
    }

    // Convert to Float32Array in chunks for better memory usage
    const CHUNK_SIZE = 32768; // Process 32KB at a time
    const float32Array = new Float32Array(totalLength / 2);
    for (let i = 0; i < totalLength; i += CHUNK_SIZE) {
      const end = Math.min(i + CHUNK_SIZE, totalLength);
      for (let j = i; j < end; j += 2) {
        float32Array[j/2] = pcmBuffer.readInt16LE(j) / 32768;
      }
    }

    // Encode to WAV
    const wavData = await WavEncoder.encode({
      sampleRate: 16000,
      channelData: [float32Array]
    });
    console.timeEnd('PCM to WAV encoding');
    const t2 = Date.now();
    console.log(`Audio timing: ElevenLabs TTS: ${t1-t0}ms, PCM to WAV: ${t2-t1}ms, Total: ${t2-t0}ms`);

    // Always return in-memory buffer for streaming; never save to disk
    return { audioBuffer: Buffer.from(wavData) };
  } catch (error) {
    console.error('Error generating audio:', error);
    if (error.statusCode) {
      console.error('API Error Status:', error.statusCode);
      console.error('API Error Body:', error.body);
    }
    throw error;
  }
}; 