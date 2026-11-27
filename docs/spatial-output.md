# Spatial output · primera integración online

Implementado 2026-11-26. La versión web ofrece monitor ST de un grafo de salidas discretas, vista de parlantes y render offline multicanal. La salida física en vivo desde este grafo al puente Node sigue siendo el próximo paso; no confundir el test local anterior con una conexión ya instalada en el editor.

## Tres escrituras de p

```text
!spk[000 900 909 009]
!vs
s220v1e0'8p[o1>2]
```

Este patch envía al parlante ID1 y cruza linealmente hasta ID2 durante ocho segundos. Los otros dos canales permanecen en cero. No hay DBAP, normalización de ganancias, retardo ni filtro de compensación. Las cadenas de efectos escritas siguen aplicándose; el modo raw no las elimina.

- `p[o1]`: salida discreta ID1. `p[o1>2]` / `p[o2<1]`: crossfade lineal de amplitud entre IDs declarados. No implica potencia constante; el cambio de energía es parte de ese gesto directo.
- `p[o 9 0 0 9]`: vector de ganancias en orden de las filas de !spk. 0…9, 9 = unidad. Permite rampas por componente: `p[o 9>0 0>9 0 0]`. No normaliza; un vector cero es silencio.
- `p[x -1 0 -1]>[x 1 0 1]`: trayectoria XYZ, realizada por DBAP. `p[423>111]` es la escritura compacta equivalente por dígitos. `p[x 0 0 0]` da el centro exacto.

La posición física y el output discreto son dos alternativas deliberadas. La primera distribuye amplitudes desde una ubicación virtual; la segunda nombra los objetos de reproducción. No se codifica un campo ambisónico ni se introduce un decoder HOA.

`p[-1 0 1]` conserva su significado secuencial. El `p` escalar bajo !spk recorre X, con Y/Z centrados, mediante DBAP. Sin !spk el paneo escalar sigue siendo el estéreo anterior. `o220` sigue siendo la referencia de frecuencia.

## Disposición y escala

```text
!spk[[1 -1 0 -1] [2 1 0 -1] [3 1 0 1] [4 -1 0 1]]
!spk[000 900 909 009]
```

Son declaraciones alternativas, no se escriben ambas en un score. La forma expandida tiene `[id x y z]` en metros. X derecha, Y arriba, Z profundidad; frente es Z negativo. La forma compacta asigna IDs1…N según posición en la lista; cada dígito d se convierte en `d / 4.5 - 1` metros. Así, 0 = −1, 9 = +1 y el centro matemático corresponde a 4.5, que requiere forma expandida. No redondear 5 a centro: esa pequeña asimetría está documentada.

La misma conversión se usa en p compacto, allí como coordenada normalizada. Para ubicar una fuente en la sala se usa una escala uniforme igual a la mayor coordenada absoluta de los parlantes, alrededor del origen. Es una primera transformación explícita, no un ajuste acústico. Una futura UI de sala podrá permitir origen/escala configurables.

Se admiten 1–32 parlantes; pueden compartir coordenadas, con IDs distintos. IDs únicos positivos; las coordenadas expandidas están acotadas a ±1000 m. El WAV sigue el orden de las filas. Enviar a ID8 no significa necesariamente octavo canal de archivo si se reordenaron esas filas: el JSON conserva esa asociación. El mapeo a puertos físicos sigue perteneciendo al perfil local del futuro puente.

