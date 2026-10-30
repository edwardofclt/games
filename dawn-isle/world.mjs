export const TILE=16, WIDTH=160, HEIGHT=128;
const define=(name,theme,rows,spawn,exits=[],objects=[],enemies=[])=>{
 if(rows.length!==8||rows.some(r=>r.length!==10))throw new Error(`Invalid map: ${name}`);
 return {name,theme,rows,spawn,exits,objects,enemies};
};
const at=(x,y)=>({x:x*16+8,y:y*16+8});
export const ROOMS={
 village:define('Hearth Village','village',[
  'TTTTTTTTTT','THH...TTTT','THH...TTTT','T.DK....TT','T.........','T.....~..T','T.....~..T','TTTTTTT.TT'
 ],at(3,5),[{x:9,y:4,to:'greenway',arrival:at(1,4)},{x:7,y:7,to:'courtyard',arrival:at(2,5),gate:'boots'}],[
  {id:'keeper',kind:'keeper',...at(3,3)}, {id:'villager',kind:'villager',...at(7,5)}, {id:'house',kind:'house',...at(1,3)}
 ]),
 greenway:define('Fernway','greenway',[
  'TTTTTTTTTT','T...TT...T','T........T','T........T','..........','T..~~....T','T........T','TTTTT.TTTT'
 ],at(1,4),[{x:0,y:4,to:'village',arrival:at(8,4)},{x:9,y:4,to:'courtyard',arrival:at(1,4)},{x:5,y:7,to:'shore',arrival:at(5,1)}],[],[
  {id:'fern-beetle',kind:'beetle',...at(6,4),hp:2}, {id:'fern-spitter',kind:'spitter',...at(7,2),hp:2}
 ]),
 courtyard:define('Old Watchtower','ruin',[
  '#####.####','#........#','#..##....#','#..##....#','.........#','#.....~..#','#._...~..#','##.#######'
 ],at(1,4),[{x:0,y:4,to:'greenway',arrival:at(8,4)},{x:5,y:0,to:'entry',arrival:at(5,6)},{x:2,y:7,to:'village',arrival:at(7,6),gate:'boots'}],[{id:'sign',kind:'sign',...at(7,2)}]),
 shore:define('Quiet Shore','shore',[
  'TTTTT.TTTT','T........T','~........~','~~.....~~~','~~~...~~~~','~~~...~~~~','~~~~~~~~~~','~~~~~~~~~~'
 ],at(5,1),[{x:5,y:0,to:'greenway',arrival:at(5,6)}],[{id:'shore-heart',kind:'heart',...at(5,4)}]),
 entry:define('Watchtower · Hall','dungeon',[
  '#####.####','#........#','#..##....#','#........#','#........#','#........#','#........#','#####.####'
 ],at(5,6),[{x:5,y:7,to:'courtyard',arrival:at(5,1)},{x:5,y:0,to:'trial',arrival:at(5,6)}],[{id:'entry-sign',kind:'sign',...at(2,2)}]),
 trial:define('Watchtower · Trial','dungeon',[
  '#####G####','#........#','#........#','#........#','#........#','#........#','#........#','#####.####'
 ],at(5,6),[{x:5,y:7,to:'entry',arrival:at(5,1)},{x:5,y:0,to:'treasure',arrival:at(5,6),gate:'trial'}],[],[{id:'trial-beetle',kind:'beetle',...at(4,3),hp:2}]),
 treasure:define('Watchtower · Treasure','dungeon',[
  '##########','#........#','#.........','#________#','#........#','#........#','#........#','#####.####'
 ],at(5,6),[{x:5,y:7,to:'trial',arrival:at(5,1)},{x:9,y:2,to:'bridge',arrival:at(1,4)}],[{id:'boots',kind:'chest',...at(3,5)}]),
 bridge:define('Watchtower · Broken Bridge','dungeon',[
  '##########','#...._...#','#...._...#','#...._...#','....._....','#...._...#','#...._...#','##########'
 ],at(1,4),[{x:0,y:4,to:'treasure',arrival:at(8,2)},{x:9,y:4,to:'boss',arrival:at(1,4)}]),
 boss:define('Watchtower · Guardian','boss',[
  '##########','#........#','#........#','#........#','.........#','#........#','#........#','##########'
 ],at(1,4),[{x:0,y:4,to:'bridge',arrival:at(8,4)}],[{id:'watchfire',kind:'fire',...at(8,2)}],[{id:'guardian',kind:'boss',...at(7,4),hp:4}])
};
export const DIRECTIONS={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};
export const CHECKPOINTS=['village','entry','treasure','bridge','boss'];
export function tileAt(room,x,y){return ROOMS[room]?.rows[Math.floor(y/16)]?.[Math.floor(x/16)]??'#';}
