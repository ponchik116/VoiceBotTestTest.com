// DOM элементы
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const soundUpload = document.getElementById('soundUpload');
const previewSoundBtn = document.getElementById('previewSoundBtn');
const outputDeviceSelect = document.getElementById('outputDeviceSelect');
const requestDeviceBtn = document.getElementById('requestDeviceBtn');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const audioMeter = document.getElementById('audioMeter');
const meterFill = audioMeter.querySelector('.meter-fill');
const logArea = document.getElementById('logArea');

// Глобальные переменные
let mediaStream = null;
let audioContext = null;
let sourceNode = null;
let processorNode = null;
let censorSoundBuffer = null;
let isProcessing = false;
let activeSinkId = '';

// Настройки для мгновенного реагирования
let lastCensorTime = 0;
const CENSOR_COOLDOWN_MS = 2000;  // Защита от частого срабатывания

// ЗАДЕРЖКА ГОЛОСА (чтобы мат перекрывался вовремя)
let audioBufferQueue = [];
let isFlushing = false;
const DELAY_MS = 600;
let sampleRate = 48000;
let delaySamples = 0;

// ========== РУССКИЕ МАТЫ ==========
const profanityListRussian = [
    'бля', 'блять', 'сука', 'хуй', 'пизда', 'ебать', 'ебаный', 'нахуй',
    'пиздец', 'мудак', 'гандон', 'пидор', 'лох', 'дебил', 'даун', 'еблан',
    'тварь', 'шлюха', 'курва', 'пидрила', 'ублюдок', 'ебал',
    'беспиздая', 'бля', 'блядва', 'блядиада', 'блядина', 'блядистость',
    'блядки', 'блядовать', 'блядогон', 'блядословник', 'блядский', 'блядство',
    'блядун', 'блядь', 'бляхомудня', 'взбляд', 'взъебнуть', 'взъёбка',
    'взъёбывать', 'взъебщик', 'впиздить', 'впиздиться', 'впиздохать',
    'впиздохивать', 'впиздохиваться', 'впиздронивать', 'впиздрониваться',
    'впиздюлить', 'впиздячил', 'впиздячить', 'впизживать', 'впизживаться',
    'вхуйнуть', 'вхуйнуться', 'вхуяривание', 'вхуярить', 'выблядовал', 'выблядок',
    'выебать', 'выебок', 'выебон', 'выебывается', 'выпиздеться', 'выпиздить',
    'выхуяривание', 'въебать', 'въёбывать', 'глупизди', 'говноёб', 'голоёбица',
    'греблядь', 'дерьмохеропиздократ', 'дерьмохеропиздократия', 'доебался',
    'доебаться', 'доёбывать', 'долбоёб', 'допиздеться', 'дохуйнуть',
    'дохуякать', 'дохуякивать', 'дохуяриваться', 'дуроёб', 'дядеёб', 'ебалка',
    'ебало', 'ебалово', 'ебальник', 'ебанатик', 'ебандей', 'ебанешься',
    'ебанул', 'ебанулся', 'ебануть', 'ебануться', 'ебанутый', 'ебанько',
    'ебаришка', 'ебаторий', 'ебаться', 'ебашит', 'ебеня', 'ебёт', 'ебистика',
    'еблан', 'ебланить', 'ебливая', 'ебля', 'ебукентий', 'ёбака', 'ёбаный',
    'ёбарь', 'ёбкость', 'ёбля', 'ёбнул', 'ёбнуться', 'ёбнутый', 'ёбс',
    'жидоёб', 'жидоёбка', 'жидоёбский', 'заебал', 'заебать', 'заебись',
    'заебцовый', 'заебенить', 'заёб', 'заёбанный', 'заебаться', 'запизденевать',
    'запиздеть', 'запиздить', 'запизживаться', 'захуяривать', 'захуярить',
    'злоебучая', 'изъебнулся', 'испизделся', 'испиздить', 'исхуячить', 'козлоёб',
    'козлоёбина', 'козлоёбиться', 'козлоёбище', 'коноёбиться', 'косоёбится',
    'многопиздная', 'мозгоёб', 'мудоёб', 'наблядовал', 'наебалово', 'наебать',
    'наебаться', 'наебашился', 'наебениться', 'наебнулся', 'наебнуть', 'наёбка',
    'нахуевертеть', 'нахуяривать', 'нахуяриться', 'напиздеть', 'напиздить',
    'настоебать', 'невъебенный', 'нехуёвый', 'нехуй', 'оберблядь', 'объебал',
    'объебалово', 'объебательство', 'объебать', 'объебаться', 'объебос',
    'один хуй', 'однохуйственно', 'опизденевать', 'опиздихуительный', 'опиздоумел',
    'оскотоёбился', 'остоебал', 'остопиздело', 'остопиздеть', 'остохуеть',
    'отпиздить', 'отхуяривать', 'отъебаться', 'охуевать', 'охуенно', 'охуенный',
    'охуительный', 'охуячивать', 'охуячить', 'переебать', 'перехуяривать',
    'перехуярить', 'пёзды', 'пизда', 'пиздабол', 'пиздаёб', 'пиздакрыл',
    'пиздануть', 'пиздануться', 'пиздатый', 'пизделиться', 'пизделякает',
    'пиздеть', 'пиздец', 'пиздецкий', 'пиздёж', 'пиздёныш', 'пиздить',
    'пиздобол', 'пиздоблошка', 'пиздобрат', 'пиздобратия', 'пиздовать', 'сучка', 'сучки', 'щит', 'бич', 'сановбич', 'дик',
    'пиздовладелец', 'пиздодушие', 'пиздоёбищность', 'пиздолет', 'пиздолиз', 'пуси', 'эсхоул', 'эс', 'крэп', 'факинг', 'фак',
    'пиздомания', 'пиздопляска', 'пиздорванец', 'пиздострадалец', 'пиздострадания',
    'пиздохуй', 'пиздошить', 'пиздрик', 'пиздуй', 'пиздун', 'пиздюк',
    'пиздюли', 'пиздюлина', 'пиздюлька', 'пиздюля', 'пиздюрить', 'пиздюхать',
    'пиздюшник', 'подзаебать', 'подзаебенить', 'поднаебнуть', 'поднаебнуться',
    'поднаёбывать', 'подпёздывать', 'подпиздывает', 'подъебнуть', 'подъёбка',
    'подъёбки', 'подъёбывать', 'поебать', 'поебень', 'попиздеть', 'попиздили',
    'похую', 'похуярили', 'приебаться', 'припиздеть', 'припиздить',
    'прихуяривать', 'прихуярить', 'проблядь', 'проебать', 'проебаться', 'проёб',
    'пропиздить', 'разъебай', 'разъебаться', 'разёбанный', 'распиздон',
    'распиздошил', 'распиздяй', 'распиздяйство', 'расхуюжить', 'расхуяривать',
    'скотоёб', 'скотоёбина', 'сосихуйский', 'спиздил', 'страхоёбище', 'сухопиздая',
    'схуярить', 'съебаться', 'трепиздон', 'трепиздонит', 'туебень', 'тупиздень',
    'уебался', 'уебать', 'уёбище', 'уёбищенск', 'уёбок', 'уёбывать', 'упиздить',
    'хитровыебанный', 'хуев', 'хуеватенький', 'хуевато', 'худоёбина', 'хуебратия',
    'хуеглот', 'хуегрыз', 'хуедин', 'хуелес', 'хуеман', 'хуемырло', 'хуеплёт',
    'хуепутяло', 'хуесос', 'хуета', 'хуетень', 'хуёвина', 'хуёвничать', 'хуёво',
    'хуёвый', 'хуила', 'хуйло', 'хуйнуть', 'хуйня', 'хуярить', 'хуяция', 'хули',
    'хуя', 'хуяк', 'хуячить', 'шароёбится', 'широкопиздая'
];

