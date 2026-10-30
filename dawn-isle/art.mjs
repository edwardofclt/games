// Original, editable pixel patterns. One character is one logical screen pixel.
export const PALETTE={o:'#26372e',h:'#4d3939',H:'#725040',s:'#e5a46d',l:'#ffd49a',e:'#263340',m:'#ba7054',g:'#c74d43',G:'#f07c51',t:'#ce8e38',T:'#f2c66a',p:'#41586b',b:'#765043',w:'#fff0bc'};
export const HERO_FRONT=[
 '.....hhhhhh.....','....hhHHHhhh....','...hhHHHhhhhh...','...hhhsssshhh...',
 '...hsslssslsh...','...hsessesssh...','....ssssssss....','.....ssmsss.....',
 '....oggggggo....','...ogtTTTtggo...','..osotTTTtosso..','..osotTTTtooso..',
 '....opppppo.....','....obboobbo....','...obbb..bbbo...','....oo....oo....'
];
export const HERO_BACK=[
 '.....hhhhhh.....','....hhHHHhhh....','...hhHHHHHhhh...','...hhHHHHHhhh...',
 '...hhhHHHhhhh...','...hhhhhhhhhh...','....hhhhhhhh....','.....hhhhhh.....',
 '....oggggggo....','...ogGggGtggo...','..osotgTTtosso..','..osotgTTtooso..',
 '....opppppo.....','....obboobbo....','...obbb..bbbo...','....oo....oo....'
];
export const HERO_SIDE=[
 '.....hhhhhh.....','....hhHHHhhh....','...hhHHHhhhhh...','...hhhhhssshh...',
 '...hhhhssllss...','...hhhhssesss...','....hhhsssss....','.....hssmss.....',
 '....oggggggo....','...ogtTTTtgo....','...ootTTTto.....','....otTTTsso....',
 '....opppppo.....','....obboobbo....','...obbb..bbbo...','....oo....oo....'
];
export const KEEPER=[
 '.....oooooo.....','....owwwwwwo....','...owwHHHHwwo...','...owHssssHwo...',
 '...owsslsslwo...','...owsesseswo...','....ossssss.....','....owwwwwwo....',
 '...oowwwwwwoo...','...oTTwwwwTTo...','..osTppppppTso..','..osTppppppTsoo.',
 '...oTppppppTo.o.','...oTTppppTTo.o.','....obboobbo..o.','....ooo..ooo..o.'
];
export const VILLAGER=[
 '.....oooooo.....','....oHHHHHHo....','...oHhhhhHHHo...','...oHssssssHo...',
 '...ohslsslsho...','....oseseso.....','....ossssso.....','.....ossso......',
 '....ogggggo.....','...ogGTTTGgo....','..osoTTTTToso...','..osoTTTTToso...',
 '....opppppo.....','....oppooppo....','...obbb..bbbo...','....ooo..ooo....'
];
export const TREE=[
 '.....oooooo.....','...ooabbbbaoo...','..oabccbccbbao..',
 '.oabccccccccbao.','oabccbcbbcccbb ao',
 'oabccbbbcbccbbao','oabcccbccccbbbao','oabbccbcccbbbbao',
 'oabcccbbccbcbbao','oabbccccccbbbbao',
 '.oabbbbbbbbbbao.','.oaaabbbbbbbaao.',
 '..oaaaaaaaaaao..','...ooaaaaaaoo...',
 '.....oddddo.....','.....odeedo.....'
].map(row=>row.replaceAll(' ',''));
export const TREE_COLORS={o:'#284c39',a:'#396348',b:'#51884b',c:'#80a954',d:'#64573e',e:'#a18a53',f:'#74a65a'};
export const BEETLE=[
 '................','....oo....oo....','...oaaooooaaao..','..oabbbccbbbao..',
 '.oabbbcccccbao..','ooabbccdccbbaoo.','efobbbbdcbbbofe.',
 '.oabbbbdcbbbao..','ooaabbbdbbbaa oo','ef ooaabbbaoo fe',
 '..oo.oooooo.oo..','................'
].map(row=>row.replaceAll(' ','.'));
export const BEETLE_COLORS={o:'#3a3540',a:'#943d46',b:'#cf5b4d',c:'#ef8b57',d:'#ffce89',e:'#786159',f:'#d5c28a'};
export const CHEST=[
 '................','...oooooooooo...','..oaaaaaaaaaao..','.oabbbbbbbbbbao.',
 '.oabccbccbccbao.','.oabbbbbbbbbbao.','.oaaaaaaaaaaaao.',
 '.occcccccccccco.','.obbbbbddbbbbbo.','.obbbboddbbbbbo.',
 '.oabbbboobbbbao.','.oabbbbbbbbbbao.','.oaaaaaaaaaaaao.',
 '..oooooooooooo..','................','................'
];
export const CHEST_COLORS={o:'#493b35',a:'#92603e',b:'#c48946',c:'#efc474',d:'#fff0b2'};
export function paintSprite(ctx,rows,colors,x,y,flip=false){
 const width=16;
 rows.forEach((row,j)=>{[...row.padEnd(width,'.').slice(0,width)].forEach((v,i)=>{
  if(colors[v]){ctx.fillStyle=colors[v];ctx.fillRect(Math.round(x)+(flip?width-1-i:i),Math.round(y)+j,1,1);}
 });});
}
export function drawHero(ctx,player,time){
 const moving=player.walk>0&&Math.floor(player.walk*8)%2;
 const data=player.face==='up'?HERO_BACK:player.face==='left'||player.face==='right'?HERO_SIDE:HERO_FRONT;
 const frame=data.slice();
 if(moving){frame[13]='....oppoobbo....';frame[14]='....obbo.bbbo...';frame[15]='....ooo..ooo....';}
 paintSprite(ctx,frame,PALETTE,player.x-8,player.y-14,player.face==='left');
}
