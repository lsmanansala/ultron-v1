import say from 'say';

let femaleVoice = {
  type: 'female',
  value: 'Microsoft Zira Desktop'
};

let maleVoice = { 
  type: 'male',
  value: 'Microsoft David Desktop'
};


let defaultRate = 1.0;

global.ultronVoice = maleVoice

export async function speak(text, options = {}) {
  const voice = global.ultronVoice.value || maleVoice.value;
  const rate = options.rate || defaultRate;
  // await usingVoices()
  return new Promise((resolve, reject) => {
    say.stop(() => {
      say.speak(text, voice, rate, (err) => {
        if (err) {
          console.error('[Ultron Speech Error]', err.message);
          return reject(err);
        }
        resolve();
      });
    });
  });
}

export async function changeVoice() {
  global.ultronVoice = global.ultronVoice.type === 'male' ?  femaleVoice : maleVoice
}

function getVoices() {
  return new Promise((resolve) => {
    say.getInstalledVoices((err, voice) => {
      return resolve(voice)
    })
  })
}
async function usingVoices() {
  const voicesList = await getVoices();
  console.log(voicesList)
}