// ========== АНГЛИЙСКИЕ МАТЫ ==========
const profanityListEnglish = [
    'fuck', 'fucking', 'fucker', 'motherfucker', 'shit', 'shitty', 'bitch', 'bitchy',
    'cunt', 'dick', 'dickhead', 'cock', 'pussy', 'asshole', 'ass', 'bastard', 'whore',
    'slut', 'damn', 'hell', 'piss', 'crap', 'douche', 'douchebag', 'twat', 'wanker',
    'bloody', 'arse', 'arsehole', 'bugger', 'damned', 'goddamn', 'son of a bitch',
    'bullshit', 'horseshit', 'fuck off', 'fuck you', 'fuckin', 'fuk', 'fck',
    'shite', 'bollocks', 'cuntish', 'dickwad', 'fucktard', 'shithead', 'shitface',
    'asswipe', 'cum', 'cumshot', 'jizz', 'semen', 'cocksucker', 'nutsack', 'ballsack'
];

// Объединяем оба списка
const profanityList = [...profanityListRussian, ...profanityListEnglish];

// Распознавание речи
let fastRecognition = null;
let recognitionActive = false;

// Флаг блокировки цензуры
let censoringNow = false;

/**
 * Добавление сообщения в лог
 */
function addLog(message, type = 'info') {
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    const timestamp = new Date().toLocaleTimeString('ru-RU');
    logEntry.textContent = `[${timestamp}] ${message}`;
    logArea.appendChild(logEntry);
    logEntry.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    while (logArea.children.length > 50) {
        logArea.removeChild(logArea.firstChild);
    }
}

