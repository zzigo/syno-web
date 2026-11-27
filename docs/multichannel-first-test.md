# Primera prueba multicanal · 2026-11-26

Estado: diagnóstico implementado. No es aún el puente PCM desde la partitura ni el paneador XYZ.

## Usar ahora

Desde la raíz del proyecto:

```sh
npm run multichannel
```

Abrir http://127.0.0.1:5198. Elegir número de canales y dispositivo explícito. **Test native outputs** reproduce una sola vez 400 ms de tono y 100 ms de separación por canal, con rampas de 10 ms y pico −30 dBFS. La frecuencia identifica la salida: 220 Hz, 275 Hz, 330 Hz… STOP, Escape y Cmd/Ctrl+. detienen. No modifica el dispositivo predeterminado del sistema.

**ST preview** reproduce por el navegador una reducción estéreo de la misma señal determinista, con posiciones L→R de potencia constante. Es una reproducción de referencia separada, no monitor sincronizado del stream nativo. El servicio está limitado a loopback y no expone su inventario de dispositivos en la web pública.

**WAV · N** genera en el navegador un WAVE_FORMAT_EXTENSIBLE PCM24 a 48 kHz, con 2/4/8/16/32 canales discretos. **Channel map** exporta un JSON con frecuencias, tiempos y orden. No necesita servidor ni interfaz. El channel mask es cero: no atribuye automáticamente posiciones 5.1/7.1. Importar a una DAW con canales discretos; un reproductor puede reducir o interpretar el multicanal de otra manera. No confundir ese downmix con una prueba de salidas.

La página está en `/multichannel/` dentro del sitio estático. Los archivos locales de diagnóstico están en `output/syno-output-test-8ch.wav` y su JSON.

## Instalación en otro equipo

Las dependencias nativas están aisladas del proyecto web:

```sh
cd tools/multichannel
npm ci
npm start
```

Con npm que exija aprobación de scripts de instalación, el manifiesto autoriza únicamente audify 1.10.1. Puede hacer falta `npm rebuild audify` después de instalar. RtAudio/CoreAudio se probó en este Mac arm64 con Node 26.13.1; otras plataformas/placas requieren validación. No hace falta instalar audify para renderizar WAV/ST en la página estática.

Para enumerar dispositivos y probar por terminal:

```sh
node tools/multichannel/probe.mjs --list
node tools/multichannel/probe.mjs --device ID --channels 8
```

Los IDs son los que devuelve el backend en cada equipo; no copiar un ID de esta sesión a otra máquina. `--loopback` solamente se admite en BlackHole: captura sus entradas y compara la identidad espectral por canal. `--report archivo.json` conserva resultados. La cola de salida precarga cuatro bloques y repone uno por callback nativo; no usa un temporizador JS como reloj de audio. Cada prueba es finita y su proceso termina al cerrar el stream.

## Resultado observado

- BlackHole 16ch: pruebas de **8 y 16 canales**, Float32 intercalado, 48 kHz, bloques de 512 frames.
- Todos los retornos mostraron la frecuencia esperada como componente dominante; resultados por canal PASS. Cola final cero y sin errores enviados al callback del stream.
- El análisis compara frecuencias de prueba y contiene la fuga espectral de las ventanas: su valor no es una medición de crosstalk físico ni THD.
- CoreAudio imprimió una advertencia al enumerar sample rates de un dispositivo del inventario. La apertura y ejecución de BlackHole sí funcionaron; no presentar esa advertencia como un fallo de la prueba ni ocultarla en los diagnósticos del servicio.
- Informes: `output/multichannel-blackhole-8.json`, `output/multichannel-blackhole-16.json`.
- FFprobe reconoció el WAV generado como `pcm_s24le`, 8 canales, 48 kHz, 24 bits y 4 segundos. Cuatro tests verifican aislamiento temporal, intercalado, cabecera/PCM24 y energía del preview ST.

No se verificaron altavoces físicos, sincronía navegador→DAC, estabilidad prolongada, voces/efectos syNo en N canales, compensación de sala ni DBAP. La latencia declarada por el dispositivo virtual no representa la latencia completa del sistema.

## Exportación de partituras: siguiente integración

Conservar WAV multicanal como master portátil y ofrecer además ST y mapa JSON. La implementación actual exporta el diagnóstico; la exportación del score requiere que el grafo N esté implementado también en render offline, con duración y colas de efectos explícitas. Evitar derivar N canales desde un master ya reducido a estéreo. Para renders largos, prever escritura por bloques y RF64 al superar el límite RIFF de 4 GiB; el generador de prueba actual es corto y está acotado a 32 canales.

[Ogg/Vorbis admite hasta 255 canales](https://xiph.org/vorbis/doc/Vorbis_I_spec.html), pero es compresión perceptual y tiene convenciones de orden; queda como exportación opcional posterior. WAV PCM es la recomendación inicial para intercambio y ensayos. [WAVEFORMATEXTENSIBLE](https://learn.microsoft.com/en-us/windows/win32/api/mmreg/ns-mmreg-waveformatextensible) permite describir precisión y disposición multicanal; el mapa adjunto conserva el significado de las salidas arbitrarias de syNo.
