// Server-backed two-player transport. Room tokens stay in memory.
(()=>{
class Events {
  constructor(){this.handlers={}}
  on(name,fn){(this.handlers[name]??=[]).push(fn);return this}
  emit(name,value){for(const fn of this.handlers[name]||[])fn(value)}
}
class Connection extends Events {
  constructor(peer){super();this.peer=peer;this.open=false}
  send(packet){if(this.open)this.peer.enqueue(packet)}
  close(){this.peer.destroy()}
}
class LobbyPeer extends Events {
  constructor(id){
    super();this.id=id;this.host=!!id;this.dead=false;this.token=null;this.cursor=0;
    this.outbox=Promise.resolve();this.connected=false;this.lastPoll=Date.now();
    queueMicrotask(()=>this.init());
  }
  async rpc(action,packet){
    const config=window.VOKERCAST_SERVER;
    if(!config?.url||!config?.key)throw Object.assign(new Error('Server not configured'),{type:'server-unconfigured'});
    const response=await fetch(config.url+'/rest/v1/rpc/vokercast_transport',{
      method:'POST',headers:{apikey:config.key,'Content-Type':'application/json'},
      body:JSON.stringify({action,room_id:this.id,token:this.token,packet:packet??null,after_seq:this.cursor}),
      signal:AbortSignal.timeout(10000),
    });
    const data=await response.json();
    if(!response.ok)throw Object.assign(new Error(data.message||'Server error'),{type:data.message||'network'});
    return data;
  }
  async init(){
    try{
      if(this.host){const data=await this.rpc('create');this.token=data.token;if(this.dead){this.rpc('close').catch(()=>{});return}this.emit('open',this.id);this.poll()}
      else if(!this.dead)this.emit('open');
    }catch(error){if(!this.dead)this.emit('error',error)}
  }
  connect(id){
    this.id=id;this.connection=new Connection(this);
    this.join();return this.connection;
  }
  async join(){
    try{
      const data=await this.rpc('join');this.token=data.token;
      if(this.dead){this.rpc('close').catch(()=>{});return}
      this.connected=true;this.connection.open=true;this.connection.emit('open');this.poll();
    }catch(error){if(!this.dead)this.emit('error',error)}
  }
  enqueue(packet){
    this.outbox=this.outbox.then(async()=>{if(!this.dead)await this.rpc('send',packet)}).catch(error=>{
      if(!this.dead){this.connection?.emit('error',error);this.emit('error',error);this.destroy()}
    });
  }
  async poll(){
    if(this.dead)return;
    try{
      const data=await this.rpc('poll');if(this.dead)return;this.lastPoll=Date.now();
      if(data.closed){this.destroy();return}
      if(this.host&&data.joined&&!this.connected){
        this.connected=true;this.connection=new Connection(this);
        this.emit('connection',this.connection);this.connection.open=true;this.connection.emit('open');
      }
      for(const message of data.messages){this.cursor=message.seq;this.connection?.emit('data',message.body);if(this.dead)return}
    }catch(error){
      if(this.dead)return;
      if(Date.now()-this.lastPoll>15000){this.emit('error',error);this.destroy();return}
    }
    if(!this.dead)this.pollTimer=setTimeout(()=>this.poll(),500);
  }
  destroy(){
    if(this.dead)return;this.dead=true;clearTimeout(this.pollTimer);
    if(this.token)this.rpc('close').catch(()=>{});
    if(this.connection?.open){this.connection.open=false;queueMicrotask(()=>this.connection.emit('close'))}
  }
}
window.LobbyPeer=LobbyPeer;
})();