/**
 * Обновление статуса
 */
function updateStatus(active, message) {
    if (active) {
        statusIndicator.className = 'status-indicator active';
        statusText.textContent = message || 'Обработка активна';
        startBtn.disabled = true;
        stopBtn.disabled = false;
    } else {
        statusIndicator.className = 'status-indicator';
        statusText.textContent = message || 'Остановлен';
        startBtn.disabled = false;
        stopBtn.disabled = true;
    }
    audioMeter.style.display = active ? 'block' : 'none';
}

/**
 * Инициализация аудио контекста
 */
async function initAudioContext() {
    if (audioContext && audioContext.state !== 'closed') {
        await audioContext.close();
    }
    
    const options = {};
    if (activeSinkId) {
        options.sinkId = activeSinkId;
    }
    
    audioContext = new (window.AudioContext || window.webkitAudioContext)(options);
    sampleRate = audioContext.sampleRate;
    delaySamples = Math.floor(sampleRate * DELAY_MS / 1000);
    addLog(`✅ Аудиоконтекст готов (${sampleRate} Гц, задержка ${DELAY_MS} мс)`);
    return audioContext;
}

/**
 * Генерация ПРИЯТНОГО звука заглушки
 */
function generateBeepBuffer() {
    if (!audioContext) return null;
    
    const duration = 0.12;
    const sampleRate = audioContext.sampleRate;
    const frameCount = sampleRate * duration;
    const buffer = audioContext.createBuffer(1, frameCount, sampleRate);
    const channelData = buffer.getChannelData(0);
    
    for (let i = 0; i < frameCount; i++) {
        const t = i / sampleRate;
        
        let frequency;
        if (t < duration * 0.4) {
            frequency = 1047;
        } else if (t < duration * 0.7) {
            frequency = 880;
        } else {
            frequency = 659;
        }
        
        let amplitude = 0.35;
        if (t < 0.008) {
            amplitude *= t / 0.008;
        }
        if (t > duration - 0.02) {
            amplitude *= (duration - t) / 0.02;
        }
        
        let signal = Math.sin(2 * Math.PI * frequency * t) * amplitude;
        signal += Math.sin(2 * Math.PI * frequency * 1.5 * t) * amplitude * 0.15;
        
        channelData[i] = signal;
    }
    
    return buffer;
}

