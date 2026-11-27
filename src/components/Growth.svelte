<script lang="ts">
  import {drawApomixis} from '../visuals/apomixis';
  import {drawSpatial,spatialAspect} from '../visuals/spatial';
  import {visualDrag as orbitDrag,stockyCamera} from '../visuals/interaction.svelte';
  import {drawStocky,stockyMixtures} from '../visuals/stocky';
  import {generatorMorph,TONAL_WAVES} from '../core/generator-morph';
  import {cubeAxes} from '../visuals/axis-labels';
  import {foldCentre,drawFoldGlow} from '../visuals/glow';
  import {drawWaveGlyph} from '../visuals/glyphs';
  import { onMount } from 'svelte';
  import { session,engine } from '../state.svelte';
  import { camera, ORBIT_DURATION_MS, orbitPhase } from '../camera.svelte';
  import {rampValueAt} from '../core/curves';
  import { soundPositionAt, layoutEvents, type VisualMode, type VisualPoint } from '../core/visualization';
  import type {TurtleSegment} from '../core/lsystem-turtle';
  import type { NoteEvent } from '../core/types';
  let { background = false }: { background?: boolean } = $props();
  let canvas: HTMLCanvasElement;
  const displayedScore=$derived(session.playing&&session.applied?session.applied:session.score);
  const axes=$derived(cubeAxes(displayedScore.events));
  const physicalDisplay=$derived(session.visualization==='spatial'||session.visualization==='cube'&&!!(displayedScore.room||displayedScore.speakers));
  const soundTrajectories=$derived(displayedScore.events.length>0&&displayedScore.events.every(event=>!event.node&&event.sequence?.mode!=='spatial'));
  onMount(() => {
    const ctx=canvas.getContext('2d')!;
    let frame=0,width=0,height=0,frameWindow=canvas.ownerDocument.defaultView??window;
    const schedule=()=>{frameWindow=canvas.ownerDocument.defaultView??window;frame=frameWindow.requestAnimationFrame(draw);};
    let yaw=camera.yaw,pitch=camera.pitch,fromYaw=yaw,fromPitch=pitch,toYaw=yaw,toPitch=pitch,changedAt=0;
    let cachedEvents:NoteEvent[]|undefined,cachedMode:VisualMode|undefined,points:VisualPoint[]=[];
    let lookup=new Map<string,VisualPoint>();let stockScore:typeof session.score|undefined,mixtures:ReturnType<typeof stockyMixtures>=[];
    const resize=new ResizeObserver(()=>{
      width=canvas.clientWidth;height=canvas.clientHeight;
      const ratio=Math.min(canvas.ownerDocument.defaultView?.devicePixelRatio??1,2);canvas.width=width*ratio;canvas.height=height*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);
    });resize.observe(canvas);
    function draw(now=performance.now()) {
      if(camera.yaw!==toYaw||camera.pitch!==toPitch){fromYaw=yaw;fromPitch=pitch;toYaw=camera.yaw;toPitch=camera.pitch;changedAt=now;}
      const progress=Math.min(1,(now-changedAt)/ORBIT_DURATION_MS),ease=1-(1-progress)**3;
      yaw=fromYaw+(toYaw-fromYaw)*ease;pitch=fromPitch+(toPitch-fromPitch)*ease;
      const phase=orbitPhase();
      const angle=yaw+(session.visualization!=='lsystem'?phase:0);
      schedule();ctx.clearRect(0,0,width,height);if(!width||!height)return;
      const playing=engine.running,time=engine.cycleTime,totalTime=engine.time,visualEvents=playing?engine.visualEvents:[],activeSourceIds=playing?engine.activeSourceIds:[];
      const score=playing?(engine.currentScore??session.applied??session.score):session.score;
      if(session.visualization==='stocky'){if(stockScore!==score){stockScore=score;mixtures=stockyMixtures(score);}drawStocky(ctx,width,height,score,mixtures,playing?time:0,session.followTime,background,stockyCamera.zoom,stockyCamera.center);return;}
      const mode=session.visualization,flower=mode==='phyllotaxis',branches=mode==='lsystem';
      const trajectories=score.events.length>0&&score.events.every(event=>!event.node&&event.sequence?.mode!=='spatial');
      const events=playing&&score.period?visualEvents:score.events;
      if(cachedEvents!==events||cachedMode!==mode){cachedEvents=events;cachedMode=mode;points=layoutEvents(events,mode);lookup=new Map(points.map(p=>[p.id,p]));}
      const roomMode=mode==='spatial'||mode==='cube'&&!!(score.room||score.speakers);
      const scale=camera.zoom*Math.min(width*(background&&!session.infoHidden ? (roomMode&&width<700?.30:.18) : .35),height*(branches ? .43 : session.infoHidden ? .4 : flower ? .34 : .29));
      const {x:baseX,y:cy}=foldCentre(width,height,background,session.infoHidden,camera.panX,camera.panY);
      const cx=baseX-(roomMode&&background&&!session.infoHidden&&width<700?width*.1:0);
      drawFoldGlow(ctx,cx,cy,Math.min(width,height)*.85,width,height);
      const aspect=mode==='parameters'?[1,1,1]:spatialAspect(score);
      const project=(x:number,y:number,z:number)=>{
        if(roomMode){x*=aspect[0];y*=aspect[1];z*=aspect[2];}
        const xx=x*Math.cos(angle)-z*Math.sin(angle),zz=x*Math.sin(angle)+z*Math.cos(angle);
        const depth=y*Math.sin(pitch)+zz*Math.cos(pitch),perspective=camera.projection==='perspective'?5/Math.max(1,5+depth):1;
        return [cx+xx*scale*perspective,cy-(y*Math.cos(pitch)-zz*Math.sin(pitch))*scale*perspective];
      };
      const roomEvents=playing?visualEvents.map(event=>({...event,t:event.t-(totalTime-time)})):score.events;
      if(roomMode){drawSpatial(ctx,score,time,playing,project,roomEvents,{yaw:angle,pitch,scale});return;}
      if(session.spatialOverlay&&score.speakers)drawSpatial(ctx,score,time,playing,project,roomEvents,{yaw:angle,pitch,scale},false);
      const line=(a:number[],b:number[],color:string,w=1)=>{ctx.strokeStyle=color;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();};
      const corners=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
      if(!branches)for(const [a,b] of [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]]){
        line(project(...corners[a] as [number,number,number]),project(...corners[b] as [number,number,number]),flower?'#253d3155':'#354640');
      }
      if(flower){ctx.setLineDash([3,8]);line(project(0,-1,0),project(0,1,0),'#6b897450');ctx.setLineDash([]);}
      else if(!branches)for(let y=-.5;y<1;y+=.5){line(project(-1,y,1),project(1,y,1),'#1b2b26');line(project(-1,y,-1),project(-1,y,1),'#1b2b26');}
      // Biological structures retain their generated positions; plain voices follow audio time.
      const runtimeEvents=new Map(visualEvents.map(e=>[e.originId,e]));
      let moving=trajectories?points.map(point=>{const played=runtimeEvents.get(point.event.id);if(played&&(point.event.freqRange||point.event.freqEndRange||point.event.panRandom||point.event.durationRange))point={...point,event:{...point.event,freq:played.freq,pan:played.pan,dur:played.dur}};return {...point,...soundPositionAt(point.event,playing?(score.period?totalTime:time):0)};}):points;
      const branchSegments=new Map<string,TurtleSegment>(score.lSystems.flatMap((system,index)=>system.turtle?.segments.map(segment=>[`${index}:${segment.id}`,segment] as const)??[]));
      if(branches){
        for(const [key,segment] of branchSegments){
          const elapsed=playing?Math.max(0,Math.min(1,(time-segment.t)/Math.max(.001,segment.dur))):1;
          if(elapsed<=0)continue;
          const end={x:segment.start.x+(segment.end.x-segment.start.x)*elapsed,y:segment.start.y+(segment.end.y-segment.start.y)*elapsed,z:0};
          const active=playing&&elapsed<1;
          line(project(segment.start.x,segment.start.y,segment.start.z),project(end.x,end.y,end.z),active?'#b7f5a0':`rgba(132,190,166,${playing?.62:.46})`,Math.max(.65,2.5-segment.depth*.4));
        }
        moving=moving.filter(point=>!playing||point.event.t<=time).map(point=>{
          const segment=branchSegments.get(`${point.event.lSystemIndex}:${point.event.lSegment}`);if(!segment)return point;
          const progress=playing?Math.max(0,Math.min(1,(time-segment.t)/Math.max(.001,segment.dur))):1;
          return {...point,x:segment.start.x+(segment.end.x-segment.start.x)*progress,y:segment.start.y+(segment.end.y-segment.start.y)*progress,z:0};
        });
      }
      const activeIds=new Set(activeSourceIds);
      const runtimeWaves=new Map(visualEvents.map(e=>[e.originId,e.wave]));
      if(trajectories&&!branches){
        for(const point of points.slice(0,128)){
          let previous=soundPositionAt(point.event,point.event.t);
          for(let i=1;i<=32;i++){
            const next=soundPositionAt(point.event,point.event.t+point.event.dur*i/32);
            line(project(previous.x,previous.y,previous.z),project(next.x,next.y,next.z),`hsla(${(point.event.id*137.508+90)%360},55%,65%,.15)`);
            previous=next;
          }
        }
      }
      if(!flower&&!branches)drawApomixis(ctx,moving,project,time,playing);
      const sorted=flower?[...moving].sort((a,b)=>(a.x-b.x)*Math.sin(angle)+(a.z-b.z)*Math.cos(angle)):moving;
      for(const point of sorted){
        const {event,x,y,z}=point,runtime=score.period!==undefined?event:runtimeEvents.get(event.id),gate=runtime?.gateLevel??1,active=playing&&(score.period!==undefined||activeIds.has(event.id))&&gate>.02,xy=project(x,y,z);
        const parent=point.parent?lookup.get(point.parent):undefined;
        if(!flower&&!branches&&parent&&!event.node?.capsule)line(project(parent.x,parent.y,parent.z),xy,active?'#b7f5a0':playing?'#56724b70':'#65835190',active?1.6:.8);
        if(flower){
          const tint=Math.max(0,Math.min(1,(y+1)/2));
          const depth=x*Math.sin(angle)+z*Math.cos(angle);
          const alpha=playing?(active?1:event.t>time ? .25 : .68):.86;
          ctx.fillStyle=`rgba(${Math.round(82+58*tint)},${Math.round(154+65*tint)},${Math.round(105+125*tint)},${alpha})`;
          const radius=playing&&!active?2:2.6+(event.volume.start+event.volume.end)/18*2.2+(depth+1)*.65;
          if(active){ctx.shadowColor='#91e8eb';ctx.shadowBlur=12;}
          ctx.beginPath();ctx.arc(xy[0],xy[1],radius,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
          if(active){ctx.strokeStyle='#ec8fbe';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(xy[0],xy[1],radius+4,0,Math.PI*2);ctx.stroke();}
        }else{
          const hue=trajectories?(event.id*137.508+90)%360:85+y*25;
          const perspective=camera.projection==='perspective'?5/Math.max(1,5+y*Math.sin(pitch)+(x*Math.sin(angle)+z*Math.cos(angle))*Math.cos(pitch)):1;const radius=(points.length>256?(active?5:2.8):active?9:6.5)*perspective*(event.node?.capsule?.scale??1);
          const wave=event.waveOptions&&playing?runtimeWaves.get(event.id)??event.wave:event.wave,morph=event.generatorMix===undefined?undefined:generatorMorph(event.generatorMix),fmAmount=morph?.fmMix??(event.modulation?1:0);
          const seed=(score.seed+event.id*997)>>>0,glyphTime=playing?totalTime:0,alpha=playing&&!active?.4:.95*gate;
          const carrier=(r:number,opacity:number)=>{if(morph){morph.carrier.forEach((weight,i)=>{if(weight>1e-6)drawWaveGlyph(ctx,TONAL_WAVES[i],seed,glyphTime,[x,y,z],r,scale*perspective,angle,pitch,project,hue,active,opacity*weight);});}else drawWaveGlyph(ctx,wave,seed,glyphTime,[x,y,z],r,scale*perspective,angle,pitch,project,hue,active,opacity);};
          if(!active){ctx.fillStyle=`hsla(${hue},42%,60%,${playing?.4:.75})`;ctx.beginPath();ctx.arc(xy[0],xy[1],2,0,Math.PI*2);ctx.fill();}
          else if(fmAmount>0){
            const age=Math.max(0,(score.period?totalTime:time)-event.t),index=rampValueAt(event.index,age);
            carrier(radius*(1+.65*fmAmount),alpha*(1-.73*fmAmount));
            if(morph){morph.modulator.forEach((weight,i)=>{if(weight>1e-6)drawWaveGlyph(ctx,TONAL_WAVES[i],seed+1,glyphTime,[x,y,z],radius*(.4+.4*index/(index+2)),scale*perspective,angle,pitch,project,(hue+48)%360,active,alpha*fmAmount*weight);});}else drawWaveGlyph(ctx,event.modulatorWave??'s',seed+1,glyphTime,[x,y,z],radius*(.4+.4*index/(index+2)),scale*perspective,angle,pitch,project,(hue+48)%360,active,alpha);
            ctx.strokeStyle=`hsla(${hue},65%,78%,${alpha*.65})`;ctx.lineWidth=.8;ctx.beginPath();ctx.arc(xy[0],xy[1],radius*(1+.65*fmAmount),0,Math.PI*2);ctx.stroke();
          }else carrier(radius,alpha);
        }
      }
      if(!session.infoHidden){
      ctx.font='10px ui-monospace,monospace';ctx.fillStyle='#748d82';
      const top=project(0,1,0),bottom=project(1,-1,1);
      const currentAxes=axes;
      if(!branches)ctx.fillText(flower?'PITCH':currentAxes.labels[1],top[0]-(flower?16:45),top[1]-16);
      if(!branches)ctx.fillText(flower?'137.5° · EVENT ORDER':currentAxes.labels[0],bottom[0]-(flower?120:55),bottom[1]+25);
      if(!branches&&!flower)ctx.fillText(currentAxes.labels[2],project(-1,-1,1)[0]-70,project(-1,-1,1)[1]+20);
      }
    }
    const moved=()=>{frameWindow.cancelAnimationFrame(frame);schedule();};window.addEventListener('syno:document-moved',moved);
    const follow=()=>{if(session.followTime&&session.visualization==='stocky')stockyCamera.zoom=Math.max(1,(engine.currentScore??session.score).duration/24);};window.addEventListener('syno:follow-time',follow);
    draw();return()=>{window.removeEventListener('syno:document-moved',moved);window.removeEventListener('syno:follow-time',follow);frameWindow.cancelAnimationFrame(frame);resize.disconnect();};
  });
