'use strict';
/* Atividade: notificações simuladas a partir do que você faz no app. */
const Activity={
 items(){const out=[],people=COMMUNITY.people;
  for(const id of state.following){const p=People.find(id);if(p)out.push({who:p,text:'começou a seguir você de volta.',href:'#person/'+id,when:'agora'});}
  state.posts.forEach((post,i)=>{const fans=people.slice(i%2,i%2+2);fans.forEach(p=>out.push({who:p,text:'curtiu sua publicação.',href:'#home',thumb:post.photo,when:'1 h'}));});
  Object.keys(state.comments).slice(0,3).forEach(pid=>{const post=Posts.find(pid),a=post&&People.find(post.user);if(a)out.push({who:a,text:'respondeu ao seu comentário: “Obrigado!”',href:'#person/'+a.id,when:'2 h'});});
  out.push({who:people[0],text:'publicou uma nova indicação: Jazz Club.',href:'#person/vincenzo',when:'3 h'},{who:people[1],text:'e mais 3 pessoas têm gosto parecido com o seu.',href:'#person/sofia',when:'1 d'});
  return out;},
 unread(){return Math.max(0,this.items().length-state.activitySeen);},
 open(){const list=this.items(),fresh=this.unread();openModal('Atividade',`<ul class="activity">${list.map((x,i)=>`<li class="${i<fresh?'new':''}" data-reveal><a href="${x.href}" data-action="close-link">${UI.avatar(x.who)}<p><strong>${esc(x.who.handle)}</strong> ${esc(x.text)} <time>${x.when}</time></p>${x.thumb?`<img src="${esc(x.thumb)}" alt="">`:''}</a></li>`).join('')}</ul>`);Store.update(s=>{s.activitySeen=list.length;},{silent:true});$$('.dot').forEach(d=>d.remove());}
};