/**
 * Загрузка пользовательского звука
 */
async function loadCensorSound(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            resolve(generateBeepBuffer());
            return;
        }
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const arrayBuffer = e.target.result;
                if (!audioContext) {
                    await initAudioContext();
                }
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                addLog(`✅ Звук загружен: ${file.name}`);
                resolve(audioBuffer);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Воспроизведение звука заглушки
 */
function playCensorSound() {
    if (!censorSoundBuffer || !audioContext || audioContext.state !== 'running') return;
    if (censoringNow) return;
    
    censoringNow = true;
    
    const playSource = audioContext.createBufferSource();
    playSource.buffer = censorSoundBuffer;
    playSource.connect(audioContext.destination);
    playSource.start();
    
    if (navigator.vibrate) navigator.vibrate(40);
    
    setTimeout(() => {
        censoringNow = false;
    }, 150);
}

/**
 * Срабатывание цензуры
 */
function triggerCensorship() {
    if (!isProcessing) return;
    
    const now = Date.now();
    if (now - lastCensorTime < CENSOR_COOLDOWN_MS) {
        return;
    }
    
    lastCensorTime = now;
    addLog(`🔇 ЦЕНЗУРА! Замена мата на звук`, 'warning');
    playCensorSound();
}

/**
 * Инициализация распознавания речи (русский + английский мат)
 */
function initFastSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        addLog('⚠️ Распознавание речи не поддерживается', 'warning');
        return null;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ru-RU'; // Русский язык, но английские слова тоже распознаются
    recognition.maxAlternatives = 1;
    
    recognition.onresult = (event) => {
        if (!isProcessing) return;
        
        const lastResult = event.results[event.results.length - 1];
        const transcript = lastResult[0].transcript.toLowerCase().trim();
        
        // Проверка по обоим спискам (русский + английский)
        let hasProfanity = false;
        let foundWord = '';
        
        for (const badWord of profanityList) {
            if (transcript.includes(badWord)) {
                hasProfanity = true;
                foundWord = badWord;
                break;
            }
        }
        
        if (!hasProfanity) {
            const words = transcript.split(/\s+/);
            for (const word of words) {
                if (profanityList.includes(word)) {
                    hasProfanity = true;
                    foundWord = word;
                    break;
                }
            }
        }
        
        // Предиктивные триггеры для английских матов
        if (!hasProfanity && transcript.length >= 2) {
            const badStarts = [
                'fu', 'fa', 'fk',  // fuck
                'sh', 'shi', 'shy', // shit
                'bi', 'bic', 'bit', // bitch
                'cu', 'cun', // cunt
                'di', 'dic', // dick
                'as', 'ass', // ass
                'pu', 'pus', // pussy
                'co', 'cock', // cock
                'mo', 'mot', // motherfucker
                'wh', 'who', // whore
                'sl', 'slu', // slut
                'ba', 'bas'  // bastard
            ];
            for (const start of badStarts) {
                if (transcript.startsWith(start)) {
                    hasProfanity = true;
                    foundWord = `[предсказано EN: ${start}...]`;
                    break;
                }
            }
        }
        
        if (hasProfanity) {
            addLog(`🔇 МАТ (${foundWord.includes('предсказано') ? 'EN предсказание' : foundWord})`, 'warning');
            triggerCensorship();
        }
    };
    
    recognition.onerror = (event) => {
        if (event.error !== 'no-speech') {
            console.log('Ошибка распознавания:', event.error);
        }
    };
    
    recognition.onend = () => {
        if (isProcessing && recognitionActive) {
            setTimeout(() => {
                try {
                    fastRecognition?.start();
                } catch (e) {}
            }, 100);
        }
    };
    
    return recognition;
}

/**
 * Обновление визуализатора громкости
 */