</script>
<div class:background class="growth-pod" data-axis-x={physicalDisplay?'X · RIGHT':axes.labels[0]} data-axis-y={physicalDisplay?'Y · UP':axes.labels[1]} data-axis-z={physicalDisplay?'Z · DEPTH':axes.labels[2]} data-visualization={session.visualization}>
  <canvas bind:this={canvas} use:orbitDrag tabindex={background?-1:0} aria-label={physicalDisplay?'Spatial speaker positions and source trajectories. X right, Y up, Z depth. Camera movement does not change audio.':session.visualization==='stocky'?'Stocky score. Frequency bands in Hz above; intensity envelopes in dB below. Playhead follows transport.':session.visualization==='lsystem'?'L-system branches. Timed trunk, forks and veins; noise and complex sound bodies. Drag to orbit.':soundTrajectories?'Sound trajectories. X pan, Y frequency, Z intensity. One moving point per voice. Drag to orbit.':session.visualization==='phyllotaxis'?'Phyllotaxis points. One point per note; golden-angle event layout. Drag to orbit.':`FOLD growth cube. ${axes.labels.join('; ')}. Drag to orbit; three-finger touch or trackpad drag. Arrow keys rotate the view.`}></canvas>
  {#if !background&&session.visualization!=='stocky'}<div class="growth-caption"><span>{session.visualization==='lsystem'?'L · BRACKETED GROWTH':new Set(displayedScore.events.map(e=>e.growthInstance).filter(id=>id!==undefined)).size>1?'FOREST · '+new Set(displayedScore.events.map(e=>e.growthInstance).filter(id=>id!==undefined)).size+' GROWTHS':soundTrajectories?'TRAJECTORIES · X p / Y Hz / Z v':session.visualization==='phyllotaxis'?'PHYLLOTAXIS · POINTS':(displayedScore.generator||'trajectories · X pan / Y Hz / Z intensity').toUpperCase()}</span><span>{session.visualization==='lsystem'?'[ ] fork · + − turn · symbols play timbres':session.visualization==='cube'?axes.summary+' · s sphere · t pyramid · a ramp · q cube · n noise':'seed '+session.seed+' · drag to orbit · slow Y'}</span></div>{/if}
</div>
