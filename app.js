// Получаем элементы UI
const micSelect = document.getElementById('micSelect');
const outputSelect = document.getElementById('outputSelect');
const pitchSlider = document.getElementById('pitch');
const pitchVal = document.getElementById('pitchVal');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');

let audioCtx, sourceNode, pitchNode, destination;

// Обновляем отображаемое значение ползунка
pitchSlider.oninput = () => pitchVal.textContent = pitchSlider.value;

// Заполняем списки устройств
async function enumerateDevices() {
  const devices = await navigator.mediaDevices.enumerateDevices();

  micSelect.innerHTML = '';
  outputSelect.innerHTML = '';

  devices.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.deviceId;
    opt.textContent = d.label || `${d.kind} ${d.deviceId}`;

    if (d.kind === 'audioinput') micSelect.appendChild(opt);
    if (d.kind === 'audiooutput') outputSelect.appendChild(opt);
  });
}

// Запуск потока
async function start() {
  startBtn.disabled = true;
  stopBtn.disabled = false;

  const micId = micSelect.value;
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {deviceId: micId ? {exact: micId} : undefined}
  });

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  // Выбор устройства вывода (если поддерживается)
  if (typeof audioCtx.setSinkId === 'function') {
    const sinkId = outputSelect.value;
    audioCtx.setSinkId(sinkId).catch(console.error);
  }

  sourceNode = audioCtx.createMediaStreamSource(stream);

  // Питч‑шifter: меняем частоту воспроизведения
  pitchNode = audioCtx.createPlaybackRate();
  pitchNode.playbackRate.value = parseFloat(pitchSlider.value);

  // Подключаем цепочку
  sourceNode.connect(pitchNode);
  pitchNode.connect(audioCtx.destination);
}

// Остановка
function stop() {
  startBtn.disabled = false;
  stopBtn.disabled = true;
  if (audioCtx) audioCtx.close();
}

// Инициализация
enumerateDevices();
navigator.mediaDevices.ondevicechange = enumerateDevices;

startBtn.onclick = start;
stopBtn.onclick = stop;