No se aplica compensación automática de nivel, distancia, filtro o retardo de sala. Esas opciones merecen un perfil de calibración independiente y mediciones. El recuerdo de ICST es pertinente: su [AmbiDecoder](https://ambisonics.ch/icst-ambisonics-plugins/08_icst_decoder/) separa configuración/decodificación y compensaciones; este instrumento adopta la separación conceptual sin requerir ambisonics. La decisión artística aquí privilegia parlantes y trayectorias audibles desde varios lugares, sin hacer de una butaca el criterio de toda la sala.

## FOLD y Speakers

`!vs` o el menú del Editor elige Speakers. SP en el footer, More o la palette superpone el espacio de parlantes al FOLD existente. Los cuadrados llevan IDs; XYZ muestra trayectoria/conexiones ponderadas y el modo raw muestra actividad alrededor de las salidas que participan. Las posiciones y el movimiento de la cámara no controlan audio. `@pov` / `@drf` etc. conservan sus destinos de parámetros, independientes de las coordenadas acústicas.

Las coordenadas de crecimiento y los offsets visuales de un forest no se convierten implícitamente en la sala. Con !room y speakers, los growths sin p explícito usan sus XYZ para posición física; p explícito tiene prioridad. Cambiar la disposición requiere Play; cambios ordinarios de p usan U/Glide. La vista muestra ganancias de enrutamiento, no mediciones de energía de reverberación.

## Grafo de audio y límites

Las voces se procesan con el DSP existente, luego se colocan como emisores mono en N salidas. Reverb estéreo de voz y circuitos estéreo de feedback se reúnen al colocar el emisor: se conserva el proceso interno, no una anchura estéreo espacial independiente.

Un bus espacial p suma sus N lanes antes de reenviar un emisor común. Las demás etapas de bus mantienen lanes discretas: filtros, volumen, chopper y delays; las reverbs de esos buses usan retornos mono por lane. Esto evita reducir todo el bus N a una reverb estéreo. No colocar p espacial en la excitación interna de feedback; usarlo en un bus exterior. Las rampas espaciales se evalúan a 100 Hz (hasta 24001 puntos), interpoladas por AudioParam; las actualizaciones conservan el Glide configurado.

El monitor N→ST usa posiciones X de parlantes y headroom fijo `1/sqrt(N)`; es una referencia, no binaural. Esa matriz afecta sólo la escucha ST, nunca el WAV de salidas. Cámara/pan visual y su proyección no alteran la matriz.

## R: render de la partitura, independiente de REC

R en footer, More o palette abre salida y formato:

| Salida | WAV | OGG/Vorbis | MP3 |
| --- | --- | --- | --- |
| Stereo monitor | PCM24 / 48 kHz | calidad0.5 | 192 kb/s |
| Spatial | PCM24 / 48 kHz / orden discreto | Deshabilitado en esta etapa | Deshabilitado |

No son tres extensiones para el mismo archivo: se usan encoders reales. El WAV N usa WAVE_FORMAT_EXTENSIBLE: layouts raw usan máscara0, y presets con roles WAVE exactos escriben su máscara declarada. Ogg soporta multicanal, pero sus convenciones de layout/orden requieren una política adicional para salidas arbitrarias; esta entrega ofrece Ogg/MP3 como copias de escucha ST.

Renderiza una ejecución escrita, o la sección seleccionada, más colas de efectos. Incluye repeats finitos y futuros ya compilados; no el Loop indefinido del transporte ni futuras mutaciones AI. Usa seed y master actuales. Letras se preparan localmente; micrófono en vivo no se puede renderizar offline. El límite inicial de PCM es384MiB. Cancelar suprime la descarga; un OfflineAudioContext en curso puede terminar internamente.

Después de generar audio se ofrece un JSON con fuente, seed, disposición, duración, master y pico. Si la señal supera0.95, se atenúan todos los canales por el mismo factor, informado; no hay normalización por canal ni ampliación de señales débiles. La versión ST reutiliza compresor/techo del monitor; la salida N mantiene amplitudes raw y aplica solamente esa protección común al exportar.

Ver Library → Spatial output: seis archivos, desde objetos aislados y crossfades hasta matrices, feedback compartido y forest con ocho salidas.

## Room, organism and output presets · current refinement

`!room[20 8 30]` or `!r[...]` declares width X, height Y and depth Z in metres, centered at the coordinate origin. The room contour remains visible; no source view replaces it with unframed points. This origin is a coordinate reference, not a claim that one audience location measures the whole concert experience.

Compact speaker triplets under a room map each digit to its corresponding physical half-dimension; expanded speaker rows retain literal metres. In a room with speakers, growth without explicit p uses the original node XYZ as physical placement. The same affine transformation drives audio and drawing. This is a spatial realization of the organism, not a simulation of physical growth/collisions or room acoustics. Explicit p, especially raw routing, takes precedence; @ mappings continue to affect sound parameters. `!vp` keeps their independent parameter-space reading.

The physical view includes gray room edges, green growth, cyan active sound bodies/trajectories and amber speaker IDs. Co-located outputs are permitted and show all IDs at a shared anchor. `p[o1>4>3>2]` divides a voice/bus lifetime into three equal linear crossfades. It remains discrete even if IDs3 and4 occupy the same place.

### View messages

| Message | View |
| --- | --- |
| `!vc` | FOLD; shares room geometry when a room/layout exists |
| `!vp` | Parameter cube, custom @ mappings |
| `!vs` | Physical room + organism + source trajectories |
| `!vf` | Phyllotaxis points; migrated from former !vp |
| `!vl` | L-system branches and venation |
| `!vt` / `!stocky` | Temporal frequency/intensity score; !st is a legacy alias |
| `!vd` | Reserved for two cubes; not implemented |

### Layout catalog

`spk8` and `!spk8` are equivalent declarations. Common presets:

| Family | Presets | Meaning |
| --- | --- | --- |
| Front | `spk1`, `spk2`, `spk2.1`, `spk3.0`, `spk3.1` | Mono, stereo, LCR; optional LFE |
| Raw rings | `spk4`, `spk8`, `spk12` | Cyclic full-range outputs, no LFE |
| Surround | `spk4.0`, `spk5.0`, `spk5.1`, `spk6.1`, `spk7.1` | Role-labelled PCM channel layouts |
| Heights | `spk5.1.2`, `spk5.1.4`, `spk7.1.2`, `spk7.1.4`, `spk9.1.6` | Base + LFE + overhead outputs |

Names: `MON`1, `STE`2, `LCR`3.0, `QUA`4, `OCT`8, `DOD`12, `SUR`5.1. Alt arrows over a preset token cycle the catalog. Changed layouts/room dimensions require Play to rebuild the channel graph.

There is a family of standards and conventions, rather than one single numerical progression. [ITU-R BS.775-4](https://www.itu.int/dms_pubrec/itu-r/rec/bs/R-REC-BS.775-4-202212-I!!PDF-E.pdf) specifies a five-main-channel reference with optional LFE; [Dolby's layout guides](https://www.dolby.com/about/support/guide/speaker-setup-guides/) cover additional overhead arrangements. syNo provides initial geometry and channel roles, not an Atmos/DTS object encoder or certification. The center channel is a full-range channel; it is not inherently restricted to dialogue. `.1` labels content for LFE and is not interchangeable with the number of physical subwoofers used by a system.

Presets use explicit file ordering. Named surround layouts follow increasing [WAVE speaker-mask bits](https://learn.microsoft.com/en-us/windows/win32/api/mmreg/ns-mmreg-waveformatextensible) where an exact mapping exists; raw rings and layouts with unrepresentable top-middle/wide roles use mask0 plus JSON role order. `spk8` is eight full-range channels; `spk7.1` is seven main channels plus LFE. `spk12` is planar; `spk7.1.4` has twelve role-specific channels including four overheads. Ring presets scale uniformly to fit the room, retaining circular equal-angle placement rather than stretching into an ellipse.

LFE is excluded from positional DBAP. Explicit raw output routing may feed it full-band, with no hidden filter/crossover. That deliberate raw mode is not a claim of broadcast LFE conformance: BS.775 specifies band-limiting for exchanged/broadcast LFE content. Any such processing must be added explicitly. No automatic bass management or +10dB playback calibration is inserted.

### Footer and capture

The bottom groups cursor Help, editing/performance, space, outputs, agents and monitoring. R / Alt R opens offline audio render. V / Alt V records screen visuals with live audio. Shift-click V / Alt Shift V opens composition formats. The recessed video well houses smaller CC, PNG and frame controls without a surrounding border. More holds seed/hash/layout diagnostics on desktop and secondary controls on portrait phones; portrait keeps R/V visible beside the contextual command.