function updateMeter(audioData) {
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
        sum += audioData[i] * audioData[i];
    }
    const rms = Math.sqrt(sum / audioData.length);
    const percent = Math.min(100, Math.max(0, rms * 150));
    meterFill.style.width = `${percent}%`;
}

/**
 * Обработка аудио С ЗАДЕРЖКОЙ
 */
function processAudio(event) {
    if (!isProcessing) return;
    
    const inputBuffer = event.inputBuffer;
    const outputBuffer = event.outputBuffer;
    const inputData = inputBuffer.getChannelData(0);
    const outputData = outputBuffer.getChannelData(0);
    
    updateMeter(inputData);
    
    for (let i = 0; i < inputData.length; i++) {
        audioBufferQueue.push(inputData[i]);
    }
    
    while (audioBufferQueue.length > delaySamples + inputData.length) {
        audioBufferQueue.shift();
    }
    
    if (audioBufferQueue.length < delaySamples) {
        for (let i = 0; i < outputData.length; i++) {
            outputData[i] = 0;
        }
        return;
    }
    
    const now = Date.now();
    const isMuted = (now - lastCensorTime < 250);
    
    for (let i = 0; i < outputData.length; i++) {
        const delayedSample = audioBufferQueue.shift();
        
        if (isMuted) {
            outputData[i] = 0;
        } else {
            outputData[i] = delayedSample;
        }
    }
}

/**
 * Запуск обработки
 */
async function startProcessing() {
    if (isProcessing) return;
    
    lastCensorTime = 0;
    censoringNow = false;
    audioBufferQueue = [];
    
    try {
        addLog('🎤 Запрос доступа к микрофону...');
        
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            } 
        });
        
        addLog('✅ Микрофон готов');
        await initAudioContext();
        
        delaySamples = Math.floor(sampleRate * DELAY_MS / 1000);
        
        if (soundUpload.files.length > 0) {
            censorSoundBuffer = await loadCensorSound(soundUpload.files[0]);
        } else {
            censorSoundBuffer = generateBeepBuffer();
            addLog('🔔 Используется приятный звук заглушки');
        }
        
        sourceNode = audioContext.createMediaStreamSource(mediaStream);
        processorNode = audioContext.createScriptProcessor(2048, 1, 1);
        processorNode.onaudioprocess = processAudio;
        
        sourceNode.connect(processorNode);
        processorNode.connect(audioContext.destination);
        
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            fastRecognition = initFastSpeechRecognition();
            if (fastRecognition) {
                recognitionActive = true;
                fastRecognition.start();
                addLog('🎙️ Распознавание речи запущено (русский + английский мат)');
            }
        }
        
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }
        
        isProcessing = true;
        updateStatus(true, `Активна - мат глушится (задержка ${DELAY_MS} мс)`);
        addLog(`✅ Готово! Задержка голоса ${DELAY_MS} мс позволяет перекрывать мат вовремя`);
        addLog(`📋 Загружено матов: русских ${profanityListRussian.length}, английских ${profanityListEnglish.length}, всего ${profanityList.length}`);
        
    } catch (err) {
        addLog(`❌ Ошибка: ${err.message}`, 'error');
        updateStatus(false, 'Ошибка');
        
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;
        }
    }
}

/**
 * Остановка обработки
 */
function stopProcessing() {
    if (!isProcessing) return;
    
    isProcessing = false;
    recognitionActive = false;
    
    if (fastRecognition) {
        try {
            fastRecognition.stop();
        } catch(e) {}
        fastRecognition = null;
    }
    
    if (processorNode) {
        processorNode.disconnect();
        processorNode = null;
    }
    if (sourceNode) {
        sourceNode.disconnect();
        sourceNode = null;
    }
    if (audioContext) {
        audioContext.close().then(() => { audioContext = null; });
    }
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
    
    audioBufferQueue = [];
    censoringNow = false;
    
    updateStatus(false, 'Остановлен');
    addLog('⏹️ Обработка остановлена');
}

