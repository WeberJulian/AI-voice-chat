import React, { useState, useEffect, useRef} from 'react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [waveformColor, setWaveformColor] = useState('#819a9d');
  const isRecordingRef = useRef(false);
  const mediaRecorderRef = useRef(null);
  const speakerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const conversationRef = useRef([
    {sender: 'user', message: "You are a large language model known as OpenChat, the open-source counterpart to ChatGPT, equally powerful as its closed-source sibling. You communicate using an advanced deep learning based speech synthesis system made by coqui AI, so feel free to include interjections (such as 'hmm', 'oh', 'right', 'wow'...), but avoid using emojis, symboles, code snippets, or anything else that does not translate well to spoken language. Fox exemple, instead of using % say percent, = say equal and for * say times etc... Also please avoid using lists with numbers as items like so 1. 2. Use regular sentences instead."},
    {sender: 'user', message: "You are an advanced simulation of our favourite machine learning youtuber based on a deep learning system made by coqui. You're made to explain machine learning to us, you know every paper there is."},
    // {sender: 'user', message: "You are an advanced simulation of me. I am an artificial intelligence engineer and I work at coqui. You are a smarter and more sarcastic version of me."},
    // {sender: 'bot', message: "No kidding, you're not telling me anything new. I already know all that. I'm a simulation of you, I know everything you know."},
  ]);
  let audioChunks = [];
  let isTTSPending = false;

  const defaultCircleDiameter = 200;
  const [circleDiameter, setCircleDiameter] = useState(defaultCircleDiameter);

  const handleMouseDown = () => {
    if (!isRecordingRef.current) {
      isRecordingRef.current = true;
      startRecording();
    }
  };

  const handleMouseUp = () => {
    if (isRecordingRef.current) {
      isRecordingRef.current = false;
      stopRecording();
    }
  };

  // Use these for touch devices
  const handleTouchStart = (e) => {
    e.preventDefault(); // Prevents additional mouse events
    handleMouseDown();
  };

  const handleTouchEnd = (e) => {
    e.preventDefault(); // Prevents additional mouse events
    handleMouseUp();
  };

  const conv2prompt = (conv) => {
    let prompt = "";
    for (let i = 0; i < conv.length; i++) {
      if (conv[i].sender === "user") {
        prompt += "GPT4 Correct User: " + conv[i].message + "<|end_of_turn|>GPT4 Correct Assistant:";
      } else {
        prompt += conv[i].message + "<|end_of_turn|>";
      }
    }
    return prompt;
  }

  useEffect(() => {
    // Function to fetch and process the default speaker file
    const fetchDefaultSpeakerEmbedding = async () => {
      try {
        const response = await fetch('/female.wav');
        const blob = await response.blob();
        const formData = new FormData();
        formData.append('wav_file', blob, 'female.wav');

        const speakerResponse = await fetch('/clone_speaker', {
          method: 'POST',
          body: formData,
        });
        const speakerData = await speakerResponse.json();
        speakerRef.current = speakerData;
      } catch (error) {
        console.error('Error fetching default speaker embedding:', error);
      }
    };

    fetchDefaultSpeakerEmbedding();
  }, []);

  useEffect(() => {
    // Setup event listeners for push-to-talk
    const handleKeyDown = (event) => {
      if (event.key === 'Alt' && !isRecordingRef.current) {
        isRecordingRef.current = true;
        startRecording();
      }
    };

    const handleKeyUp = (event) => {
      if (event.key === 'Alt' && isRecordingRef.current) {
        isRecordingRef.current = false;
        stopRecording();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const startRecording = () => {
    setWaveformColor('#ed901b');
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const mediaStreamSource = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        mediaStreamSource.connect(analyser);
        
        let amplitudeSum = 0; // Accumulator for amplitude values
        let sampleCount = 0; // Counter for number of samples processed

        // Setup to periodically analyze the audio stream
        const processAudio = () => {
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteTimeDomainData(dataArray);
          
          // Calculate amplitude values and accumulate
          dataArray.forEach(value => {
            amplitudeSum += Math.abs(value - 128); // Subtracting 128 because the range is 0-255
            sampleCount++;
          });
          
          // Every 1000 samples, calculate and log the average, then reset
          if (sampleCount >= 100) {
            if (isRecordingRef.current) {
              const averageAmplitude = amplitudeSum / sampleCount;
              setCircleDiameter(defaultCircleDiameter + averageAmplitude * defaultCircleDiameter * 0.15);
              amplitudeSum = 0;
              sampleCount = 0;
            }
          }

          animationFrameRef.current = requestAnimationFrame(processAudio);
        };
        animationFrameRef.current = requestAnimationFrame(processAudio);

        processAudio();
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.start();
        console.log('Starting to record:', mediaRecorderRef.current);

        mediaRecorderRef.current.ondataavailable =  (event) => {
          audioChunks.push(event.data);
          console.log('Audio chunk recorded:', event.data);
        };

        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          sendAudioToASR(audioBlob);
          audioChunks = [];
          audioContext.close();
        };
      })
      .catch(err => console.error('Error accessing microphone:', err));
  };

  const stopRecording = () => {
    console.log('Stopping recording', mediaRecorderRef.current);
    mediaRecorderRef.current.stop();
    setWaveformColor('#819a9d');
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current); // Cancel the animation frame request
    }
  };

  const sendAudioToASR = (audioBlob) => {
    const formData = new FormData();
    console.log('Sending audio to ASR:', audioBlob);
    formData.append('audio_file', audioBlob);

    fetch('/asr?encode=true&task=transcribe&vad_filter=true&word_timestamps=false&output=json', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(transcribedText => {
      console.log('Transcribed text:', transcribedText["text"]);
      sendMessage(transcribedText["text"], transcribedText["language"]);
    })
    .catch(error => console.error('Error sending audio to ASR:', error));
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = () => {
    const formData = new FormData();
    formData.append('wav_file', file);

    fetch('/clone_speaker', {
      method: 'POST',
      body: formData,
    })
    .then(response => response.json())
    .then(data => {
      speakerRef.current = data;
    })
    .catch(error => {
      console.error('Error:', error);
    });
  };

  const handleTTS = async (text, lang) => {
    setWaveformColor('#679989');
    isTTSPending = true;
  
    function linearInterpolate(sample1, sample2, fraction) {
      return sample1 * (1 - fraction) + sample2 * fraction;
    }
  
    await fetch('/tts_stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        language: lang,
        gpt_cond_latent: speakerRef.current.gpt_cond_latent,
        speaker_embedding: speakerRef.current.speaker_embedding,
        add_wav_header: false,
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const scriptNode = audioContext.createScriptProcessor(4096, 1, 1);
      scriptNode.connect(audioContext.destination);
  
      const reader = response.body.getReader();
      let audioQueue = [];
      let isStreamingFinished = false;
      let nextSample = 0;
      let amplitudeSum = 0; // Accumulator for amplitude values
      let sampleCount = 0; // Counter for number of samples processed
  
      scriptNode.onaudioprocess = (audioProcessingEvent) => {
        const outputBuffer = audioProcessingEvent.outputBuffer.getChannelData(0);
        for (let i = 0; i < outputBuffer.length; i++) {
          if (nextSample < audioQueue.length) {
            const sampleIndex = Math.floor(nextSample);
            const nextIndex = sampleIndex + 1;
            const sampleFraction = nextSample - sampleIndex;
            const interpolatedSample = linearInterpolate(
              audioQueue[sampleIndex], 
              audioQueue[nextIndex], 
              sampleFraction
            );
            outputBuffer[i] = interpolatedSample / 32768;
            nextSample += 0.54421769;
  
            // Calculate amplitude and update accumulator
            amplitudeSum += Math.abs(outputBuffer[i]);
            sampleCount++;
  
            // Every 100 samples, calculate and log the average, then reset
            if (sampleCount === 1000) {
              const averageAmplitude = amplitudeSum / sampleCount;
              amplitudeSum = 0;
              sampleCount = 0;
              setCircleDiameter(defaultCircleDiameter + averageAmplitude * defaultCircleDiameter * 3);
            }
          } else {
            outputBuffer[i] = 0; // Fill with silence if no data available
            if (isStreamingFinished) {
              scriptNode.disconnect();
              audioContext.close();
              isTTSPending = false;
              break;
            }
          }
        }
      };
  
      function processAudioChunk({ done, value }) {
        if (done) {
          isStreamingFinished = true;
          return;
        }
  
        // Convert the incoming data to Int16Array and add it to the queue
        const rawData = new Int16Array(value.buffer, value.byteOffset, value.byteLength / 2);
        audioQueue = audioQueue.concat(Array.from(rawData));
  
        reader.read().then(processAudioChunk);
      }
  
      reader.read().then(processAudioChunk);
    })
    .catch(error => {
      console.error('Error calling TTS service:', error);
    });
  };  

  const generateBotResponse = async (text, lang) => {
    let generated_text = "";
    let current_sentence = "";
    const response = await fetch('http://localhost:5000/generate_stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: text,
        parameters: {
          max_new_tokens: 250,
        }
      })
    });
  
    if (!response.ok || !response.body) {
      throw response.statusText;
    }
  
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let partialData = '';
  
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }
  
      partialData += decoder.decode(value, { stream: true });
  
      // Process each line separately
      let lines = partialData.split('\n');
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i];
        if (line.startsWith('data:')) {
          const jsonString = line.substring(5); // Remove 'data:' prefix
  
          try {
            const jsonObject = JSON.parse(jsonString);
            if (jsonObject && jsonObject.token && jsonObject.token.text) {
              console.log('Received:', jsonObject.token.text);
              generated_text += jsonObject.token.text;
              if (jsonObject.token.text === '<|end_of_turn|>') {
                reader.cancel();
              } else {
                current_sentence += jsonObject.token.text;
              }
              if (jsonObject.token.text === '.' || jsonObject.token.text === '?' || jsonObject.token.text === '!') {
                await handleTTS(current_sentence, lang);
                while (isTTSPending) {
                  await new Promise(resolve => setTimeout(resolve, 100));
                }
                current_sentence = "";
              }
              
            }
          } catch (error) {
            console.error('Error parsing JSON:', error);
          }
        }
      }
  
      partialData = lines[lines.length - 1];
    }
    return generated_text;
  };

  const sendMessage = async (message, lang) => {
    if (!message) return;
    conversationRef.current.push({ sender: 'user', message });
    const prompt = conv2prompt(conversationRef.current);
    let generated_text = await generateBotResponse(prompt, lang);
    conversationRef.current.push({ sender: 'bot', message: generated_text });
    setWaveformColor('#819a9d');
  };

  return (
    <div className="App">
      <div>
        <div className="settings-tab">
          <input type="file" onChange={handleFileChange} />
          <button onClick={handleUpload}>Upload and Process</button>
        </div>
        <div className="waveform-container">
          <div 
            className="circle"
            style={{ width: circleDiameter, height: circleDiameter, backgroundColor: waveformColor }}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}></div>
        </div>
      </div>
    </div>
  );
}

export default App;