// Generated from library/*.syn by scripts/sync-library.mjs.
export const libraryStudies = [
  {
    "name": "Control paths · through the middle",
    "detail": "Three or more waypoints in frequency, FM, filter, pan, reverb, delay and chopper",
    "file": "Effects-paths.syn",
    "code": "# Continuous control paths: the middle value is a real waypoint, not discarded.\n# Every untimed path below follows the ten-second gate; its middle value lands at 5 s.\n# Input version: i1r5h.1>8f9>1>5p-1>1'10~?1 (requires microphone permission).\n!t[Through the middle]\ns110>330>165:s27.5>55>27.5i1>7>2v0>2>0f9>1>5h.1>8>.3r1>5>2d.1>.4>.2p-1>1>0'10\n# Own total time: s220f9>1>5'6\n# Individual segment times: s220f9>1'3>5'7\n# Reverse written order: s220f9<1<5'10\n# More vertices: s220f9>1>5>3'12\n# Shared bus: {s220'4}r0>8>0f9>1>5\n# Feedback: {n1v0.01'0.1}d.01>.03>.02g.5>1.1>.7f3>8>4v1'6\n# Spatial: spk4 s220p[000>999>444]'10\n",
    "category": "Effects"
  },
  {
    "name": "A · detached inheritance",
    "detail": "A whole motif inside each maternal/daughter capsule · N/U/D",
    "file": "A-capsule-motif.syn",
    "code": "# A · detached inheritance. N=24, U=3/9, D=0.1+4*2.9/9.\n# One capsule carries the WHOLE two-event motif, including its timing ratios.\n# Try A504 (no environmental stress), A534, then A539 (spore dispersal).\n!t[Detached inheritance]\n!vc\nA534(\ns165:s41.25i1.2>3'0.24v0>0.7>0'0.24e0f5>7'0.24r2\n0.28t220:s55i2>0.5'0.36v0>0.45>0'0.36e0f6>4'0.36r3\n)\n",
    "category": "Growth"
  },
  {
    "name": "A& · rhythmic and timbral births",
    "detail": "Proportional daughter rhythm · probability rests · related new timbres",
    "file": "autocode/08-A-rhythmic-birth.syn",
    "code": "# A& · clonal pulse, dormant gaps and timbral births.\n# AI uses the selected model. The mother remains; daughters acquire a proportional rhythm.\n# ~?2 = 20% silence per loop. Change to ~?5 for 50%, ~?9 for 90%.\n# U controls how often a related new timbre is born; N/U/D may be edited compactly.\n!t[Daughters with intervals of absence]\n!vc\nA543&(\ns165:s41.25i1.2v0>0.8>0'1.2e0f6r3p-0.5\n0.3t165:s41.25i1.8v0>0.5>0'1.2e0f5r3p0.5\n)\n",
    "category": "Autocode"
  },
  {
    "name": "07 · Biome in a room",
    "detail": "Metres / room-shaped growth / physical bodies + contour",
    "file": "spatial/07-Room-organism.syn",
    "code": "# FOLD and the room share a physical volume; green growth, cyan sound, amber speakers.\n# X width / Y height / Z depth, in metres, centered at the room origin.\n# Without an explicit p, growth occupies the room in XYZ. @ still routes sound parameters.\n# !vp = parameter cube. !vs = room + organism + trajectories. !vd is reserved.\n!t[Biome in a room]\n!room[20 8 30]\nspkOCT\n!vs\nG234@fov (s165v1e0254'0.5)\nH232@fov (t220v0.7e0254'0.7)\nS223@fov (n2v0.15e0254'0.4f5)\n",
    "category": "Spatial output",
    "loop": false,
    "seed": 3181
  },
  {
    "name": "08 · Four wires, three places",
    "detail": "Multi-hop raw p / co-located speakers retain separate IDs",
    "file": "spatial/08-Raw-path.syn",
    "code": "# Co-located speakers 3 and 4 remain different raw outputs.\n# Three equal crossfades over nine seconds: 1 -> 4 -> 3 -> 2.\n# The 4 -> 3 gesture has no geometric travel, but changes the discrete destination.\n!t[Four wires, three places]\n!r[20 10 30]\n!spk[123 323 432 432]\n!vs\ns100v0>3>0'9e0p[o1>4>3>2]\n",
    "category": "Spatial output",
    "loop": false,
    "seed": 3181
  },
  {
    "name": "09 · Layout desk",
    "detail": "Stereo / raw rings / surround / overhead presets · compare roles",
    "file": "spatial/09-Layout-desk.syn",
    "code": "# ONE active speaker layout per score. Alt+Up/Down on spk cycles the preset list.\n# Ring/full-range: spk4 spk8 spk12 / spkQUA spkOCT spkDOD\n# Stereo/front: spk1 spk2 spk2.1 spk3.0 spk3.1 / spkMON spkSTE spkLCR\n# Surround: spk4.0 spk5.0 spk5.1 spk6.1 spk7.1 / spkSUR = 5.1\n# Heights: spk5.1.2 spk5.1.4 spk7.1.2 spk7.1.4 spk9.1.6\n# spk8 is eight full-range outputs; spk7.1 is seven plus LFE.\n# spk12 is a flat ring; spk7.1.4 is seven + LFE + four overhead channels.\n# These are editable output layouts, not Atmos/DTS bitstream encoders.\n# Positional DBAP never sends to LFE. Raw p[o4] may address LFE explicitly, without automatic filtering.\n!t[Layout desk]\n!room[20 10 30]\nspk8\n!vs\ns220v0>2>0'8e0p[o1>2>3>4]\nt330v0>0.6>0'8e0p[x -1 0 -1]>[x 1 0 1]\n",
    "category": "Spatial output",
    "loop": false,
    "seed": 3181
  },
  {
    "name": "01 · Raw speakers",
    "detail": "One signal per output · explicit IDs · no spatial algorithm",
    "file": "spatial/01-Raw-speakers.syn",
    "code": "# Discrete outputs, no spatial algorithm. 1 -> 2 -> 3 -> 4.\n# !spk rows: speaker ID, X right, Y up, Z depth, metres.\n# p[o1] addresses speaker ID 1. File channels follow !spk row order.\n!t[Four objects]\n!spk[[1 -1 0 -1] [2 1 0 -1] [3 1 0 1] [4 -1 0 1]]\n!vs\ns220v0>1>0'1e0p[o1]\n1s275v0>1>0'1e0p[o2]\n2s330v0>1>0'1e0p[o3]\n3s440v0>1>0'1e0p[o4]\n",
    "category": "Spatial output",
    "loop": false,
    "seed": 3181
  },
  {
    "name": "02 · Across the wires",
    "detail": "p[o1>2] · raw linear output crossfades",
    "file": "spatial/02-Raw-crossfades.syn",
    "code": "# p[o1>2]: a linear crossfade between two raw outputs.\n# Every other output remains zero. No DBAP, calibration or gain normalization.\n# !spk compact XYZ: digits 0..9 map linearly to -1..1 metres.\n!t[Across the wires]\n!spk[000 900 909 009]\n!vs\ns110>165v0>2>0'8e0p[o1>2]\nt330>220v0>0.8>0'8e0p[o4>3]\n2n2v0>0.4>0'6e0f7>2h0.2>4p[o2>4]\n",
    "category": "Spatial output",
    "loop": false,
    "seed": 3181
  },
  {
    "name": "03 · XYZ trajectories",
    "detail": "p[423>111] / component ramps / DBAP",
    "file": "spatial/03-XYZ-trajectories.syn",
    "code": "# XYZ mode uses DBAP. Compare with 02: this interpolates a physical position.\n# Packed p[423>111] = three digits per XYZ endpoint, 0..9 -> -1..1.\n# Exact centre: p[x 0 0 0]. p[-1 0 1] still means a sequential pan.\n!t[Three trajectories]\n!spk[000 900 909 009]\n!vs\ns220v0>1>0'10e0p[423>111]\nt330v0>0.6>0'10e0p[x -1 0 -1]>[x 1 0 1]\na440v0>0.3>0'10e0f3>8p[x 0 -1>1 0]\n",
    "category": "Spatial output",
    "loop": false,
    "seed": 3181
  },
  {
    "name": "04 · Output matrix",
    "detail": "Direct output gains · no normalization",
    "file": "spatial/04-Output-matrix.syn",
    "code": "# p[o ...] specifies per-output gains, 0..9, in speaker row order.\n# No normalization: 9 9 means two unity sends. v is independent.\n!t[Matrix shadows]\n!spk[000 900 909 009]\n!vs\ns110v0>1>0'8e0p[o 9 0 0 9]\nt220v0>0.7>0'8e0p[o 0 9 9 0]\na330v0>0.3>0'8e0p[o 9>0 0>9 0 0]\n",
    "category": "Spatial output",
    "loop": false,
    "seed": 3181
  },
  {
    "name": "05 · A return between objects",
    "detail": "Whole feedback bus · reverb / chop / raw output crossfade",
    "file": "spatial/05-Shared-return.syn",
    "code": "# A shared raw crossfade after a complete feedback/effect chain.\n# Spatial p gathers this bus into one emitter; its internal feedback remains stereo.\n# Other bus effects preserve N lanes; spatial bus reverb is lane-wise mono.\n!t[A return between two objects]\n!spk[000 900 909 009]\n!vs\n{{n2v0.1'0.3e0}d0.017g1.05f5x0.3v1'6}h1r3p[o1>4]\n",
    "category": "Spatial output",
    "loop": false,
    "seed": 3181
  },
  {
    "name": "06 · Forest beside the room",
    "detail": "Eight outputs · parameter mappings independent of spatial p",
    "file": "spatial/06-Forest-and-room.syn",
    "code": "# Keep parameter XYZ mapping @fov independent of speaker placement.\n# SP in footer overlays speakers on the normal FOLD; !vs shows the room alone.\n!t[Forest beside the room]\n!spk[000 900 909 009 090 990 999 099]\n!vc\nG234@fov (s165v0.8e0254'0.35p[o1>8])\nH232@fov (t220v0.5e0254'0.5p[x -1>1 0 -1])\nS223@fov (n2v0.1e0254'0.3f6p[o3])\n",
    "category": "Spatial output",
    "loop": false,
    "seed": 3181
  },
  {
    "name": "Stocky · ramp rooms",
    "detail": "Shared v contours / strong horizontal pinch / implicit section names / detachable FOLD",
    "file": "Stocky-ramps.syn",
    "code": "# STOCKY / two rooms. Space is time; the lower plot composes ALL written v stages.\n# Pinch out strongly expands time; pinch in closes it. + / - also zoom.\n# 0, double-click or the bottom 1:1 control fits the whole score.\n# Drag / horizontal scroll pans time; F follows the current zoomed window.\n# Detach FOLD with its corner arrow or its tab context menu, then Ctrl+F fullscreen.\n!t[Ramp rooms]\n!vt\nintro=({s220v3'10e0 s330v2'10e0}v0>9>0'10)\nchorus=({s440v3'10e0 s660v2'10e0}v0>9'10)\nintro\n;\nchorus\n# Names come from the calls. No ;intro / ;chorus repetition is necessary.\n",
    "category": "Visuals"
  },
  {
    "name": "Three rooms · named sections",
    "detail": "!t title / ;intro / Cmd brackets / Stocky score / F follow",
    "file": "Named-sections.syn",
    "code": "# Three rooms / named sections, header title, Stocky score, F follow.\n# Play whole piece; Cmd/Ctrl+[ ] queues a section at the next loop.\n# While stopped, section navigation positions the cursor and selects the next Play scope.\n# Whole piece is available in the header section dropdown. F / Alt F follows time.\n!t[Three rooms]\n!vt\n!b120\n;intro\n(s220v1e0254'n4)4\n;chorus\n{(s[330 440 550 660]v2e0254'n8)2}p-1>1r3\n;<last room>\nt110v0>2>0'2e0\n",
    "category": "Synthesis"
  },
  {
    "name": "Random · exact choices and ranges",
    "detail": "Space = comma / colon = continuous / frequency, time and controls",
    "file": "Random-choices.syn",
    "code": "# EXACT CHOICES / try one active line at a time, Loop ON.\n# Space = comma. Only 100, 200 or 400 Hz, never values between.\ns?[100 200 400]v2e0254'0.3\n# s?[110,880]v2e0254'0.3\n# s?[110:880]v2e0254'0.3    # continuous logarithmic Hz interval\n# s?[110:]v2e0254'0.3       # 110 to default 1760 Hz\n# s?[:880]v2e0254'0.3       # default 55 to 880 Hz\n# !sa s[300 400 500]v2e0254'?[0.1,1]  # each cell: exactly .1 or 1 second\n# s220v?[1 3 5]p?[-1 0 1]h?[0.1:3]'1\n",
    "category": "Randomness"
  },
  {
    "name": "Shared duration · seven tones",
    "detail": "One bus gesture / missing gates inherit / written durations retained",
    "file": "buses/04-Shared-duration.syn",
    "code": "# SHARED GATE / seven simultaneous tones, one ten-second pan/filter gesture.\n# '10 supplies the missing gates; explicit note gates keep priority.\n{s100 s200 s300 s400 s500 s700 s800}p1>-1f5>3'10\n# {s100'2 2s200 s300'3}p1>-1f5>3'10  # gates: 2, 8 and 3 seconds\n# Rhythmic sequences, finite-repeat clocks and feedback excitations keep their own gates.\n",
    "category": "Buses & chains",
    "loop": false,
    "seed": 3181
  },
  {
    "name": "Studie II · Hajdu → syNo",
    "detail": "380 mixture events / 1,900 sinusoids / shared chamber / ~2:56",
    "file": "pieces/Studie-II-Hajdu.syn",
    "code": "# KARLHEINZ STOCKHAUSEN / STUDIE II (1954)\n# syNo realization of the 380-event score data in Georg Hajdu's Max example.\n# Source: Max 9 / Examples / synths / very-special-guest / stockhausen-studie-II.maxpat.\n# Real-time version: Georg Hajdu. Assistance: Les Stuck, Sven Bey, Thorsten Floth,\n# Catrin Groth, Ulrike Luttmann. Special thanks: Werner Funk.\n# Score copyright: 1954 Stockhausen Verlag. The supplied Max example states Used with permission.\n# That credit is retained; score data are NOT relicensed under syNo's 0BSD code license.\n# No Max UI, image assets, or Max DSP source are bundled.\n# See docs/hajdu-studie-ii.md for the translation and its sonic differences.\n# Exact row order, roots, mixture types, dB endpoints and rounded-ms timing are retained.\n# syNo uses e0090 edge fades, standard equal-power panning and convolution r4;\n# it does NOT contain yafr2, nor claim sample-identical sound to Max.\n# One common r4v3 output chain; the two After Studies remain separate pieces.\n# Loop OFF. Each line below is one mixture, independent from the next onset.\n# ma / mb / mc / md / me = mixture spacing 1 / 2 / 3 / 4 / 5.\n# Call arguments: root Hz, first linear intensity, last linear intensity, gate seconds.\n# * opens the next argument; *2 reuses argument 2; apostrophe * takes gate from an argument.\n!sc\n!vt\n\n# One reusable relative lattice; each mixture supplies its own root.\nu[0 111.45254855 222.90509711 334.35764566 445.81019422 557.26274277 668.71529133 780.16783988 891.62038844 1003.072937 1114.5254855 1225.9780341 1337.4305827 1448.8831312 1560.3356798 1671.7882283 1783.2407769 1894.6933254 2006.145874 2117.5984225 2229.0509711]:5/1\n\n# MIXTURE 1 / f[j] = root * 5^(j*1/25), j=0..4.\nma=(\n o*\n s[n1]v*>*e0090'*p-1\n s[n2]v*2>*3e0090'*4p-1\n s[n3]v*2>*3e0090'*4p-1\n s[n4]v*2>*3e0090'*4p-1\n s[n5]v*2>*3e0090'*4p-1\n)\n\n# MIXTURE 2 / f[j] = root * 5^(j*2/25), j=0..4.\nmb=(\n o*\n s[n1]v*>*e0090'*p-0.5\n s[n3]v*2>*3e0090'*4p-0.5\n s[n5]v*2>*3e0090'*4p-0.5\n s[n7]v*2>*3e0090'*4p-0.5\n s[n9]v*2>*3e0090'*4p-0.5\n)\n\n# MIXTURE 3 / f[j] = root * 5^(j*3/25), j=0..4.\nmc=(\n o*\n s[n1]v*>*e0090'*p0\n s[n4]v*2>*3e0090'*4p0\n s[n7]v*2>*3e0090'*4p0\n s[n10]v*2>*3e0090'*4p0\n s[n13]v*2>*3e0090'*4p0\n)\n\n# MIXTURE 4 / f[j] = root * 5^(j*4/25), j=0..4.\nmd=(\n o*\n s[n1]v*>*e0090'*p0.5\n s[n5]v*2>*3e0090'*4p0.5\n s[n9]v*2>*3e0090'*4p0.5\n s[n13]v*2>*3e0090'*4p0.5\n s[n17]v*2>*3e0090'*4p0.5\n)\n\n# MIXTURE 5 / f[j] = root * 5^(j*5/25), j=0..4.\nme=(\n o*\n s[n1]v*>*e0090'*p1\n s[n6]v*2>*3e0090'*4p1\n s[n11]v*2>*3e0090'*4p1\n s[n16]v*2>*3e0090'*4p1\n s[n21]v*2>*3e0090'*4p1\n)\n\n# SCORE / onset prefix is in seconds; gates can overlap the next event.\n{\n 0me690,1.4264038732,0.09,1.562\n 0.869mb690,0.09,0.31933205031,0.676\n 1.545mb1010,0.50610719267,0.45106851026,0.769\n 1.562me1310,0.09,1.0098166089,0.932\n 2.314mb785,0.45106851026,0.09,0.634\n 2.948mb1150,0.09,0.31933205031,0.769\n 5.588mc231,1.7957360835,0.45106851026,0.459\n 6.047mc280,0.45106851026,0.28460498942,0.404\n 6.451mc190,0.28460498942,0.09,0.354\n 6.805mc340,0.09,1.1330328706,0.594\n 7.399mc190,1.1330328706,0.09,0.459\n 10.461ma569,0.56786161003,0.31933205031,0.312\n 10.773ma607,0.31933205031,0.09,0.43\n 11.203ma533,0.09,0.71489541125,0.803\n 11.425md736,0.50610719267,0.09,0.43\n 12.018mc1230,0.3582964535,0.09,0.522\n 12.54mc690,0.09,0.71489541125,0.933\n 13.473me362,0.71489541125,1.7957360835,0.82\n 14.293me952,2.5365446381,0.9,0.558\n 14.851me500,0.9,0.09,0.634\n 15.398mb412,0.50610719267,0.09,0.226\n 15.828ma231,0.09,0.28460498942,0.257\n 16.085ma246,0.9,0.28460498942,0.154\n 16.239ma217,0.28460498942,0.50610719267,0.333\n 16.572ma190,0.50610719267,0.09,0.43\n 17.568md1400,0.50610719267,0.09,1.287\n 18.855md647,0.09,0.63715120595,1.562\n 20.417md837,0.71489541125,0.09,1.463\n 21.88md500,0.09,0.56786161003,1.206\n 23.076md1080,0.80212584432,0.09,1.373\n 24.449md319,0.09,0.71489541125,0.43\n 24.879md533,1.0098166089,0.09,0.594\n 25.039mc440,0.09,1.4264038732,0.333\n 25.372mc362,2.8460498942,0.28460498942,0.354\n 25.726mc647,0.28460498942,0.09,0.43\n 28.195me1310,0.09,4.5106851026,0.274\n 28.469me952,5.6786161003,3.582964535,0.594\n 29.063me1810,3.582964535,1.4264038732,0.404\n 29.467me690,1.4264038732,0.09,0.333\n 30.597mb263,0.50610719267,0.09,0.875\n 31.472mb299,0.09,0.40201523294,0.874\n 32.346mb440,0.40201523294,0.09,1.13\n 33.35ma690,0.09,0.71489541125,1.719\n 33.476mb340,0.50610719267,0.31933205031,0.404\n 33.662mb500,0.9,0.50610719267,0.432\n 33.88mb386,0.31933205031,0.09,0.522\n 34.094mb647,0.50610719267,0.09,0.293\n 35.682me690,2.2606977884,0.09,0.875\n 36.114mc469,0.31933205031,0.09,1.133\n 37.247mc319,0.09,0.28460498942,0.82\n 37.331md1490,0.09,0.71489541125,0.213\n 37.544md893,3.1933205031,1.2712837902,0.354\n 37.898md1930,1.2712837902,0.09,0.594\n 38.067mc263,0.40201523294,0.28460498942,1.131\n 38.748ma386,0.09,0.45106851026,0.676\n 39.198mc386,0.28460498942,0.09,0.432\n 39.424ma412,0.63715120595,0.3582964535,0.555\n 39.979ma440,0.3582964535,0.09,0.822\n 40.801ma469,0.09,0.31933205031,0.459\n 41.26ma362,0.9,0.09,0.379\n 42.373ma299,0.09,0.56786161003,0.555\n 42.928ma340,0.9,0.09,0.522\n 44.868mc893,0.56786161003,0.09,0.379\n 45.095me952,5.0610719267,0.09,0.119\n 45.214me690,0.09,1.600451469,0.432\n 45.646me2500,1.600451469,0.09,0.312\n 45.958me952,0.09,0.9,0.43\n 46.388me690,9,0.09,0.164\n 47.023md785,1.0098166089,0.09,0.875\n 47.898md607,0.80212584432,0.09,0.676\n 48.574md785,0.09,0.50610719267,0.995\n 49.569md607,1.0098166089,0.09,1.131\n 50.338mb319,0.09,0.31933205031,0.722\n 51.06mb217,0.45106851026,0.09,0.875\n 51.935mb190,0.40201523294,0.09,1.06\n 52.095ma1310,1.2712837902,0.40201523294,0.428\n 52.095ma1400,0.80212584432,0.09,0.74\n 52.095ma1590,3.1933205031,1.2712837902,0.241\n 53.264mc1080,0.09,1.2712837902,0.378\n 53.264mc736,0.09,1.600451469,1.012\n 53.264mc893,0.09,1.4264038732,1.304\n 53.264mc607,0.09,1.2712837902,1.958\n 53.264mc500,0.09,1.600451469,2.449\n 54.642mc1010,0.09,0.45106851026,0.614\n 54.869mb362,0.28460498942,0.09,0.654\n 54.995mb607,1.600451469,0.09,0.528\n 55.242mb412,0.9,0.09,0.281\n 55.396mb469,0.50610719267,0.09,0.127\n 56.065me2500,0.09,0.63715120595,0.738\n 56.469me1310,0.09,0.50610719267,0.333\n 57.519mb785,2.8460498942,1.4264038732,0.293\n 57.519mb690,2.0148490247,0.80212584432,0.724\n 57.519mb1150,1.0098166089,0.31933205031,1.102\n 57.519mb1010,1.4264038732,0.22606977884,1.36\n 57.519mb893,0.71489541125,0.09,1.693\n 60.144mb1310,0.09,1.2712837902,0.824\n 60.635mb2340,0.71489541125,1.600451469,0.333\n 60.833mc1400,0.9,0.09,0.601\n 61.008mc647,0.50610719267,0.09,0.427\n 61.207mc837,0.28460498942,0.09,0.227\n 62.361md500,0.09,0.40201523294,0.112\n 62.673ma1150,0.09,3.1933205031,0.594\n 62.673ma1230,0.09,5.0610719267,1.026\n 62.673ma1080,0.09,3.582964535,1.828\n 62.673ma952,0.09,4.5106851026,2.15\n 63.336mb1150,0.50610719267,0.09,0.182\n 63.768me1310,0.09,0.71489541125,1.875\n 64.147me690,0.1600451469,0.80212584432,1.496\n 64.501mb3680,0.09,0.31933205031,0.808\n 64.7md1700,0.09,0.9,0.609\n 64.898me1810,0.09,0.50610719267,0.411\n 65.155md2840,0.09,0.31933205031,0.154\n 65.453mb837,0.09,1.7957360835,0.227\n 65.453mb500,0.09,0.45106851026,0.539\n 65.855ma386,2.5365446381,0.09,2.625\n 66.413ma362,5.0610719267,0.09,2.067\n 66.872ma412,4.0201523294,0.09,1.608\n 67.396ma386,2.0148490247,0.09,1.084\n 67.886ma469,3.1933205031,0.09,0.594\n 69.477me690,0.09,0.40201523294,1.814\n 70.071me500,0.25365446381,0.63715120595,1.219\n 70.53me1810,0.40201523294,0.80212584432,0.76\n 70.886me1310,0.40201523294,0.50610719267,0.404\n 71.218mb1700,2.8460498942,0.09,0.769\n 72.038ma785,0.50610719267,0.22606977884,0.227\n 72.038ma893,2.8460498942,0.09,0.362\n 72.495mc952,0.09,0.3582964535,1.046\n 72.67mc2060,0.09,0.9,0.871\n 72.927mc1230,0.09,0.3582964535,0.614\n 73.071mc2670,0.09,0.3582964535,0.47\n 73.328mc1230,0.09,0.56786161003,0.213\n 74.391mc553,0.09,1.1330328706,0.164\n 74.391mc362,0.09,1.600451469,0.282\n 74.391mc647,0.09,0.56786161003,0.714\n 74.849md362,0.63715120595,0.09,1.125\n 75.483md607,0.71489541125,0.09,0.491\n 75.656mb1490,0.31933205031,0.28460498942,0.257\n 75.656mc837,1.0098166089,0.40201523294,0.55\n 75.656mc1490,1.600451469,0.28460498942,0.862\n 75.656mc1230,1.0098166089,0.09,1.104\n 78.29me1310,0.09,1.600451469,0.681\n 78.454me1810,0.1600451469,0.50610719267,0.517\n 78.68me4760,0.45106851026,0.9,0.291\n 78.767me2500,0.56786161003,0.9,0.205\n 78.886me3450,0.71489541125,0.9,0.085\n 79.303mb1400,0.09,1.7957360835,1.037\n 79.659mb1590,0.09,1.0098166089,0.681\n 79.881mb1230,0.09,2.0148490247,0.45\n 79.881ma500,0.09,3.1933205031,0.432\n 80.108md1010,0.56786161003,0.09,0.241\n 80.401md178,1.600451469,0.09,0.432\n 80.658md319,0.71489541125,0.09,0.354\n 80.899md100,1.2712837902,0.09,0.199\n 81.173md569,0.31933205031,0.09,0.293\n 81.485ma412,1.1330328706,0.09,0.119\n 81.615ma893,3.1933205031,0.09,0.164\n 81.712mb412,1.600451469,0.09,0.127\n 82.186mb263,0.50610719267,0.09,0.135\n 82.519mb1010,5.0610719267,0.09,0.164\n 82.793me952,3.582964535,0.09,0.112\n 82.957mc1010,2.8460498942,0.09,0.594\n 83.29mc2840,1.2712837902,0.09,0.459\n 83.583mc607,0.3582964535,0.09,0.404\n 83.827mc362,1.4264038732,0.09,0.522\n 84.259mc231,1.2712837902,0.09,0.312\n 84.394mc1080,2.8460498942,0.09,0.432\n 84.558mc386,0.71489541125,0.09,0.118\n 84.65mb736,0.31933205031,0.09,0.213\n 85.029mb190,0.80212584432,0.09,0.241\n 85.362mb299,5.0610719267,0.09,0.312\n 85.766mb469,2.0148490247,0.09,0.211\n 86.196mb1150,0.63715120595,0.09,0.186\n 86.552me1810,0.45106851026,0.09,0.491\n 86.696me500,0.3582964535,0.09,0.404\n 86.885mc362,0.56786161003,0.09,0.215\n 87.195ma217,0.50610719267,0.09,0.089\n 87.343ma319,0.9,0.09,0.058\n 87.57ma147,2.8460498942,0.09,0.098\n 87.724ma469,9,0.09,0.164\n 87.922me362,0.40201523294,0.09,0.404\n 88.276me690,0.45106851026,0.09,0.378\n 88.8me1310,0.9,0.09,0.432\n 89.259me2500,1.0098166089,0.09,0.356\n 89.853ma362,0.3582964535,0.09,0.144\n 90.028ma785,3.582964535,0.09,0.257\n 90.34ma1700,2.0148490247,0.63715120595,0.213\n 90.553mc1230,0.63715120595,0.09,0.105\n 90.739mc440,1.7957360835,0.09,0.08\n 90.952mc263,2.8460498942,0.09,0.227\n 91.127mc2060,1.0098166089,0.09,0.175\n 91.325mc736,0.3582964535,0.09,0.227\n 91.552md138,1.600451469,0.09,0.112\n 91.885md785,0.56786161003,0.09,0.127\n 92.039mb280,0.50610719267,0.09,0.164\n 92.126mb1400,2.2606977884,0.09,0.332\n 92.302mb893,4.0201523294,0.09,0.432\n 92.406ma647,0.56786161003,0.09,0.459\n 92.865ma203,1.1330328706,0.09,0.491\n 93.389ma138,2.2606977884,0.09,0.594\n 93.983ma440,4.5106851026,0.09,0.524\n 94.473ma299,9,0.09,0.524\n 94.997me190,0.9,0.09,0.227\n 95.29me1310,2.0148490247,0.09,0.154\n 95.722me362,0.31933205031,0.09,0.198\n 95.963md837,2.0148490247,0.09,0.087\n 96.089md469,0.63715120595,0.09,0.226\n 96.186md2670,0.3582964535,0.09,0.164\n 96.315md1490,1.600451469,0.09,0.293\n 96.459mc190,0.9,0.09,0.118\n 96.551ma952,9,0.09,0.421\n 96.715md190,0.40201523294,0.09,0.356\n 96.869md607,0.40201523294,0.09,0.274\n 96.973md1080,0.80212584432,0.09,0.459\n 97.159me690,9,0.09,0.046\n 97.323me1310,2.8460498942,0.09,0.062\n 97.473me362,0.9,0.09,0.164\n 97.599me4760,5.0610719267,0.09,0.106\n 97.73me2500,9,0.09,0.079\n 97.865mb340,0.63715120595,0.09,0.154\n 98.177mb138,1.7957360835,0.09,0.186\n 98.451mb553,0.3582964535,0.09,0.126\n 98.692mb837,1.0098166089,0.09,0.105\n 98.878mc167,0.45106851026,0.09,0.274\n 99.152mc280,2.8460498942,0.09,0.312\n 99.611mb412,0.09,2.5365446381,0.164\n 99.923md1010,0.56786161003,0.09,0.512\n 99.923md569,0.50610719267,0.09,0.274\n 99.923md340,0.28460498942,0.09,0.828\n 101.616me138,0.09,0.45106851026,2.86\n 102.25me263,0.17957360835,0.56786161003,2.226\n 103.019me500,0.40201523294,1.0098166089,1.457\n 103.358mc1700,0.71489541125,0.09,0.786\n 103.543me1810,0.71489541125,1.2712837902,0.933\n 103.79mc2840,0.80212584432,0.09,0.354\n 104.895ma952,3.1933205031,0.40201523294,1.795\n 104.895ma607,4.0201523294,1.0098166089,1.161\n 104.895ma412,6.3715120595,1.7957360835,0.869\n 104.895ma280,9,5.0610719267,0.379\n 104.895ma190,1.7957360835,0.09,2.615\n 106.798mb299,0.09,0.9,0.257\n 106.798mb190,0.09,0.80212584432,0.402\n 107.725mc1080,0.50610719267,0.09,1.564\n 107.725mc647,2.2606977884,1.1330328706,0.432\n 107.725mc386,1.0098166089,0.40201523294,0.744\n 108.424ma1700,2.2606977884,0.09,1.364\n 108.424ma1150,1.600451469,0.09,1.768\n 108.424ma553,5.6786161003,0.09,0.55\n 108.424ma362,4.0201523294,0.09,1.009\n 110.782md837,0.09,0.45106851026,5.182\n 111.844md500,0.14264038732,0.50610719267,4.121\n 112.977md2840,0.3582964535,0.9,2.988\n 113.972md263,0.63715120595,1.1330328706,1.993\n 114.905md1490,1.0098166089,1.600451469,1.06\n 115.915me190,5.0610719267,0.09,0.154\n 116.142mb2200,0.09,4.0201523294,0.846\n 116.142mb893,0.09,1.7957360835,2.073\n 116.142mb569,0.09,2.2606977884,1.551\n 116.988mc100,0.45106851026,0.09,2.097\n 117.262mc469,0.80212584432,0.09,1.823\n 117.856mc785,1.1330328706,0.09,1.228\n 118.26mc299,1.7957360835,0.09,0.824\n 118.751mc167,3.1933205031,0.09,0.333\n 119.649md2060,0.9,0.31933205031,0.744\n 119.649md1080,0.63715120595,0.22606977884,0.862\n 119.649md362,1.0098166089,0.63715120595,0.312\n 119.649md190,0.56786161003,0.09,1.175\n 120.722me500,0.09,0.45106851026,1.378\n 121.394ma299,9,0.09,0.274\n 121.542me3450,0.31933205031,0.45106851026,0.558\n 121.988mb837,0.09,2.0148490247,0.883\n 121.988mb533,0.09,3.582964535,0.665\n 121.988mb340,0.09,1.2712837902,1.301\n 121.988mb217,0.09,5.0610719267,0.306\n 121.988mb138,0.09,1.0098166089,1.667\n 125.582ma469,9,0.09,0.43\n 125.582ma138,5.6786161003,0.09,1.563\n 125.968md1150,0.80212584432,0.09,0.677\n 126.132mc263,0.31933205031,0.09,0.726\n 126.244mc1230,0.40201523294,0.09,0.614\n 126.43mc736,0.71489541125,0.09,0.428\n 126.616mc1930,0.9,0.09,0.241\n 127.608me362,0.09,0.31933205031,1.545\n 128.067me190,0.20148490247,0.50610719267,1.085\n 128.558me1310,0.45106851026,0.9,0.594\n 129.897mb607,0.09,1.1330328706,2.176\n 129.897mb386,0.09,3.1933205031,0.634\n 129.897mb246,0.09,1.7957360835,1.454\n 129.897mb157,0.09,0.9,2.852\n 133.211ma263,1.600451469,0.09,1.14\n 133.565ma386,3.1933205031,0.09,0.786\n 133.919ma1230,4.5106851026,0.09,0.432\n 134.351me952,1.600451469,0.09,0.085\n 134.351me2500,1.0098166089,0.09,0.205\n 134.351me362,0.71489541125,0.09,0.369\n 134.351me4760,0.45106851026,0.09,0.681\n 134.351me690,0.31933205031,0.09,0.908\n 135.729md1400,0.40201523294,0.31933205031,0.213\n 135.729md785,0.31933205031,0.09,0.672\n 136.082mb412,0.09,2.8460498942,0.875\n 136.514mc190,0.71489541125,0.09,0.293\n 137.441mc280,1.1330328706,0.09,0.135\n 137.698mc340,1.2712837902,0.09,0.092\n 139.26mc213,1.600451469,0.09,0.199\n 139.664me1310,0.45106851026,0.09,1.164\n 140.096ma533,1.4264038732,0.09,0.459\n 140.096ma785,1.1330328706,0.09,0.717\n 140.488md1080,0.09,0.45106851026,1.577\n 142.065md1930,0.40201523294,0.28460498942,0.404\n 142.469md190,0.28460498942,0.09,0.257\n 142.726md607,0.09,0.31933205031,0.995\n 143.721md340,0.3582964535,0.09,0.634\n 144.17mb386,0.09,0.80212584432,0.727\n 144.257mb157,0.09,1.1330328706,0.64\n 144.303mb100,0.09,1.7957360835,0.594\n 144.542me1810,0.3582964535,0.09,1.547\n 145.058me263,0.9,0.09,1.031\n 145.878me138,3.582964535,0.09,0.211\n 146.592mb386,0.50610719267,0.09,0.154\n 146.673mb340,0.28460498942,0.09,0.055\n 146.985mc469,0.09,3.1933205031,0.634\n 146.985mc280,0.09,0.71489541125,1.766\n 146.985mc785,0.09,0.31933205031,1.878\n 146.985mc167,0.09,1.1330328706,2.077\n 146.985mc100,0.09,0.56786161003,2.433\n 148.57ma440,5.6786161003,1.1330328706,0.432\n 149.002ma362,1.1330328706,0.09,0.118\n 149.12ma386,0.09,0.56786161003,1.562\n 149.581md1150,1.600451469,0.09,0.404\n 149.808ma299,3.1933205031,2.5365446381,0.076\n 149.808ma203,2.2606977884,1.0098166089,0.432\n 149.808ma647,2.0148490247,0.63715120595,0.644\n 149.808ma440,1.2712837902,0.12712837902,1.239\n 149.808ma138,5.6786161003,0.09,1.366\n 150.682ma469,2.2606977884,0.09,0.227\n 151.977mc569,1.1330328706,0.09,0.581\n 152.039md263,0.09,0.80212584432,0.135\n 152.174md837,1.600451469,0.50610719267,0.075\n 152.249md1490,0.50610719267,2.8460498942,0.257\n 152.594mb569,0.09,0.28460498942,2.333\n 152.78mb893,0.11330328706,0.31933205031,2.147\n 153.073mb362,0.10098166089,0.40201523294,1.854\n 154.206mb2200,0.31933205031,0.45106851026,0.722\n 155.094me362,0.09,0.3582964535,0.333\n 155.427me263,1.4264038732,0.09,0.722\n 156.93md138,0.09,0.71489541125,0.594\n 156.93md785,0.09,0.63715120595,0.759\n 157.497ma440,1.600451469,0.56786161003,0.072\n 157.584mb412,0.56786161003,0.09,0.379\n 157.917mb469,0.80212584432,0.09,0.82\n 158.977mb362,2.0148490247,0.09,0.181\n 160.539mb533,0.63715120595,0.09,0.558\n 161.261mb607,5.0610719267,0.09,0.378\n 161.752me690,0.09,0.80212584432,0.594\n 162.346me190,3.1933205031,0.80212584432,0.105\n 162.451me362,0.80212584432,0.45106851026,0.186\n 162.637me2500,0.45106851026,2.0148490247,0.059\n 163.071mc500,0.71489541125,0.09,0.933\n 164.004mc893,0.09,2.8460498942,1.562\n 164.172mb217,0.09,5.0610719267,0.274\n 164.336md319,1.7957360835,0.09,1.707\n 164.629md569,2.5365446381,0.09,1.415\n 164.733md1010,4.0201523294,0.09,1.311\n 165.224md100,5.0610719267,0.09,0.82\n 165.567mc1080,4.0201523294,0.09,0.333\n 166.029me690,2.8460498942,2.5365446381,0.227\n 166.256me500,2.5365446381,2.0148490247,0.033\n 166.289me1310,2.0148490247,1.1330328706,0.118\n 166.407me952,1.1330328706,0.80212584432,0.062\n 166.469me1810,0.80212584432,0.09,0.432\n 167.179mc440,0.09,0.31933205031,0.594\n 167.734mc569,0.3582964535,0.09,0.241\n 167.773mc263,0.63715120595,0.09,0.241\n 168.533mc469,1.1330328706,0.09,0.356\n 169.466mc386,9,0.09,0.722\n 171.028ma121,4.0201523294,0.28460498942,0.82\n 171.848ma138,0.28460498942,3.1933205031,0.43\n 172.278ma100,5.0610719267,0.09,1.562\n 173.84ma129,0.09,3.582964535,0.594\n 174.434ma107,4.5106851026,0.09,1.093\n 174.434ma107,4.5106851026,0.09,1.093\n}r4v3\n",
    "category": "Pieces",
    "loop": false,
    "seed": 3181
  },
  {
    "name": "Absolute Hz · one table",
    "detail": "u[f ...] / exact discrete frequencies / indexed voices / growth",
    "file": "tunings/16-Absolute-Hz.syn",
    "code": "# EXACT Hz / discrete table, not cents and not MIDI.\n# Positions refer directly to the written table; o does not transpose an absolute table.\n# + / - still shift an indexed entry by an octave; out-of-table positions are errors.\n# Cents and ratio scales keep their existing repeating-period behavior.\n!b100 !sa\nu[f 178.496293 190.365394 217.132941 246.180634 280.133322 319.239317 362.389832]\ns[n1 2 3 5 7 5 3 2]v1.5e0254'n8p-0.4r2\nt[n7 5 4 3]v0.7e1354'n4p0.4r3\n# TRY the same table on growth: comment the two sequence rows first.\n# A234 s220v0.7e0254'0.3\n# Reusable table-position, intensity and duration arguments:\n# tone=s[n*]v*e0090'*\n# tone2,1.2,0.4\n# * opens a function argument; *2 reuses argument 2. It is NOT a rhythm multiplier.\n",
    "category": "Tunings"
  },
  {
    "name": "After Studie I · spectral miniature",
    "detail": "Original procedural study / pure sine spectra / 42 s / not a score reconstruction",
    "file": "pieces/After-Studie-I.syn",
    "code": "# AFTER STUDIE I / original procedural miniature / 42 seconds / Loop OFF.\n# Reference: Stockhausen, Studie I (1953), programme note published by IRCAM.\n# Individual sine frequencies, levels, attacks and lifetimes compose each spectrum.\n# This is a new event schedule, NOT a transcription or the original recording.\n# Source/provenance: docs/historical-studies.md in the development repository.\n# Every line is one independently shaped pure sine; no FM or borrowed score data.\n\n# SPECTRUM 01 / 3 independent sine components.\n0s211v0'0.12>1.9'1.33>0'0.25e0p0\n0.017s293v0'0.139>1.2'1.1965>0'0.271e0p0\n0.034s419v0'0.158>0.75'1.063>0'0.292e0p0\n\n# SPECTRUM 02 / 4 independent sine components.\n2.3s137v0'0.12>1.2'2.03>0'0.25e0p0\n2.317s349v0'0.139>1.7'1.858>0'0.271e0p0\n2.334s521v0'0.158>0.8'1.686>0'0.292e0p0\n2.351s733v0'0.177>0.5'1.514>0'0.313e0p0\n\n# SPECTRUM 03 / 2 independent sine components.\n6s463v0'0.12>1.9'0.73>0'0.25e0p0\n6.017s619v0'0.139>1.3'0.6295>0'0.271e0p0\n\n# SPECTRUM 04 / 5 independent sine components.\n8s173v0'0.12>1.5'2.83>0'0.25e0p0\n8.017s277v0'0.139>1.1'2.614>0'0.271e0p0\n8.034s443v0'0.158>0.8'2.398>0'0.292e0p0\n8.051s709v0'0.177>0.6'2.182>0'0.313e0p0\n8.068s1133v0'0.196>0.4'1.966>0'0.334e0p0\n\n# SPECTRUM 05 / 3 independent sine components.\n12.5s317v0'0.12>1.7'1.23>0'0.25e0p0\n12.517s503v0'0.139>1.2'1.102>0'0.271e0p0\n12.534s797v0'0.158>0.7'0.974>0'0.292e0p0\n\n# SPECTRUM 06 / 4 independent sine components.\n15s109v0'0.12>1.5'2.33>0'0.25e0p0\n15.017s233v0'0.139>1.2'2.1415>0'0.271e0p0\n15.034s487v0'0.158>0.9'1.953>0'0.292e0p0\n15.051s977v0'0.177>0.6'1.7645>0'0.313e0p0\n\n# SPECTRUM 07 / 6 independent sine components.\n19s223v0'0.12>1.6'2.93>0'0.25e0p0\n19.017s367v0'0.139>1.2'2.7085>0'0.271e0p0\n19.034s601v0'0.158>0.9'2.487>0'0.292e0p0\n19.051s983v0'0.177>0.7'2.2655>0'0.313e0p0\n19.068s1609v0'0.196>0.5'2.044>0'0.334e0p0\n19.085s2633v0'0.215>0.3'1.8225>0'0.355e0p0\n\n# SPECTRUM 08 / 2 independent sine components.\n23.5s569v0'0.12>2'0.44>0'0.24e0p0\n23.517s887v0'0.139>1'0.3902>0'0.2268e0p0\n\n# SPECTRUM 09 / 3 independent sine components.\n26s149v0'0.12>1.6'1.83>0'0.25e0p0\n26.017s383v0'0.139>1.1'1.669>0'0.271e0p0\n26.034s991v0'0.158>0.7'1.508>0'0.292e0p0\n\n# SPECTRUM 10 / 5 independent sine components.\n30s197v0'0.12>1.8'3.23>0'0.25e0p0\n30.017s311v0'0.139>1.3'2.992>0'0.271e0p0\n30.034s491v0'0.158>0.9'2.754>0'0.292e0p0\n30.051s773v0'0.177>0.6'2.516>0'0.313e0p0\n30.068s1217v0'0.196>0.4'2.278>0'0.334e0p0\n\n# SPECTRUM 11 / 4 independent sine components.\n35s421v0'0.12>1.5'1.33>0'0.25e0p0\n35.017s673v0'0.139>1.1'1.1965>0'0.271e0p0\n35.034s1069v0'0.158>0.7'1.063>0'0.292e0p0\n35.051s1699v0'0.177>0.4'0.9295>0'0.313e0p0\n\n# SPECTRUM 12 / 3 independent sine components.\n38s157v0'0.12>1.7'3.63>0'0.25e0p0\n38s397v0'0.139>1.1'3.59>0'0.271e0p0\n38s1003v0'0.158>0.6'3.55>0'0.292e0p0\n\n",
    "category": "Pieces",
    "loop": false,
    "seed": 3181
  },
  {
    "name": "After Studie II · tape apparatus",
    "detail": "Five-tone mixtures / hear only the chamber tail / original schedule",
    "file": "pieces/After-Studie-II.syn",
    "code": "# AFTER STUDIE II / five-tone tape apparatus / original procedural miniature.\n# Reference: the instrument-construction research of Antonio de Sousa Dias.\n# https://github.com/asousadias/Stockhausen_ElektronischStudie2_1954\n# This is NOT his score excerpt and NOT a complete reconstruction of Studie II.\n# Frequencies derive independently from 100 * 5^(k/25); five mixture widths.\n# Five 55.5 ms sine slices excite a reverb; every dry slice ends at 277.5 ms.\n# Each output contour remains exactly ZERO through at least 350 ms.\n# Consequently only the chamber tail is heard. Reverb is the material, not decoration.\n# syNo r9 uses its existing synthetic 6.65 s stereo IR, not the historical 10 s chamber.\n# New onsets, envelopes and object order below are composed for this syNo miniature.\n# Loop OFF. Source/provenance: docs/historical-studies.md.\n\n# Exact absolute-frequency table: one definition, one-based n positions.\nu[f 100 106.649494 113.741146 121.304357 129.370483 137.972966 147.147471 156.932033 167.36722 178.496293 190.365394 203.02373 216.523781 230.921517 246.27663 262.65278 280.117862 298.744283 318.609267 339.795172 362.389832 386.486923 412.186348 439.594656 468.825477 500 533.247471 568.705731 606.521786 646.852417 689.864831 735.737353 784.660166 836.836098 892.481466 951.826969 1015.11865 1082.6189 1154.60759 1231.38315 1313.2639 1400.58931 1493.72141 1593.04633 1698.97586 1811.94916 1932.43461 2060.93174 2197.97328 2344.12739 2500 2666.23736 2843.52865 3032.60893 3234.26208 3449.32415 3678.68676 3923.30083 4184.18049 4462.40733 4759.13485 5075.59324 5413.09452 5773.03793 6156.91575 6566.31951 7002.94655 7468.60707 7965.23167 8494.87929 9059.7458 9662.17307 10304.6587 10989.8664 11720.6369 12500 13331.1868 14217.6433 15163.0446 16171.3104 17246.6208]\n\nshort=({\n s[n*]v0'0.003>2.4'0.0495>0'0.003e0p0'0.0555\n 0.0555s[n*]v0'0.003>2.4'0.0495>0'0.003e0p0'0.0555\n 0.111s[n*]v0'0.003>2.4'0.0495>0'0.003e0p0'0.0555\n 0.1665s[n*]v0'0.003>2.4'0.0495>0'0.003e0p0'0.0555\n 0.222s[n*]v0'0.003>2.4'0.0495>0'0.003e0p0'0.0555\n}r9v0>0>*>*>0'1.4)\n\nmiddle=({\n s[n*]v0'0.003>2.4'0.0495>0'0.003e0p0'0.0555\n 0.0555s[n*]v0'0.003>2.4'0.0495>0'0.003e0p0'0.0555\n 0.111s[n*]v0'0.003>2.4'0.0495>0'0.003e0p0'0.0555\n 0.1665s[n*]v0'0.003>2.4'0.0495>0'0.003e0p0'0.0555\n 0.222s[n*]v0'0.003>2.4'0.0495>0'0.003e0p0'0.0555\n}r9v0>0>*>*>0'2)\n\nlong=({\n s[n*]v0'0.003>2.4'0.0495>0'0.003e0p0'0.0555\n 0.0555s[n*]v0'0.003>2.4'0.0495>0'0.003e0p0'0.0555\n 0.111s[n*]v0'0.003>2.4'0.0495>0'0.003e0p0'0.0555\n 0.1665s[n*]v0'0.003>2.4'0.0495>0'0.003e0p0'0.0555\n 0.222s[n*]v0'0.003>2.4'0.0495>0'0.003e0p0'0.0555\n}r9v0>0>*>*>0'2.8)\n\n# Five families, two/three widths alternating; every cell has five sine slices.\n# Function arguments: five Hz-table positions, then two output-envelope levels.\n\n# OBJECT 01 / lattice step 9, mixture spacing 1.\nshort10,11,12,13,14,4.8,1.2\n;0.35\n# OBJECT 02 / lattice step 24, mixture spacing 1.\nlong25,26,27,28,29,1.1,4.5\n;0.8\n# OBJECT 03 / lattice step 15, mixture spacing 1.\nmiddle16,17,18,19,20,3.5,0.8\n;0.15\n# OBJECT 04 / lattice step 32, mixture spacing 3.\nshort33,36,39,42,45,1.1,4.5\n;0.55\n# OBJECT 05 / lattice step 20, mixture spacing 3.\nlong21,24,27,30,33,3.5,0.8\n;0.25\n# OBJECT 06 / lattice step 27, mixture spacing 3.\nmiddle28,31,34,37,40,4.8,1.2\n;0.35\n# OBJECT 07 / lattice step 12, mixture spacing 5.\nshort13,18,23,28,33,3.5,0.8\n;0.8\n# OBJECT 08 / lattice step 35, mixture spacing 5.\nlong36,41,46,51,56,4.8,1.2\n;0.15\n# OBJECT 09 / lattice step 22, mixture spacing 5.\nmiddle23,28,33,38,43,1.1,4.5\n;0.55\n# OBJECT 10 / lattice step 17, mixture spacing 2.\nshort18,20,22,24,26,4.8,1.2\n;0.25\n# OBJECT 11 / lattice step 30, mixture spacing 2.\nlong31,33,35,37,39,1.1,4.5\n;0.35\n# OBJECT 12 / lattice step 11, mixture spacing 2.\nmiddle12,14,16,18,20,3.5,0.8\n;0.8\n# OBJECT 13 / lattice step 26, mixture spacing 4.\nshort27,31,35,39,43,1.1,4.5\n;0.15\n# OBJECT 14 / lattice step 18, mixture spacing 4.\nlong19,23,27,31,35,3.5,0.8\n;0.55\n# OBJECT 15 / lattice step 33, mixture spacing 4.\nmiddle34,38,42,46,50,4.8,1.2\n",
    "category": "Pieces",
    "loop": false,
    "seed": 3181
  },
  {
    "name": "Soft machines · lyric song",
    "detail": "2:40 / 144 BPM / psytrance-vaporwave / original lyrics / cinema captions",
    "file": "pieces/Soft-machines.syn",
    "code": "# SOFT MACHINES / original lyric song / 144 BPM / 96 bars / 2:40 / Loop OFF.\n# Psytrance pulse, vaporwave harmony, plastic digital debris; an intimate chorus inside the machine.\n# Original speculative-fiction lyrics: future leaks, mineral memory and obsolete consumer dreams.\n# First Play prepares 12 local Kokoro phrases. English af_heart; written text stays local.\n# l_ = sung/recited verse + yellow cinema subtitles. w0 raw voice ... w9 vocoder.\n# Read one instrument per row; ; advances sections by their actual duration.\n!b144 !sa\n\n# INSTRUMENTS / each rhythm row spans one 4/4 bar.\nkick=((s74>44'0.08v4e0092'n4p0)4)\nbass=(a[~ 55 55 82.5 ~ 55 49 55]v1.1e0012'n8f2.4>4'0.06p-0.08)\nhats=(n[~ 1 ~ 1 ~ 1 ~ 1]v0.35e0001'n8f8.4p0.45r1)\nsnare=(n[~ 1 ~ 1]v0.65e0012'n4f6.5p-0.2r2)\narp=(!sc uDOR o110 a[n1 3 5 8 7 5 3 2]v0.32e1354'n8f3>7p0.5d0.208333r2)\n\n# HARMONIC FIELD / two continuous voices / four bars.\npad=(\n !sc uJMI o110 t[n1 5 3 8 7 3 5 2]v0.55e1354'n2r5p-0.55\n u31 o110 a[n1 11 19 31 27 19 11 1]v0.16e1354'n2f3.6r5p0.55\n)\n# Four-bar cells. All clocks share the same written bar grid.\nrhythm=((kick bass hats snare)4)\nveil=((hats arp)4 pad)\nroll=((n[1 1 1 1 1 1 1 1]v0.35e0001'n8f4>8p-0.3>0.3)4)\nriser=(n2v0'b15>0.55'0>0'b1f2>8'b16e0p-0.6>0.6'b16)\n\n# VOICE / each line spans four bars: eight half notes, or sixteen quarter notes.\n# w transitions follow the full verse. Low wet amounts retain intelligible direct voice.\nopening=(!sc l_[Tomorrow is leaking through the ceiling of the mall.]:s[110 165 147 220 196 165 147 110]w1>3v3'n2r3)\nfirst=(!sc l_[We bought a second sunrise from a screen beneath the sea.]:a[110 165 220 247 220 196 165 147]w2>5v3'n2r2)\nsecond=(!sc l_[The escalators carry little futures in their teeth.]:s[147 165 196 220 165 147 110 147]w4>2v3'n2r2)\nthird=(!sc l_[Your face becomes a password that the weather won't forget.]:t[110 147 165 220 247 220 165 147]w2>6v3'n2r3)\nfourth=(!sc l_[I keep a tender copy where the signal used to hurt.]:a[165 196 220 247 220 165 147 110]w5>2v3'n2r2)\nunder=(!sc l_[Beneath the polished floor, the black earth learns our names.]:s[110 123.5 147 165 147 123.5 110 82.5]w1>4v3'n2r4)\nstay=(!sc l_[Stay with me until the advertisements begin to dream.]:t[147 165 220 196 165 147 123.5 110]w2>5v3'n2r4)\nmouth=(!sc l_[Do not wake the city. Let it grow another mouth.]:a[110 147 165 220 247 294 330 440]w2>8v3'n2r3)\n# Two open wet/dry endpoints: hooka2,8 goes from mostly voice to mostly machine.\nhooka=(!sc l_[Let the future enter. Leave a body at the door.]:a[220 220 247 220 165 165 196 220 294 294 247 220 196 165 147 165]w*>*v3.5'n4r2)\nhookb=(!sc l_[We are the soft machines that sing beneath the floor.]:s[165 165 196 220 247 247 220 196 165 147 165 196 220 196 165 110]w*>*v3.5'n4r2)\nclosing=(!sc l_[When the last screen closes, there is still a little light.]:s[220 196 165 147 165 147 123.5 110]w5>0v3'n2r4)\n# A final raw-voice fragment, rather than another synthetic crescendo.\nresidue=(l_[A little light.]v2'6.666666666667r4)\n\n# 01 INTRO / 8 bars / a voice is heard before the whole dance machine arrives.\nintro=({\n (kick hats)8\n (pad)2\n opening\n}f3>7r2)\n\n# 02 VERSE / 16 bars / four lyrics over an increasingly legible groove.\nverse=({\n (rhythm)4\n (pad)4\n (first ; second ; third ; fourth)\n}f5>8r1)\n\n# 03 BREAKDOWN / 8 bars / remove kick and bass; keep a damaged harmonic shelter.\nbreakone=({\n (veil)2\n (under ; stay)\n}f7>3r5p-0.3>0.3)\n\n# 04 BUILD / 8 bars / alternate rising voice and a familiar line, without swallowing consonants.\nbuildone=({\n (roll riser)2\n (pad)2\n (mouth ; stay)\n}f3>8d0.208333r2)\n\n# 05 DROP / 16 bars / the hook returns twice; wet/dry becomes part of the composition.\ndropone=({\n (rhythm arp)4\n (pad)4\n (hooka2,7 ; hookb5,2 ; hooka3,8 ; hookb6,3)\n}f8r2)\n\n# 06 SECOND BREAKDOWN / 8 bars / expose the affection inside the decaying system.\nbreaktwo=({\n (pad)2\n (hats)8\n (fourth ; under)\n}f6>2r5p0.3>-0.3)\n\n# 07 SECOND BUILD / 8 bars / two short-memory returns sit behind the text.\nbuildtwo=({\n (roll riser)2\n (pad)2\n {n2v0.015'0.03e0}g1.04d0.013f5v0.5'b32\n (stay ; mouth)\n}f3>8r3)\n\n# 08 SECOND DROP / 16 bars / same song, a brighter apparatus, more voice on the last answer.\ndroptwo=({\n (rhythm arp)4\n (pad)4\n (hooka2,8 ; hookb7,3 ; hooka4,8 ; hookb6,0)\n}f8>6r3)\n\n# 09 OUTRO / 8 bars / voice returns to its unprocessed body while percussion dissolves.\noutro=({\n (kick hats)8\n (pad)2\n (closing ; residue)\n}f6>2r4v9'b28>0'b4)\n\nintro ; verse ; breakone ; buildone ; dropone ; breaktwo ; buildtwo ; droptwo ; outro\n",
    "category": "Pieces",
    "loop": false,
    "seed": 3181
  },
  {
    "name": "Cinema · yellow lyric subtitles",
    "detail": "l_ / synchronized verse cues / raw-to-vocoder w blend",
    "file": "lyrics/04-Cinema.syn",
    "code": "# CINEMA / l_ adds synchronized yellow subtitles; l keeps the voice without subtitles.\n# One full verse cue per sounding phrase. No inferred word or phoneme alignment.\n# w0 = raw voice; w9 = vocoder; w2>8 traverses the complete verse.\n!b100 !sc\nl_[The future enters through a door made of light.]:a[110 165 220 165 147 196 165 110]w2>8v4'n2r3\n;\nl_[And leaves a little music in the walls.]:s[220 196 165 147 165 147 123.5 110]w7>1v4'n2r4\n",
    "category": "Lyrics & voice",
    "loop": false,
    "seed": 3181
  },
  {
    "name": "Output desk · named functions",
    "detail": "Eight minimal chains / comment-uncomment / explicit feedback",
    "file": "buses/01-Output-desk.syn",
    "code": "# OUTPUT DESK / choose one active case; comment/uncomment with Cmd/Ctrl+/.\n# () groups and finite repetitions; {} gathers audio; only explicit g enables feedback.\n# Processors read left-to-right. p and f ramps without a time span the whole bus.\n!b128 !sa\nroll=(n[1 1 1 1 1 1 1 1]v0.7e0012'n16f7)\nkick=(s[55 ~ ~ ~ 55 ~ ~ ~]v3e0093'n16)\n\n# 01 One named expression, one shared pan sweep.\n{roll}p1>-1\n# 02 One shared filter opens over roll's complete duration.\n# {roll}f1>8\n# 03 Combine two instruments, then filter / pan / delay / reverb the mix.\n# {kick roll}f2>8p-0.6>0.6d0.1875r3\n# 04 Chop BEFORE reverb: the tail crosses the silent gates.\n# {roll}h2r6\n# 05 Chop AFTER reverb: the wet tail is also gated.\n# {roll}r6h2\n# 06 Process each branch separately, then filter the complete mix.\n# {{kick}p-0.4 {roll}p0.4d0.1875}f3>8r3\n# 07 Pan/filter separately before and after a shared reverberant stage.\n# {{roll}p1>-1f2>8}r5f8>3p-1>1\n# 08 Feedback is explicit; its filter/delay live inside the return.\n# {{n2v0.02'0.03e0}g1.08d0.013f5v2'4}f8>2p1>-1r3\n",
    "category": "Buses & chains",
    "loop": false,
    "seed": 3181
  },
  {
    "name": "Parallel machines · nested chains",
    "detail": "Three instruments / independent branches / shared output mix",
    "file": "buses/02-Parallel-machines.syn",
    "code": "# PARALLEL MACHINES / three instrument functions / nested serial and parallel buses.\n# The outer bus hears the MIX, so its effects really share one input.\n# Read the curly scopes from inside out; effects within a suffix are left-to-right.\n# f/p without times follow the complete child form; fixed delays remain in seconds.\n!b128 !sa\nkick=(s[55 ~ ~ ~ 55 ~ ~ ~]v3e0093'n16)\nroll=(n[1 ~ 1 1 ~ 1 1 1]v0.6e0002'n16f8)\nbass=(a[55 ~ 82.5 55]v0.8e0253'n8f3)\n\n{\n {((kick roll)8)}f2>8p-0.7>0.7d0.1875r3\n {((bass)8)}f5>2h0.2>3'7.5p0.7>-0.7r2\n}f8>3r4h1v7\n",
    "category": "Buses & chains",
    "loop": false,
    "seed": 3181
  },
  {
    "name": "Return and voice · shared chain",
    "detail": "Feedback / local singing / branch pan / post-return filter",
    "file": "buses/03-Return-and-voice.syn",
    "code": "# RETURN AND VOICE / a real return plus a generated spoken modulator / shared output chain.\n# First use downloads local Kokoro. English voice; text stays local.\n# The g branch is feedback. Outer f is a post-return filter, not the feedback filter.\n# Literal pitch Hz here. Four one-second carrier cells make a four-second verse.\n{\n {{n2v0.025'0.03e0}g1.08d0.013f5v1.2'4}p-0.5f6>2\n {l[the circuit remembers every word]:a[110 165 220 147]v3'1}p0.5d0.25r3\n}f8>4r4p-0.3>0.3v6\n",
    "category": "Buses & chains",
    "loop": false,
    "seed": 3181
  },
  {
    "name": "Voice · first verse",
    "detail": "Local Kokoro / literal text / timed phrase / effects",
    "file": "lyrics/01-Voice.syn",
    "code": "# VOICE / Kokoro af_heart / local English prototype.\n# First Play downloads the local model (~95 MB); the worker renders before transport starts.\n# The whole phrase is fitted to its gate. No text is transmitted; Stop cancels preparation.\n# Omit '4 for a deterministic duration estimated from the word count.\nl[this is a verse of my first song]v4'4r2\n",
    "category": "Lyrics & voice",
    "loop": false,
    "seed": 3181
  },
  {
    "name": "Singing · continuous verse",
    "detail": "One verse across a tuned carrier melody / vocoder",
    "file": "lyrics/02-Singing.syn",
    "code": "# SINGING / one continuous phrase, independent melodic prosody.\n# The text flows once across the full melody; notes do not imply word boundaries.\n# s / t / a / q select harmonic carrier banks. s is a harmonic sine bank.\n# 'n4 is each melodic cell, so eight cells span four seconds at 120 BPM.\n# Effects follow the vocoder; parentheses still create shared effect buses.\n!b120 !sc uDOR o110\nl[the trees are singing and the forest keeps on growing]:s[n1 3 5 8 7 5 3 1]v4'n4r4p-0.3>0.3\n",
    "category": "Lyrics & voice",
    "loop": false,
    "seed": 3181
  },
  {
    "name": "Written prosody · word by word",
    "detail": "Exact word or syllable gates / musical figures / relative waits",
    "file": "lyrics/03-Written-prosody.syn",
    "code": "# WRITTEN PROSODY / manual syllable / word attacks using existing events.\n# ; advances to the next event. A newline alone means parallel music.\n# Tiny gates compress speech by resampling; use longer gates for intelligibility.\n# Each l[] is synthesized separately here, with an exact written onset and gate.\n!b80\nl[this]:a220v4'n8 ;\nl[is]:a247v3'n16 ;\nl[the]:a262v3'n16 ;\nl[first]:a330v4'n4 ;\nl[sy]:a294v4'n8 ;\nl[llable]:a220v3'n4r3\n",
    "category": "Lyrics & voice",
    "loop": false,
    "seed": 3181
  },
  {
    "name": "Pulse rows · drum-and-bass primer",
    "detail": "170 BPM / instrument rows / intro → groove → breaks → drops → outro",
    "file": "pieces/Pulse-rows.syn",
    "code": "# PULSE ROWS — a small drum-and-bass form, 170 BPM, 48 bars (~68 seconds).\n# One definition = one identifiable instrument. Each drum/bass row spans one 4/4 bar.\n# ~ is a rest cell; 'n16 = sixteenth-note cells; 'n8 = eighth-note cells.\n# Sections below repeat a PARALLEL group, then ; waits for that section to finish.\n# LOOP OFF: hear the complete form once. Alt+Enter auditions a selected row/section.\n# G is a growth generator, not the transport loop. Keep it inside spores' own scope.\n!b170 !sa\n\n# INSTRUMENT ROWS — start with kick alone, then add snare / hats / bass.\nkick=(s[55 ~ ~ ~ ~ ~ 55 ~ ~ ~ 48 ~ ~ ~ ~ ~]v3.8e0094'n16p0)\nsnare=(n[~ ~ ~ ~ 1 ~ ~ ~ ~ ~ ~ ~ 1 ~ ~ ~]v1.4e0093'n16f7r1p0.1)\nhats=(n[1 ~ 1 ~ 1 1 1 ~ 1 ~ 1 ~ 1 1 1 ~]v0.35e0001'n16f9p-0.35r1)\nbass=(q[55 ~ 55 82.5 ~ 55 49 ~]v1.1e0252'n8f3>5p-0.1r1)\n\n# A variation: same bar length, different pitches / rhythm / filter opening.\nlowbass=(a[55 55 ~ 49 55 ~ 82.5 55]v1.2e0252'n8f3>6p0.1r1)\n# Quiet burst: <= one bar, once at the start of each shared bar loop.\nspores=(G234@gop(?111v0.45>0.08i2e0254'0.11r2p-0.8>0.8))\n# Breakdown removes BOTH kick and bass; this atmospheric row still lasts one bar.\nair=(t[220 ~ 330 ~ 440 ~ 330 ~]v0.3e1354'n8r5p-0.6>0.6)\n# Build-up: one bar of rolls + a riser lasting sixteen beats / four bars.\nroll=(n[1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1]v0.45e0001'n16f6>8r2p0.2)\nriser=(n1v0'b15>0.7'0>0'b1f2>8'b16e0p-0.5>0.5'b16)\n\n# FORM — instrument names stay on individual rows so you can see each layer.\n# 01 INTRO · 4 bars · minimal percussion.\nintro=((\n kick\n hats\n)4)\n# 02 GROOVE · 8 bars · full breakbeat and bass establish the pulse.\ngroove=((\n kick\n snare\n hats\n bass\n)8)\n# 03 BREAKDOWN · 4 bars · no kick, no bass.\nbreakdown=((\n air\n)4)\n# 04 BUILD-UP · 4 bars · rolls / hats, with one long rising noise voice.\nbuild=(\n (roll hats)4\n riser\n)\n# 05 DROP · 8 bars · drums and bass return; the biological layer decorates them.\ndropone=((\n kick\n snare\n hats\n bass\n spores\n)8)\n# 06 SECOND BREAKDOWN · 4 bars.\nsecondbreak=((\n air\n)4)\n# 07 SECOND BUILD-UP · 4 bars.\nsecondbuild=(\n (roll hats)4\n riser\n)\n# 08 SECOND DROP · 8 bars · change the bass, retain the shared drum grid.\ndroptwo=((\n kick\n snare\n hats\n lowbass\n spores\n)8)\n# 09 OUTRO · 4 bars · remove bass and snare, leave mixable percussion.\noutro=((\n kick\n hats\n)4)\n\n# PLAY THE FORM — standalone calls supply section names; ; advances by their actual duration.\nintro\n;\ngroove\n;\nbreakdown\n;\nbuild\n;\ndropone\n;\nsecondbreak\n;\nsecondbuild\n;\ndroptwo\n;\noutro\n",
    "category": "Pieces",
    "loop": false,
    "seed": 3181
  },
  {
    "name": "PLAY · keyboard and touch",
    "detail": "Cmd E / Q-A pairs / eleven values from cursor / custom faders",
    "file": "PLAY-values.syn",
    "code": "# PLAY — leave the cursor at this score and Cmd/Ctrl+E.\n# Q/A: N digit; W/S: U digit; E/D: D digit; R/F: Hz;\n# T/G and Y/H: volume endpoints; U/J: FM index;\n# I/K, O/L, P/; and [/apostrophe: ADSR stages.\n# Hold Shift for a finer decimal step (discrete digits remain whole).\n# U L = next loop; U W = live writing; PLAY also performs hot edits with manual U.\n# Cmd/Ctrl+E again restores ordinary typing. E in the bottom bar does the same.\nG588@gop ?111v3>1i2e0254'0.11r4p-1>1\n# Comma shortens / period lengthens the first written time from the anchor.\n# Numeric times use seconds and their decimal calibre; n figures halve/double duration.\n# To control reverb and pan, leave PLAY, place the cursor there, enter again.\n",
    "category": "Synthesis"
  },
  {
    "name": "Sections · ; and relative waits",
    "detail": "Parallel growths / finite repetitions / next section / overlapping tails",
    "file": "Sections.syn",
    "code": "# SECTIONS — ; advances to the longest event end; ;10 adds ten seconds.\n# Without ; expressions start together. Numeric onsets use the current section origin.\n# Reverb and delay tails overlap the following section; Loop OFF auditions this form once.\n# The scoped A and G run together; repeat that complete section three times.\n(\n A543 (\n  s165:s41.25i1.2v0.6e0254'0.2p-0.5\n  0.3t165:s41.25i1.8v0.4e0254'0.2p0.5\n )\n G119 (s120v1'0.2r5)\n)3\n;2\n# Starts two seconds after the repeated growths finish.\n(s110v0.8e0254'0.5 ; t220v0.5e0254'0.5)2\n;\n# Named sections also work: opening ;10 ending\nq55v0>0.4>0'2e0f4r5\n# ;n4 waits a quarter note; ;b2 waits two beats at the current !b tempo.\n",
    "category": "Synthesis",
    "loop": false,
    "seed": 3181
  },
  {
    "name": "Generator morph · @g",
    "detail": "Ordered harmonic blends · s/t/a/q and all 16 FM pairs",
    "file": "G-generator-morph.syn",
    "code": "# GENERATOR MORPH · g is an XYZ target, on the 0–9 scale\n# s → t → a → q → s:s → s:t → s:a → s:q → … → q:q\n# Adjacent stages blend harmonic components continuously.\n# Without written FM, the modulator follows carrier / 4; i sets its depth.\n# X = generator family, Y = frequency, Z = intensity.\nG453@gov\ns110v3i2e0254'0.65\n# Compare the default map, including Z volume:\n# G453 s110v3e0254'0.65\n# Compare Z as generator family, keeping pan and frequency:\n# R453@pog t110v2i3e1354'0.8\n",
    "category": "Growth"
  },
  {
    "name": "Start here · feedback desk",
    "detail": "16 minimal comment/uncomment cases · one file · also in Help",
    "file": "Feedback-primer.syn",
    "code": "# FEEDBACK DESK — one file, one active line at a time\n# Comment the current line with #, uncomment the next one, then Cmd+Enter.\n# Loop OFF lets one circuit finish; Cmd+. / Escape stops all sound and returns.\n# Explicit g makes {} a feedback return; without g, {} is a plain audio bus.\n# Inside a return = excitation; outside = gain g, filter f, cross-feed x,\n# output level v, and circuit lifetime 'seconds. d is omitted here:\n# the internal delay defaults to 12 ms, with a slight stereo asymmetry.\n\n# 01 — dry excitation, no return circuit: hear the seed alone.\n# s220v3e0254'0.15\n\n# 02 — first closed loop: a brief seed keeps returning, then decays.\n{s220v3e0254'0.15}g0.6f8v4'4\n\n# 03 — g0: the lowpass circuit has no recirculation; one filtered seed.\n# {s220v3e0254'0.15}g0f8v4'4\n\n# 04 — longer memory: raise return gain, keep the same seed/output level.\n# {s220v3e0254'0.15}g0.94f8v4'5\n\n# 05 — grow toward self-oscillation from a small noise seed.\n# {n2v0.03e0'0.05}g1.08f7v2'8\n\n# 06 — grow, then decay: change return gain without changing output level.\n# {n2v0.03e0'0.05}g1.08>0.6'8f7v2'8\n\n# 07 — filter the recirculating signal: brightness changes on each pass.\n# {n1v0.1e0'0.05}g1.05f8>2'8v2'8\n\n# 08 — x0 isolates the returns; x1 feeds each side into the other.\n# {s220v2p-1e0254'0.15}g0.94f8x0>1'6v4'6\n\n# 09 — two excitations enter ONE shared circuit.\n# {s220v2p-0.6e0254'0.2 t330v1p0.6e0254'0.2}g0.94f7v3'6\n\n# 10 — a sustained injection: contrast this with a short starting seed.\n# {n2v0.1e0'3}g0.85f5v3'6\n\n# 11 — chop the INJECTION; the return continues between its pulses.\n# {s165v1h2e0'3}g0.94f7v3'6\n\n# 12 — chop the complete OUTPUT; the internal circuit still runs.\n# ({s165v1e0'3}g0.94f7v3'6)h2\n\n# 13 — add one reverb after the complete return circuit.\n# ({s220v2e0254'0.15}g0.94f7v3'6)r4\n\n# 14 — fade the COMPLETE result, including the reverb tail.\n# (({s220v2e0254'0.15}g0.94f7v3'6)r4)v9>0'10\n\n# 15 — two independent circuits: braces do not share their return paths.\n# {s165v2e0254'0.15}g0.92f6v3'6 {t247.5v1e0254'0.15}g0.95f7v3'6\n\n# 16 — explicit FM excitation, not a nested feedback circuit.\n# {t82.5:s27.5i4v1e0254'0.2}g1.04f6v2'8\n\n# Digital silence is not a seed. g changes regeneration; v changes listening level.\n# The audible result also depends on filtering, saturation and circuit delay.\n# Nested () compose processors. Actual refeeding requires an explicit g return.\n",
    "category": "Feedback & buses",
    "loop": false,
    "seed": 3181
  },
  {
    "name": "Growing organism · keep the past",
    "detail": "Autonomous additive writing · earlier music and loop remain intact",
    "file": "autocode/08-Growing-organism.syn",
    "code": "# ACCUMULATE: Play starts the agent automatically. No enable switch.\n# Agents -> Accumulate (default): Llama writes new layers, not a mutation index.\n# Earlier notes, timbres, effects, IDs and the 1.2-second loop are preserved.\n# Quiet new expressions appear in the editor and enter at the next loop.\n# Close Agents: growth continues. Pause / Stop / Undo explicitly control it.\n# Maximum 12 sound expressions by default; change the limit in Agents.\n!b100 !sa\nG234& (\ns[165 220 247.5 330]v0.5e0254'n8p-0.4\n0.3t82.5:s20.625i1.5v0.2e0254'0.9p0.4\n)\n",
    "category": "Autocode"
  },
  {
    "name": "FM feedback · whole-output fade",
    "detail": "FM excitation / return / reverb / postfix bus volume",
    "file": "Feedback-fm-output-fade.syn",
    "code": "# FM excitation -> feedback return -> shared reverb -> final output fade.\n# carrier : modulator; i changes modulation depth; voice v scales the carrier output.\n# All inner FM ramps last 5 seconds here. The circuit continues until 16 seconds.\n# Postfix )v9>0'20 fades the COMPLETE output, including the reverb tail.\n(\n {t82.5>1000'5:s270.5i9>0'5v1>0'5e0}d0.013g1.08f5.5x0.35v2'16\n)r4v9>0'20\n",
    "category": "Feedback & buses"
  },
  {
    "name": "Nested groups · shared chain",
    "detail": "Two returns / shared chop / reverb / final fade",
    "file": "Feedback-nested-group-chain.syn",
    "code": "# Nested composition: two feedback returns mix, chop together, then reverb, then fade.\n# () groups / repeats; postfix v/r/h/d process the complete mixed output in order.\n# {} with g closes an actual audio feedback loop. Nested () are composition, not recursion.\n(\n (\n  {n2v0.03e0'0.05}d0.013g1.06f5.4x0.2v1.5'12\n  {t110:s27.5i6v0.1e0'0.2}d0.029g1.03f4.8x0.4v1.2'12\n )h0.2>3'12r4\n)v9>0'18\n",
    "category": "Feedback & buses"
  },
  {
    "name": "G& · phyllotaxis",
    "detail": "Interlaced tuned cells · G234&",
    "file": "autocode/01-G-phyllotaxis.syn",
    "code": "# Phyllotaxis · two interlaced tuned cells\n# G234& : geometry N4 U0.3333 D1.3889; no static population expansion.\n# Play starts agentic growth; open Agents to choose model or behavior.\n# Only the parenthesized music is rewritten. Bottom AI shows input/output tokens.\n# Pause / Undo mutation in Agents; Cmd+. stops sound and blocks further adoption.\n!b100 !sa\nG234& (\nuJMA o110\ns[n1 3 5 3]v0.8e0254'n8p-0.5\nt[n1 2 4 5]v0.5e0254'n8p0.5r2\n)\n",
    "category": "Autocode"
  },
  {
    "name": "A& · apomixis",
    "detail": "Paired timbral clones · A143&",
    "file": "autocode/02-A-apomixis.syn",
    "code": "# Apomixis · paired timbral clones\n# A143& : geometry N2 U0.4444 D1.0667; no static population expansion.\n# Play starts agentic growth; open Agents to choose model or behavior.\n# Only the parenthesized music is rewritten. Bottom AI shows input/output tokens.\n# Pause / Undo mutation in Agents; Cmd+. stops sound and blocks further adoption.\nA143& (\ns165:s41.25i1.2v0.6e0254'1.2p-0.5\n0.3t165:s41.25i1.8v0.4e0254'1.2p0.5\n)\n",
    "category": "Autocode"
  },
  {
    "name": "S& · stolon",
    "detail": "Spatial cells, rests and echoes · S342&",
    "file": "autocode/03-S-stolon.syn",
    "code": "# Stolon · spatial cells, rests and echoes\n# S342& : geometry N8 U0.4444 D0.7444; no static population expansion.\n# Play starts agentic growth; open Agents to choose model or behavior.\n# Only the parenthesized music is rewritten. Bottom AI shows input/output tokens.\n# Pause / Undo mutation in Agents; Cmd+. stops sound and blocks further adoption.\n!b100 !sx\nS342& (\nuPTH o110\nt[n1  3 5 ~  4]v0.5e0254'n8p-0.6d0.3\na[n1 ~ 4  7 3]v0.3f4e0254'n8p0.6r2\n)\n",
    "category": "Autocode"
  },
  {
    "name": "H& · apical dominance",
    "detail": "Low stem and upper FM buds · H433&",
    "file": "autocode/04-H-apical.syn",
    "code": "# Apical dominance · a low stem and upper buds\n# H433& : geometry N12 U0.3333 D1.0667; no static population expansion.\n# Play starts agentic growth; open Agents to choose model or behavior.\n# Only the parenthesized music is rewritten. Bottom AI shows input/output tokens.\n# Pause / Undo mutation in Agents; Cmd+. stops sound and blocks further adoption.\nH433& (\ns82.5v0.8e0254'2p0r2\n0.2t330:s82.5i2v0.25e0254'0.6p-0.7\n0.6a495v0.15f5e0254'0.4p0.7r3\n)\n",
    "category": "Autocode"
  },
  {
    "name": "R& · tropism",
    "detail": "Opposing pan / frequency trajectories · R254&",
    "file": "autocode/05-R-tropism.syn",
    "code": "# Tropism · two long opposing trajectories\n# R254& : geometry N4 U0.5556 D1.3889; no static population expansion.\n# Play starts agentic growth; open Agents to choose model or behavior.\n# Only the parenthesized music is rewritten. Bottom AI shows input/output tokens.\n# Pause / Undo mutation in Agents; Cmd+. stops sound and blocks further adoption.\nR254& (\ns110>220'8v0>0.6>0'8p-1>1'8f2>7'8e0r3\nt330>165'8v0>0.3>0'8p1>-1'8f7>3'8e0r2\n)\n",
    "category": "Autocode"
  },
  {
    "name": "K& · colonisation",
    "detail": "Sparse cells and noisy attractors · K354&",
    "file": "autocode/06-K-colonisation.syn",
    "code": "# Colonisation · sparse grains and noisy attractors\n# K354& : geometry N8 U0.5556 D1.3889; no static population expansion.\n# Play starts agentic growth; open Agents to choose model or behavior.\n# Only the parenthesized music is rewritten. Bottom AI shows input/output tokens.\n# Pause / Undo mutation in Agents; Cmd+. stops sound and blocks further adoption.\n!b90 !sa\nK354& (\ns[220 ~ 330 440 ~]v0.4e0254'n8p-0.6r2\nt[660 440 ~ 880]v0.2f5e0254'n16p0.6\nn2v0.06f6h2e0254'0.4p0r3\n)\n",
    "category": "Autocode"
  },
  {
    "name": "L& · living grammar",
    "detail": "Mutate productions, turns and branches · FM / noise",
    "file": "autocode/07-L-living-grammar.syn",
    "code": "# L&: Directed edits mutates rules; Accumulate preserves them and adds layers.\n# Noise and FM bindings remain musical material, not only pitches.\n# Play starts the agent; bottom AI shows activity even with Agents closed.\n!vl\nL& (\ntrunk=s165:s41.25i2v0.5e0254'0.12\nvein=n2v0.15f4h2'0.08\nL3/25 A>A[+B]A B>BB @A=trunk @B=vein\n)\n",
    "category": "Autocode"
  },
  {
    "name": "Growth · parenthesized scopes",
    "detail": "G234 and H123 grow only their own material",
    "file": "Growth-scoped.syn",
    "code": "# Each generator applies only to its parentheses; the last voice stays outside growth.\n# G234 = N4 U0.3333 D1.3889. H123 = N2 U0.2222 D1.0667.\nuJMA o110\nG234 (s110v1e0254'0.2p-0.6)\nH123 (t165v0.6e0254'0.3p0.6)\na220v0.1e0254'2\n",
    "category": "Growth"
  },
  {
    "name": "Variables · crossing pans",
    "detail": "Untimed transitions follow each note gate · two clonal growths",
    "file": "Variables-pan.syn",
    "code": "# Untimed pan follows the explicit 0.8-second gate, also inside a named growth.\n# Add '2 after either pan transition to give it an independent two-second sweep.\nleft=(uJMA o220 A N12 U0.03 D0.7 s220v0.7e1354'0.8p-0.6>1)\nright=(uJMA o222.75 A N12 U0.03 D0.7 s222.75v0.7e1354'0.8p0.6>-1)\nleft right\n",
    "category": "Effects"
  },
  {
    "name": "One n · pitch positions",
    "detail": "One-based positions · nested subdivisions · octave registers",
    "file": "Pitch-positions.syn",
    "code": "# One n marks the WHOLE pitch list. Positions start at 1.\n# Prefixes shift literal octaves: -1 root below, +2 second degree above, --1 two below.\n# On uBPJ, the tuning period stays 3/1, but explicit +/- registers are 2/1 octaves.\n!b100 !sa\nuJMA o110\ns[n1 2 [3 4 5] 6 7 -1 +2 --1]v1e0254'n8\n",
    "category": "Tunings"
  },
  {
    "name": "Questions inside cells",
    "detail": "Random pitch / time / chopper · nested rhythm",
    "file": "Questions-in-cells.syn",
    "code": "# Spaces subdivide rhythmic cells. Commas and spaces separate exact alternatives; colons delimit random intervals.\n# Random time is sampled per ROOT cell; children subdivide that sampled duration.\n# In !sa each event gets its own timbre/envelope; !sc holds one atom for the phrase.\n!b100 !sa\ns[[300 ?] [400 500]]v1e0254'?[0.1:1]p-0.5\n?[300 [400 500]]v0.7e0254'n8p0.5\na[300 [400 500]]h?v0.3e0254'n8f5\n# Other valid forms: s?[300:400]  s[n1 ? 3 ?[2:5]]  h?[0.1:3]\n",
    "category": "Randomness"
  },
  {
    "name": "Autocode · local G",
    "detail": "Visible and reversible cell mutation · open Agents to monitor",
    "file": "Mutation-local.syn",
    "code": "# (contents)G mutates locally while playing. & is reserved for agents.\n# Open Agents to pause, change interval or undo. No AI request is made here.\n# A/S/H/R/K suffixes use their own seeded growth geometry as the mutation driver.\n!b100 !sa\nuHEX o110\n(\ns[n1 2 [3 4 5] 6]v0.8e0254'n8p-0.5r2\nt[n1 3 5 4]v0.5e0254'n4p0.5r3\n)G\n",
    "category": "Autocode"
  },
  {
    "name": "Autocode · agentic &G",
    "detail": "Opt-in AI region · existing gateway · monitor in Agents",
    "file": "Mutation-agent.syn",
    "code": "# (contents)&G marks an AGENTIC region, never a local fallback.\n# Play starts agentic growth. The agent continues when its pod is closed.\n# Only this region is sent; proposals are compiled before applying.\n# Manual edits during generation discard the stale proposal. Stop/pause cancels adoption.\n!b100 !sa\nuJMA o110\n(\ns[n1 3 5 3]v0.8e0254'n8p-0.5\nt[n1 2 4 5]v0.5e0254'n8p0.5r2\n)&G\n",
    "category": "Autocode"
  },
  {
    "name": "Input · delay",
    "detail": "i = i1 · input trim · 30-second microphone study",
    "file": "Input-delay.syn",
    "code": "# Press Play to authorize microphone input. No input permission is requested on load.\n# i means i1, the first channel of the selected browser input device.\n# !i1 is input trim on a 0..1 scale; v keeps the normal 0..9 sound level.\n# Stop releases the microphone. id0.3 = channel 1 + delay 0.3 seconds.\n!i1=(0.9)\nid0.3v3e0'30\n",
    "category": "Input"
  },
  {
    "name": "Input · chopper",
    "detail": "ih3 · channel 1 · gated input and reverb",
    "file": "Input-chop.syn",
    "code": "# i = i1. h3 gates the input before reverb.\n# Default input duration is 8 seconds; here it is explicit 30 seconds.\n# i2 requires a device exposing at least two channels; it is not a second device selector.\n!i1=(0.9)\nih3r3v3e0'30\n",
    "category": "Input"
  },
  {
    "name": "A234 · first compact growth",
    "detail": "Three digits = N/U/D · exact equivalences in comments",
    "file": "A234-starter.syn",
    "code": "# A234 = 4 generations / mutation 3/9 / spread 0.1 + 4*2.9/9.\n# Change one digit at a time: A234 -> A334 -> A344 -> A345.\n# For exact controls: A N4 U0.3333333333 D1.3888888889.\nuJMA o110\nA234\ns165v0.8e0254'0.32r2\n",
    "category": "Growth"
  },
  {
    "name": "Compact forest · A234 G442 H532",
    "detail": "Three tuning scopes · compact growth controls",
    "file": "Compact-forest.syn",
    "code": "# Three independent compact growths; each expression restores its caller's controls.\n# A234 = N4, U1/3, D1.3889; G442 = N12, U4/9, D0.7444.\n# H532 = N24, U1/3, D0.7444. h lowercase is a chopper.\nclone=(uJMA o110 A234 s165v0.7e0254'0.4r3)\ncanopy=(u31 o110 G442 t165v0.5e0254'0.3h0.5r2)\nbranches=(uHEX o110 H532 a165v0.25e0254'0.24f5h3r3)\nclone canopy branches\n",
    "category": "Growth"
  },
  {
    "name": "00 · Scale desk",
    "detail": "All aliases + extended cents / ratios catalog · swap one u line",
    "file": "tunings/00-Scale-desk.syn",
    "code": "# TUNINGS 00 / same growth, different tuning.\n# 1. Play. 2. Replace u31 below with ONE commented TRY expression.\n# Keep the same seed / generator / root to compare only the tuning.\n# Position 1 in a marked n list = root; growth Y is quantized to the selected tuning.\n# All currently supported aliases:\n# TRY u12 | 12 EDO\n# TRY u19 | 19 EDO\n# TRY u31 | 31 EDO\n# TRY u53 | 53 EDO\n# TRY uJMA | just major\n# TRY uJMI | just minor\n# TRY uPTH | Pythagorean diatonic\n# TRY uPEN | just major pentatonic\n# TRY uDOR | Dorian\n# TRY uMAJ | major\n# TRY uMIN | minor\n# TRY uPEL | Pelog cents from the supplied sketch\n# TRY uSLD | Slendro cents from the supplied sketch\n# TRY uBPJ | just Bohlen-Pierce, thirteen degrees in 3/1\n# TRY uHEX | 1-3-5-7 hexany, six degrees\n# TRY uWCA | harmonic twelve-degree collection\n# TRY u[81/80] | syntonic comma pair\n# TRY u[6561/6400] | two syntonic commas pair\n# TRY u[64/63] | septimal comma pair\n# TRY u[4096/3969] | two septimal commas pair\n# TRY u[33/32] | undecimal pair\n# TRY u[27/26] | tridecimal pair\n# TRY u[256/255] | 17-limit pair\n# TRY u[513/512] | 19-limit pair\n# TRY u[736/729] | 23-limit pair\n# TRY u[1/1 9/8 81/64 4/3 3/2 27/16 243/128 2/1] | Pythagorean diatonic\n# TRY u[1/1 9/8 5/4 4/3 3/2 5/3 15/8 2/1] | just major / Didymus / Ptolemy ditonic\n# TRY u[1/1 9/8 6/5 4/3 3/2 8/5 9/5 2/1] | just minor\n# TRY u[1/1 9/8 81/64 3/2 27/16 2/1] | Pythagorean pentatonic\n# TRY u[1/1 9/8 5/4 3/2 5/3 2/1] | just major pentatonic\n# TRY u[1/1 6/5 4/3 3/2 7/5 2/1] | minor pentatonic from sketch\n# TRY u[1/1 28/27 32/27 4/3 3/2 14/9 8/5 2/1] | Archytas from sketch\n# TRY u[1/1 40/39 10/9 4/3 3/2 20/19 5/3 2/1] | Eratosthenes from sketch\n# TRY u[1/1 20/19 10/9 4/3 3/2 15/14 5/3 2/1] | Aristoxenus from sketch\n# TRY u[1/1 10/9 5/4 4/3 3/2 5/3 15/8 2/1] | Ptolemy intense\n# TRY u[1/1 21/20 7/6 4/3 3/2 7/5 7/4 2/1] | Ptolemy soft\n# TRY u[1/1 28/27 8/7 4/3 3/2 14/9 7/4 2/1] | Ptolemy tonic\n# TRY u[1/1 12/11 6/5 4/3 3/2 18/11 9/5 2/1] | Ptolemy equitonal\n# TRY u[1/1 81/80 25/24 16/15 9/8 6/5 5/4 4/3 45/32 3/2 8/5 5/3 9/5 15/8 2/1] | five-limit chromatic\n# TRY u[1/1 16/15 9/8 6/5 5/4 4/3 45/32 3/2 8/5 5/3 9/5 15/8 2/1] | Euler twelve-degree\n# TRY u[1/1 7/6 5/4 35/24 5/3 7/4 2/1] | hexany, normalized unique degrees\n# TRY u[1/1 9/8 6/5 4/3 3/2 5/3 9/5 2/1] | Harrison from sketch\n# TRY u[1/1 9/8 5/4 11/8 3/2 13/8 7/4 15/8 2/1] | harmonic collection\n# TRY u[0 120 270 540 670 785 950 1200] | Pelog from sketch\n# TRY u[0 240 480 720 960 1200] | Slendro from sketch\n# TRY u[0 90 192 294 390 498 588 696 792 888 996 1092 1200] | Werckmeister III from sketch\n# TRY u[0 90 193 294 386 498 590 697 792 890 996 1086 1200] | Kirnberger III from sketch\n# TRY u[0 94 196 294 392 500 592 698 796 894 998 1096 1200] | Vallotti from sketch\n# TRY u[0 90 196 294 392 498 588 698 792 894 996 1092 1200] | Young from sketch\n# TRY u[1/1 27/25 25/21 9/7 7/5 75/49 5/3 9/5 49/25 15/7 7/3 63/25 25/9 3/1] | Bohlen-Pierce, corrected thirteen degrees\n# TRY u[1/1 8/7 4/3 8/5 2/1 8/3 4/1]:8/1 | subharmonic span, explicit 8/1 period\n# Single comma lists produce two degrees including 1/1; the period remains 2/1.\n# Names/cents above reproduce the supplied catalog, not historical edition claims.\n!vc\nu31 o110\nG N16 U0.06 D0.8\ns165v0.8e0254'0.24r2\n",
    "category": "Tunings"
  },
  {
    "name": "01 · One scale, one growth",
    "detail": "First quantized canopy · compare uJMA / uPTH / u31",
    "file": "tunings/01-One-growth.syn",
    "code": "# TUNINGS 01 / change only the u line, then Play.\n# TRY uJMA / uPTH / uMIN / u31. o110 is the reference root in Hz.\nuJMA o110\nG N12 U0.04 D0.8\ns165v0.8e0254'0.28r2\n",
    "category": "Tunings"
  },
  {
    "name": "02 · Hear the degrees",
    "detail": "Eight scale degrees, then the same tuning in an apical growth",
    "file": "tunings/02-Degrees-and-space.syn",
    "code": "# TUNINGS 02 / n means a degree only inside a pitch list.\n# First hear the scale, then its quantized distribution on H.\n# TRY uPEN / uHEX / uDOR / u19. Negative degrees are allowed.\n!b100 !sa\nuPEN o165\nline=(s[n-4 1 2 3 4 5 6 1]v1e0254'n8)\nbranch=(H N12 U0.08 D1 @pov/dfs 2.4t165v0.8e0254'0.25r2)\nline branch\n",
    "category": "Tunings"
  },
  {
    "name": "03 · Comma drift",
    "detail": "Two clonal populations separated by 81/80",
    "file": "tunings/03-Comma-drift.syn",
    "code": "# TUNINGS 03 / the same major ratios; the second root is raised by 81/80.\n# 220 * 81/80 = 222.75 Hz. Listen for beating, not a new keyboard step.\nleft=(uJMA o220 A N12 U0.03 D0.7 s220v0.7e1354'0.8p-0.6)\nright=(uJMA o222.75 A N12 U0.03 D0.7 s222.75v0.7e1354'0.8p0.6)\nleft right\n",
    "category": "Tunings"
  },
  {
    "name": "04 · Two scales",
    "detail": "Pythagorean sine / just-major triangle · same root",
    "file": "tunings/04-Two-scales.syn",
    "code": "# TUNINGS 04 / scoped u and o: neither layer overwrites the other.\n# TRY u31 in left or uHEX in right. Same root makes the differences clearer.\nleft=(uPTH o110 G N16 U0.05 D0.9 s165v0.7e0254'0.3p-0.65r2)\nright=(uJMA o110 A N16 U0.08 D0.9 t165v0.6e0254'0.3p0.65r2)\nleft right\n",
    "category": "Tunings"
  },
  {
    "name": "05 · Three scales",
    "detail": "19 EDO / 31 EDO / just minor · G / H / R",
    "file": "tunings/05-Three-scales.syn",
    "code": "# TUNINGS 05 / three roots and three quantizers coexist.\n# TRY u53 for lower, uHEX for middle, uPEL for upper.\nlower=(u19 o55 G N16 U0.04 D0.8 s82.5v0.8e0254'0.42p-0.65r2)\nmiddle=(u31 o110 H N16 U0.09 D0.9 t165v0.6e0254'0.32p0r3)\nupper=(uJMI o220 R N16 U0.12 D1 a220v0.35e0254'0.24f4>7'0.24p0.65r2)\nlower middle upper\n",
    "category": "Tunings"
  },
  {
    "name": "06 · Four-scale forest",
    "detail": "Four simultaneous populations · G / A / S / K · s / t / a / q",
    "file": "tunings/06-Four-scales.syn",
    "code": "# TUNINGS 06 / four tuning scopes, four independently growing layers.\n# h is a chopper, not a sound atom. Each layer has its own h speed.\n# TRY uPTH / uJMA / uHEX / uBPJ by replacing one local u expression.\nlow=(uJMA o55 G N16 U0.04 D0.8 s82.5v0.8e0254'0.4h0.2p-0.75r3)\nmid=(uPTH o110 A N16 U0.07 D0.9 t165v0.6e0254'0.32h1.4p-0.25r2)\nhigh=(uHEX o165 S N16 U0.1 D1 a220v0.3e0254'0.26f5h3p0.25r3)\nroot=(uBPJ o55 K N16 U0.08 D0.8 q82.5v0.3e0254'0.36f4h5p0.75r2)\nlow mid high root\n",
    "category": "Tunings"
  },
  {
    "name": "07 · Two unequal grids",
    "detail": "Pelog / Slendro cents · nearest eligible branch traversal",
    "file": "tunings/07-Pelog-Slendro.syn",
    "code": "# TUNINGS 07 / these cents are explicit approximations from the sketch.\n# TRY custom cents from 00 Scale desk. Traversal nnb is parent-first nearest.\nair=(uPEL o110 S N18 U0.08 D1 @pov/nnb s165v0.7e0254'0.24r3)\nwood=(uSLD o165 R N18 U0.12 D1 @pof/dfs t220v0.5e0254'0.31r2)\nair wood\n",
    "category": "Tunings"
  },
  {
    "name": "08 · Hexany branches",
    "detail": "Six just degrees · apical depth-first / breadth-first dialogue",
    "file": "tunings/08-Hexany.syn",
    "code": "# TUNINGS 08 / six hexany degrees, not twelve equal semitones.\n# uHEX = u[1/1 7/6 5/4 35/24 5/3 7/4 2/1].\n# Compare dfs and bfs without changing the tuning.\nfront=(uHEX o110 H N20 U0.07 D0.8 @pov/dfs s165:t27.5i0.3>3'0.32v0.6e0254'0.32r2)\nback=(uHEX o110 H N20 U0.07 D0.8 @pov/bfs t220v0.5e0254'0.32r3)\nfront back\n",
    "category": "Tunings"
  },
  {
    "name": "09 · Beyond the octave",
    "detail": "Bohlen-Pierce versus 3/1 custom ratios · two roots",
    "file": "tunings/09-Tritave.syn",
    "code": "# TUNINGS 09 / the period is 3/1; position 14 in BPJ reaches root * 3.\n# TRY u[1/1 5/4 3/2 7/4]:3/1 in right. Ratios are sorted by cents.\nleft=(uBPJ o55 G N20 U0.06 D0.9 s110v0.7e0254'0.3p-0.6r3)\nright=(u[1/1 9/7 7/5 5/3 7/3]:3/1 o55 R N20 U0.1 D1 t110v0.6e0254'0.3p0.6r3)\nleft right\n",
    "category": "Tunings"
  },
  {
    "name": "10 · Pitch and grain",
    "detail": "Harmonic tuning / noise timbre mapped by growth XYZ",
    "file": "tunings/10-Harmonic-noise.syn",
    "code": "# TUNINGS 10 / tuning changes oscillator pitches; it does not pitch-quantize noise.\n# The noise growth uses X filter / Y chopper / Z intensity instead.\nnotes=(uWCA o55 G N20 U0.06 D0.9 s110:t27.5i0.2>5'0.4v0.6e0254'0.4r3)\ngrains=(K N20 U0.1 D0.9 @fhv/bfs n2v0.45e0254'0.3r2)\nnotes grains\n",
    "category": "Tunings"
  },
  {
    "name": "11 · Build a tuning",
    "detail": "User cents in two contrasting growth traversals",
    "file": "tunings/11-Custom-cents.syn",
    "code": "# TUNINGS 11 / edit cents with Alt+arrows. Values are not limited to 0..9.\n# TRY u[0 100 270 540 670 785 950] or u[0 90 386 702 996].\nleft=(u[0 100 270 540 670 785 950] o110 A N16 U0.08 D1 @pov/dfs s165v0.7e0254'0.3p-0.5r2)\nright=(u[0 90 386 702 996] o110 S N16 U0.08 D1 @pov/nnb a165v0.3e0254'0.3f5p0.5r3)\nleft right\n",
    "category": "Tunings"
  },
  {
    "name": "12 · Four tuned cells",
    "detail": "Four scales / four pulse lengths / rests / nested tuplets",
    "file": "tunings/12-Polytuned-cells.syn",
    "code": "# TUNINGS 12 / rhythmic polyphony before the final forest.\n# Each expression owns its tuning; all share 96 BPM. LOOP repeats the full combined score.\n# Scale-degree pitches are n values; apostrophe n is a note duration.\n!b96 !sa\nbass=(uJMI o55 s[n1 ~ 5 ~ 1 3 ~ 5]v1e0254'n8p-0.65r2)\nline=(uPTH o110 t[n1 3 [5 6 7] 8]f3>7'4v0.8e0254'n4p-0.2r3)\nshine=(uHEX o220 a[n1 3 ~ 5 6 ~]f4>7'4h0.4>3'4v0.35e0254'n8p0.3r2)\ncloud=(uBPJ o110 q[n1 ~ 4 7 ~ 9]f4v0.3e0254'b1/3p0.7r3)\nbass line shine cloud\n",
    "category": "Tunings"
  },
  {
    "name": "13 · Forest with rhythmic undergrowth",
    "detail": "Three quantized growths + three tuned cells · independent timing / FM / noise",
    "file": "tunings/13-Tuned-forest-and-cells.syn",
    "code": "# TUNINGS 13 / six expressions, three growth populations and three cell voices.\n# Growth order supplies another rhythm; it does not consume the sequence grid.\n# Cells repeat through the longer canopy arc instead of ending after 2.4 s.\n# h gates are independent per voice. Replace any local u with a Scale desk option.\n!b100 !sa\ncanopy=(u31 o110 G N16 U0.06 D0.8 s165:t27.5i0.2>5'0.32v0.6e0254'0.32r3)\nveins=(uHEX o165 H N16 U0.08 D0.9 @pov/dfs t220v0.5e0254'0.28r2)\nroots=(uBPJ o55 K N16 U0.1 D0.9 q82.5v0.3e0254'0.4f4h2r3)\nbass=(uJMI o55 s[n1 ~ 5 3 ~ 1 5 ~]v0.8e0254'n8p-0.65r2)\nshards=(uHEX o220 a[n1 [2 4 6] ~ 5]v0.25e0254'n4f3>7'2.4p0.65r3)\ndust=(n2v[0.2 0 0.1 0]f[3 6 4]h0.2>3'2.88e0'n16)\ncanopy veins roots (bass)5 (shards)5 (dust)7\n",
    "category": "Tunings"
  },
  {
    "name": "14 · Four worlds in motion",
    "detail": "Advanced · four tuning systems / four growths / three time-warped cells",
    "file": "tunings/14-Four-worlds.syn",
    "code": "# TUNINGS 14 / advanced study. Start with 04 before editing this one.\n# Four u scopes in growths coexist with three rhythmic cells using those worlds.\n# Single comma / cents alternatives and every alias are in 00 Scale desk.\n# The cell step durations accelerate or slow smoothly across their root cells.\n!b96 !sa\ncanopy=(u31 o110 G N20 U0.05 D0.8 s165:t27.5i0.3>6'0.4v0.6e0254'0.4r3)\nbranches=(uHEX o165 H N18 U0.08 D0.9 @pov/dfs t220v0.45e0254'0.32r2)\nroots=(uBPJ o55 K N16 U0.09 D0.9 q82.5v0.25e0254'0.45f3>6'0.45h3r3)\nvines=(uPEL o110 S N18 U0.08 D1 a165v0.25e0254'0.3f5h0.3>2'0.3r3)\nlow=(uBPJ o55 s[n1 ~ 4 7 ~ 9 4 1]v0.7e0254'n8>n16p-0.7r2)\nbright=(uHEX o220 t[n1 [3 4 6] 5 ~ 3 1]i0.2>4'2.4:s55v0.4e0254'n16>n4p0.5r3)\ngrain=(u31 o110 a[n1 6 ~ 12 19 ~]v0.2e0254'n8>n16f3>7'2h0.2>4'2p0.7r3)\ncanopy branches roots vines low bright grain\n",
    "category": "Tunings"
  },
  {
    "name": "01 · A pulse",
    "detail": "Four identical pitches · hear note durations",
    "file": "rhythm/01-Pulse.syn",
    "code": "# RHYTHM 01 / all four cells have the same pitch and one eighth-note gate.\n# Change !b120, then try n4 / n8 / n16 after the apostrophe.\n!b120 !sa\ns[220 220 220 220]v1.5e0254'n8\n",
    "category": "Arpeggiators & sequences"
  },
  {
    "name": "02 · Rests and accents",
    "detail": "A four-beat cell · ~ is silence · aligned intensity accents",
    "file": "rhythm/02-Rests.syn",
    "code": "# RHYTHM 02 / eight eighths = four beats. ~ consumes one step.\n# Remove one ~ or replace it with n4, keeping the eight positions.\n!b120 !sa\nuDOR o110\nt[n1 ~ 5 3 ~ 1 7 ~]v[2 0 1 1 0 2 1 0]e0254'n8\n",
    "category": "Arpeggiators & sequences"
  },
  {
    "name": "03 · Divide a pulse",
    "detail": "Duple / triplet / quintuple subdivisions in one line",
    "file": "rhythm/03-Nested.syn",
    "code": "# RHYTHM 03 / every top-level cell lasts one quarter note.\n# The second divides in two, the third in three, the fourth in five.\n!b90 !sa\nuPEN o165\ns[n1 [2 3] [1 3 4] [5 4 3 2 1]]v1.5e0254'n4\n",
    "category": "Arpeggiators & sequences"
  },
  {
    "name": "04 · Three against four",
    "detail": "Both layers fill the same four beats · exact beat fractions",
    "file": "rhythm/04-Three-against-four.syn",
    "code": "# RHYTHM 04 / three notes each 4/3 beat against four quarter notes.\n# They reunite every four beats; no rounded-second drift.\n!b108 !sa\nthree=(uJMA o110 s[n1 3 5]v1.2e0254'b4/3p-0.6)\nfour=(uJMA o220 t[n1 5 3 5]v0.8e0254'n4p0.6)\nthree four\n",
    "category": "Arpeggiators & sequences"
  },
  {
    "name": "05 · Spatial cells",
    "detail": "Visible spacing as rhythm · ixi-inspired two-row score",
    "file": "rhythm/05-Spatial-cells.syn",
    "code": "# RHYTHM 05 / !sx: one separator is normal; each EXTRA space is a rest.\n# Add one space before 330 and watch/listen to its shifted onset.\n!b120 !sx\nupper=(s[220  330 440   330]v1.2e0254'n8p-0.6)\nlower=(t[110 165  220  165]v0.8e0254'n8p0.6)\nupper lower\n",
    "category": "Arpeggiators & sequences"
  },
  {
    "name": "06 · Five against eight",
    "detail": "Five-note pitch list / eight accents · 40-step return",
    "file": "rhythm/06-Polymeter.syn",
    "code": "# RHYTHM 06 / lists on ONE voice share their least common period.\n# 5 pitches and 8 accents = 40 eighth-note steps, not eight steps.\n!b120 !sa\nuPEN o110\ns[n1 2 3 4 5]v[1.5 0.5 0 0.8 1.2 0.4 0 0.8]e0254'n8p-0.4\nlow=(uJMA o55 t[n1 ~ 5 ~]v0.8e0254'n4p0.5)\n(low)5\n",
    "category": "Arpeggiators & sequences"
  },
  {
    "name": "07 · Together / apart",
    "detail": "Three voices share onsets while their notes and timbres diverge",
    "file": "rhythm/07-Homorhythm.syn",
    "code": "# RHYTHM 07 / same cell structure in three voices creates homorhythm.\n# Replace a pitch list with n1 1 1 1 1 1 1 1 for synchronous unison rhythm.\n!b104 !sa\nuJMI o110\nlow=(s[n1 ~ 5 3 1 ~ 5 3]v1e0254'n8p-0.6)\nmid=(t[n3 ~ 7 5 3 ~ 7 5]v0.8e0254'n8p0)\nhigh=(a[n5 ~ 8 7 5 ~ 8 7]v0.3e0254'n8f5p0.6)\nlow mid high\n",
    "category": "Arpeggiators & sequences"
  },
  {
    "name": "08 · Rhythm inside a sustained sound",
    "detail": "No oscillator retriggers · volume cells / FM / smooth filter",
    "file": "rhythm/08-Continuous-timbre.syn",
    "code": "# RHYTHM 08 / !sc holds one oscillator through the phrase; v zero makes a rest.\n# Compare !sa: the same cells retrigger the ADSR per step.\n!b120 !sc\ns[110 165 220 330]:s27.5i0.2>6'8v[1 0 0.7 0 1.2 0 0.4 0]f2>8'8p-0.8>0.8'8e0'n4\n",
    "category": "Arpeggiators & sequences"
  },
  {
    "name": "09 · Time in transition",
    "detail": "Accelerando / ritardando · durations interpolate per cell",
    "file": "rhythm/09-Time-warp.syn",
    "code": "# RHYTHM 09 / apostrophe n8>n32 means the FIRST step is an eighth,\n# the LAST a thirty-second; intermediate root-cell gates interpolate in seconds.\n# Nested tuplets subdivide their own changing parent duration.\n# LOOP returns to the initial speed; no global tempo automation is implied.\n!b96 !sa\nuDOR o110\nfast=(s[n1 3 5 7 8 7 5 3]v1e0254'n8>n32p-0.6)\nslow=(t[n1 5 [3 4 5] 7 5 3 2 1]v0.7e0254'n32>n8p0.6)\nfast slow\n",
    "category": "Arpeggiators & sequences"
  },
  {
    "name": "10 · Cells beneath a canopy",
    "detail": "Two tuned arpeggiators + quantized growth + noise rhythm",
    "file": "rhythm/10-Rhythm-and-growth.syn",
    "code": "# RHYTHM 10 / four independent processes share one patch.\n# A growth supplies its own traversal onsets; a list supplies musical cells.\n!b112 !sa\ncanopy=(u31 o110 G N16 U0.08 D0.9 s165v0.5e0254'0.3r3)\nbass=(uJMI o55 s[n1 ~ 5 3 ~ 1 5 ~]v0.9e0254'n8h0.3p-0.6)\nchord=(uHEX o220 t[n1 [2 4 6] ~ 5]v0.6e0254'n4f4>7'3p0.6r2)\ndust=(n2v[0.25 0 0.12 0 0.2 0.1 0 0]f[3 6 4 7]e0'n16h0.2>3'1.1)\ncanopy bass chord dust\n",
    "category": "Arpeggiators & sequences"
  },
  {
    "name": "11 · Mutable canon",
    "detail": "Three cells · two named future rotators · three tuning systems",
    "file": "rhythm/11-Future-canon.syn",
    "code": "# RHYTHM 11 / LOOP on. Each target rotates at its next phrase boundary.\n# !f4:12 mid 1 shifts mid right; !f6:8 high -1 shifts high left.\n!b120 !sx\nlow=(uJMI o55 s[n1 ~ 5 3 ~ 1 5 ~]v1e0254'n8p-0.65)\nmid=(uHEX o110 t[n1 3  5 6  4]v0.7e0254'n8p0r2)\nhigh=(u31 o220 a[n1  6 12  19 12]v0.3e0254'n8p0.65f5r3)\n!f4:12 mid 1\n!f6:8 high -1\nlow mid high\n",
    "category": "Arpeggiators & sequences"
  },
  {
    "name": "12 · Moving matter",
    "detail": "Advanced · five voices / time warps / smooth FM, filter, pan and chop",
    "file": "rhythm/12-Transitional-polyphony.syn",
    "code": "# RHYTHM 12 / first learn 03, 04 and 09. Every line is an independent voice.\n# Articulated cell sweeps run inside each note; continuous sweeps span the whole phrase.\n# The global loop repeats the complete combined span. Fine-edit glide is a UI setting,\n# distinct from the score's explicit ramps. h is a chopper, not a waveform.\n!b100\nbass=(!sa uJMI o55 s[n1 ~ 5 3 1 ~ 5 ~]v1e0254'n8>n16p-0.7r3)\nmetal=(!sc uHEX o110 t[n1 3 [4 5 6] 3 ~ 1]:s27.5i0.2>7'4v0.65e0'n16>n4f2>8'4p-0.6>0.6'4r3)\nsparks=(!sa u31 o220 a[n1 6 ~ 12 19 ~ 24 19]v0.3e0254'n16>n32f3>8'0.2h0.2>3'0.2p0.7r2)\nshadow=(!sc uBPJ o55 q[n1 4 ~ 7 9 ~]v[0.35 0.2 0 0.3 0.1 0]e0'n8>n4f2>6'6h4>0.3'6p0.6>-0.6'6r3)\ndust=(!sc n2v[0.12 0 0.2 0 0.1 0.15 0 0]f[2 5 3 7]e0'n16>n8h0.1>5'2p-0.7>0.7'2r2)\nbass metal sparks shadow dust\n",
    "category": "Arpeggiators & sequences"
  },
  {
    "name": "31 EDO",
    "detail": "Equal divisions · scale-degree sequences",
    "file": "tuning/Equal-divisions.syn",
    "code": "# 31 equal steps per octave; one n marks the list; positions start at 1.\n!b100 !sa\nu31 o220\ns[n1 4 7 10 13 16 19 22]v2e0254'n8\n",
    "category": "Tunings"
  },
  {
    "name": "Just major",
    "detail": "uJMA · exact ratios · articulated FM",
    "file": "tuning/Just-major.syn",
    "code": "# Exact 5-limit major; the last degree wraps to the next octave.\n!b108 !sa\nuJMA o220\nt[n1 2 3 4 5 6 7 8]:s55i0.3v2e0254'n8\n",
    "category": "Tunings"
  },
  {
    "name": "Custom cents",
    "detail": "u[0 100 200 500 600] · continuous voice",
    "file": "tuning/Custom-cents.syn",
    "code": "# Cents from the root; period defaults to 1200 cents.\n!b90 !sc\nu[0 100 200 500 600] o110\ns[n1 2 3 4 5 4 3 2]f[3 7 5 2]v2e0'n8\n",
    "category": "Tunings"
  },
  {
    "name": "Bohlen–Pierce",
    "detail": "uBPJ · explicit 3:1 period",
    "file": "tuning/Bohlen-pierce.syn",
    "code": "# Non-octave period: 3/1 (1901.955 cents), not 2/1.\n!b100 !sa\nuBPJ o110\ns[n1 3 5 7 9 11 13 14]v2e0254'n8\n",
    "category": "Tunings"
  },
  {
    "name": "Custom period",
    "detail": "Ratio list · explicit tritave",
    "file": "tuning/Custom-period.syn",
    "code": "# Ratios with an explicit tritave period.\n!b110 !sc\nu[1/1 5/4 3/2 7/4]:3/1 o110\ns[n1 2 3 4 5 4 3 2]v2e0'n8\n",
    "category": "Tunings"
  },
  {
    "name": "Continuous timbre",
    "detail": "!sc · living voice · independent parameter lengths",
    "file": "sequences/Continuous.syn",
    "code": "# Default !sc: one oscillator survives all pitch/filter/intensity steps.\n# Different list lengths combine over their least common multiple (12 steps here).\n!b100 !sc\ns[110 165 220 330]f[2 7 4]v[1 2 1.4 2.5]e0'n8\n",
    "category": "Arpeggiators & sequences"
  },
  {
    "name": "Arpeggiator",
    "detail": "!sa · one ADSR per step",
    "file": "sequences/Articulated.syn",
    "code": "# Every step is a separate voice with its own ADSR.\n!b120 !sa\ns[110 165 220 330]v2e0254'n8\n",
    "category": "Arpeggiators & sequences"
  },
  {
    "name": "Nested tuplets",
    "detail": "Three inside one pulse · note-value durations",
    "file": "sequences/Tuplets.syn",
    "code": "# Four outer quarter-note cells. The second contains an eighth-note triplet.\n!b120 !sa\ns[110 [165 220 330] 440 220]v2e0254'n4\n",
    "category": "Arpeggiators & sequences"
  },
  {
    "name": "Spatial score",
    "detail": "!sx · spaces as silent steps",
    "file": "sequences/Spatial.syn",
    "code": "# Extra spaces are silent slots. Source spacing is musically significant in !sx.\n!b120 !sx\nupper=(s[440   550 660    880]v2e0254'n8p-0.6)\nlower=(t[110  165    220 165]v1.5e0254'n8p0.6)\nupper lower\n",
    "category": "Arpeggiators & sequences"
  },
  {
    "name": "Reich · future",
    "detail": "Two Dorian cells · timed rotations of reichp",
    "file": "pieces/Reich-future.syn",
    "code": "# PIECES / keep Loop ON: the future rotator evolves on successive transport cycles.\n# Two copies of the pictured twelve-note cell, the second rotated one slot.\n# One-based Dorian positions; tonic is E4 (MIDI 64). Synthetic timbre, no piano sample.\n# !f6:48 = every six seconds, rotate reichp right one slot; at most 48 actions.\n# Mutations become audible at the next phrase boundary; source stays declarative.\n!b180 !sx\nuDOR o329.6275569\nreich=(t[n1 2 5 6 7 2 1 6 5 2 7 6]:s82.4i0.2v2e0092'n8p-0.6)\nreichp=(t[n6 1 2 5 6 7 2 1 6 5 2 7]:s82.4i0.2v2e0092'n8p0.6)\n!f6:48 reichp 1\nreich reichp\n",
    "category": "Pieces",
    "loop": true,
    "seed": 3181
  },
  {
    "name": "Growth writing",
    "detail": "Compact and precise controls · XYZ routing · DFS / BFS",
    "file": "Growth-compact.syn",
    "code": "# Compact N/U/D controls coexist with exact and original spellings.\n# A342 = A N8 U0.444444 D0.744444 (N lookup / U digit divided by 9 / D 0.1..3).\n# Precise equivalent construction: A(8,0.444444,0.744444).\n!vc\nuJMA o110\ncanopy=(A342 @pov/dfs s110v2e0254'0.22)\nroots=(K(14,0.08,1.2) @fhi/bfs n2v0.25e0254'0.28)\ncanopy roots\n",
    "category": "Growth"
  },
  {
    "name": "L · compact",
    "detail": "Three digits · generations / angle / taper",
    "file": "L-compact.syn",
    "code": "# L322 = 3 generations / 25-degree turns / 0.55 branch taper.\n# Exact equivalent: L3:F/25,0.55 ...\n!vl\nbark=n2v0>0.3>0'0.3f3>7'0.3e0'0.3\nL322:F F>F[+F]F[-F]F @F=bark\n",
    "category": "Growth"
  },
  {
    "name": "Confluencias",
    "detail": "Six parts · 4:00 · 3–10 voices · play once",
    "file": "pieces/Confluencias.syn",
    "code": "# CONFLUENCIAS\n# Six parts / 4:00 plus effect tails / 3-10 principal voices / seed 3181.\n# Play once. Pieces turns LOOP off when loaded.\n# A shared 110 : 165 : 220 cell survives every transformation.\n# I  00:00 Umbral           - a common breath acquires edges.\n# II 00:40 Desdoblamiento   - the same breath branches and changes skin.\n# III01:20 Gravedad         - attraction, restraint and pulse pressure.\n# IV 02:00 Caida            - a descent that cannot find its floor.\n# V  02:40 Garganta         - the room feeds itself; ten voices meet.\n# VI 03:20 Memoria          - the branches remember one pitch.\n# The final L rewrite splits three paired states into six sequential parts.\n# Named expressions scope their growth controls; no state leaks between parts.\n!vc\n\n# A quiet, homorhythmic three-voice inhalation; two attacks, then recur.\nflutter=(\n s220v0.32e0143'0.12 t330v0.25e0143'0.12 s440v0.22e0143'0.12\n 0.38s220v0.32e0143'0.12 0.38t330v0.25e0143'0.12 0.38s440v0.22e0143'0.12\n)\n\n# The tissue is shared, not presented as independent demonstrations.\nleaf=(G N7 U0.08 D1.1\n 4s165v0.85e0154'0.15f5.5\n 10t220v0.75e0154'0.15f5\n)\nrunner=(S N10 U0.12 D1.1\n 17?[s a]165v0.65e0154'0.05f4.8\n 25?[s t]220v0.6e0154'0.05f4.3\n)\nclone=(A N5 U0.18 D0.8\n 31?[s t]?[165:220]v0.65e0154'0.05\n 36t165:s55i0.4>2'0.05v0.65e0154'0.05\n)\napex=(H N8 U0.08 D1\n 3a110v0.5e0154'0.12f3.8\n 9t165:s41.25i1>3'0.12v0.65e0154'0.12\n)\npull=(R N8 U0.12 D1.3\n 16t110v0.65e0154'0.12\n 23s165:t55i0.5>2'0.12v0.6e0154'0.12\n)\nroot=(K N2 U0.08 D1.2\n 30?[s t]82.5v0.7e0154'0.05\n 35s110v0.65e0154'0.05\n)\n\n\nparta=({\n # I / UMBRAL: three continuous strands; fragile common attacks.\n s110v0'3>0.7'29>0.45'8p-0.55e1395\n t165v0'4>0.55'28>0.4'8p0.55e1395\n s220v0'5>0.45'27>0.35'8p0e1395\n (flutter)4\n 8s110v0.75p-0.65e0254'0.32f6\n 8t110v0.75p0e0254'0.32f6\n 8a110v0.75p0.65e0254'0.32f6\n 20s165v0.75p-0.65e0254'0.32f6\n 20t165v0.75p0e0254'0.32f6\n 20a165v0.75p0.65e0254'0.32f6\n 32s220v0.75p-0.65e0254'0.32f6\n 32t220v0.75p0e0254'0.32f6\n 32a220v0.75p0.65e0254'0.32f6\n}r1.2)\n\n\npartb=({\n # II / DESDOBLAMIENTO: a moving canon, still tied to the opening cell.\n s110v0.45>0.8'40p-0.65>0.2'40e1395\n t165v0.4>0.7'40p0.6>-0.3'40e1395\n s220:t55i0.2>2'40v0.35>0.65'40p0e1395\n leaf runner clone\n 8s110v0.9p-0.65e0254'0.32f6\n 8t165v0.9p0e0254'0.32f6\n 8a220v0.9p0.65e0254'0.32f6\n 20s165v0.9p-0.65e0254'0.32f6\n 20t220v0.9p0e0254'0.32f6\n 20a330v0.9p0.65e0254'0.32f6\n}d0.31r2.2)\n\n\npartc=({\n # III / GRAVEDAD: a lower centre and a synchronized closing diaphragm.\n s82.5v0.65>0.85'40p-0.45e1395\n t110v0.55>0.75'40p0.45e1395\n a165v0.35>0.55'40p0e1395f3.5\n apex pull root\n 12n3v0>0.4>0'3p-0.8>0.8'3e0\n {n1v0.008'0.04e0}d0.012g0.86>1.04'32f3.2>2.2'40x0.4v0.6'40\n 38s165v0.8p-0.65e0254'0.32f6\n 38t165v0.8p0e0254'0.32f6\n 38a165v0.8p0.65e0254'0.32f6\n}h6>1.2'40r3.5>1.5'40)\n\n\npartd=({\n # IV / CAIDA: the branches stretch into octave-related descending layers.\n s55v0.4e1395'40p-0.5\n t110v0.35e1395'40p0.5\n s165v0.3e1395'40p0\n 0s1760^55'20v0>0.134>0.5>1>1.5>1.866>2>1.866>1.5>1>0.5>0.134>0'20p-0.6>0.6'20e0\n 3.33333333s1760^55'20v0>0.134>0.5>1>1.5>1.866>2>1.866>1.5>1>0.5>0.134>0'20p-0.6>0.6'20e0\n 6.66666667s1760^55'20v0>0.134>0.5>1>1.5>1.866>2>1.866>1.5>1>0.5>0.134>0'20p-0.6>0.6'20e0\n 10s1760^55'20v0>0.134>0.5>1>1.5>1.866>2>1.866>1.5>1>0.5>0.134>0'20p-0.6>0.6'20e0\n 13.3333333s1760^55'20v0>0.134>0.5>1>1.5>1.866>2>1.866>1.5>1>0.5>0.134>0'20p-0.6>0.6'20e0\n 16.6666667s1760^55'20v0>0.134>0.5>1>1.5>1.866>2>1.866>1.5>1>0.5>0.134>0'20p-0.6>0.6'20e0\n 37s110v0.7p-0.65e0254'0.4f6\n 37t110v0.7p0e0254'0.4f6\n 37a110v0.7p0.65e0254'0.4f6\n 38.3s165v0.7p-0.65e0254'0.4f6\n 38.3t165v0.7p0e0254'0.4f6\n 38.3a165v0.7p0.65e0254'0.4f6\n}r2)\n\n\nparte=({\n # V / GARGANTA: resonance takes the foreground; five attacks meet two returns.\n s82.5v0.5>0.8'40p-0.6e1395\n t110v0.45>0.7'40p0.6e1395\n a165v0.35>0.6'40p0e1395f4.2\n {\n  n2v0.025p-1'40e0\n  n1v0.025p1'40e0\n }b165>145'32,660>620'32q0.25,0.2k2.2>4'32g0.72>0.82'32,0.68>0.75'32d0.013,0.029x0.25>0.35'32v0'4>3.6'24>0.6'12\n 8s110v1.85p-0.65e0254'0.8f6\n 8t165v1.85p-0.325e0254'0.8f6\n 8a220v1.85p0e0254'0.8f6\n 8q330v1.85p0.325e0254'0.8f6\n 8s440v1.85p0.65e0254'0.8f6\n 16s165v1.85p-0.65e0254'0.8f6\n 16t220v1.85p-0.325e0254'0.8f6\n 16a330v1.85p0e0254'0.8f6\n 16q440v1.85p0.325e0254'0.8f6\n 16s660v1.85p0.65e0254'0.8f6\n 24s220v1.85p-0.65e0254'0.8f6\n 24t220v1.85p-0.325e0254'0.8f6\n 24a220v1.85p0e0254'0.8f6\n 24q220v1.85p0.325e0254'0.8f6\n 24s220v1.85p0.65e0254'0.8f6\n 32s110v1.85p-0.65e0254'0.8f6\n 32t165v1.85p-0.325e0254'0.8f6\n 32a220v1.85p0e0254'0.8f6\n 32q293.333333v1.85p0.325e0254'0.8f6\n 32s330v1.85p0.65e0254'0.8f6\n}h3>0.1'32r2>6'40)\n\n\npartf=({\n # VI / MEMORIA: the same three strands finally agree, then disappear.\n s110v0.7'4>0.9'28>0'8p-0.5>0'32e0f5>1'40\n t165^110'32v0.7'4>0.9'28>0'8p0.5>0'32e0f5>1'40\n s220^110'32v0.7'4>0.9'28>0'8p0e0f5>1'40\n 4s110v0.55p-0.65e0254'0.38f6\n 4t165v0.55p0e0254'0.38f6\n 4a220v0.55p0.65e0254'0.38f6\n 16s110v0.55p-0.65e0254'0.38f6\n 16t110v0.55p0e0254'0.38f6\n 16a110v0.55p0.65e0254'0.38f6\n 28s110v0.55p-0.65e0254'0.38f6\n 28t110v0.55p0e0254'0.38f6\n 28a110v0.55p0.65e0254'0.38f6\n}r4>0'40)\n\n\n# One rewrite: ABC -> AB CD EF. The pairs are opening/branching,\n# pressure/fall, throat/memory. Each binding lasts forty seconds.\nL1:ABC A>AB B>CD C>EF @A=parta @B=partb @C=partc @D=partd @E=parte @F=partf\n",
    "category": "Pieces",
    "loop": false,
    "seed": 3181
  },
  {
    "name": "Corte Cero",
    "detail": "2:00 · 160 BPM · evolving feedback / sub pressure · play once",
    "file": "pieces/Corte-cero.syn",
    "code": "# CORTE CERO\n# 2:00 exactly / 160 BPM / 80 bars / seed 3181 / play once.\n# Every source excites a feedback return. No dry oscillator reaches the master.\n# 00:00 ARC: establish the pressure grid.\n# 00:30 FRACTURE: narrow the bands and shear the grid.\n# 01:00 WHITE ROOM: open the noise and cut the reverberated mass.\n# 01:30 BLACKOUT: recover the pulse, overload it, extinguish the output.\n# q is reciprocal Q: smaller values make a narrower, more resonant band.\n# Revision 3: independent post-return choppers, no shared master gate.\n# Revision 2: four independent returns per block; continuously moving controls.\n# Sub fundamentals descend to 26 Hz. All excitation remains inside feedback.\n# Outer h/r order is intentional. Output v stays outside the return gain g.\n# LOOP is disabled by the Pieces preset. Cmd+. or Escape disconnects everything.\n!vc\n\n# One beat = 0.375 seconds. The last tick ends exactly at the beat boundary.\nbeata=(\n s145^43'0.15v0>2.8>0'0.15e0p-0.15>0.15'0.15\n 0.1875n1v0.32p0.7e0031'0.035\n 0.335n1v0.22p-0.7e0031'0.04\n)\nbeatb=(\n q160^39'0.14v0>2.9>0'0.14e0p0.25>-0.25'0.14\n 0.09375n1v0.5p-0.8e0031'0.025\n 0.335n2v0.45p0.8e0031'0.04\n)\nbeatc=(\n n1v1.8p0e0061'0.14\n 0.1875q?[330:3300]v0.75p-0.8e0031'0.035\n 0.335n1v0.9p0.8e0031'0.04\n)\nbeatd=(\n s135^41'0.14v0>3.1>0'0.14e0p-0.2>0.2'0.14\n 0.1875s95^39'0.09v2.2p-0.2e0061\n 0.335n1v0.8p0.6e0031'0.04\n)\n\n\narc=({\n # ARC: pulse / torn surface / sub pressure / moving sideband.\n {\n  (beata)80\n  n2v0.006>0.02'30p-1>0.4'30e0\n  n1v0.018>0.005'30p1>-0.4'30e0\n }b64^49'30,1800^3400'30q0.7>0.18'30,0.35>0.07'30k2.8>6'30g0.76>1.02'30,0.68>0.94'30d0.0039>0.0081'30,0.0117>0.0043'30x0.12>0.52'30v0>2.8>1.6>3.2>0'30h3.09375>2.86'30\n { n3v0.004>0.012'30p-0.8>0.8'30e0 }d0.006>0.0025'30g1.02>1.28'30f3.8>7.4'30x0.12>0.62'30v0>0.7>0.25>1.2>0'30h0.18>1.2'30\n { s46^29'30v0>0.65>0.35>0.8>0'30p-0.25>0.25'30e0 }d0.024>0.036'30g1.1>1.32'30f1.9>0.9'30x0.05>0.2'30v0>2.1>1.3>2.7>0'30h5.5>2.1'30\n { a660^1540'30v0>0.012>0.003>0.018>0'30p1>-1'30e0 }d0.013>0.004'30g0.94>1.16'30f3>6.3'30x0.7>0.15'30v0>0.6>0.2>1>0'30h1.7>0.08'30\n}r0.8>3.5'30)\n\nfracture=({\n # FRACTURE: pulse / torn surface / sub pressure / moving sideband.\n {\n  (beatb)80\n  n2v0.006>0.02'30p-1>0.4'30e0\n  n1v0.018>0.005'30p1>-0.4'30e0\n }b49^92'30,3400^760'30q0.18>0.025'30,0.07>0.018'30k6>8.8'30g0.88>1.16'30,0.82>1.08'30d0.0081>0.0018'30,0.0043>0.015'30x0.52>0.82'30v0>3.2>1.8>3.6>0'30h2.86>3.6'30\n { n3v0.004>0.012'30p-0.8>0.8'30e0 }d0.0025>0.012'30g1.12>1.43'30f7.4>2.6'30x0.62>0.28'30v0>1.2>0.4>1.5>0'30h1.2>0.12'30\n { s29^55'30v0>0.8>0.25>0.9>0'30p0.25>-0.3'30e0 }d0.036>0.019'30g1.24>1.4'30f0.9>2.5'30x0.2>0.05'30v0>2.7>1.7>3.1>0'30h2.1>6.2'30\n { q1540^330'30v0>0.018>0.004>0.025>0'30p-1>1'30e0 }d0.004>0.018'30g1.04>1.3'30f6.3>3.4'30x0.15>0.8'30v0>1>0.3>1.4>0'30h0.08>2.6'30\n}r3.5>7.5'30)\n\nwhite=({\n # WHITE ROOM: pulse / torn surface / sub pressure / moving sideband.\n {\n  (beatc)80\n  n2v0.006>0.02'30p-1>0.4'30e0\n  n1v0.018>0.005'30p1>-0.4'30e0\n }b92^43.5'30,760^5200'30q0.025>0.65'30,0.018>0.45'30k8.8>5.2'30g1.16>0.92'30,1.08>1.22'30d0.0018>0.0057'30,0.015>0.0029'30x0.82>0.28'30v0>3.6>2>3.9>0'30h3.6>1.1'30\n { n3v0.004>0.012'30p-0.8>0.8'30e0 }d0.012>0.0012'30g1.43>1.16'30f2.6>8.5'30x0.28>0.85'30v0>1.5>0.6>2>0'30h0.12>2.3'30\n { s55^26'30v0>0.9>0.3>1>0'30p-0.3>0.3'30e0 }d0.019>0.039'30g1.4>1.18'30f2.5>1.2'30x0.05>0.3'30v0>3.1>2>3.5>0'30h6.2>3.8'30\n { a330^2640'30v0>0.025>0.006>0.03>0'30p1>-1'30e0 }d0.018>0.003'30g1.3>1.12'30f3.4>7.8'30x0.8>0.25'30v0>1.4>0.5>1.8>0'30h2.6>0.2'30\n}r7.5>9'30)\n\nblackout=({\n # BLACKOUT: pulse / torn surface / sub pressure / moving sideband.\n {\n  (beatd)80\n  n2v0.006>0.02'30p-1>0.4'30e0\n  n1v0.018>0.005'30p1>-0.4'30e0\n }b43.5^110'30,5200^440'30q0.1>0.018'30,0.08>0.012'30k8.2>2.2'30g1.12>0.62'30,1.18>0.65'30d0.0057>0.021'30,0.0029>0.014'30x0.58>0.03'30v0>3.9>2.1>3.4>0'30h1.1>3.09375'30\n { n3v0.004>0.012'30p-0.8>0.8'30e0 }d0.0012>0.024'30g1.3>0.88'30f8.5>0.8'30x0.85>0.04'30v0>2>0.7>1.5>0'30h2.3>0.06'30\n { s26^41'30v0>1>0.4>0.7>0'30p0.3>-0.1'30e0 }d0.039>0.026'30g1.3>0.94'30f1.2>0.5'30x0.3>0.02'30v0>3.5>2.2>2.8>0'30h3.8>7'30\n { t2640^110'30v0>0.03>0.009>0.02>0'30p-1>1'30e0 }d0.003>0.031'30g1.26>0.83'30f7.8>1.1'30x0.25>0.9'30v0>1.8>0.5>1.2>0'30h0.2>1.8'30\n}r6>0.5'30v9'0.01>9'28.49>0'1.5)\n\n# Four contiguous blocks, each twenty bars at 160 BPM.\nL0:ABCD A>A @A=arc @B=fracture @C=white @D=blackout\n",
    "category": "Pieces",
    "loop": false,
    "seed": 3181
  },
  {
    "name": "Golden canopy",
    "detail": "G · phyllotaxis",
    "file": "G-phyllotaxis.syn",
    "code": "# GOLDEN CANOPY · G / phyllotaxis\n# N 1–128 generations · U 0–1 mutation · D 0.1–3 spread\n!vc\nG N32 U0.08 D1\ns110v3e0254'0.32\nt220v1e0153'0.16\n",
    "category": "Growth"
  },
  {
    "name": "Clonal drift",
    "detail": "A · apomixis",
    "file": "A-apomixis.syn",
    "code": "# CLONAL DRIFT · A / apomixis\n# N 1–128 generations · U 0–1 mutation · D 0.1–3 spread\n!vc\nA N40 U0.18 D1.3\ns110v3e0255'0.28\nt165v2e0144'0.18\n",
    "category": "Growth"
  },
  {
    "name": "Stolon",
    "detail": "S · runners and ramets",
    "file": "S-stolon.syn",
    "code": "# STOLON · runners and ramets\n# N 1–128 generations · U 0–1 mutation · D 0.1–3 spread\n!vc\nS N32 U0.08 D1.1\nt165v3e0254'0.22\n",
    "category": "Growth"
  },
  {
    "name": "Apical dominance",
    "detail": "H · inhibited lateral buds",
    "file": "H-apical.syn",
    "code": "# APICAL DOMINANCE · leader and lateral buds\n# N 1–128 generations · U 0–1 mutation · D 0.1–3 spread\n!vc\nH N32 U0.1 D1\ns110v3e0254'0.24\n",
    "category": "Growth"
  },
  {
    "name": "Tropism",
    "detail": "R · moving attractor",
    "file": "R-tropism.syn",
    "code": "# TROPISM · moving attractor\n# N 1–128 generations · U 0–1 mutation · D 0.1–3 spread\n!vc\nR N48 U0.12 D1.4\nt165v3e0255'0.2\n",
    "category": "Growth"
  },
  {
    "name": "Roots",
    "detail": "K · colonisation",
    "file": "K-colonisation.syn",
    "code": "# ROOTS · K / space colonisation\n# N 1–128 generations · U 0–1 mutation · D 0.1–3 spread\n!vc\nK N48 U0.08 D1.2\ns110v3e0254'0.18\n",
    "category": "Growth"
  },
  {
    "name": "Forest",
    "detail": "Three parallel growths · FM canopy / noise roots / mutable vines · pinch zoom",
    "file": "Forest.syn",
    "code": "# FOREST / three simultaneous, independently scoped growth processes.\n# Their local coordinate systems are packed into separate regions of the cube.\n# Pinch with two fingers to zoom; drag / three-finger touch to orbit.\n!vc\ncanopy=(G N24 U0.06 D0.85 s110:t27.5i0.2>4'0.42v0>0.7>0'0.42e0p-0.7r3h0.3>1'0.42'0.42)\nroots=(K N24 U0.12 D1.1 n3v0>0.32>0'0.55e0f2>5'0.55p0r2h3>0.4'0.55'0.55)\nvines=(S N24 U0.08 D0.9 ?[t a]165v0>0.45>0'0.38e0f6>3'0.38p0.7r4h1.6>4'0.38'0.38)\ncanopy roots vines\n",
    "category": "Growth"
  },
  {
    "name": "L · Tree",
    "detail": "Bracketed grammar · branching noise and FM · 25°",
    "file": "L-tree.syn",
    "code": "# L · TREE / bracketed Lindenmayer grammar / seed 3181\n# F moves forward and plays bark; + / - turn 25 degrees.\n# [ saves position, direction and musical time; ] restores the fork.\n# Branches grow and sound together. No automatic pitch transposition.\n!vl\nbark=(\n n2v0>0.28>0'0.65f2>6'0.65p-0.4>0.4'0.65e0r2'0.65\n s110:t37i0.2>5'0.65v0>0.42>0'0.65e0r2'0.65\n)\nL3:F/25 F>F[+F]F[-F]F @F=bark\n",
    "category": "Growth"
  },
  {
    "name": "L · Leaf",
    "detail": "Bilateral veins · spine and tips · noise / complex timbres · 55°",
    "file": "L-leaf.syn",
    "code": "# L · LEAF / bilateral venation / seed 3181\n# F lengthens a vein; X is a growing tip, bound here to a different timbre.\n# An unbound X is a silent nonterminal in bracketed grammars.\n# The spine and paired veins fork in space AND time; /55 sets the turn angle.\n!vl\nvein=(\n n3v0>0.35>0'0.65f1.8>4'0.65e0r3'0.65\n t82.5:s27.5i0.4>3'0.65v0>0.4>0'0.65e0r3'0.65\n)\ntip=(\n n1v0>0.12>0'0.9f7>3'0.9h0.1>1'0.9e0r4'0.9\n a330:s110i1>7'0.9v0>0.22>0'0.9e0r4'0.9\n)\nL3:X/55 X>F[+X][-X]FX F>FF @F=vein @X=tip\n",
    "category": "Growth"
  },
  {
    "name": "L-system",
    "detail": "L · rewriting / musical bindings",
    "file": "L-rewriting.syn",
    "code": "# L-SYSTEM · symbolic growth, explicit musical bindings\n# L4 = 4 parallel rewriting generations; default axiom = first rule symbol\n# A > AB > ABA > ABAAB > ABAABABA\n!vf\naa=s220v3e0254'0.2\nbb=t330v2e0153'0.2\nL4 A>AB B>A @A=aa @B=bb\n\n# Optional explicit axiom: L4:AC\n# Parameterized binding: tone=s*v2'0.2 and @A=tone220\n",
    "category": "Growth"
  },
  {
    "name": "Shepard descent",
    "detail": "Six overlapping voices · logarithmic glide",
    "file": "Shepard-continuous.syn",
    "code": "# SHEPARD DESCENT\n# Six octave-spaced sine layers, renewed every 20/6 seconds.\n# ^ = exponential frequency glide; > = linear values.\n# 13 intensity values approximate a raised-cosine window over 20 seconds.\n# LOOP on: starts with preceding voices already in flight, then continues.\n# LOOP off before Play: auditions one isolated 20-second voice.\n!vf\n(\n s3520^55'20v0>0.201>0.75>1.5>2.25>2.799>3>2.799>2.25>1.5>0.75>0.201>0'20p-0.6>0.6'20e0\n)'3.3333333333333335\n",
    "category": "Synthesis"
  },
  {
    "name": "Feedback circuit",
    "detail": "Shared stereo return · bounded self-oscillation",
    "file": "Feedback-circuit.syn",
    "code": "# FEEDBACK CIRCUIT\n# A tiny 20 ms seed; no microphone and no continuous excitation.\n# d = delay seconds, g = return gain, x = cross-routing 0..1.\n# f = lowpass 0..9, v = output level, final '16 = circuit lifetime.\n# Try g0.85 for decay, g1.12 for growth toward bounded saturation.\n# Keep output v independent from g. Cmd+. disconnects the circuit.\n!vc\n{ n1v0.03'0.02e0 }d0.012g1.12f6.6x0.35v2'16\n",
    "category": "Feedback & buses"
  },
  {
    "name": "No-input · two bands",
    "detail": "Independent returns · drive · cross-coupled delays",
    "file": "Feedback-two-bands.syn",
    "code": "# NO-INPUT · TWO BANDS\n# Two continuously excited, cross-coupled resonant returns.\n# b = band centres Hz, q = reciprocal Q, k = drive before tanh.\n# d and g accept left,right; x adds the other channel's output.\n# v is outside the return path. Cmd+. or Escape stops all audio.\n# Try b145,620 g0.82,0.75 k4, then apply with Cmd+Enter.\n!vc\n{\n n2v0.03p-1'24e0\n n1v0.03p1'24e0\n}b220,880q0.25,0.2k2.5g0.72,0.68d0.013,0.029x0.35v4'24\n",
    "category": "Feedback & buses"
  },
  {
    "name": "Feedback · output reverb",
    "detail": "Outer braces · shared post-chain processing",
    "file": "Feedback-output-bus.syn",
    "code": "# SHARED OUTPUT BUS\n# The outer r8 processes the complete feedback output, outside the return.\n# Its reverb tail survives the inner circuit's 16-second lifetime.\n# Turn LOOP off before Play to hear that tail decay naturally.\n# Cmd+. or Escape cuts all audio, buses and tails.\n!vc\n{{ s220v0.03'0.2e0 }d0.2g1.4f4x0.5v5'16}r8\n",
    "category": "Feedback & buses"
  },
  {
    "name": "Sound solids",
    "detail": "Sphere · pyramid · ramp · cube · Perlin noise",
    "file": "Sound-solids.syn",
    "code": "# CUBE · SOUND SOLIDS\n# s sphere / t pyramid / a ramp / q cube / n Perlin-noise body.\n# Choose cube in the Editor to see the solids; points keeps its point layout.\n!vc\ns110v2p-0.9'12e0\nt220v2p-0.45'12e0\na440v2p0'12e0\nq880v2p0.45'12e0\nn2v2p0.9'12e0\n",
    "category": "Visuals"
  },
  {
    "name": "Mutable timbre",
    "detail": "Seeded choice per node · ?[s a]",
    "file": "Mutable-timbre.syn",
    "code": "# MUTABLE TIMBRE\n# ?165 chooses among s/t/a/q for each generated note.\n# ?[s a]165 restricts choices to sine and sawtooth.\n# Choices renew per loop. Same seed + loop count = same realization.\n# Timbre choice selects an atom; it does not morph waveforms over time.\n!vc\nS N32 U0.08 D1.1\n?[s a]165v3e0254'0.22\n",
    "category": "Randomness"
  },
  {
    "name": "Random sweeps",
    "detail": "??>? · random pitch endpoints / pan / gate · chopper",
    "file": "Random-sweeps.syn",
    "code": "# RANDOM SWEEPS / independent timbre, pitch endpoints, pan endpoints and duration.\n# Implicit sweep times follow each newly sampled gate.\n# h.1 also gates the body's visibility in FOLD.\n!vc\n??>?v2e0254p?>?h.1'?[0.3:2]\n\n# Fixed sine, bounded upward sweep and left-to-right pan:\n# s?[110:220]>?[440:880]v2e0254p?[-1:0]>?[0:1]'?[0.5:3]\n# With independent 4-second pan: ??>?p?>?'4v2e0254'? \n",
    "category": "Randomness"
  },
  {
    "name": "Random time",
    "detail": "s? pitch · '? duration · new phrase span per loop",
    "file": "Random-time.syn",
    "code": "# RANDOM TIME / independent random pitch and duration.\n# '? = uniform 0.1–2 seconds, resampled at every loop.\n# Loop length follows the sampled duration, without maximum-length padding.\ns?[110:880]v2e0254'?\n\n# Bounded version: s?[110:880]v2e0254'?[0.05:0.8]\n# Random timbre too: ??v2e0254'?[0.1:1.2]\n# Finite phrase: (s?[110:880]v2e0254'?[0.1:0.8])8\n# Duration changes the note gate; other parameter sweep times stay independent.\n",
    "category": "Randomness"
  },
  {
    "name": "Random questions",
    "detail": "s? pitch · ?165 atom · ?? both",
    "file": "Random-pitch.syn",
    "code": "# RANDOM QUESTIONS\n# ?165 = random oscillator, fixed pitch; s? = sine, random pitch.\n# ?? = random oscillator and random pitch; renewed each score loop.\n# Frequency choices are log-uniform, 55..1760 Hz unless bounded.\n!vc\ns?[110:880]v2e0254'0.4\n0.5?[s a]?[220:660]v2e0254'0.4\n1??v2e0254'0.4\n",
    "category": "Randomness"
  },
  {
    "name": "Effects in order",
    "detail": "Reverb then chopper · chopper then reverb",
    "file": "Effects-chain.syn",
    "code": "# EFFECTS IN ORDER\n# r4h2 chops the reverberated output, including its tail.\n# Swap to h2r8: chops first, then reverberates the cuts.\n!vc\n{{ n1v0.03'0.2e0 }d0.005g1.11f5.8>1x0.35v2'26}r4h2\n",
    "category": "Effects"
  },
  {
    "name": "Common delay",
    "detail": "d3 seconds · decaying echoes",
    "file": "Common-delay.syn",
    "code": "# COMMON DELAY\n# d3 = three seconds; repeats decay by 0.38 per return.\n# Turn LOOP off before Play to hear the echoes separately.\n# {s200v3'0.2e0}d3r4 applies delay then reverb to a shared bus.\n!vc\ns200v3'0.2e0d3\n",
    "category": "Effects"
  }
];