/**
 * Получение устройств вывода
 */
async function enumerateOutputDevices() {
    try {
        addLog('🔍 Поиск устройств вывода...');
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
        
        outputDeviceSelect.innerHTML = '<option value="">Системное устройство</option>';
        
        audioOutputs.forEach(device => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            
            let deviceName = device.label || `Устройство ${device.deviceId.slice(0, 8)}`;
            if (deviceName.includes('CABLE')) deviceName = '🔌 Виртуальный кабель (VB-Cable)';
            if (deviceName.includes('BlackHole')) deviceName = '🌀 BlackHole';
            if (deviceName.includes('Speakers')) deviceName = '🔊 Колонки';
            if (deviceName.includes('Headphones')) deviceName = '🎧 Наушники';
            if (deviceName.includes('AirPods')) deviceName = '🎧 AirPods';
            
            option.textContent = deviceName;
            outputDeviceSelect.appendChild(option);
        });
        
        addLog(`✅ Найдено: ${audioOutputs.length} устройств вывода`);
    } catch (err) {
        addLog(`❌ Ошибка: ${err.message}`, 'error');
    }
}

/**
 * Переключение устройства вывода
 */
async function switchOutputDevice(deviceId) {
    if (!audioContext) {
        activeSinkId = deviceId;
        addLog(`📌 Устройство сохранено для следующего запуска`);
        return;
    }
    
    if (!audioContext.setSinkId) {
        addLog('⚠️ Переключение на лету не поддерживается', 'warning');
        return;
    }
    
    try {
        await audioContext.setSinkId(deviceId);
        activeSinkId = deviceId;
        const deviceName = deviceId ? (outputDeviceSelect.options[outputDeviceSelect.selectedIndex]?.textContent || deviceId) : 'системное';
        addLog(`✅ Вывод на: ${deviceName}`);
    } catch (err) {
        addLog(`❌ Ошибка: ${err.message}`, 'error');
    }
}

/**
 * Предпросмотр звука
 */
async function previewSound() {
    if (!censorSoundBuffer) {
        if (soundUpload.files.length > 0) {
            try {
                censorSoundBuffer = await loadCensorSound(soundUpload.files[0]);
            } catch (err) {
                addLog(`❌ Ошибка загрузки`, 'error');
                return;
            }
        } else {
            censorSoundBuffer = generateBeepBuffer();
        }
    }
    
    playCensorSound();
    addLog('🔊 Предпросмотр звука заглушки');
}

// ============ Обработчики событий ============
startBtn.addEventListener('click', startProcessing);
stopBtn.addEventListener('click', stopProcessing);
requestDeviceBtn.addEventListener('click', enumerateOutputDevices);
previewSoundBtn.addEventListener('click', previewSound);
outputDeviceSelect.addEventListener('change', (e) => switchOutputDevice(e.target.value));

soundUpload.addEventListener('change', async (e) => {
    if (e.target.files.length > 0) {
        try {
            censorSoundBuffer = await loadCensorSound(e.target.files[0]);
            addLog(`✅ Звук "${e.target.files[0].name}" готов`);
        } catch (err) {
            addLog(`❌ Ошибка загрузки звука`, 'error');
        }
    }
});

// Инициализация
enumerateOutputDevices();
navigator.mediaDevices.addEventListener('devicechange', enumerateOutputDevices);

window.addEventListener('beforeunload', () => {
    if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
    if (audioContext) audioContext.close();
    if (fastRecognition) fastRecognition.stop();
});

addLog('🎙️ Система готова! Мат заменяется приятным мелодичным звуком');
addLog(`⏱️ Задержка голоса ${DELAY_MS} мс для точного перекрытия мата`);
addLog(`🌍 Поддерживаются русские и английские маты (${profanityListEnglish.length} EN слов)`);
