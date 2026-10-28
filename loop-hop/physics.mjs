export const TAU = Math.PI * 2;
export const STEP = 1 / 240;
export const SPIKE_ANGLE = -Math.PI / 4;
export const START_ANGLE = SPIKE_ANGLE - 4.4;
export const speedFor = score => Math.min(2.8, 1.3 + score * .13);
export const JUMP_DURATION = .56;
export const JUMP_HEIGHT = 48;
export const SPIKE = [{x:146,y:-14},{x:180,y:0},{x:146,y:14}];
function distanceToSegment(p, a, b) {
  const dx=b.x-a.x, dy=b.y-a.y;
  const t=Math.max(0, Math.min(1, ((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));
  return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);
}
export function touchesSpike(angle, height) {
  const d=angle-SPIKE_ANGLE;
  const p={x:Math.cos(d)*(157+height), y:Math.sin(d)*(157+height)};
  const signs=SPIKE.map((a,i)=>{const b=SPIKE[(i+1)%3];return (b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);});
  return signs.every(v=>v>=0) || signs.every(v=>v<=0) || SPIKE.some((a,i)=>distanceToSegment(p,a,SPIKE[(i+1)%3])<9);
}
export class Game {
  constructor() { this.angle=START_ANGLE; this.score=0; this.height=0; this.jumpTime=0; this.airborne=false; this.dead=false; this.pulse=0; }
  jump() {
    if(this.dead || this.airborne) return false;
    this.airborne=true; this.jumpTime=0; return true;
  }
  step(dt) {
    if(this.dead) return;
    this.angle+=speedFor(this.score)*dt;
    if(this.airborne) {
      this.jumpTime+=dt;
      const progress=this.jumpTime/JUMP_DURATION;
      this.height=Math.max(0,4*JUMP_HEIGHT*progress*(1-progress));
      if(this.jumpTime>=JUMP_DURATION) {this.airborne=false;this.height=0;}
    }
    this.pulse=Math.max(0,this.pulse-dt);
    if(touchesSpike(this.angle,this.height)) {this.dead=true;return;}
    const laps=Math.floor((this.angle-START_ANGLE)/TAU);
    if(laps>this.score) {this.score=laps;this.pulse=.5;}
  }
}
